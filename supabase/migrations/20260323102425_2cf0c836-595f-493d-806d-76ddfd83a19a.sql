
-- Innovations table (similar to clubs)
CREATE TABLE public.innovations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  category TEXT DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Innovation images table (2-4 images per innovation)
CREATE TABLE public.innovation_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  innovation_id UUID NOT NULL REFERENCES public.innovations(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.innovations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.innovation_images ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Public read innovations" ON public.innovations FOR SELECT USING (true);
CREATE POLICY "Public read innovation_images" ON public.innovation_images FOR SELECT USING (true);

-- Admin manage
CREATE POLICY "Admins manage innovations" ON public.innovations FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins manage innovation_images" ON public.innovation_images FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.innovations;
