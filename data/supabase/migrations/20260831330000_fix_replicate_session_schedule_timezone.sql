-- Corrige replicação de horários quando a frequência semanal gera intervalo fracionado
-- (ex.: 2x/semana = 3,5 dias). Somar 3,5 * interval '1 day' a timestamptz desloca
-- o relógio em 12h (10:00 → 22:00) nas sessões ímpares.

CREATE OR REPLACE FUNCTION public.session_schedule_day_offset(
  p_sessions_after_anchor integer,
  p_days_between numeric
)
RETURNS integer
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  v_low integer;
BEGIN
  IF p_sessions_after_anchor <= 0 THEN
    RETURN 0;
  END IF;

  IF p_days_between = trunc(p_days_between) THEN
    RETURN (p_sessions_after_anchor * p_days_between)::integer;
  END IF;

  -- Alterna intervalos floor/ceil (ex.: 3,4,3,4 dias para 2x/semana).
  v_low := floor(p_days_between)::integer;
  RETURN v_low * p_sessions_after_anchor + floor(p_sessions_after_anchor / 2.0)::integer;
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

  SELECT COALESCE(
    LEAST(3, GREATEST(1, ROUND(p.suggested_weekly_frequency)::integer)),
    2
  ) INTO v_weekly_freq
  FROM public.patients p
  WHERE p.id = v_cycle.patient_id;

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

REVOKE ALL ON FUNCTION public.session_schedule_day_offset(integer, numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.session_schedule_day_offset(integer, numeric) TO authenticated;

-- Repara ciclos já replicados com horários defasados.
DO $$
DECLARE
  v_row record;
BEGIN
  FOR v_row IN
    SELECT cs.cycle_id, cs.id AS anchor_session_id
    FROM public.care_sessions cs
    WHERE cs.scheduled_at IS NOT NULL
      AND cs.session_number = (
        SELECT MIN(cs2.session_number)
        FROM public.care_sessions cs2
        WHERE cs2.cycle_id = cs.cycle_id
          AND cs2.scheduled_at IS NOT NULL
      )
  LOOP
    PERFORM public.replicate_session_schedule(v_row.cycle_id, v_row.anchor_session_id);
  END LOOP;
END;
$$;
