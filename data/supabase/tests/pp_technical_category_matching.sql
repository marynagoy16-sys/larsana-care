-- Smoke test: matching Cardiorrespiratória por categoria técnica
-- Executar após migrations 20260630150000 e 20260630150100

DO $$
DECLARE
  v_pp uuid;
  v_patient uuid;
  v_demand uuid;
  v_original_status public.cardiorrespiratory_habilitation_status;
BEGIN
  SELECT id, cardiorrespiratory_habilitation_status
  INTO v_pp, v_original_status
  FROM public.professionals
  WHERE credentialing_status = 'ativo'
  ORDER BY created_at
  LIMIT 1;

  IF v_pp IS NULL THEN
    RAISE NOTICE 'SKIP: profissional ativo de teste não encontrado';
    RETURN;
  END IF;

  SELECT id INTO v_patient
  FROM public.patients
  ORDER BY created_at
  LIMIT 1;

  IF v_patient IS NULL THEN
    RAISE NOTICE 'SKIP: paciente de teste não encontrado';
    RETURN;
  END IF;

  UPDATE public.patients
  SET technical_category = 'cardiorrespiratoria'
  WHERE id = v_patient;

  INSERT INTO public.demands (patient_id, status, required_profession, technical_category)
  VALUES (v_patient, 'aberta', 'FISIO', 'cardiorrespiratoria')
  RETURNING id INTO v_demand;

  UPDATE public.professionals
  SET cardiorrespiratory_habilitation_status = 'nao_habilitado'
  WHERE id = v_pp;

  IF public.pp_can_see_demand(v_pp, v_demand) THEN
    RAISE EXCEPTION 'PP não habilitado não deveria ver demanda cardiorrespiratória';
  END IF;

  UPDATE public.professionals
  SET cardiorrespiratory_habilitation_status = 'habilitado'
  WHERE id = v_pp;

  IF NOT public.pp_can_see_demand(v_pp, v_demand) THEN
    RAISE EXCEPTION 'PP habilitado deveria ver demanda cardiorrespiratória';
  END IF;

  UPDATE public.professionals
  SET cardiorrespiratory_habilitation_status = v_original_status
  WHERE id = v_pp;

  DELETE FROM public.demands WHERE id = v_demand;
  UPDATE public.patients SET technical_category = NULL WHERE id = v_patient;

  RAISE NOTICE 'OK: filtro cardiorrespiratório validado';
END;
$$;
