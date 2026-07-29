
CREATE TABLE public.social_media_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  platform_name TEXT NOT NULL,
  platform_url TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  icon_name TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.social_media_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read social_media_links"
ON public.social_media_links FOR SELECT
USING (true);

CREATE POLICY "Admins manage social_media_links"
ON public.social_media_links FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Seed default platforms
INSERT INTO public.social_media_links (platform_name, icon_name, display_order) VALUES
  ('Instagram', 'instagram', 0),
  ('YouTube', 'youtube', 1),
  ('Facebook', 'facebook', 2),
  ('LinkedIn', 'linkedin', 3),
  ('X', 'twitter', 4),
  ('Threads', 'at-sign', 5);
