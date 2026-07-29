
-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS for user_roles
CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Posts table
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'notices',
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read posts" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Admins manage posts" ON public.posts FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Gallery table
CREATE TABLE public.gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  caption TEXT,
  category TEXT DEFAULT 'general',
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read gallery" ON public.gallery FOR SELECT USING (true);
CREATE POLICY "Admins manage gallery" ON public.gallery FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Files table
CREATE TABLE public.files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read files" ON public.files FOR SELECT USING (true);
CREATE POLICY "Admins manage files" ON public.files FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Events table
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Admins manage events" ON public.events FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Messages (contact form)
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert messages" ON public.messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins read messages" ON public.messages FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete messages" ON public.messages FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Clubs table
CREATE TABLE public.clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  meeting_days TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read clubs" ON public.clubs FOR SELECT USING (true);
CREATE POLICY "Admins manage clubs" ON public.clubs FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Sports table
CREATE TABLE public.sports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  season TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read sports" ON public.sports FOR SELECT USING (true);
CREATE POLICY "Admins manage sports" ON public.sports FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Site settings (notification banner etc)
CREATE TABLE public.site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Admins manage settings" ON public.site_settings FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('images', 'images', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('files', 'files', true);

-- Storage policies
CREATE POLICY "Public read images" ON storage.objects FOR SELECT USING (bucket_id = 'images');
CREATE POLICY "Admins upload images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update images" ON storage.objects FOR UPDATE USING (bucket_id = 'images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete images" ON storage.objects FOR DELETE USING (bucket_id = 'images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Public read files bucket" ON storage.objects FOR SELECT USING (bucket_id = 'files');
CREATE POLICY "Admins upload files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'files' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete files" ON storage.objects FOR DELETE USING (bucket_id = 'files' AND public.has_role(auth.uid(), 'admin'));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.clubs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sports;
ALTER PUBLICATION supabase_realtime ADD TABLE public.gallery;
ALTER PUBLICATION supabase_realtime ADD TABLE public.site_settings;

-- Auto-create user role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
