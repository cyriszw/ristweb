
CREATE TABLE public.admission_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_name text NOT NULL,
  email text NOT NULL,
  phone text,
  level text NOT NULL CHECK (level IN ('o-level', 'a-level')),
  o_level_subjects text[] DEFAULT '{}',
  a_level_subjects text[] DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.admission_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert applications"
  ON public.admission_applications FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Admins read applications"
  ON public.admission_applications FOR SELECT
  TO public
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete applications"
  ON public.admission_applications FOR DELETE
  TO public
  USING (has_role(auth.uid(), 'admin'));
