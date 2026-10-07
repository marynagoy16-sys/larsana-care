-- Encerrar conta zera a jornada. NFS-e de intermediação fica pendente no fechamento.

CREATE OR REPLACE FUNCTION public.reset_pp_patent_journey(p_professional_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.professionals
  SET
    points_total = 0,
    points_permanent = 0,
    points_variable = 0,
    patente = 'ALUMINIO'::public.pp_patente,
    patente_earned_at = now(),
    referral_count_pre_bronze = 0,
    is_active = false,
    updated_at = now()
  WHERE id = p_professional_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_close_pp_account(p_professional_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_staff_role(ARRAY['admin', 'gestao']::public.user_role[]) THEN
    RAISE EXCEPTION 'Sem permissão';
  END IF;
  PERFORM public.reset_pp_patent_journey(p_professional_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_close_pp_account(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.trg_reset_pp_on_account_deletion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prof_id uuid;
BEGIN
  IF NEW.status = 'processed' AND OLD.status IS DISTINCT FROM 'processed' THEN
    SELECT id INTO v_prof_id FROM public.professionals WHERE user_id = NEW.user_id;
    IF v_prof_id IS NOT NULL THEN
      PERFORM public.reset_pp_patent_journey(v_prof_id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS account_deletion_reset_pp_journey ON public.account_deletion_requests;
CREATE TRIGGER account_deletion_reset_pp_journey
  AFTER UPDATE OF status ON public.account_deletion_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_reset_pp_on_account_deletion();

UPDATE public.professionals
SET
  is_active = false,
  points_total = 0,
  points_permanent = 0,
  points_variable = 0,
  patente = 'ALUMINIO'::public.pp_patente,
  patente_earned_at = now(),
  referral_count_pre_bronze = 0,
  updated_at = now()
WHERE full_name ILIKE 'Lucas Ribeiro do Nascimento';

CREATE TABLE IF NOT EXISTS public.cycle_intermediation_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id uuid NOT NULL UNIQUE REFERENCES public.care_cycles (id) ON DELETE CASCADE,
  closure_id uuid,
  amount_cents integer NOT NULL DEFAULT 0,
  patient_document text,
  status text NOT NULL DEFAULT 'pendente_upload',
  receipt_path text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cycle_intermediation_invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cycle_intermediation_invoices_staff ON public.cycle_intermediation_invoices;
CREATE POLICY cycle_intermediation_invoices_staff ON public.cycle_intermediation_invoices
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

CREATE OR REPLACE FUNCTION public.trg_queue_intermediation_invoice()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_doc text;
BEGIN
  SELECT coalesce(p.cpf, '') INTO v_doc
  FROM public.care_cycles c
  JOIN public.patients p ON p.id = c.patient_id
  WHERE c.id = NEW.cycle_id;

  INSERT INTO public.cycle_intermediation_invoices (
    cycle_id, closure_id, amount_cents, patient_document, status
  ) VALUES (
    NEW.cycle_id,
    NEW.id,
    coalesce(NEW.larsana_margin_cents, 0),
    nullif(v_doc, ''),
    'pendente_upload'
  )
  ON CONFLICT (cycle_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS financial_closures_intermediation_invoice ON public.financial_closures;
CREATE TRIGGER financial_closures_intermediation_invoice
  AFTER INSERT ON public.financial_closures
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_queue_intermediation_invoice();
