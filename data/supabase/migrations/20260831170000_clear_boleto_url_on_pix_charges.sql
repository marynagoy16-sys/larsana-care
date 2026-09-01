-- invoiceUrl do Asaas não é boleto; limpar registros PIX com boleto_url indevido.

UPDATE public.charges
SET boleto_url = NULL, updated_at = now()
WHERE payment_method = 'PIX'
  AND boleto_url IS NOT NULL;
