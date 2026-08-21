-- Academy não bloqueia demandas; credenciamento PP é o gate operacional (transcrição 17/08/2026)

UPDATE public.academy_platform_settings
SET
  gates_master_enabled = false,
  active_preset = 'optional'::public.academy_gate_preset,
  updated_at = now()
WHERE id IS NOT NULL;

UPDATE public.academy_gate_rules
SET
  is_enabled = false,
  requirement_type = 'none',
  required_module_ids = '{}',
  course_id = NULL,
  block_message = 'A Formação PP é opcional para receber demandas. Conclua seu credenciamento para operar.',
  updated_at = now()
WHERE gate_target = 'demands';
