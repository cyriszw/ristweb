CREATE OR REPLACE FUNCTION public.increment_gallery_likes(row_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.gallery SET likes = likes + 1 WHERE id = row_id;
$$;