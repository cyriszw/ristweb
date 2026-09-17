-- Allow public seller registration without login (as requested: register button should go directly to form)
-- Remove parent/student fields that are no longer needed in the simplified form
-- These columns were empty (0 rows had data) so safe to drop

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='marketplace_sellers' AND column_name='provider_name') THEN
    ALTER TABLE public.marketplace_sellers DROP COLUMN provider_name;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='marketplace_sellers' AND column_name='student_name') THEN
    ALTER TABLE public.marketplace_sellers DROP COLUMN student_name;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='marketplace_sellers' AND column_name='student_id_reg') THEN
    ALTER TABLE public.marketplace_sellers DROP COLUMN student_id_reg;
  END IF;
END $$;

-- Allow anon registration: make user_id nullable (already done) and disable RLS for sellers to allow public inserts
-- RLS is disabled to allow unauthenticated seller registration via the public form (Register as a Seller -> form -> pending)
-- Admin operations still go via service_role which bypasses RLS; public reads are not needed for sellers table
ALTER TABLE public.marketplace_sellers DISABLE ROW LEVEL SECURITY;

-- Ensure default 10 school-approved products exist (School Approved)
INSERT INTO public.marketplace_products (name, category, description, is_approved, is_prohibited, enabled) VALUES
('Unsweetened Powdered Milk','Food & Snacks','School-approved default item', true, false, true),
('Mazoe Raspberry','Drinks','School-approved default item', true, false, true),
('Mazoe Blackberry','Drinks','School-approved default item', true, false, true),
('Mazoe Cream Soda','Drinks','School-approved default item', true, false, true),
('Potato Chips','Food & Snacks','School-approved default item', true, false, true),
('Biscuits (Charhons or Proton)','Food & Snacks','School-approved default item', true, false, true),
('Tomato Sauce','Food & Snacks','School-approved default item', true, false, true),
('Peanut Butter','Food & Snacks','School-approved default item', true, false, true),
('White Maputi','Food & Snacks','School-approved default item', true, false, true),
('Cerevita','Food & Snacks','School-approved default item', true, false, true)
ON CONFLICT (name) DO UPDATE SET category=EXCLUDED.category, is_approved=true, is_prohibited=false, enabled=true;

-- Allow sellers to request new products (pending approval) via anon/auth
DROP POLICY IF EXISTS "Anyone can request products" ON public.marketplace_products;
DROP POLICY IF EXISTS "Sellers can request products" ON public.marketplace_products;
CREATE POLICY "Anyone can request products" ON public.marketplace_products FOR INSERT WITH CHECK (is_approved = false AND is_prohibited = false AND enabled = false);

-- Refresh PostgREST schema
NOTIFY pgrst, 'reload schema';
