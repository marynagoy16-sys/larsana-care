-- Alinha bloqueio de ciclo aos termos aceitos no fluxo de solicitação do paciente
-- (CONTRATO_INTERMEDIACAO + TERMO_CONSENTIMENTO + LGPD), não TERMO_ADESAO + DIRETRIZES.

CREATE OR REPLACE FUNCTION public.block_cycle_without_acceptance()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status IN ('aguardando_pagamento', 'ativo') THEN
    IF NOT public.has_valid_acceptance(
      NEW.patient_id,
      ARRAY['CONTRATO_INTERMEDIACAO', 'TERMO_CONSENTIMENTO', 'LGPD']::public.legal_term_type[]
    ) THEN
      RAISE EXCEPTION 'Paciente sem aceite vigente dos termos obrigatórios';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.block_cycle_without_acceptance() IS
  'Impede ciclo aguardando_pagamento/ativo sem aceite dos termos do app paciente (intermediação, consentimento, LGPD).';
