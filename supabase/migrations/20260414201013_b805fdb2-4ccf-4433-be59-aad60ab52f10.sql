
CREATE TABLE public.innovation_social_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  innovation_id UUID NOT NULL REFERENCES public.innovations(id) ON DELETE CASCADE,
  platform_name TEXT NOT NULL,
  platform_url TEXT NOT NULL DEFAULT '',
  icon_name TEXT NOT NULL DEFAULT 'globe',
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.innovation_social_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read innovation_social_links" ON public.innovation_social_links FOR SELECT USING (true);
CREATE POLICY "Admins manage innovation_social_links" ON public.innovation_social_links FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
