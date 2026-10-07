-- Remarcação só por pedido do paciente, recolocar em 14 dias pelo PP,
-- retorno do substituto não assumido, cancelamento do ciclo e falta de 50%.

ALTER TABLE public.session_reschedule_requests
  ADD COLUMN IF NOT EXISTS patient_reason text;

CREATE OR REPLACE FUNCTION public.patient_request_reschedule_to_pp(
  p_session_id uuid,
  p_reason text DEFAULT NULL,
  p_attachment text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
  v_id uuid;
BEGIN
  v_result := public.patient_chat_request_reschedule(p_session_id);
  v_id := (v_result ->> 'request_id')::uuid;

  UPDATE public.session_reschedule_requests
  SET
    patient_reason = nullif(trim(coalesce(p_reason, '')), ''),
    certificate_storage_path = coalesce(nullif(trim(coalesce(p_attachment, '')), ''), certificate_storage_path),
    updated_at = now()
  WHERE id = v_id;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.patient_request_reschedule_to_pp(uuid, text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.pp_place_patient_reschedule(
  p_request_id uuid,
  p_scheduled_at timestamptz
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pp uuid := public.current_professional_id();
  v_request public.session_reschedule_requests%ROWTYPE;
BEGIN
  IF v_pp IS NULL THEN
    RAISE EXCEPTION 'Profissional não identificado';
  END IF;

  IF p_scheduled_at IS NULL OR p_scheduled_at <= now() THEN
    RAISE EXCEPTION 'Informe um horário futuro';
  END IF;

  SELECT * INTO v_request
  FROM public.session_reschedule_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Solicitação não encontrada';
  END IF;

  IF v_request.responsible_professional_id <> v_pp THEN
    RAISE EXCEPTION 'Sem permissão';
  END IF;

  IF v_request.status <> 'awaiting_pp_slots' THEN
    RAISE EXCEPTION 'Esta solicitação não está aguardando recolocação';
  END IF;

  IF now() > v_request.reschedule_deadline THEN
    RAISE EXCEPTION 'O prazo de 14 dias para recolocar a terapia encerrou';
  END IF;

  IF v_request.window_type = 'late' THEN
    PERFORM public.apply_late_reschedule_fee(v_request.session_id, 'remarcacao_tardia_paciente');
  END IF;

  UPDATE public.care_sessions
  SET
    scheduled_at = p_scheduled_at,
    status = 'remarcada'::public.session_status,
    professional_id = v_pp,
    updated_at = now()
  WHERE id = v_request.session_id;

  UPDATE public.session_reschedule_requests
  SET
    proposed_scheduled_at = p_scheduled_at,
    status = 'completed',
    updated_at = now()
  WHERE id = p_request_id;

  RETURN jsonb_build_object(
    'request_id', p_request_id,
    'session_id', v_request.session_id,
    'scheduled_at', p_scheduled_at
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.pp_place_patient_reschedule(uuid, timestamptz) TO authenticated;

CREATE OR REPLACE FUNCTION public.push_sub_offer_to_patient_chat(
  p_request_id uuid,
  p_reason text DEFAULT 'pp_late'
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request public.session_reschedule_requests%ROWTYPE;
  v_pp_name text;
  v_responsible record;
  v_thread_id uuid;
  v_scheduled_label text;
  v_body text;
  v_count integer := 0;
BEGIN
  SELECT * INTO v_request
  FROM public.session_reschedule_requests
  WHERE id = p_request_id;

  IF NOT FOUND OR v_request.status <> 'sub_offered' THEN
    RETURN 0;
  END IF;

  SELECT p.full_name INTO v_pp_name
  FROM public.professionals p
  WHERE p.id = v_request.responsible_professional_id;

  v_scheduled_label := to_char(
    v_request.original_scheduled_at AT TIME ZONE 'America/Sao_Paulo',
    'DD/MM/YYYY "às" HH24:MI'
  );

  v_body := format(
    'Estou buscando um fisioterapeuta substituto para o atendimento de %s. Se ninguém assumir até esse horário, o atendimento volta para %s.',
    v_scheduled_label,
    coalesce(v_pp_name, 'o profissional responsável')
  );

  FOR v_responsible IN
    SELECT pr.user_id
    FROM public.patient_responsibles pr
    WHERE pr.patient_id = v_request.patient_id
      AND pr.user_id IS NOT NULL
  LOOP
    v_thread_id := public._patient_chat_ensure_thread(v_request.patient_id, v_responsible.user_id);

    IF EXISTS (
      SELECT 1
      FROM public.patient_chat_messages pcm
      WHERE pcm.thread_id = v_thread_id
        AND pcm.template_code = 'sub_offer'
        AND pcm.payload ->> 'request_id' = p_request_id::text
    ) THEN
      CONTINUE;
    END IF;

    INSERT INTO public.patient_chat_messages (thread_id, sender_role, template_code, body, payload)
    VALUES (
      v_thread_id,
      'sara',
      'sub_offer',
      v_body,
      jsonb_build_object(
        'request_id', p_request_id,
        'session_id', v_request.session_id,
        'original_scheduled_at', v_request.original_scheduled_at,
        'reason', coalesce(p_reason, 'pp_late')
      )
    );

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.revert_unclaimed_substitute_sessions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row record;
  v_owner uuid;
  v_count integer := 0;
BEGIN
  FOR v_row IN
    SELECT srr.id, srr.session_id, srr.responsible_professional_id, srr.original_professional_id
    FROM public.session_reschedule_requests srr
    JOIN public.care_sessions cs ON cs.id = srr.session_id
    WHERE srr.status = 'sub_offered'
      AND cs.scheduled_at IS NOT NULL
      AND cs.scheduled_at <= now()
  LOOP
    v_owner := coalesce(v_row.original_professional_id, v_row.responsible_professional_id);

    UPDATE public.care_sessions
    SET professional_id = v_owner, updated_at = now()
    WHERE id = v_row.session_id;

    UPDATE public.session_reschedule_requests
    SET status = 'expired', updated_at = now()
    WHERE id = v_row.id;

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.pp_session_check_in(p_session_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pp uuid := public.current_professional_id();
  v_session public.care_sessions%ROWTYPE;
BEGIN
  IF v_pp IS NULL THEN RAISE EXCEPTION 'Profissional não identificado'; END IF;

  PERFORM public.revert_unclaimed_substitute_sessions();

  UPDATE public.care_sessions
  SET check_in_at = now(), updated_at = now()
  WHERE id = p_session_id AND professional_id = v_pp AND check_in_at IS NULL
  RETURNING * INTO v_session;

  IF NOT FOUND THEN RAISE EXCEPTION 'Sessão não encontrada ou check-in já realizado'; END IF;

  IF v_session.is_assessment_session AND EXISTS (
    SELECT 1
    FROM public.initial_assessments ia
    JOIN public.care_cycles cc ON cc.id = v_session.cycle_id
    WHERE ia.patient_id = cc.patient_id
      AND ia.status = 'avaliacao_feita'::public.assessment_status
  ) THEN
    PERFORM public.complete_checked_in_session(p_session_id);
  END IF;

  RETURN jsonb_build_object('session_id', p_session_id, 'check_in_at', v_session.check_in_at);
END;
$$;

CREATE OR REPLACE FUNCTION public.apply_absence_half_charge(p_session_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session public.care_sessions%ROWTYPE;
  v_cycle public.care_cycles%ROWTYPE;
  v_partial integer := 50;
  v_partial_amt integer;
  v_pp_pct numeric;
  v_larsana_pct numeric;
  v_pp_amt integer;
  v_larsana_amt integer;
  v_adj_id uuid;
BEGIN
  SELECT * INTO v_session FROM public.care_sessions WHERE id = p_session_id;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT * INTO v_cycle FROM public.care_cycles WHERE id = v_session.cycle_id;
  IF v_cycle.payment_status <> 'pago' OR v_cycle.session_unit_price_cents IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT sa.id INTO v_adj_id
  FROM public.session_adjustments sa
  WHERE sa.session_id = p_session_id AND sa.reason = 'falta_paciente'
  LIMIT 1;

  IF v_adj_id IS NOT NULL THEN
    RETURN v_adj_id;
  END IF;

  v_partial_amt := round(v_cycle.session_unit_price_cents * v_partial / 100.0)::integer;

  SELECT r.pp_percent, r.larsana_percent INTO v_pp_pct, v_larsana_pct
  FROM public.resolve_cycle_split_percentages(v_cycle.id) r;

  v_pp_amt := round(v_partial_amt * coalesce(v_pp_pct, 0) / 100.0)::integer;
  v_larsana_amt := v_partial_amt - v_pp_amt;

  INSERT INTO public.session_adjustments (
    cycle_id,
    session_id,
    reason,
    session_value_cents,
    partial_percent,
    refund_family_cents,
    family_charge_cents,
    pp_transfer_cents,
    larsana_cents
  ) VALUES (
    v_cycle.id,
    v_session.id,
    'falta_paciente',
    v_cycle.session_unit_price_cents,
    v_partial,
    0,
    v_partial_amt,
    v_pp_amt,
    v_larsana_amt
  )
  ON CONFLICT (session_id) DO NOTHING
  RETURNING id INTO v_adj_id;

  RETURN v_adj_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_absence_consumes_half()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'falta'::public.session_status
     AND OLD.status IS DISTINCT FROM 'falta'::public.session_status THEN
    PERFORM public.apply_absence_half_charge(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS care_sessions_absence_half ON public.care_sessions;
CREATE TRIGGER care_sessions_absence_half
  AFTER UPDATE OF status ON public.care_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_absence_consumes_half();

CREATE OR REPLACE FUNCTION public.patient_cancel_treatment_cycle(
  p_cycle_id uuid,
  p_reason text,
  p_note text DEFAULT NULL,
  p_attachment text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cycle public.care_cycles%ROWTYPE;
  v_pause public.pause_type;
  v_decision text;
BEGIN
  SELECT * INTO v_cycle FROM public.care_cycles WHERE id = p_cycle_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ciclo não encontrado';
  END IF;

  IF NOT (v_cycle.patient_id = ANY (public.current_patient_ids())) THEN
    RAISE EXCEPTION 'Sem permissão';
  END IF;

  IF p_reason NOT IN ('financeiro', 'obito', 'outras') THEN
    RAISE EXCEPTION 'Motivo inválido';
  END IF;

  v_pause := CASE
    WHEN p_reason = 'financeiro' THEN 'unjustified'::public.pause_type
    ELSE 'justified'::public.pause_type
  END;

  v_decision := CASE p_reason
    WHEN 'financeiro' THEN 'Encerramento por decisão do paciente (financeiro): 20% sobre o saldo não realizado'
    WHEN 'obito' THEN 'Encerramento por óbito: reembolso do remanescente'
    ELSE 'Encerramento por justificativa excepcional: reembolso do remanescente'
  END;

  IF nullif(trim(coalesce(p_note, '')), '') IS NOT NULL THEN
    v_decision := v_decision || '. ' || trim(p_note);
  END IF;

  IF nullif(trim(coalesce(p_attachment, '')), '') IS NOT NULL THEN
    v_decision := v_decision || ' Anexo: ' || trim(p_attachment);
  END IF;

  RETURN public._close_cycle_financially_impl(p_cycle_id, v_pause, v_decision, auth.uid());
END;
$$;

GRANT EXECUTE ON FUNCTION public.patient_cancel_treatment_cycle(uuid, text, text, text) TO authenticated;
