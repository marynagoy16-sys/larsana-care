-- Inativar um paciente guarda o cadastro. A exclusão deixa de ser a ação da lista.

ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.patients.is_active IS 'false quando o admin inativa o cadastro sem excluir o paciente';
