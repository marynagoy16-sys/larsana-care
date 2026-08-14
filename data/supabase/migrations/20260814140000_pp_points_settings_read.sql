-- LarsanaCare: PP pode ler thresholds de patente para exibir barra de progresso
-- Migration: 20260814140000_pp_points_settings_read

DROP POLICY IF EXISTS pp_points_settings_read ON public.pp_points_settings;
CREATE POLICY pp_points_settings_read ON public.pp_points_settings
  FOR SELECT TO authenticated
  USING (true);

COMMENT ON POLICY pp_points_settings_read ON public.pp_points_settings IS
  'PP e staff leem thresholds públicos para barra de progresso da patente.';
