import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { buildAnalysisPrompt } from "@/lib/prompts";

const anthropic = new Anthropic(); // reads ANTHROPIC_API_KEY from env

export async function POST(request: Request) {
  const supabase = await createClient();

  // ── Auth ────────────────────────────────────────────────────────────────────
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  // ── Parse body ──────────────────────────────────────────────────────────────
  const body = await request.json();
  const assessmentId: string | undefined = body.assessmentId;
  if (!assessmentId) {
    return Response.json({ error: "assessmentId is required" }, { status: 400 });
  }

  // ── Fetch assessment + class ────────────────────────────────────────────────
  const { data: assessment, error: aErr } = await supabase
    .from("assessments")
    .select(
      "id, title, date, total_marks, questions, class_id, classes(name, year_group, exam_board, tier, teacher_id)"
    )
    .eq("id", assessmentId)
    .single();

  if (aErr || !assessment) {
    return Response.json({ error: "Assessment not found" }, { status: 404 });
  }

  // Verify ownership
  const cls = assessment.classes as unknown as {
    name: string;
    year_group: number;
    exam_board: string;
    tier: string;
    teacher_id: string;
  };
  if (cls.teacher_id !== user.id) {
    return Response.json({ error: "Not authorised" }, { status: 403 });
  }

  // ── Fetch students + marks ──────────────────────────────────────────────────
  const { data: markRows } = await supabase
    .from("marks")
    .select("student_id, scores, students(name, target_grade)")
    .eq("assessment_id", assessmentId);

  if (!markRows || markRows.length === 0) {
    return Response.json({ error: "No marks found for this assessment" }, { status: 400 });
  }

  const questions = assessment.questions as {
    number: number;
    max_marks: number;
    topic: string;
  }[];
  const totalMarks = assessment.total_marks as number;

  // ── Build prompt ────────────────────────────────────────────────────────────
  const students = markRows.map((row) => {
    const student = row.students as unknown as {
      name: string;
      target_grade: number | null;
    };
    return {
      name: student.name,
      target_grade: student.target_grade,
      scores: row.scores as (number | null)[],
    };
  });

  const prompt = buildAnalysisPrompt({
    title: assessment.title as string,
    date: assessment.date as string,
    className: cls.name,
    examBoard: cls.exam_board,
    tier: cls.tier,
    yearGroup: cls.year_group,
    totalMarks,
    questions,
    students,
  });

  // ── Call Claude API ─────────────────────────────────────────────────────────
  let responseText: string;
  try {
    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8192,
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = msg.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return Response.json({ error: "No text in Claude response" }, { status: 502 });
    }
    responseText = textBlock.text;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Claude API call failed";
    return Response.json({ error: message }, { status: 502 });
  }

  // ── Parse response ──────────────────────────────────────────────────────────
  // Strip potential markdown fences
  let cleaned = responseText.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  }

  let parsed: {
    qla: { topic: string; avg_percentage: number; students_below_40: number }[];
    feedback: { student_name: string; www: string; ebi: string }[];
    interventions: {
      student_name: string;
      target_grade: number;
      current_percentage: number;
      weakest_topics: string[];
    }[];
    class_summary: string;
  };

  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return Response.json(
      { error: "Failed to parse Claude response as JSON" },
      { status: 502 }
    );
  }

  // ── Store in analysis_results ───────────────────────────────────────────────
  const { error: insertErr } = await supabase.from("analysis_results").insert({
    assessment_id: assessmentId,
    qla_data: { qla: parsed.qla, class_summary: parsed.class_summary },
    feedback: parsed.feedback,
    intervention_list: parsed.interventions,
  });

  if (insertErr) {
    return Response.json({ error: insertErr.message }, { status: 500 });
  }

  return Response.json({ success: true });
}
