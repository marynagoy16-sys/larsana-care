-- Permite paciente simular pagamento em dev/produção (sem Asaas ativo)
GRANT EXECUTE ON FUNCTION public.simulate_charge_payment(uuid) TO authenticated;
