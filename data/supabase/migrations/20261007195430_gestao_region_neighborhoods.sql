-- A tela de regiões é usada por admin e gestão, mas o WITH CHECK
-- só deixava o admin inserir cidades e bairros. A gestão via a seleção
-- e o salvamento era recusado.

DROP POLICY IF EXISTS cities_admin ON public.cities;
CREATE POLICY cities_admin ON public.cities
  FOR ALL TO authenticated
  USING (public.is_staff_role(ARRAY['admin', 'gestao']::public.user_role[]))
  WITH CHECK (public.is_staff_role(ARRAY['admin', 'gestao']::public.user_role[]));

DROP POLICY IF EXISTS neighborhoods_admin ON public.neighborhoods;
CREATE POLICY neighborhoods_admin ON public.neighborhoods
  FOR ALL TO authenticated
  USING (public.is_staff_role(ARRAY['admin', 'gestao']::public.user_role[]))
  WITH CHECK (public.is_staff_role(ARRAY['admin', 'gestao']::public.user_role[]));
