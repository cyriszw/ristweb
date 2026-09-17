-- Seller Dashboard - Complete Marketplace Seller Experience
-- Extends marketplace_sellers, adds stores, seller_products, orders, reviews, messages, notifications, payouts
-- Users -> Sellers -> Stores (1:1) -> Products -> Orders

-- 1. Stores (1:1 per seller)
CREATE TABLE IF NOT EXISTS public.marketplace_stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES public.marketplace_sellers(id) ON DELETE CASCADE UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  store_name TEXT NOT NULL,
  logo_url TEXT,
  banner_url TEXT,
  description TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  location TEXT,
  business_hours JSONB DEFAULT '{}'::jsonb,
  social_links JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','draft','suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_marketplace_stores_seller ON public.marketplace_stores(seller_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_stores_slug ON public.marketplace_stores(slug);
CREATE INDEX IF NOT EXISTS idx_marketplace_stores_status ON public.marketplace_stores(status);

-- 2. Seller Products (store-specific, not the global catalog)
CREATE TABLE IF NOT EXISTS public.marketplace_seller_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.marketplace_stores(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES public.marketplace_sellers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT,
  description TEXT,
  price NUMERIC NOT NULL CHECK (price >= 0),
  discount_price NUMERIC CHECK (discount_price IS NULL OR discount_price >= 0),
  category TEXT NOT NULL DEFAULT 'Other Approved Items' CHECK (category IN ('Food & Snacks','Drinks','School Supplies','Clothing & Uniform Items','Other Approved Items')),
  stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  sku TEXT,
  images TEXT[] DEFAULT '{}',
  variants JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','out_of_stock','archived')),
  views INTEGER NOT NULL DEFAULT 0,
  sales_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_seller_products_store ON public.marketplace_seller_products(store_id);
CREATE INDEX IF NOT EXISTS idx_seller_products_seller ON public.marketplace_seller_products(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_products_status ON public.marketplace_seller_products(status);
CREATE INDEX IF NOT EXISTS idx_seller_products_category ON public.marketplace_seller_products(category);
CREATE INDEX IF NOT EXISTS idx_seller_products_published ON public.marketplace_seller_products(status, stock_quantity) WHERE status='published';

-- 3. Orders
CREATE TABLE IF NOT EXISTS public.marketplace_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  store_id UUID NOT NULL REFERENCES public.marketplace_stores(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES public.marketplace_sellers(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  subtotal NUMERIC NOT NULL DEFAULT 0 CHECK (subtotal >=0),
  platform_fee NUMERIC NOT NULL DEFAULT 0 CHECK (platform_fee >=0),
  seller_earnings NUMERIC NOT NULL DEFAULT 0 CHECK (seller_earnings >=0),
  total NUMERIC NOT NULL DEFAULT 0 CHECK (total >=0),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending','paid','failed','refunded')),
  order_status TEXT NOT NULL DEFAULT 'pending' CHECK (order_status IN ('pending','confirmed','processing','shipped','completed','cancelled','refunded')),
  shipping_address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_orders_store ON public.marketplace_orders(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller ON public.marketplace_orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON public.marketplace_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.marketplace_orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON public.marketplace_orders(created_at DESC);

-- 4. Order Items
CREATE TABLE IF NOT EXISTS public.marketplace_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.marketplace_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.marketplace_seller_products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_image TEXT,
  quantity INTEGER NOT NULL CHECK (quantity >0),
  unit_price NUMERIC NOT NULL CHECK (unit_price >=0),
  total NUMERIC NOT NULL CHECK (total >=0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.marketplace_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON public.marketplace_order_items(product_id);

-- 5. Reviews
CREATE TABLE IF NOT EXISTS public.marketplace_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.marketplace_seller_products(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.marketplace_stores(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES public.marketplace_sellers(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL DEFAULT 'Customer',
  rating INTEGER NOT NULL CHECK (rating >=1 AND rating <=5),
  comment TEXT,
  seller_reply TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON public.marketplace_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_store ON public.marketplace_reviews(store_id);
CREATE INDEX IF NOT EXISTS idx_reviews_seller ON public.marketplace_reviews(seller_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.marketplace_reviews(rating);

-- 6. Messages (seller-customer conversations per store/order/product)
CREATE TABLE IF NOT EXISTS public.marketplace_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.marketplace_stores(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES public.marketplace_sellers(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  order_id UUID REFERENCES public.marketplace_orders(id) ON DELETE SET NULL,
  product_id UUID REFERENCES public.marketplace_seller_products(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('seller','customer')),
  sender_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_messages_store ON public.marketplace_messages(store_id);
CREATE INDEX IF NOT EXISTS idx_messages_seller ON public.marketplace_messages(seller_id);
CREATE INDEX IF NOT EXISTS idx_messages_customer ON public.marketplace_messages(customer_id);
CREATE INDEX IF NOT EXISTS idx_messages_read ON public.marketplace_messages(is_read) WHERE is_read=false;

-- 7. Notifications
CREATE TABLE IF NOT EXISTS public.marketplace_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES public.marketplace_sellers(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('new_order','order_status','new_review','low_stock','new_message','payout','announcement')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  related_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_seller ON public.marketplace_notifications(seller_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.marketplace_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.marketplace_notifications(is_read);

-- 8. Payouts
CREATE TABLE IF NOT EXISTS public.marketplace_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES public.marketplace_sellers(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.marketplace_stores(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.marketplace_orders(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL CHECK (amount >=0),
  platform_fee NUMERIC NOT NULL DEFAULT 0,
  net_amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed','failed')),
  payout_method TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_payouts_seller ON public.marketplace_payouts(seller_id);
CREATE INDEX IF NOT EXISTS idx_payouts_store ON public.marketplace_payouts(store_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON public.marketplace_payouts(status);

-- 9. Helper function: slugify
CREATE OR REPLACE FUNCTION public.slugify(txt TEXT) RETURNS TEXT LANGUAGE sql IMMUTABLE AS $$
  SELECT lower(regexp_replace(regexp_replace(trim(txt), '[^a-zA-Z0-9]+', '-', 'g'), '^-|-$', '', 'g'))
$$;

-- 10. Auto create store on seller activation + updated_at triggers
CREATE OR REPLACE FUNCTION public.marketplace_touch_seller_dash()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_stores_updated ON public.marketplace_stores;
CREATE TRIGGER trg_stores_updated BEFORE UPDATE ON public.marketplace_stores FOR EACH ROW EXECUTE FUNCTION public.marketplace_touch_seller_dash();
DROP TRIGGER IF EXISTS trg_seller_products_updated ON public.marketplace_seller_products;
CREATE TRIGGER trg_seller_products_updated BEFORE UPDATE ON public.marketplace_seller_products FOR EACH ROW EXECUTE FUNCTION public.marketplace_touch_seller_dash();
DROP TRIGGER IF EXISTS trg_orders_updated ON public.marketplace_orders;
CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON public.marketplace_orders FOR EACH ROW EXECUTE FUNCTION public.marketplace_touch_seller_dash();
DROP TRIGGER IF EXISTS trg_reviews_updated ON public.marketplace_reviews;
CREATE TRIGGER trg_reviews_updated BEFORE UPDATE ON public.marketplace_reviews FOR EACH ROW EXECUTE FUNCTION public.marketplace_touch_seller_dash();
DROP TRIGGER IF EXISTS trg_payouts_updated ON public.marketplace_payouts;
CREATE TRIGGER trg_payouts_updated BEFORE UPDATE ON public.marketplace_payouts FOR EACH ROW EXECUTE FUNCTION public.marketplace_touch_seller_dash();

-- Ensure seller_products seller_id matches store's seller_id
CREATE OR REPLACE FUNCTION public.marketplace_seller_product_check()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE store_seller UUID;
BEGIN
  SELECT seller_id INTO store_seller FROM public.marketplace_stores WHERE id = NEW.store_id;
  IF store_seller IS NULL THEN RAISE EXCEPTION 'Invalid store'; END IF;
  IF store_seller != NEW.seller_id THEN RAISE EXCEPTION 'seller_id mismatch with store'; END IF;
  -- Auto set slug if null
  IF NEW.slug IS NULL OR NEW.slug='' THEN NEW.slug := slugify(NEW.name) || '-' || substr(NEW.id::text,1,8); END IF;
  -- Auto out_of_stock if stock 0 and published
  IF NEW.stock_quantity = 0 AND NEW.status='published' THEN NEW.status := 'out_of_stock'; END IF;
  IF NEW.stock_quantity >0 AND NEW.status='out_of_stock' THEN NEW.status := 'published'; END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_seller_product_check ON public.marketplace_seller_products;
CREATE TRIGGER trg_seller_product_check BEFORE INSERT OR UPDATE ON public.marketplace_seller_products FOR EACH ROW EXECUTE FUNCTION public.marketplace_seller_product_check();

-- Auto-generate order_number and calculate earnings
CREATE OR REPLACE FUNCTION public.marketplace_order_before()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number='' THEN NEW.order_number := 'ORD-' || to_char(now(),'YYYYMMDD') || '-' || substr(gen_random_uuid()::text,1,8); END IF;
  NEW.updated_at := now();
  -- 10% platform fee example, seller gets 90%
  IF NEW.platform_fee = 0 AND NEW.total >0 THEN
    NEW.platform_fee := round(NEW.total * 0.10,2);
    NEW.seller_earnings := round(NEW.total - NEW.platform_fee,2);
    IF NEW.subtotal =0 THEN NEW.subtotal := NEW.total; END IF;
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_orders_before ON public.marketplace_orders;
CREATE TRIGGER trg_orders_before BEFORE INSERT OR UPDATE ON public.marketplace_orders FOR EACH ROW EXECUTE FUNCTION public.marketplace_order_before();

-- Auto increment sales_count and decrement stock on completed order item creation (simplified)
-- Notifications: low stock, new order etc - create via trigger
CREATE OR REPLACE FUNCTION public.marketplace_after_order_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  INSERT INTO public.marketplace_notifications (seller_id, user_id, type, title, message, related_id)
  SELECT NEW.seller_id, s.user_id, 'new_order', 'New order ' || NEW.order_number, 'You received a new order for $' || NEW.total || ' - ' || NEW.customer_name, NEW.id
  FROM public.marketplace_sellers s WHERE s.id = NEW.seller_id;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_after_order_insert ON public.marketplace_orders;
CREATE TRIGGER trg_after_order_insert AFTER INSERT ON public.marketplace_orders FOR EACH ROW EXECUTE FUNCTION public.marketplace_after_order_insert();

CREATE OR REPLACE FUNCTION public.marketplace_after_review()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  INSERT INTO public.marketplace_notifications (seller_id, type, title, message, related_id)
  VALUES (NEW.seller_id, 'new_review', 'New review ' || NEW.rating || '★', NEW.customer_name || ' reviewed ' || (SELECT name FROM public.marketplace_seller_products WHERE id=NEW.product_id), NEW.id);
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_after_review ON public.marketplace_reviews;
CREATE TRIGGER trg_after_review AFTER INSERT ON public.marketplace_reviews FOR EACH ROW EXECUTE FUNCTION public.marketplace_after_review();

CREATE OR REPLACE FUNCTION public.marketplace_after_message()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NEW.sender_type='customer' THEN
    INSERT INTO public.marketplace_notifications (seller_id, type, title, message, related_id)
    VALUES (NEW.seller_id, 'new_message', 'New message from ' || NEW.customer_name, left(NEW.message,80), NEW.id);
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_after_message ON public.marketplace_messages;
CREATE TRIGGER trg_after_message AFTER INSERT ON public.marketplace_messages FOR EACH ROW EXECUTE FUNCTION public.marketplace_after_message();

-- Ensure store slug unique trigger
CREATE OR REPLACE FUNCTION public.marketplace_store_slug()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug='' THEN NEW.slug := slugify(NEW.store_name) || '-' || substr(NEW.seller_id::text,1,6); END IF;
  NEW.slug := slugify(NEW.slug);
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_store_slug ON public.marketplace_stores;
CREATE TRIGGER trg_store_slug BEFORE INSERT OR UPDATE ON public.marketplace_stores FOR EACH ROW EXECUTE FUNCTION public.marketplace_store_slug();

-- Enable RLS
ALTER TABLE public.marketplace_stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_seller_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_payouts ENABLE ROW LEVEL SECURITY;

-- RLS Policies: sellers own resources; public can read published products and active stores

-- Stores: public read active, sellers manage own, admin manage all
DROP POLICY IF EXISTS "Public read active stores" ON public.marketplace_stores;
CREATE POLICY "Public read active stores" ON public.marketplace_stores FOR SELECT USING (status='active');
DROP POLICY IF EXISTS "Sellers read own store" ON public.marketplace_stores;
CREATE POLICY "Sellers read own store" ON public.marketplace_stores FOR SELECT USING (seller_id IN (SELECT id FROM public.marketplace_sellers WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Sellers insert own store" ON public.marketplace_stores;
CREATE POLICY "Sellers insert own store" ON public.marketplace_stores FOR INSERT WITH CHECK (seller_id IN (SELECT id FROM public.marketplace_sellers WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Sellers update own store" ON public.marketplace_stores;
CREATE POLICY "Sellers update own store" ON public.marketplace_stores FOR UPDATE USING (seller_id IN (SELECT id FROM public.marketplace_sellers WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Admins manage stores" ON public.marketplace_stores;
CREATE POLICY "Admins manage stores" ON public.marketplace_stores FOR ALL USING (has_role(auth.uid(),'admin'::app_role));

-- Seller Products: public read published, sellers manage own
DROP POLICY IF EXISTS "Public read published products" ON public.marketplace_seller_products;
CREATE POLICY "Public read published products" ON public.marketplace_seller_products FOR SELECT USING (status='published');
DROP POLICY IF EXISTS "Sellers read own products" ON public.marketplace_seller_products;
CREATE POLICY "Sellers read own products" ON public.marketplace_seller_products FOR SELECT USING (seller_id IN (SELECT id FROM public.marketplace_sellers WHERE user_id=auth.uid()));
DROP POLICY IF EXISTS "Sellers insert own products" ON public.marketplace_seller_products;
CREATE POLICY "Sellers insert own products" ON public.marketplace_seller_products FOR INSERT WITH CHECK (seller_id IN (SELECT id FROM public.marketplace_sellers WHERE user_id=auth.uid()));
DROP POLICY IF EXISTS "Sellers update own products" ON public.marketplace_seller_products;
CREATE POLICY "Sellers update own products" ON public.marketplace_seller_products FOR UPDATE USING (seller_id IN (SELECT id FROM public.marketplace_sellers WHERE user_id=auth.uid()));
DROP POLICY IF EXISTS "Sellers delete own products" ON public.marketplace_seller_products;
CREATE POLICY "Sellers delete own products" ON public.marketplace_seller_products FOR DELETE USING (seller_id IN (SELECT id FROM public.marketplace_sellers WHERE user_id=auth.uid()));
DROP POLICY IF EXISTS "Admins manage seller products" ON public.marketplace_seller_products;
CREATE POLICY "Admins manage seller products" ON public.marketplace_seller_products FOR ALL USING (has_role(auth.uid(),'admin'::app_role));

-- Orders: sellers read own, customers read own, admin all
DROP POLICY IF EXISTS "Sellers read own orders" ON public.marketplace_orders;
CREATE POLICY "Sellers read own orders" ON public.marketplace_orders FOR SELECT USING (seller_id IN (SELECT id FROM public.marketplace_sellers WHERE user_id=auth.uid()));
DROP POLICY IF EXISTS "Customers read own orders" ON public.marketplace_orders;
CREATE POLICY "Customers read own orders" ON public.marketplace_orders FOR SELECT USING (customer_id = auth.uid());
DROP POLICY IF EXISTS "Anyone can create orders" ON public.marketplace_orders;
CREATE POLICY "Anyone can create orders" ON public.marketplace_orders FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Sellers update own orders" ON public.marketplace_orders;
CREATE POLICY "Sellers update own orders" ON public.marketplace_orders FOR UPDATE USING (seller_id IN (SELECT id FROM public.marketplace_sellers WHERE user_id=auth.uid()));
DROP POLICY IF EXISTS "Admins manage orders" ON public.marketplace_orders;
CREATE POLICY "Admins manage orders" ON public.marketplace_orders FOR ALL USING (has_role(auth.uid(),'admin'::app_role));

-- Order items: via orders
DROP POLICY IF EXISTS "Sellers read own order items" ON public.marketplace_order_items;
CREATE POLICY "Sellers read own order items" ON public.marketplace_order_items FOR SELECT USING (order_id IN (SELECT id FROM public.marketplace_orders WHERE seller_id IN (SELECT id FROM public.marketplace_sellers WHERE user_id=auth.uid()) OR customer_id=auth.uid()));
DROP POLICY IF EXISTS "Anyone insert order items" ON public.marketplace_order_items;
CREATE POLICY "Anyone insert order items" ON public.marketplace_order_items FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Admins manage order items" ON public.marketplace_order_items;
CREATE POLICY "Admins manage order items" ON public.marketplace_order_items FOR ALL USING (has_role(auth.uid(),'admin'::app_role));

-- Reviews: public read, sellers read own, anyone can insert
DROP POLICY IF EXISTS "Public read reviews" ON public.marketplace_reviews;
CREATE POLICY "Public read reviews" ON public.marketplace_reviews FOR SELECT USING (true);
DROP POLICY IF EXISTS "Sellers update own reviews reply" ON public.marketplace_reviews;
CREATE POLICY "Sellers update own reviews reply" ON public.marketplace_reviews FOR UPDATE USING (seller_id IN (SELECT id FROM public.marketplace_sellers WHERE user_id=auth.uid()));
DROP POLICY IF EXISTS "Anyone insert review" ON public.marketplace_reviews;
CREATE POLICY "Anyone insert review" ON public.marketplace_reviews FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Admins manage reviews" ON public.marketplace_reviews;
CREATE POLICY "Admins manage reviews" ON public.marketplace_reviews FOR ALL USING (has_role(auth.uid(),'admin'::app_role));

-- Messages: sellers read own
DROP POLICY IF EXISTS "Sellers read own messages" ON public.marketplace_messages;
CREATE POLICY "Sellers read own messages" ON public.marketplace_messages FOR SELECT USING (seller_id IN (SELECT id FROM public.marketplace_sellers WHERE user_id=auth.uid()) OR customer_id=auth.uid());
DROP POLICY IF EXISTS "Sellers insert messages" ON public.marketplace_messages;
CREATE POLICY "Sellers insert messages" ON public.marketplace_messages FOR INSERT WITH CHECK (seller_id IN (SELECT id FROM public.marketplace_sellers WHERE user_id=auth.uid()) OR true);
DROP POLICY IF EXISTS "Sellers update own messages read" ON public.marketplace_messages;
CREATE POLICY "Sellers update own messages read" ON public.marketplace_messages FOR UPDATE USING (seller_id IN (SELECT id FROM public.marketplace_sellers WHERE user_id=auth.uid()) OR customer_id=auth.uid());
DROP POLICY IF EXISTS "Admins manage messages" ON public.marketplace_messages;
CREATE POLICY "Admins manage messages" ON public.marketplace_messages FOR ALL USING (has_role(auth.uid(),'admin'::app_role));

-- Notifications: sellers read own
DROP POLICY IF EXISTS "Sellers read own notifications" ON public.marketplace_notifications;
CREATE POLICY "Sellers read own notifications" ON public.marketplace_notifications FOR SELECT USING (seller_id IN (SELECT id FROM public.marketplace_sellers WHERE user_id=auth.uid()) OR user_id=auth.uid());
DROP POLICY IF EXISTS "Sellers update own notifications" ON public.marketplace_notifications;
CREATE POLICY "Sellers update own notifications" ON public.marketplace_notifications FOR UPDATE USING (seller_id IN (SELECT id FROM public.marketplace_sellers WHERE user_id=auth.uid()) OR user_id=auth.uid());
DROP POLICY IF EXISTS "System insert notifications" ON public.marketplace_notifications;
CREATE POLICY "System insert notifications" ON public.marketplace_notifications FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Admins manage notifications" ON public.marketplace_notifications;
CREATE POLICY "Admins manage notifications" ON public.marketplace_notifications FOR ALL USING (has_role(auth.uid(),'admin'::app_role));

-- Payouts: sellers read own, admin manage
DROP POLICY IF EXISTS "Sellers read own payouts" ON public.marketplace_payouts;
CREATE POLICY "Sellers read own payouts" ON public.marketplace_payouts FOR SELECT USING (seller_id IN (SELECT id FROM public.marketplace_sellers WHERE user_id=auth.uid()));
DROP POLICY IF EXISTS "Admins manage payouts" ON public.marketplace_payouts;
CREATE POLICY "Admins manage payouts" ON public.marketplace_payouts FOR ALL USING (has_role(auth.uid(),'admin'::app_role));
DROP POLICY IF EXISTS "System insert payouts" ON public.marketplace_payouts;
CREATE POLICY "System insert payouts" ON public.marketplace_payouts FOR INSERT WITH CHECK (true);

-- Storage for seller assets (extend marketplace bucket, or ensure exists)
INSERT INTO storage.buckets (id, name, public) VALUES ('marketplace', 'marketplace', true) ON CONFLICT (id) DO NOTHING;

-- Ensure marketplace_sellers has RLS enabled after previous disable (keep disabled? we need secure)
-- Re-enable and set proper policies (allow public insert for anon registration, but restrict reads)
-- But we keep it DISABLED per previous migration to allow anon; for seller dashboard we need enabled with anon insert
DO $$
BEGIN
  IF (SELECT relrowsecurity FROM pg_class WHERE relname='marketplace_sellers') = false THEN
    ALTER TABLE public.marketplace_sellers ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

DROP POLICY IF EXISTS "Users can read own seller" ON public.marketplace_sellers;
DROP POLICY IF EXISTS "Users can insert own seller" ON public.marketplace_sellers;
DROP POLICY IF EXISTS "Users can update own seller pending" ON public.marketplace_sellers;
DROP POLICY IF EXISTS "Admins manage sellers" ON public.marketplace_sellers;
DROP POLICY IF EXISTS "Public can insert seller" ON public.marketplace_sellers;
DROP POLICY IF EXISTS "Anon insert seller" ON public.marketplace_sellers;
-- Allow anyone to insert pending seller (for public register) and authenticated to insert linked
CREATE POLICY "Anyone can insert seller" ON public.marketplace_sellers FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can read own seller" ON public.marketplace_sellers FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Public cannot list sellers" ON public.marketplace_sellers FOR SELECT USING (false);
-- Actually combine: allow own + admin; need to drop previous then create one
DROP POLICY IF EXISTS "Anyone can insert seller" ON public.marketplace_sellers;
DROP POLICY IF EXISTS "Users can read own seller" ON public.marketplace_sellers;
DROP POLICY IF EXISTS "Public cannot list sellers" ON public.marketplace_sellers;
CREATE POLICY "Anyone can insert seller" ON public.marketplace_sellers FOR INSERT WITH CHECK (true);
CREATE POLICY "Sellers can read own" ON public.marketplace_sellers FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "Admins read all sellers" ON public.marketplace_sellers FOR SELECT USING (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Sellers can update own" ON public.marketplace_sellers FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins manage sellers all" ON public.marketplace_sellers FOR ALL USING (has_role(auth.uid(),'admin'::app_role));
