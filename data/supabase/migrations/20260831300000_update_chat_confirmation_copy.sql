-- Copy da Sara ao confirmar horário escolhido pelo paciente.

CREATE OR REPLACE FUNCTION public.push_scheduling_confirmation_to_patient_chat(
  p_patient_id uuid,
  p_proposal_id uuid,
  p_slot_starts_at timestamptz,
  p_session_id uuid DEFAULT NULL,
  p_proposal_type public.scheduling_proposal_type DEFAULT 'avaliacao'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_responsible record;
  v_thread_id uuid;
  v_slot_label text;
  v_body text;
  v_effective_type public.scheduling_proposal_type;
BEGIN
  SELECT CASE
    WHEN sp.cycle_id IS NOT NULL THEN 'continuidade'::public.scheduling_proposal_type
    ELSE sp.proposal_type
  END
  INTO v_effective_type
  FROM public.scheduling_proposals sp
  WHERE sp.id = p_proposal_id;

  v_effective_type := coalesce(v_effective_type, p_proposal_type);

  v_slot_label := to_char(p_slot_starts_at AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY "às" HH24:MI');

  v_body := CASE v_effective_type
    WHEN 'continuidade' THEN format(
      'Confirmamos sua terapia para %s. O profissional parceiro já foi avisado e o atendimento entrou na agenda dele.',
      v_slot_label
    )
    WHEN 'avaliacao' THEN format(
      'Confirmamos sua avaliação domiciliar para %s. O profissional parceiro já foi avisado e o atendimento entrou na agenda dele.',
      v_slot_label
    )
    ELSE format(
      'Confirmamos seu atendimento para %s. O profissional parceiro já foi avisado e o atendimento entrou na agenda dele.',
      v_slot_label
    )
  END;

  FOR v_responsible IN
    SELECT pr.user_id
    FROM public.patient_responsibles pr
    WHERE pr.patient_id = p_patient_id
      AND pr.user_id IS NOT NULL
  LOOP
    SELECT t.id INTO v_thread_id
    FROM public.patient_chat_threads t
    WHERE t.patient_id = p_patient_id
      AND t.user_id = v_responsible.user_id;

    IF v_thread_id IS NULL THEN
      INSERT INTO public.patient_chat_threads (patient_id, user_id)
      VALUES (p_patient_id, v_responsible.user_id)
      RETURNING id INTO v_thread_id;

      INSERT INTO public.patient_chat_messages (thread_id, sender_role, template_code, body)
      VALUES (
        v_thread_id,
        'sara',
        'welcome',
        'Oi! Meu nome é Sara. Sou assistente da Larsana e estou aqui para te ajudar com confirmações de horário, lembretes e orientações sobre seu tratamento.'
      );
    END IF;

    INSERT INTO public.patient_chat_messages (thread_id, sender_role, template_code, body, payload)
    VALUES (
      v_thread_id,
      'sara',
      'patient_confirmed_slot',
      v_body,
      jsonb_build_object(
        'proposal_id', p_proposal_id,
        'slot_starts_at', p_slot_starts_at,
        'session_id', p_session_id,
        'proposal_type', v_effective_type
      )
    );
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.push_scheduling_confirmation_to_patient_chat(uuid, uuid, timestamptz, uuid, public.scheduling_proposal_type) TO service_role;

UPDATE public.patient_chat_messages pcm
SET body = regexp_replace(
  regexp_replace(
    pcm.body,
    '^Perfeito! Confirmamos sua (?:primeira terapia do ciclo|terapia|avaliação domiciliar|.+?) para (.+)\. (?:Seu|O) profissional parceiro já foi avisado e o atendimento entrou na agenda dele\.$',
    'Confirmamos sua terapia para \1. O profissional parceiro já foi avisado e o atendimento entrou na agenda dele.',
    'g'
  ),
  'Confirmamos sua primeira terapia do ciclo para',
  'Confirmamos sua terapia para',
  'g'
)
WHERE pcm.template_code = 'patient_confirmed_slot'
  AND (
    pcm.body LIKE 'Perfeito! Confirmamos%'
    OR pcm.body LIKE '%primeira terapia do ciclo%'
    OR pcm.body LIKE '%avaliação domiciliar%'
  )
  AND EXISTS (
    SELECT 1
    FROM public.scheduling_proposals sp
    WHERE sp.id = (pcm.payload ->> 'proposal_id')::uuid
      AND (sp.proposal_type = 'continuidade' OR sp.cycle_id IS NOT NULL)
  );

UPDATE public.patient_chat_messages pcm
SET body = regexp_replace(
  pcm.body,
  '^Perfeito! Confirmamos sua avaliação domiciliar para (.+)\. Seu profissional parceiro',
  'Confirmamos sua avaliação domiciliar para \1. O profissional parceiro',
  'g'
)
WHERE pcm.template_code = 'patient_confirmed_slot'
  AND pcm.body LIKE 'Perfeito! Confirmamos sua avaliação domiciliar%';
