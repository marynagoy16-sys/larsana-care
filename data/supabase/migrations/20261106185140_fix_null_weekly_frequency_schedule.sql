-- GREATEST/LEAST ignoram NULL. Com suggested_weekly_frequency vazio,
-- COALESCE(..., 2) por fora nunca era alcançado e a frequência virava 1.
-- A tela trata vazio como 2. O ciclo de 8 sessões também é o pacote de 2x/semana.

CREATE OR REPLACE FUNCTION public.pp_register_fixed_cycle_schedule(
  p_demand_id uuid,
  p_slots jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_demand public.demands%ROWTYPE;
  v_cycle public.care_cycles%ROWTYPE;
  v_pp uuid;
  v_freq integer;
  v_slot_count integer;
  v_session record;
  v_index integer := 0;
  v_slot timestamptz;
  v_week integer;
  v_scheduled integer := 0;
  v_thread_id uuid;
  v_user_id uuid;
  v_summary text := '';
  v_local timestamp;
  v_label text;
BEGIN
  v_pp := public.current_professional_id();
  SELECT * INTO v_demand FROM public.demands WHERE id = p_demand_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Demanda não encontrada';
  END IF;
  IF v_demand.demand_type IS DISTINCT FROM 'continuidade' THEN
    RAISE EXCEPTION 'Horário fixo vale só para o ciclo pago';
  END IF;
  IF v_pp IS NULL OR v_demand.assigned_professional_id IS DISTINCT FROM v_pp THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;
  IF v_demand.cycle_id IS NULL THEN
    RAISE EXCEPTION 'Ciclo não vinculado à demanda';
  END IF;

  SELECT * INTO v_cycle FROM public.care_cycles WHERE id = v_demand.cycle_id;

  SELECT LEAST(
    3,
    GREATEST(1, ROUND(COALESCE(p.suggested_weekly_frequency, 2))::integer)
  ) INTO v_freq
  FROM public.patients p
  WHERE p.id = v_cycle.patient_id;

  IF v_freq IS NULL THEN
    v_freq := 2;
  END IF;

  SELECT count(*) INTO v_slot_count
  FROM jsonb_array_elements(CASE WHEN jsonb_typeof(p_slots) = 'array' THEN p_slots ELSE '[]'::jsonb END);

  IF v_slot_count <> v_freq THEN
    RAISE EXCEPTION 'Selecione exatamente % horário(s) fixo(s)', v_freq;
  END IF;

  CREATE TEMP TABLE IF NOT EXISTS tmp_fixed_slots (
    ord integer PRIMARY KEY,
    starts_at timestamptz NOT NULL
  ) ON COMMIT DROP;
  DELETE FROM tmp_fixed_slots;

  INSERT INTO tmp_fixed_slots (ord, starts_at)
  SELECT row_number() OVER (ORDER BY (value->>'starts_at')::timestamptz) - 1,
         (value->>'starts_at')::timestamptz
  FROM jsonb_array_elements(p_slots);

  FOR v_session IN
    SELECT id, session_number
    FROM public.care_sessions
    WHERE cycle_id = v_cycle.id
      AND is_assessment_session = false
      AND scheduled_at IS NULL
    ORDER BY session_number
  LOOP
    v_slot := (SELECT starts_at FROM tmp_fixed_slots WHERE ord = (v_index % v_freq));
    v_week := v_index / v_freq;
    UPDATE public.care_sessions
    SET scheduled_at = v_slot + make_interval(weeks => v_week),
        status = 'prevista'::public.session_status,
        professional_id = v_pp,
        updated_at = now()
    WHERE id = v_session.id;
    v_index := v_index + 1;
    v_scheduled := v_scheduled + 1;
  END LOOP;

  FOR v_local IN
    SELECT starts_at AT TIME ZONE 'America/Sao_Paulo' FROM tmp_fixed_slots ORDER BY ord
  LOOP
    v_label := CASE extract(dow FROM v_local)::integer
      WHEN 0 THEN 'domingo'
      WHEN 1 THEN 'segunda-feira'
      WHEN 2 THEN 'terça-feira'
      WHEN 3 THEN 'quarta-feira'
      WHEN 4 THEN 'quinta-feira'
      WHEN 5 THEN 'sexta-feira'
      ELSE 'sábado'
    END || ' às ' || to_char(v_local, 'HH24"h"MI');
    v_summary := v_summary || CASE WHEN v_summary = '' THEN '' ELSE ' e ' END || v_label;
  END LOOP;

  SELECT pr.user_id INTO v_user_id
  FROM public.patient_responsibles pr
  WHERE pr.patient_id = v_cycle.patient_id
  ORDER BY pr.is_primary DESC
  LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    SELECT id INTO v_thread_id
    FROM public.patient_chat_threads
    WHERE patient_id = v_cycle.patient_id AND user_id = v_user_id
    LIMIT 1;

    IF v_thread_id IS NULL THEN
      INSERT INTO public.patient_chat_threads (patient_id, user_id)
      VALUES (v_cycle.patient_id, v_user_id)
      RETURNING id INTO v_thread_id;
    END IF;

    INSERT INTO public.patient_chat_messages (thread_id, sender_role, template_code, body)
    VALUES (
      v_thread_id,
      'sara',
      'ciclo_horario_fixo',
      'Confirmamos o início do seu ciclo de atendimentos, '
        || v_freq::text || ' vez(es) por semana: ' || v_summary
        || '. Esses horários ficam fixos até o fim do ciclo.'
    );
  END IF;

  PERFORM public.notify_patient_responsibles(
    v_cycle.patient_id,
    'geral'::public.notification_type,
    'Horários do ciclo confirmados',
    'Seu profissional parceiro definiu os horários fixos: ' || v_summary || '.',
    jsonb_build_object('cycle_id', v_cycle.id, 'href', '/paciente/tratamento')
  );

  RETURN jsonb_build_object('scheduled', v_scheduled, 'weekly_frequency', v_freq);
END;
$$;

CREATE OR REPLACE FUNCTION public.replicate_session_schedule(
  p_cycle_id uuid,
  p_anchor_session_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_anchor public.care_sessions%ROWTYPE;
  v_cycle public.care_cycles%ROWTYPE;
  v_weekly_freq integer;
  v_days_between numeric;
  v_local_anchor timestamp;
  v_n integer;
  v_day_offset integer;
  v_next_local timestamp;
  v_next_at timestamptz;
  v_i integer;
  v_updated integer := 0;
BEGIN
  SELECT * INTO v_anchor
  FROM public.care_sessions
  WHERE id = p_anchor_session_id
    AND cycle_id = p_cycle_id;

  IF NOT FOUND OR v_anchor.scheduled_at IS NULL THEN
    RAISE EXCEPTION 'Sessão âncora não encontrada ou sem horário';
  END IF;

  SELECT * INTO v_cycle FROM public.care_cycles WHERE id = p_cycle_id;

  SELECT LEAST(
    3,
    GREATEST(1, ROUND(COALESCE(p.suggested_weekly_frequency, 2))::integer)
  ) INTO v_weekly_freq
  FROM public.patients p
  WHERE p.id = v_cycle.patient_id;

  IF v_weekly_freq IS NULL THEN
    v_weekly_freq := 2;
  END IF;

  v_days_between := 7.0 / v_weekly_freq;
  v_local_anchor := v_anchor.scheduled_at AT TIME ZONE 'America/Sao_Paulo';

  FOR v_i IN 1..v_cycle.session_count LOOP
    IF EXISTS (
      SELECT 1 FROM public.care_sessions cs
      WHERE cs.cycle_id = p_cycle_id AND cs.session_number = v_i
    ) THEN
      IF v_i > v_anchor.session_number THEN
        v_n := v_i - v_anchor.session_number;
        v_day_offset := public.session_schedule_day_offset(v_n, v_days_between);
        v_next_local := (v_local_anchor::date + v_day_offset) + v_local_anchor::time;
        v_next_at := v_next_local AT TIME ZONE 'America/Sao_Paulo';

        UPDATE public.care_sessions
        SET
          scheduled_at = v_next_at,
          status = CASE WHEN status = 'remarcada' THEN status ELSE 'prevista'::public.session_status END,
          updated_at = now()
        WHERE cycle_id = p_cycle_id
          AND session_number = v_i
          AND (scheduled_at IS NULL OR scheduled_at <> v_next_at);

        IF FOUND THEN
          v_updated := v_updated + 1;
        END IF;
      END IF;
    ELSE
      v_n := v_i - v_anchor.session_number;
      v_day_offset := public.session_schedule_day_offset(v_n, v_days_between);
      v_next_local := (v_local_anchor::date + v_day_offset) + v_local_anchor::time;
      v_next_at := v_next_local AT TIME ZONE 'America/Sao_Paulo';

      INSERT INTO public.care_sessions (
        cycle_id, session_number, status, professional_id, scheduled_at
      ) VALUES (
        p_cycle_id,
        v_i,
        'prevista'::public.session_status,
        v_cycle.assigned_professional_id,
        v_next_at
      );
      v_updated := v_updated + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'cycle_id', p_cycle_id,
    'anchor_session_id', p_anchor_session_id,
    'sessions_updated', v_updated
  );
END;
$$;
