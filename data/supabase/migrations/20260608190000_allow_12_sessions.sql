-- LarsanaCare: allow 12 sessions in cycles
-- Migration: 20260608190000_allow_12_sessions

ALTER TABLE public.care_cycles DROP CONSTRAINT IF EXISTS care_cycles_session_count_check;
ALTER TABLE public.care_cycles ADD CONSTRAINT care_cycles_session_count_check CHECK (session_count IN (4, 8, 12));
