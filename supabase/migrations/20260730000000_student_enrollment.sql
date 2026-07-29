-- Houses
CREATE TABLE public.houses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
INSERT INTO public.houses (name) VALUES
  ('Mafuyana'), ('Mzilikazi'), ('Champagnat'), ('Lwanga');

-- Students
CREATE TABLE public.students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id TEXT NOT NULL UNIQUE,
  application_id UUID UNIQUE REFERENCES public.admission_applications(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE,
  gender TEXT,
  house TEXT NOT NULL,
  grade TEXT NOT NULL,
  class TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  admission_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  parent_name TEXT,
  parent_contact TEXT,
  parent_email TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
CREATE INDEX idx_students_application ON public.students(application_id);
CREATE INDEX idx_students_grade ON public.students(grade);
CREATE INDEX idx_students_house ON public.students(house);

-- Add 'enrolled' to application_statuses check constraint
ALTER TABLE public.application_statuses DROP CONSTRAINT IF EXISTS application_statuses_status_check;
ALTER TABLE public.application_statuses ADD CONSTRAINT application_statuses_status_check
  CHECK (status IN ('submitted','under_review','additional_info_required','interview_scheduled','accepted','rejected','enrolled'));

-- Student ID sequence helper
CREATE SEQUENCE IF NOT EXISTS public.student_id_seq START 1;

CREATE OR REPLACE FUNCTION public.generate_student_id()
RETURNS TEXT AS $$
DECLARE
  year TEXT := to_char(now(), 'YYYY');
  seq TEXT := lpad(nextval('public.student_id_seq')::text, 4, '0');
BEGIN
  RETURN 'MBD' || year || seq;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- Enrollment notification trigger
CREATE OR REPLACE FUNCTION public.notify_enrollment()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.application_notifications (application_id, recipient_type, title, message)
  VALUES (
    NEW.application_id,
    'applicant',
    'Enrollment Complete',
    'Your enrollment has been completed. Welcome to Marist Brothers!'
  );
  INSERT INTO public.application_activity_log (application_id, action, details)
  VALUES (NEW.application_id, 'enrolled', 'Student enrolled: ' || NEW.student_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_notify_enrollment
  AFTER INSERT ON public.students
  FOR EACH ROW
  WHEN (NEW.application_id IS NOT NULL)
  EXECUTE FUNCTION public.notify_enrollment();

-- RLS
ALTER TABLE public.houses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Houses readable by all" ON public.houses FOR SELECT USING (true);

CREATE POLICY "Students readable by admins" ON public.students
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Students readable by applicant via tracking" ON public.students
  FOR SELECT USING (
    application_id IN (
      SELECT application_id FROM public.application_tracking WHERE tracking_token = current_setting('app.tracking_token', true)
    )
  );

CREATE POLICY "Students insertable by admins" ON public.students
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Students updatable by admins" ON public.students
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Students deletable by admins" ON public.students
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));
