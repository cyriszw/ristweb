
CREATE TABLE public.homepage_stats (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  value text NOT NULL,
  icon text DEFAULT NULL,
  is_visible boolean NOT NULL DEFAULT true,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.homepage_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage homepage_stats" ON public.homepage_stats FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Public read homepage_stats" ON public.homepage_stats FOR SELECT USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.homepage_stats;
