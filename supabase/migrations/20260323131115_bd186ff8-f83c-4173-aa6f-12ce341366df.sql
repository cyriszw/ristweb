
CREATE TABLE public.visitor_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_type text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.visitor_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert visitor_logs" ON public.visitor_logs
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Admins read visitor_logs" ON public.visitor_logs
  FOR SELECT TO public USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete visitor_logs" ON public.visitor_logs
  FOR DELETE TO public USING (has_role(auth.uid(), 'admin'::app_role));
