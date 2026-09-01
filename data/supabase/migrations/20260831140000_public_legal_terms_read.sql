-- public_legal_terms_read
-- Allow unauthenticated users (login/signup) to read current legal terms.

CREATE OR REPLACE FUNCTION public.get_public_legal_term(p_term_type public.legal_term_type)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'id', lt.id,
    'term_type', lt.term_type,
    'title', lt.title,
    'version', lt.version,
    'content', lt.content
  )
  FROM public.legal_terms lt
  WHERE lt.term_type = p_term_type
    AND lt.is_current = true
  ORDER BY lt.published_at DESC
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_public_legal_term(public.legal_term_type) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_legal_term(public.legal_term_type) TO anon, authenticated;
