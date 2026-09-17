-- Allow sellers to reset PIN via phone without being logged in
-- Uses pgcrypto to hash new PIN and update auth.users

-- Ensure pgcrypto available (used by Supabase auth)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.reset_seller_pin(phone_input TEXT, new_pin TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  uid UUID;
  clean_phone TEXT;
  pwd TEXT;
BEGIN
  clean_phone := regexp_replace(phone_input, '[^0-9]', '', 'g');
  IF clean_phone = '' THEN clean_phone := phone_input; END IF;
  IF length(new_pin) < 4 THEN RAISE EXCEPTION 'PIN must be at least 4 digits'; END IF;
  -- pad PIN to 6 chars for Supabase password requirement
  pwd := CASE WHEN length(new_pin) >= 6 THEN new_pin ELSE rpad(new_pin, 6, '0') END;

  SELECT user_id INTO uid FROM public.marketplace_sellers WHERE regexp_replace(phone, '[^0-9]', '', 'g') = clean_phone OR phone = phone_input;
  IF uid IS NULL THEN
    -- also try derived email lookup via auth users
    SELECT id INTO uid FROM auth.users WHERE email = clean_phone || '@sellers.maristdete.local';
  END IF;
  IF uid IS NULL THEN RAISE EXCEPTION 'Seller not found for phone %', phone_input; END IF;

  UPDATE auth.users
  SET encrypted_password = crypt(pwd, gen_salt('bf')),
      updated_at = now()
  WHERE id = uid;

  -- also update marketplace_sellers updated_at
  UPDATE public.marketplace_sellers SET updated_at = now() WHERE user_id = uid;
END;
$$;

-- Allow anon and authenticated to execute (reset is public, but phone must match)
GRANT EXECUTE ON FUNCTION public.reset_seller_pin(TEXT, TEXT) TO anon, authenticated;

-- Helper to get seller by phone for login (optional, not exposing password)
CREATE OR REPLACE FUNCTION public.get_seller_by_phone(phone_input TEXT)
RETURNS TABLE (seller_id UUID, store_slug TEXT)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.id, st.slug
  FROM public.marketplace_sellers s
  LEFT JOIN public.marketplace_stores st ON st.seller_id = s.id
  WHERE regexp_replace(s.phone, '[^0-9]', '', 'g') = regexp_replace(phone_input, '[^0-9]', '', 'g');
$$;
GRANT EXECUTE ON FUNCTION public.get_seller_by_phone(TEXT) TO anon, authenticated;
