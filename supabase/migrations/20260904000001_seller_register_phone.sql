-- RPC to register seller via phone + PIN with confirmed email (no email confirmation needed)
CREATE OR REPLACE FUNCTION public.register_seller_phone(phone_input TEXT, pin_input TEXT, full_name_input TEXT, store_name_input TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  clean_phone TEXT;
  email TEXT;
  pwd TEXT;
  uid UUID;
  seller_id UUID;
  store_slug TEXT;
  instance UUID := '00000000-0000-0000-0000-000000000000';
BEGIN
  clean_phone := regexp_replace(phone_input, '[^0-9]', '', 'g');
  IF clean_phone = '' THEN RAISE EXCEPTION 'Invalid phone number'; END IF;
  IF length(pin_input) < 4 OR length(pin_input) > 6 THEN RAISE EXCEPTION 'PIN must be 4-6 digits'; END IF;
  IF pin_input !~ '^\d+$' THEN RAISE EXCEPTION 'PIN must be digits only'; END IF;
  IF full_name_input = '' OR store_name_input = '' THEN RAISE EXCEPTION 'Name and store required'; END IF;
  pwd := CASE WHEN length(pin_input) >= 6 THEN pin_input ELSE rpad(pin_input, 6, '0') END;
  email := clean_phone || '@sellers.maristdete.local';
  IF EXISTS (SELECT 1 FROM public.marketplace_sellers WHERE regexp_replace(phone,'[^0-9]','g')=clean_phone) THEN RAISE EXCEPTION 'Phone already registered'; END IF;
  IF EXISTS (SELECT 1 FROM auth.users WHERE email=email) THEN RAISE EXCEPTION 'Phone already registered'; END IF;
  uid := gen_random_uuid();
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_current, recovery_sent_at)
  VALUES (instance, uid, 'authenticated', 'authenticated', email, crypt(pwd, gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, jsonb_build_object('full_name', full_name_input, 'phone', phone_input), now(), now(), '', '', '', null);
  INSERT INTO auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES (uid::text, uid, jsonb_build_object('sub', uid::text, 'email', email), 'email', now(), now(), now());
  INSERT INTO public.marketplace_sellers (user_id, full_name, email, phone, seller_type, intended_items, agreement, status)
  VALUES (uid, full_name_input, email, phone_input, 'vendor', 'Seller Dashboard Registration', true, 'active')
  RETURNING id INTO seller_id;
  store_slug := lower(regexp_replace(store_name_input, '[^a-zA-Z0-9]+','-','g'));
  store_slug := regexp_replace(store_slug, '^-|-$','','g');
  store_slug := store_slug || '-' || substr(uid::text,1,4);
  INSERT INTO public.marketplace_stores (seller_id, slug, store_name, description, contact_email, contact_phone, status)
  VALUES (seller_id, store_slug, store_name_input, 'Welcome to '||store_name_input, email, phone_input, 'active');
  RETURN json_build_object('user_id', uid, 'email', email, 'seller_id', seller_id, 'slug', store_slug);
END;
$$;
GRANT EXECUTE ON FUNCTION public.register_seller_phone(TEXT,TEXT,TEXT,TEXT) TO anon, authenticated;
GRANT USAGE ON SCHEMA auth TO anon, authenticated;
