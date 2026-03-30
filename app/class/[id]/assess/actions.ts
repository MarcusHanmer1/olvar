"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type SavePayload = {
  classId: string;
  title: string;
  date: string;
  questions: { number: number; max_marks: number; topic: string }[];
  marks: { studentId: string; scores: (number | null)[] }[];
};

export async function saveAssessmentWithMarks(
  payload: SavePayload
): Promise<{ error?: string; assessmentId?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const totalMarks = payload.questions.reduce((s, q) => s + q.max_marks, 0);

  const { data: assessment, error: aErr } = await supabase
    .from("assessments")
    .insert({
      class_id: payload.classId,
      title: payload.title.trim(),
      date: payload.date,
      total_marks: totalMarks,
      questions: payload.questions,
    })
    .select("id")
    .single();

  if (aErr || !assessment) return { error: aErr?.message ?? "Failed to create assessment" };

  const marksRows = payload.marks.map((m) => ({
    assessment_id: assessment.id,
    student_id: m.studentId,
    scores: m.scores,
  }));

  const { error: mErr } = await supabase.from("marks").insert(marksRows);

  if (mErr) return { error: mErr.message };

  revalidatePath(`/class/${payload.classId}`);

  return { assessmentId: assessment.id };
}
