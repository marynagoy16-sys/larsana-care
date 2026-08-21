# Documentos legais — integração pendente

Marina está produzindo 7 peças jurídicas. Quando recebidas:

1. Inserir em `legal_terms` via admin **Config → Termos** ou migration seed
2. Tipos sugeridos: `CONTRATO_INTERMEDIACAO`, `TERMO_CONSENTIMENTO`, `LGPD`, `CONTRATO_PRESTACAO`, `POLITICA_CANCELAMENTO`, `TERMO_IMAGEM`, `REGULAMENTO_PP`
3. Fluxos de aceite:
   - Paciente: solicitação (`ServiceRequestForm`), aceite inicial (`PacienteAceitePage`)
   - PP: credenciamento (`PPCredenciamentoPage`)

O código já aceita termos dinâmicos de `legal_terms` com `is_current = true`.
