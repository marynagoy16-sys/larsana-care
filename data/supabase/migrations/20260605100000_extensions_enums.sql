-- LarsanaCare: extensions and enums
-- Migration: 20260605100000_extensions_enums

CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "btree_gist" WITH SCHEMA extensions;

-- ===== ENUMS =====

CREATE TYPE public.user_role AS ENUM (
  'admin',
  'financeiro',
  'gestao',
  'pp',
  'paciente'
);

CREATE TYPE public.patient_level AS ENUM (
  'N1',
  'N2',
  'N3',
  'VALOR_SOCIAL'
);

CREATE TYPE public.patient_care_status AS ENUM (
  'ATIVO',
  'PAUSA'
);

CREATE TYPE public.region_code AS ENUM (
  'A',
  'B',
  'C'
);

CREATE TYPE public.person_type AS ENUM (
  'PF',
  'PJ'
);

CREATE TYPE public.profession_type AS ENUM (
  'FISIO',
  'NUTI',
  'MED',
  'CUID',
  'FONO'
);

CREATE TYPE public.council_type AS ENUM (
  'CREFITO',
  'COREN'
);

CREATE TYPE public.pp_class AS ENUM (
  'BRONZE',
  'PRATA',
  'OURO'
);

CREATE TYPE public.credentialing_status AS ENUM (
  'rascunho',
  'documentos_pendentes',
  'termos_pendentes',
  'contrato_pendente',
  'aguardando_aprovacao',
  'ativo',
  'inativo',
  'descredenciado'
);

CREATE TYPE public.assessment_status AS ENUM (
  'avaliacao_feita',
  'proposta_enviada',
  'em_analise',
  'respondida_sim',
  'respondida_nao',
  'vencida'
);

CREATE TYPE public.family_response AS ENUM (
  'SIM',
  'NAO'
);

CREATE TYPE public.cycle_status AS ENUM (
  'rascunho',
  'aguardando_pagamento',
  'ativo',
  'encerrado',
  'cancelado'
);

CREATE TYPE public.session_status AS ENUM (
  'prevista',
  'realizada',
  'falta',
  'remarcada',
  'intercorrencia'
);

CREATE TYPE public.payment_method AS ENUM (
  'PIX',
  'BOLETO'
);

CREATE TYPE public.payment_status AS ENUM (
  'pendente',
  'pago',
  'vencido',
  'cancelado'
);

CREATE TYPE public.transfer_status AS ENUM (
  'aguardando_nf',
  'aguardando_validacao',
  'liberado',
  'transferido',
  'falhou',
  'cancelado'
);

CREATE TYPE public.demand_status AS ENUM (
  'aberta',
  'alocada',
  'cancelada'
);

CREATE TYPE public.demand_response_type AS ENUM (
  'accepted',
  'declined'
);

CREATE TYPE public.legal_term_type AS ENUM (
  'TERMO_ADESAO',
  'DIRETRIZES',
  'LGPD',
  'DIRETRIZES_PP',
  'LGPD_PP'
);

CREATE TYPE public.medical_record_type AS ENUM (
  'avaliacao',
  'evolucao',
  'alta'
);

CREATE TYPE public.alert_type AS ENUM (
  'cobranca_vencida',
  'contrato_pendente',
  'prontuario_incompleto_24h',
  'avaliacao_sem_resposta_5d',
  'nps_baixo_consecutivo'
);

CREATE TYPE public.alert_severity AS ENUM (
  'info',
  'warning',
  'critical'
);

CREATE TYPE public.contract_status AS ENUM (
  'rascunho',
  'gerado',
  'pendente_aceite',
  'assinado',
  'aprovado',
  'cancelado'
);

CREATE TYPE public.professional_document_type AS ENUM (
  'RG_CNH',
  'COUNCIL_CARD',
  'CRIMINAL_BACKGROUND',
  'CERTIFICATE',
  'SIGNED_CONTRACT_PDF',
  'VISIT_CARD_PHOTO'
);

CREATE TYPE public.patient_document_type AS ENUM (
  'RG',
  'LAUDO',
  'EXAME',
  'OUTRO'
);

CREATE TYPE public.notification_type AS ENUM (
  'avaliacao_resposta',
  'repasse_liberado',
  'prontuario_alerta',
  'cobranca',
  'proposta',
  'nps',
  'credenciamento',
  'geral'
);

CREATE TYPE public.ticket_status AS ENUM (
  'aberto',
  'em_andamento',
  'resolvido',
  'fechado'
);

CREATE TYPE public.lgpd_request_type AS ENUM (
  'portabilidade',
  'revogacao',
  'exclusao',
  'acesso'
);

CREATE TYPE public.lgpd_request_status AS ENUM (
  'pendente',
  'em_analise',
  'concluido',
  'rejeitado'
);

CREATE TYPE public.nps_rater_type AS ENUM (
  'paciente',
  'pp'
);

CREATE TYPE public.nps_rated_entity_type AS ENUM (
  'professional',
  'patient',
  'platform'
);
