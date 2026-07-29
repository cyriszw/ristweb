
CREATE TABLE public.subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  level text NOT NULL CHECK (level IN ('o-level', 'a-level')),
  category text,
  stream text CHECK (stream IS NULL OR stream IN ('sciences', 'commercials', 'arts')),
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read subjects" ON public.subjects FOR SELECT TO public USING (true);
CREATE POLICY "Admins manage subjects" ON public.subjects FOR ALL TO public USING (has_role(auth.uid(), 'admin'));

-- Seed O-Level subjects
INSERT INTO public.subjects (name, level, category, sort_order) VALUES
('Biology', 'o-level', 'Sciences', 1),
('Chemistry', 'o-level', 'Sciences', 2),
('Physics', 'o-level', 'Sciences', 3),
('Combined Science', 'o-level', 'Sciences', 4),
('Agriculture', 'o-level', 'Sciences', 5),
('Mathematics', 'o-level', 'Mathematics', 6),
('Additional Mathematics', 'o-level', 'Mathematics', 7),
('Statistics', 'o-level', 'Mathematics', 8),
('Principles of Accounts', 'o-level', 'Commercials', 9),
('Business Studies', 'o-level', 'Commercials', 10),
('Commerce', 'o-level', 'Commercials', 11),
('Economics', 'o-level', 'Commercials', 12),
('History', 'o-level', 'Humanities', 13),
('Geography', 'o-level', 'Humanities', 14),
('Family & Religious Studies', 'o-level', 'Humanities', 15),
('Economic History', 'o-level', 'Humanities', 16),
('Shona', 'o-level', 'Languages', 17),
('Ndebele', 'o-level', 'Languages', 18),
('English', 'o-level', 'Languages', 19),
('English Literature', 'o-level', 'Languages', 20),
('Computer Science', 'o-level', 'Technology', 21),
('Computer Operations and Packages', 'o-level', 'Technology', 22),
('Building Studies', 'o-level', 'Technical & Practical', 23),
('Wood Technology', 'o-level', 'Technical & Practical', 24),
('Metal Technology', 'o-level', 'Technical & Practical', 25),
('Fashion & Fabrics', 'o-level', 'Technical & Practical', 26),
('Food & Nutrition', 'o-level', 'Technical & Practical', 27),
('Technical Graphics', 'o-level', 'Technical & Practical', 28),
('Music', 'o-level', 'Technical & Practical', 29),
('Art', 'o-level', 'Technical & Practical', 30);

-- Seed A-Level subjects with streams
INSERT INTO public.subjects (name, level, stream, sort_order) VALUES
('Mathematics', 'a-level', 'sciences', 1),
('Pure Mathematics', 'a-level', 'sciences', 2),
('Statistics', 'a-level', 'sciences', 3),
('Physics', 'a-level', 'sciences', 4),
('Chemistry', 'a-level', 'sciences', 5),
('Biology', 'a-level', 'sciences', 6),
('Computer Science', 'a-level', 'sciences', 7),
('Accounting', 'a-level', 'commercials', 8),
('Business Studies', 'a-level', 'commercials', 9),
('Economics', 'a-level', 'commercials', 10),
('History', 'a-level', 'arts', 11),
('Geography', 'a-level', 'arts', 12),
('Literature in English', 'a-level', 'arts', 13),
('Divinity / Religious Studies', 'a-level', 'arts', 14),
('English Language', 'a-level', 'arts', 15),
('Ndebele', 'a-level', 'arts', 16);
