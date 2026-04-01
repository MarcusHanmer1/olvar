-- ============================================================
-- Add generated_questions table
-- Run this in the Supabase SQL editor (Project > SQL Editor)
-- ============================================================

CREATE TABLE generated_questions (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id        UUID REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
  topics          JSONB NOT NULL DEFAULT '[]',
  questions_data  JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE generated_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "generated_questions_all" ON generated_questions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM classes
      WHERE classes.id = generated_questions.class_id
        AND classes.teacher_id = auth.uid()
    )
  );
