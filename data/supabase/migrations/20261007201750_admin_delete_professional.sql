-- Exclusão de profissional pelo admin.
-- Cadastro sem histórico clínico/financeiro é apagado.
-- Cadastro com atendimento, avaliação, ciclo, prontuário ou repasse é inativado,
-- para o Postgres não devolver o erro cru de chave estrangeira.

CREATE OR REPLACE FUNCTION public.professional_has_retained_history(p_professional_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r record;
  v_exists boolean;
BEGIN
  FOR r IN
    SELECT
      c.conrelid::regclass AS child_table,
      a.attname AS child_column
    FROM pg_constraint c
    JOIN pg_attribute a
      ON a.attrelid = c.conrelid
     AND a.attnum = c.conkey[1]
    WHERE c.confrelid = 'public.professionals'::regclass
      AND c.contype = 'f'
      AND c.confdeltype IN ('r', 'a')
      AND cardinality(c.conkey) = 1
  LOOP
    EXECUTE format(
      'SELECT EXISTS (SELECT 1 FROM %s WHERE %I = $1)',
      r.child_table,
      r.child_column
    )
    INTO v_exists
    USING p_professional_id;

    IF v_exists THEN
      RETURN true;
    END IF;
  END LOOP;

  RETURN false;
END;
$$;

REVOKE ALL ON FUNCTION public.professional_has_retained_history(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.professional_has_retained_history(uuid) FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.admin_delete_professional(p_professional_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_staff_role(ARRAY['admin', 'gestao']::public.user_role[]) THEN
    RAISE EXCEPTION 'Sem permissão para excluir o profissional';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.professionals WHERE id = p_professional_id) THEN
    RAISE EXCEPTION 'Profissional não encontrado';
  END IF;

  IF public.professional_has_retained_history(p_professional_id) THEN
    PERFORM public.reset_pp_patent_journey(p_professional_id);
    UPDATE public.professionals
    SET credentialing_status = 'descredenciado',
        updated_at = now()
    WHERE id = p_professional_id;
    RETURN 'inactivated';
  END IF;

  DELETE FROM public.professionals WHERE id = p_professional_id;
  RETURN 'deleted';
END;
$$;

REVOKE ALL ON FUNCTION public.admin_delete_professional(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_delete_professional(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_delete_professional(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.trg_professionals_delete_or_inactivate()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.professional_has_retained_history(OLD.id) THEN
    PERFORM public.reset_pp_patent_journey(OLD.id);
    UPDATE public.professionals
    SET credentialing_status = 'descredenciado',
        updated_at = now()
    WHERE id = OLD.id;
    RETURN NULL;
  END IF;

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS professionals_delete_or_inactivate ON public.professionals;
CREATE TRIGGER professionals_delete_or_inactivate
  BEFORE DELETE ON public.professionals
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_professionals_delete_or_inactivate();

NOTIFY pgrst, 'reload schema';
