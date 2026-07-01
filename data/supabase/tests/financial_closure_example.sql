-- Teste manual: cenário PDF PF 2º ciclo, 8 sessões R$150, 4 realizadas
-- Executar após seed/migrations em ambiente de dev

DO $$
DECLARE
  v_cycle_id uuid;
  v_calc record;
BEGIN
  -- Validação puramente aritmética da função (sem dados reais)
  NULL;
END $$;

-- Valores esperados para pause_type = 'justified':
-- gross 120000, completed 60000, remaining 60000
-- pp_release 42000, larsana_commission 18000, operational_fee 0, refund 60000

-- Valores esperados para pause_type = 'unjustified':
-- pp_release 42000, larsana_commission 18000, operational_fee 12000, refund 48000, larsana_total 30000

SELECT
  sessions_contracted,
  sessions_completed,
  gross_cycle_amount_cents,
  completed_amount_cents,
  remaining_amount_cents,
  pp_percentage,
  larsana_percentage,
  pp_release_amount_cents,
  larsana_commission_amount_cents,
  operational_fee_cents,
  family_refund_amount_cents,
  larsana_total_cents
FROM public.calculate_financial_closure(
  '00000000-0000-0000-0000-000000000000'::uuid,
  'unjustified'::public.pause_type
);
-- Deve falhar com cycle not found — use com cycle_id real após setup de teste
