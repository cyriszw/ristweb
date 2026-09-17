-- Marketplace schema for Marist / Thomas Coulter Primary School
-- Covers spec sections 2-11

-- Enable pgcrypto if needed
-- Storage bucket for marketplace listing images
INSERT INTO storage.buckets (id, name, public) VALUES ('marketplace', 'marketplace', true)
ON CONFLICT (id) DO NOTHING;

-- Helper function already exists: has_role

-- 1. Sellers table
CREATE TABLE IF NOT EXISTS public.marketplace_sellers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  provider_name TEXT,
  student_name TEXT,
  student_id_reg TEXT,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  seller_type TEXT NOT NULL CHECK (seller_type IN ('parent','guardian','provider','vendor')),
  intended_items TEXT NOT NULL,
  agreement BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','suspended','rejected','banned')),
  suspension_reason TEXT,
  internal_notes TEXT,
  violation_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_marketplace_sellers_user ON public.marketplace_sellers(user_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_sellers_status ON public.marketplace_sellers(status);

-- 2. Approved product list (admin controlled)
CREATE TABLE IF NOT EXISTS public.marketplace_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL CHECK (category IN ('Food & Snacks','Drinks','School Supplies','Clothing & Uniform Items','Other Approved Items')),
  description TEXT,
  min_price NUMERIC,
  max_price NUMERIC,
  is_approved BOOLEAN NOT NULL DEFAULT true,
  is_prohibited BOOLEAN NOT NULL DEFAULT false,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_category ON public.marketplace_products(category);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_enabled ON public.marketplace_products(enabled, is_approved) WHERE enabled = true AND is_approved = true;

-- 3. Listings
CREATE TABLE IF NOT EXISTS public.marketplace_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES public.marketplace_sellers(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.marketplace_products(id) ON DELETE RESTRICT,
  category TEXT NOT NULL CHECK (category IN ('Food & Snacks','Drinks','School Supplies','Clothing & Uniform Items','Other Approved Items')),
  description TEXT,
  price NUMERIC NOT NULL CHECK (price >= 0),
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 0),
  availability TEXT NOT NULL DEFAULT 'in_stock' CHECK (availability IN ('in_stock','out_of_stock','preorder')),
  image_url TEXT,
  contact_info TEXT,
  collection_info TEXT,
  status TEXT NOT NULL DEFAULT 'pending_review' CHECK (status IN ('draft','pending_review','approved','rejected','suspended','removed')),
  flagged BOOLEAN NOT NULL DEFAULT false,
  flag_reason TEXT,
  is_visible BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_seller ON public.marketplace_listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_product ON public.marketplace_listings(product_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_status ON public.marketplace_listings(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_visible ON public.marketplace_listings(is_visible) WHERE is_visible = true;
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_category ON public.marketplace_listings(category);

-- 4. Audit log
CREATE TABLE IF NOT EXISTS public.marketplace_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  actor_id UUID REFERENCES auth.users(id),
  target_type TEXT NOT NULL,
  target_id UUID,
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_marketplace_audit_target ON public.marketplace_audit_log(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_audit_created ON public.marketplace_audit_log(created_at DESC);

-- 5. Rules (editable by admin)
CREATE TABLE IF NOT EXISTS public.marketplace_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);
-- Ensure single row for rules
INSERT INTO public.marketplace_rules (id, content) VALUES (
  '00000000-0000-0000-0000-000000000001',
  E'Only school-approved products may be advertised.\nSellers must provide accurate product and pricing information.\nIllegal or prohibited goods are strictly forbidden.\nSellers must comply with all applicable laws and school policies.\nThe school may remove listings that violate Marketplace Rules.\nAccounts may be suspended for violations.\nThe Marketplace does not replace the school''s official tuck-shop or procurement processes.\nThe school reserves the right to review, reject, remove or suspend marketplace activity according to its policies.'
) ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE public.marketplace_sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_rules ENABLE ROW LEVEL SECURITY;

-- Helper to check seller is active
CREATE OR REPLACE FUNCTION public.marketplace_is_seller_active(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.marketplace_sellers
    WHERE user_id = _user_id AND status = 'active'
  )
$$;

-- Updated_at trigger generic
CREATE OR REPLACE FUNCTION public.marketplace_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_marketplace_sellers_updated ON public.marketplace_sellers;
CREATE TRIGGER trg_marketplace_sellers_updated BEFORE UPDATE ON public.marketplace_sellers FOR EACH ROW EXECUTE FUNCTION public.marketplace_touch_updated_at();
DROP TRIGGER IF EXISTS trg_marketplace_products_updated ON public.marketplace_products;
CREATE TRIGGER trg_marketplace_products_updated BEFORE UPDATE ON public.marketplace_products FOR EACH ROW EXECUTE FUNCTION public.marketplace_touch_updated_at();
DROP TRIGGER IF EXISTS trg_marketplace_listings_updated ON public.marketplace_listings;
CREATE TRIGGER trg_marketplace_listings_updated BEFORE UPDATE ON public.marketplace_listings FOR EACH ROW EXECUTE FUNCTION public.marketplace_touch_updated_at();
DROP TRIGGER IF EXISTS trg_marketplace_rules_updated ON public.marketplace_rules;
CREATE TRIGGER trg_marketplace_rules_updated BEFORE UPDATE ON public.marketplace_rules FOR EACH ROW EXECUTE FUNCTION public.marketplace_touch_updated_at();

-- Compliance trigger for listings: block prohibited products, enforce seller active, handle flagging and suspension
CREATE OR REPLACE FUNCTION public.marketplace_listing_compliance()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  prod RECORD;
  seller RECORD;
BEGIN
  SELECT * INTO prod FROM public.marketplace_products WHERE id = NEW.product_id;
  SELECT * INTO seller FROM public.marketplace_sellers WHERE id = NEW.seller_id;

  -- If product is prohibited or not approved/enabled, block
  IF prod IS NULL THEN
    RAISE EXCEPTION 'Invalid product';
  END IF;

  IF prod.is_prohibited = true OR prod.enabled = false OR prod.is_approved = false THEN
    NEW.flagged := true;
    NEW.flag_reason := 'Product is prohibited or not approved: ' || prod.name;
    NEW.status := 'rejected';
    NEW.is_visible := false;
    -- Increment violation count and possibly suspend seller if policy says immediate suspension
    -- Here we flag and record audit, but suspension is handled via separate logic or admin review
    -- For automatic suspension on prohibited attempt, we increment violation_count
    UPDATE public.marketplace_sellers SET violation_count = violation_count + 1, updated_at = now() WHERE id = NEW.seller_id;
    -- If violation_count >=1 and school rules specify immediate suspension, we could auto-suspend
    -- For now we set to suspended if violation_count >=2 or if product is explicitly prohibited with zero tolerance
    -- Check if seller should be auto-suspended
    PERFORM 1 FROM public.marketplace_sellers WHERE id = NEW.seller_id AND violation_count >= 2;
    IF FOUND THEN
      UPDATE public.marketplace_sellers SET status = 'suspended', suspension_reason = 'Automatic suspension: attempted to list prohibited item: ' || prod.name WHERE id = NEW.seller_id;
    END IF;
    INSERT INTO public.marketplace_audit_log (action, actor_id, target_type, target_id, details)
    VALUES ('listing_blocked_prohibited', seller.user_id, 'listing', NEW.id, 'Blocked prohibited product: ' || prod.name || ' by seller ' || seller.id);
    RETURN NEW;
  END IF;

  -- If seller not active (pending, suspended, banned, rejected), block
  IF seller.status != 'active' THEN
    NEW.flagged := true;
    NEW.flag_reason := 'Seller account not active: ' || seller.status;
    IF NEW.status = 'approved' THEN
      NEW.status := 'pending_review';
    END IF;
    NEW.is_visible := false;
    INSERT INTO public.marketplace_audit_log (action, actor_id, target_type, target_id, details)
    VALUES ('listing_blocked_inactive_seller', seller.user_id, 'listing', NEW.id, 'Seller status ' || seller.status);
    RETURN NEW;
  END IF;

  -- Price validation against product min/max if set
  IF prod.min_price IS NOT NULL AND NEW.price < prod.min_price THEN
    RAISE EXCEPTION 'Price below minimum allowed for this product: %', prod.min_price;
  END IF;
  IF prod.max_price IS NOT NULL AND NEW.price > prod.max_price THEN
    RAISE EXCEPTION 'Price above maximum allowed for this product: %', prod.max_price;
  END IF;

  -- If listing is being approved, ensure product still approved and seller active
  IF NEW.status = 'approved' THEN
    NEW.is_visible := true;
    NEW.approved_at := COALESCE(NEW.approved_at, now());
    NEW.flagged := false;
    NEW.flag_reason := NULL;
  ELSIF NEW.status IN ('pending_review','draft') THEN
    NEW.is_visible := false;
  ELSIF NEW.status IN ('rejected','suspended','removed') THEN
    NEW.is_visible := false;
  END IF;

  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_marketplace_listing_compliance ON public.marketplace_listings;
CREATE TRIGGER trg_marketplace_listing_compliance BEFORE INSERT OR UPDATE ON public.marketplace_listings
FOR EACH ROW EXECUTE FUNCTION public.marketplace_listing_compliance();

-- Trigger to hide listings when seller is suspended/banned
CREATE OR REPLACE FUNCTION public.marketplace_hide_on_seller_suspend()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IN ('suspended','banned','rejected') AND OLD.status != NEW.status THEN
    UPDATE public.marketplace_listings SET is_visible = false, status = 'suspended', updated_at = now()
    WHERE seller_id = NEW.id AND status = 'approved';
    INSERT INTO public.marketplace_audit_log (action, actor_id, target_type, target_id, details)
    VALUES ('seller_suspended', auth.uid(), 'seller', NEW.id, 'Seller ' || NEW.id || ' status changed to ' || NEW.status || ' reason: ' || COALESCE(NEW.suspension_reason,''));
  END IF;
  IF NEW.status = 'active' AND OLD.status != 'active' THEN
    INSERT INTO public.marketplace_audit_log (action, actor_id, target_type, target_id, details)
    VALUES ('seller_activated', auth.uid(), 'seller', NEW.id, 'Seller activated');
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_marketplace_seller_status ON public.marketplace_sellers;
CREATE TRIGGER trg_marketplace_seller_status AFTER UPDATE ON public.marketplace_sellers
FOR EACH ROW EXECUTE FUNCTION public.marketplace_hide_on_seller_suspend();

-- Audit helper for product changes
CREATE OR REPLACE FUNCTION public.marketplace_audit_product()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.marketplace_audit_log (action, actor_id, target_type, target_id, details)
  VALUES (TG_OP || '_product', auth.uid(), 'product', COALESCE(NEW.id, OLD.id), COALESCE(NEW.name, OLD.name));
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_marketplace_product_audit ON public.marketplace_products;
CREATE TRIGGER trg_marketplace_product_audit AFTER INSERT OR UPDATE OR DELETE ON public.marketplace_products
FOR EACH ROW EXECUTE FUNCTION public.marketplace_audit_product();

-- RLS Policies
-- Sellers
DROP POLICY IF EXISTS "Public cannot read sellers" ON public.marketplace_sellers;
DROP POLICY IF EXISTS "Users can read own seller" ON public.marketplace_sellers;
DROP POLICY IF EXISTS "Users can insert own seller" ON public.marketplace_sellers;
DROP POLICY IF EXISTS "Users can update own seller pending" ON public.marketplace_sellers;
DROP POLICY IF EXISTS "Admins manage sellers" ON public.marketplace_sellers;
CREATE POLICY "Users can read own seller" ON public.marketplace_sellers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own seller" ON public.marketplace_sellers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own seller pending" ON public.marketplace_sellers FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage sellers" ON public.marketplace_sellers FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Products
DROP POLICY IF EXISTS "Public read approved products" ON public.marketplace_products;
DROP POLICY IF EXISTS "Admins manage products" ON public.marketplace_products;
CREATE POLICY "Public read approved products" ON public.marketplace_products FOR SELECT USING (enabled = true AND is_approved = true AND is_prohibited = false);
CREATE POLICY "Admins manage products" ON public.marketplace_products FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Listings
DROP POLICY IF EXISTS "Public read approved listings" ON public.marketplace_listings;
DROP POLICY IF EXISTS "Sellers read own listings" ON public.marketplace_listings;
DROP POLICY IF EXISTS "Sellers insert own listings" ON public.marketplace_listings;
DROP POLICY IF EXISTS "Sellers update own listings" ON public.marketplace_listings;
DROP POLICY IF EXISTS "Sellers delete own listings" ON public.marketplace_listings;
DROP POLICY IF EXISTS "Admins manage listings" ON public.marketplace_listings;
CREATE POLICY "Public read approved listings" ON public.marketplace_listings FOR SELECT USING (is_visible = true AND status = 'approved');
CREATE POLICY "Sellers read own listings" ON public.marketplace_listings FOR SELECT USING (
  seller_id IN (SELECT id FROM public.marketplace_sellers WHERE user_id = auth.uid())
);
CREATE POLICY "Sellers insert own listings" ON public.marketplace_listings FOR INSERT WITH CHECK (
  seller_id IN (SELECT id FROM public.marketplace_sellers WHERE user_id = auth.uid() AND status = 'active')
);
CREATE POLICY "Sellers update own listings" ON public.marketplace_listings FOR UPDATE USING (
  seller_id IN (SELECT id FROM public.marketplace_sellers WHERE user_id = auth.uid())
) WITH CHECK (
  seller_id IN (SELECT id FROM public.marketplace_sellers WHERE user_id = auth.uid())
);
CREATE POLICY "Sellers delete own listings" ON public.marketplace_listings FOR DELETE USING (
  seller_id IN (SELECT id FROM public.marketplace_sellers WHERE user_id = auth.uid())
);
CREATE POLICY "Admins manage listings" ON public.marketplace_listings FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Audit log
DROP POLICY IF EXISTS "Admins read audit" ON public.marketplace_audit_log;
CREATE POLICY "Admins read audit" ON public.marketplace_audit_log FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins insert audit" ON public.marketplace_audit_log FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Rules
DROP POLICY IF EXISTS "Public read rules" ON public.marketplace_rules;
DROP POLICY IF EXISTS "Admins manage rules" ON public.marketplace_rules;
CREATE POLICY "Public read rules" ON public.marketplace_rules FOR SELECT USING (true);
CREATE POLICY "Admins manage rules" ON public.marketplace_rules FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Storage policies for marketplace bucket
DROP POLICY IF EXISTS "Public read marketplace" ON storage.objects;
DROP POLICY IF EXISTS "Sellers upload marketplace" ON storage.objects;
DROP POLICY IF EXISTS "Sellers update marketplace" ON storage.objects;
DROP POLICY IF EXISTS "Sellers delete marketplace" ON storage.objects;
DROP POLICY IF EXISTS "Admins manage marketplace storage" ON storage.objects;
CREATE POLICY "Public read marketplace" ON storage.objects FOR SELECT USING (bucket_id = 'marketplace');
CREATE POLICY "Sellers upload marketplace" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'marketplace' AND auth.role() = 'authenticated');
CREATE POLICY "Sellers update marketplace" ON storage.objects FOR UPDATE USING (bucket_id = 'marketplace' AND auth.role() = 'authenticated');
CREATE POLICY "Sellers delete marketplace" ON storage.objects FOR DELETE USING (bucket_id = 'marketplace' AND auth.role() = 'authenticated');
CREATE POLICY "Admins manage marketplace storage" ON storage.objects FOR ALL USING (bucket_id = 'marketplace' AND has_role(auth.uid(), 'admin'::app_role));

-- Seed approved products
INSERT INTO public.marketplace_products (name, category, description, is_approved, is_prohibited, enabled) VALUES
('Sandwiches','Food & Snacks','Fresh sandwiches - various fillings', true, false, true),
('Fruit','Food & Snacks','Fresh seasonal fruit', true, false, true),
('Baked goods','Food & Snacks','Muffins, scones, biscuits (school approved)', true, false, true),
('Approved snacks','Food & Snacks','Crisps and snacks from approved list', true, false, true),
('Yoghurt','Food & Snacks','Yoghurt cups', true, false, true),
('Fruit Juice','Drinks','100% fruit juice boxes', true, false, true),
('Water','Drinks','Bottled water', true, false, true),
('Milk','Drinks','Flavoured milk', true, false, true),
('Exercise Books','School Supplies','A4 exercise books', true, false, true),
('Pens & Pencils','School Supplies','Blue/black pens, HB pencils', true, false, true),
('Ruler & Eraser','School Supplies','Stationery sets', true, false, true),
('School Bag','School Supplies','Approved school bags', true, false, true),
('School Shirt','Clothing & Uniform Items','White school shirts', true, false, true),
('School Shorts','Clothing & Uniform Items','Grey school shorts', true, false, true),
('School Dress','Clothing & Uniform Items','School dresses', true, false, true),
('School Tie','Clothing & Uniform Items','School ties', true, false, true),
('Socks','Clothing & Uniform Items','Grey school socks', true, false, true),
('Lunch Box','Other Approved Items','Lunch boxes', true, false, true),
('Water Bottle','Other Approved Items','Reusable water bottles', true, false, true)
ON CONFLICT (name) DO NOTHING;

-- Add a few prohibited examples (not visible to public, but admin can see)
INSERT INTO public.marketplace_products (name, category, description, is_approved, is_prohibited, enabled) VALUES
('Energy Drinks','Drinks','Prohibited - high caffeine', false, true, false),
('Fizzy Drinks','Drinks','Prohibited sugary carbonated drinks', false, true, false),
('Sweets - Prohibited','Food & Snacks','Prohibited high-sugar sweets', false, true, false)
ON CONFLICT (name) DO NOTHING;
