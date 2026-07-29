
-- Uniforms table
CREATE TABLE public.uniforms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  quantity integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.uniforms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage uniforms" ON public.uniforms FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Public read uniforms" ON public.uniforms FOR SELECT USING (true);

-- Stationery table
CREATE TABLE public.stationery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  quantity integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.stationery ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage stationery" ON public.stationery FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Public read stationery" ON public.stationery FOR SELECT USING (true);

-- Testimonials table
CREATE TABLE public.testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  message text NOT NULL,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage testimonials" ON public.testimonials FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Public read testimonials" ON public.testimonials FOR SELECT USING (true);

-- Site content table for editable text
CREATE TABLE public.site_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  content text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage site_content" ON public.site_content FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Public read site_content" ON public.site_content FOR SELECT USING (true);

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.uniforms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.stationery;
ALTER PUBLICATION supabase_realtime ADD TABLE public.testimonials;
ALTER PUBLICATION supabase_realtime ADD TABLE public.site_content;
