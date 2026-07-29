
CREATE TABLE public.academic_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  year integer NOT NULL DEFAULT EXTRACT(YEAR FROM now()),
  pass_rate numeric NOT NULL DEFAULT 0,
  fail_rate numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(category, year)
);

ALTER TABLE public.academic_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage academic_results" ON public.academic_results
  FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public read academic_results" ON public.academic_results
  FOR SELECT TO public USING (true);
