-- Novo valor de demand_type precisa estar commitado antes de ser usado.
ALTER TYPE public.demand_type ADD VALUE IF NOT EXISTS 'substituicao';
