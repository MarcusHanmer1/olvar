-- ============================================================
-- Olvar — database schema
-- Run this in the Supabase SQL editor (Project → SQL Editor)
-- ============================================================

-- ------------------------------------------------------------
-- Tables
-- ------------------------------------------------------------

CREATE TABLE teachers (
  id          UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email       TEXT UNIQUE NOT NULL,
  full_name   TEXT NOT NULL DEFAULT '',
  school_name TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE classes (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id  UUID REFERENCES teachers(id) ON DELETE CASCADE NOT NULL,
  name        TEXT NOT NULL,
  year_group  INT  NOT NULL CHECK (year_group BETWEEN 7 AND 13),
  exam_board  TEXT NOT NULL CHECK (exam_board IN ('AQA', 'Edexcel', 'OCR', 'WJEC')),
  tier        TEXT NOT NULL CHECK (tier IN ('Higher', 'Foundation')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE students (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id     UUID REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
  name         TEXT NOT NULL,
  target_grade INT  CHECK (target_grade BETWEEN 1 AND 9),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE assessments (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id     UUID  REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
  title        TEXT  NOT NULL,
  total_marks  INT   NOT NULL,
  date         DATE  NOT NULL,
  questions    JSONB NOT NULL DEFAULT '[]',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE marks (
  id            UUID  DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id UUID  REFERENCES assessments(id) ON DELETE CASCADE NOT NULL,
  student_id    UUID  REFERENCES students(id)    ON DELETE CASCADE NOT NULL,
  scores        JSONB NOT NULL DEFAULT '[]',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (assessment_id, student_id)
);

CREATE TABLE analysis_results (
  id                UUID  DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id     UUID  REFERENCES assessments(id) ON DELETE CASCADE NOT NULL,
  qla_data          JSONB,
  feedback          JSONB,
  intervention_list JSONB,
  generated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- Row Level Security
-- ------------------------------------------------------------

ALTER TABLE teachers         ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE students         ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE marks            ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_results ENABLE ROW LEVEL SECURITY;

-- teachers: own row only
CREATE POLICY "teachers_select" ON teachers FOR SELECT USING (auth.uid() = id);
CREATE POLICY "teachers_update" ON teachers FOR UPDATE USING (auth.uid() = id);

-- classes: teacher owns them
CREATE POLICY "classes_all" ON classes FOR ALL
  USING (auth.uid() = teacher_id);

-- students: via class ownership
CREATE POLICY "students_all" ON students FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM classes
      WHERE classes.id = students.class_id
        AND classes.teacher_id = auth.uid()
    )
  );

-- assessments: via class ownership
CREATE POLICY "assessments_all" ON assessments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM classes
      WHERE classes.id = assessments.class_id
        AND classes.teacher_id = auth.uid()
    )
  );

-- marks: via assessment → class → teacher
CREATE POLICY "marks_all" ON marks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM assessments
      JOIN classes ON classes.id = assessments.class_id
      WHERE assessments.id = marks.assessment_id
        AND classes.teacher_id = auth.uid()
    )
  );

-- analysis_results: via assessment → class → teacher
CREATE POLICY "analysis_results_all" ON analysis_results FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM assessments
      JOIN classes ON classes.id = assessments.class_id
      WHERE assessments.id = analysis_results.assessment_id
        AND classes.teacher_id = auth.uid()
    )
  );

-- ------------------------------------------------------------
-- Trigger: create teachers row when a new user signs up
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.teachers (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', '')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
