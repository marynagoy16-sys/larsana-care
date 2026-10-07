-- Importação de vínculo paciente–PP e de evoluções históricas no ciclo informado.

CREATE OR REPLACE FUNCTION public.bulk_import_patient_pp_links(
  p_rows jsonb,
  p_skip_duplicates boolean DEFAULT true
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row jsonb;
  v_idx integer := 0;
  v_created integer := 0;
  v_errors jsonb := '[]'::jsonb;
  v_patient_id uuid;
  v_pp_id uuid;
  v_cpf_patient text;
  v_cpf_pp text;
BEGIN
  IF NOT public.is_staff() THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  FOR v_row IN SELECT value FROM jsonb_array_elements(p_rows)
  LOOP
    v_idx := v_idx + 1;
    BEGIN
      v_cpf_patient := public.normalize_cpf(v_row->>'cpf_paciente');
      v_cpf_pp := public.normalize_cpf(coalesce(v_row->>'cpf_pp', v_row->>'cpf_profissional'));

      SELECT id INTO v_patient_id FROM public.patients WHERE cpf = v_cpf_patient LIMIT 1;
      IF v_patient_id IS NULL THEN
        RAISE EXCEPTION 'Paciente não encontrado';
      END IF;

      SELECT id INTO v_pp_id
      FROM public.professionals
      WHERE public.normalize_cpf(cpf_cnpj) = v_cpf_pp
      LIMIT 1;
      IF v_pp_id IS NULL THEN
        RAISE EXCEPTION 'Profissional não encontrado';
      END IF;

      UPDATE public.patients
      SET allocated_professional_id = v_pp_id, updated_at = now()
      WHERE id = v_patient_id
        AND (NOT p_skip_duplicates OR allocated_professional_id IS DISTINCT FROM v_pp_id);

      v_created := v_created + 1;
    EXCEPTION WHEN OTHERS THEN
      v_errors := v_errors || jsonb_build_array(jsonb_build_object('row', v_idx, 'message', SQLERRM));
    END;
  END LOOP;

  RETURN jsonb_build_object('created', v_created, 'errors', v_errors);
END;
$$;

GRANT EXECUTE ON FUNCTION public.bulk_import_patient_pp_links(jsonb, boolean) TO authenticated;

CREATE OR REPLACE FUNCTION public.bulk_import_historical_evolutions(p_rows jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row jsonb;
  v_idx integer := 0;
  v_created integer := 0;
  v_errors jsonb := '[]'::jsonb;
  v_patient_id uuid;
  v_pp_id uuid;
  v_cycle_id uuid;
  v_cycle_number integer;
  v_pricing_id uuid;
  v_recorded timestamptz;
  v_crefito text;
  v_session_id uuid;
BEGIN
  IF NOT public.is_staff() THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  SELECT id INTO v_pricing_id
  FROM public.pricing_matrix_versions
  ORDER BY created_at DESC
  LIMIT 1;

  FOR v_row IN SELECT value FROM jsonb_array_elements(p_rows)
  LOOP
    v_idx := v_idx + 1;
    BEGIN
      SELECT id INTO v_patient_id
      FROM public.patients
      WHERE cpf = public.normalize_cpf(v_row->>'cpf_paciente')
      LIMIT 1;
      IF v_patient_id IS NULL THEN
        RAISE EXCEPTION 'Paciente não encontrado';
      END IF;

      SELECT id INTO v_pp_id
      FROM public.professionals
      WHERE public.normalize_cpf(cpf_cnpj) = public.normalize_cpf(v_row->>'cpf_profissional')
      LIMIT 1;

      SELECT registration_number INTO v_crefito
      FROM public.professional_councils
      WHERE professional_id = v_pp_id AND council_type = 'CREFITO'
      LIMIT 1;
      IF v_pp_id IS NULL THEN
        RAISE EXCEPTION 'Profissional não encontrado';
      END IF;

      v_cycle_number := greatest(coalesce((v_row->>'numero_ciclo')::integer, 1), 1);
      v_recorded := coalesce(public.parse_excel_date(v_row->>'data')::timestamptz, now());

      SELECT id INTO v_cycle_id
      FROM public.care_cycles
      WHERE patient_id = v_patient_id AND cycle_number = v_cycle_number
      LIMIT 1;

      IF v_cycle_id IS NULL THEN
        IF v_pricing_id IS NULL THEN
          RAISE EXCEPTION 'Não há tabela de preços para criar o ciclo histórico';
        END IF;

        INSERT INTO public.care_cycles (
          patient_id, cycle_number, session_count, assigned_professional_id,
          pricing_version_id, patient_level, session_unit_price_cents, total_amount_cents,
          status, payment_status, started_at
        )
        SELECT
          v_patient_id,
          v_cycle_number,
          8,
          v_pp_id,
          v_pricing_id,
          p.patient_level,
          0,
          0,
          'ativo',
          'pago',
          v_recorded
        FROM public.patients p
        WHERE p.id = v_patient_id
        RETURNING id INTO v_cycle_id;
      END IF;

      SELECT cs.id INTO v_session_id
      FROM public.care_sessions cs
      WHERE cs.cycle_id = v_cycle_id
        AND cs.status = 'realizada'
        AND NOT EXISTS (
          SELECT 1 FROM public.medical_records mr WHERE mr.session_id = cs.id
        )
      ORDER BY cs.session_number
      LIMIT 1;

      IF v_session_id IS NULL THEN
        INSERT INTO public.care_sessions (
          cycle_id, session_number, status, professional_id, is_assessment_session, scheduled_at
        )
        SELECT
          v_cycle_id,
          coalesce(max(session_number), 0) + 1,
          'realizada',
          v_pp_id,
          false,
          v_recorded
        FROM public.care_sessions
        WHERE cycle_id = v_cycle_id
        RETURNING id INTO v_session_id;
      ELSE
        UPDATE public.care_sessions
        SET scheduled_at = coalesce(scheduled_at, v_recorded), professional_id = v_pp_id, updated_at = now()
        WHERE id = v_session_id;
      END IF;

      INSERT INTO public.medical_records (
        patient_id, session_id, cycle_id, professional_id, crefito_number,
        record_type, content_richtext, recorded_at
      ) VALUES (
        v_patient_id,
        v_session_id,
        v_cycle_id,
        v_pp_id,
        coalesce(nullif(trim(v_crefito), ''), 'histórico'),
        'evolucao',
        nullif(trim(v_row->>'texto'), ''),
        v_recorded
      );

      UPDATE public.patients
      SET allocated_professional_id = coalesce(allocated_professional_id, v_pp_id), updated_at = now()
      WHERE id = v_patient_id;

      v_created := v_created + 1;
    EXCEPTION WHEN OTHERS THEN
      v_errors := v_errors || jsonb_build_array(jsonb_build_object('row', v_idx, 'message', SQLERRM));
    END;
  END LOOP;

  RETURN jsonb_build_object('created', v_created, 'errors', v_errors);
END;
$$;

GRANT EXECUTE ON FUNCTION public.bulk_import_historical_evolutions(jsonb) TO authenticated;
