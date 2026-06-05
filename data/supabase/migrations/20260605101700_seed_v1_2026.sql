-- LarsanaCare: reference seed V1-2026 (no PII)
-- Migration: 20260605101700_seed_v1_2026

-- Regions
INSERT INTO public.regions (id, code, name, cities_description) VALUES
  ('a0000000-0000-4000-8000-000000000001', 'A', 'Região A', 'Mauá, Ribeirão Pires, Rio Grande da Serra, Diadema'),
  ('a0000000-0000-4000-8000-000000000002', 'B', 'Região B', 'Santo André, São Bernardo do Campo'),
  ('a0000000-0000-4000-8000-000000000003', 'C', 'Região C', 'São Caetano do Sul, São Paulo Capital')
ON CONFLICT (code) DO NOTHING;

-- Cities
INSERT INTO public.cities (region_id, name) VALUES
  ('a0000000-0000-4000-8000-000000000001', 'Mauá'),
  ('a0000000-0000-4000-8000-000000000001', 'Ribeirão Pires'),
  ('a0000000-0000-4000-8000-000000000001', 'Rio Grande da Serra'),
  ('a0000000-0000-4000-8000-000000000001', 'Diadema'),
  ('a0000000-0000-4000-8000-000000000002', 'Santo André'),
  ('a0000000-0000-4000-8000-000000000002', 'São Bernardo do Campo'),
  ('a0000000-0000-4000-8000-000000000003', 'São Caetano do Sul'),
  ('a0000000-0000-4000-8000-000000000003', 'São Paulo')
ON CONFLICT (region_id, name) DO NOTHING;

-- Pricing V1-2026
INSERT INTO public.pricing_matrix_versions (id, version_code, effective_from, is_active, notes)
VALUES (
  'b0000000-0000-4000-8000-000000000001',
  'V1-2026',
  '2026-01-01',
  true,
  'Tabela oficial Larsana Care V1-2026'
)
ON CONFLICT (version_code) DO NOTHING;

-- Deactivate other versions if re-run
UPDATE public.pricing_matrix_versions
SET is_active = false
WHERE version_code != 'V1-2026';

UPDATE public.pricing_matrix_versions
SET is_active = true
WHERE version_code = 'V1-2026';

-- Pricing entries (cents)
INSERT INTO public.pricing_matrix_entries (version_id, region_id, patient_level, session_price_cents)
SELECT
  'b0000000-0000-4000-8000-000000000001',
  r.id,
  e.level,
  e.price
FROM public.regions r
CROSS JOIN (
  VALUES
    ('N1'::public.patient_level, 10000),
    ('N2'::public.patient_level, 13000),
    ('N3'::public.patient_level, 15000)
) AS e(level, price)
WHERE r.code = 'A'
ON CONFLICT (version_id, region_id, patient_level) DO NOTHING;

INSERT INTO public.pricing_matrix_entries (version_id, region_id, patient_level, session_price_cents)
SELECT
  'b0000000-0000-4000-8000-000000000001',
  r.id,
  e.level,
  e.price
FROM public.regions r
CROSS JOIN (
  VALUES
    ('N1'::public.patient_level, 13000),
    ('N2'::public.patient_level, 15000),
    ('N3'::public.patient_level, 17000)
) AS e(level, price)
WHERE r.code = 'B'
ON CONFLICT (version_id, region_id, patient_level) DO NOTHING;

INSERT INTO public.pricing_matrix_entries (version_id, region_id, patient_level, session_price_cents)
SELECT
  'b0000000-0000-4000-8000-000000000001',
  r.id,
  e.level,
  e.price
FROM public.regions r
CROSS JOIN (
  VALUES
    ('N1'::public.patient_level, 15000),
    ('N2'::public.patient_level, 18000),
    ('N3'::public.patient_level, 20000)
) AS e(level, price)
WHERE r.code = 'C'
ON CONFLICT (version_id, region_id, patient_level) DO NOTHING;

-- Commission rules
INSERT INTO public.commission_rules (version_id, pp_class, pp_percent, larsana_percent) VALUES
  ('b0000000-0000-4000-8000-000000000001', 'BRONZE', 70, 30),
  ('b0000000-0000-4000-8000-000000000001', 'PRATA', 75, 25),
  ('b0000000-0000-4000-8000-000000000001', 'OURO', 80, 20)
ON CONFLICT (version_id, pp_class) DO NOTHING;

INSERT INTO public.first_month_retention_rules (version_id, larsana_percent)
VALUES ('b0000000-0000-4000-8000-000000000001', 40)
ON CONFLICT (version_id) DO NOTHING;

-- Contract template placeholder
INSERT INTO public.contract_templates (profession, version, title, content_template, is_active)
VALUES (
  'FISIO',
  '1.0',
  'LRS-PROF.FISIO — Contrato de Parceria',
  'Contrato de prestação de serviços de fisioterapia domiciliar — Larsana Care / DELUMA.',
  true
)
ON CONFLICT (profession, version) DO NOTHING;

-- Contract sequences 2026
INSERT INTO public.contract_sequences (profession, year, last_sequence) VALUES
  ('FISIO', 2026, 10),
  ('CUID', 2026, 2),
  ('NUTI', 2026, 0),
  ('MED', 2026, 0),
  ('FONO', 2026, 0)
ON CONFLICT (profession, year) DO NOTHING;

-- Legal terms v1
INSERT INTO public.legal_terms (term_type, version, title, content, is_current) VALUES
  ('TERMO_ADESAO', '1.0', 'Termo de Adesão Larsana Care', 'Termo de adesão à plataforma Larsana Care.', true),
  ('DIRETRIZES', '1.0', 'Diretrizes de Uso', 'Diretrizes operacionais para pacientes e responsáveis.', true),
  ('LGPD', '1.0', 'Política de Privacidade LGPD', 'Política de privacidade e proteção de dados.', true),
  ('DIRETRIZES_PP', '1.0', 'Diretrizes Profissionais Parceiros', 'Diretrizes para profissionais parceiros.', true),
  ('LGPD_PP', '1.0', 'LGPD Profissionais Parceiros', 'Política de privacidade para PP.', true)
ON CONFLICT (term_type, version) DO NOTHING;

-- Receipt template
INSERT INTO public.receipt_templates (name, content_template, is_default)
VALUES (
  'recibo_ciclo_padrao',
  'O valor descrito neste recibo refere-se ao ciclo de atendimentos realizados, prestados por profissional parceiro, incluindo os custos operacionais, administrativos e de intermediação necessários para viabilização do serviço por meio da plataforma Larsana Care.',
  true
)
ON CONFLICT (name) DO NOTHING;
