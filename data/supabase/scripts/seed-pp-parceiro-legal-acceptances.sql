-- Aceites de teste para parceiro@larsanacare.com.br (credenciamento PP completo)

INSERT INTO public.digital_acceptances (
  acceptor_role,
  acceptor_user_id,
  professional_id,
  term_id,
  context_type,
  ip_address,
  user_agent
)
SELECT
  'pp'::public.user_role,
  'c1000000-0000-4000-8000-000000000004'::uuid,
  'd1000000-0000-4000-8000-000000000001'::uuid,
  lt.id,
  'credentialing'::public.legal_acceptance_context,
  '127.0.0.1'::inet,
  'seed-test-script'
FROM public.legal_terms lt
WHERE lt.is_current = true
  AND lt.term_type IN (
    'ANEXO_I_COMERCIAL_PP',
    'ANEXO_II_OPERACIONAL_PP',
    'ANEXO_III_CATEGORIAS_PP',
    'ANEXO_IV_SIGILO_PP',
    'TERMO_USO_PP'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM public.digital_acceptances da
    WHERE da.acceptor_user_id = 'c1000000-0000-4000-8000-000000000004'::uuid
      AND da.term_id = lt.id
      AND da.context_id IS NULL
  );

SELECT lt.term_type, da.accepted_at
FROM public.digital_acceptances da
JOIN public.legal_terms lt ON lt.id = da.term_id
WHERE da.professional_id = 'd1000000-0000-4000-8000-000000000001'
ORDER BY lt.term_type;
