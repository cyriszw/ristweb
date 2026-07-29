
CREATE TABLE public.fees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  amount text,
  file_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.fees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read fees" ON public.fees FOR SELECT USING (true);
CREATE POLICY "Admins manage fees" ON public.fees FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

ALTER PUBLICATION supabase_realtime ADD TABLE public.fees;
