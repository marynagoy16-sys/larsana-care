-- A reserva usava DELETE FROM tmp_fixed_slots sem filtro.
-- O plan_filter do Postgres recusa isso com "DELETE requires a WHERE clause".
-- Os horários passam a ficar num array, sem apagar tabela temporária.

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
  v_slots timestamptz[];
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

  SELECT coalesce(array_agg(parsed.starts_at ORDER BY parsed.ord), ARRAY[]::timestamptz[])
  INTO v_slots
  FROM (
    SELECT
      row_number() OVER (ORDER BY (value->>'starts_at')::timestamptz) - 1 AS ord,
      (value->>'starts_at')::timestamptz AS starts_at
    FROM jsonb_array_elements(
      CASE WHEN jsonb_typeof(p_slots) = 'array' THEN p_slots ELSE '[]'::jsonb END
    )
  ) parsed;

  v_slot_count := coalesce(array_length(v_slots, 1), 0);
  IF v_slot_count <> v_freq THEN
    RAISE EXCEPTION 'Selecione exatamente % horário(s) fixo(s)', v_freq;
  END IF;

  FOR v_session IN
    SELECT id, session_number
    FROM public.care_sessions
    WHERE cycle_id = v_cycle.id
      AND is_assessment_session = false
      AND scheduled_at IS NULL
    ORDER BY session_number
  LOOP
    v_slot := v_slots[(v_index % v_freq) + 1];
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

  FOREACH v_slot IN ARRAY v_slots
  LOOP
    v_local := v_slot AT TIME ZONE 'America/Sao_Paulo';
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
