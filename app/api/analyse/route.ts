import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

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
  const questionLines = questions
    .map((q) => `  Q${q.number}: "${q.topic}" (max ${q.max_marks} marks)`)
    .join("\n");

  const studentLines = markRows
    .map((row) => {
      const student = row.students as unknown as {
        name: string;
        target_grade: number | null;
      };
      const scores = row.scores as (number | null)[];
      const filled = scores.map((s) => (s !== null ? s : 0));
      const total = filled.reduce((a, b) => a + b, 0);
      const pct = ((total / totalMarks) * 100).toFixed(1);

      const scoreList = questions
        .map(
          (q, i) =>
            `    Q${q.number} (${q.topic}, /${q.max_marks}): ${scores[i] ?? "—"}`
        )
        .join("\n");

      return `  ${student.name} (Target grade: ${student.target_grade ?? "not set"})\n${scoreList}\n    Total: ${total}/${totalMarks} (${pct}%)`;
    })
    .join("\n\n");

  const prompt = `You are an expert UK GCSE mathematics teacher assistant. You analyse assessment results and produce detailed, actionable Question Level Analysis (QLA), personalised feedback, and intervention recommendations.

Here is the data from a GCSE maths assessment:

Assessment: "${assessment.title}"
Date: ${assessment.date}
Class: ${cls.name} — Year ${cls.year_group} — ${cls.exam_board} ${cls.tier}
Total marks: ${totalMarks}

Questions:
${questionLines}

Student Results:
${studentLines}

Analyse this data and return a JSON object with EXACTLY this structure:

{
  "qla": [
    {
      "topic": "Topic name exactly as listed above",
      "avg_percentage": 65.5,
      "students_below_40": 3
    }
  ],
  "feedback": [
    {
      "student_name": "Exact student name",
      "www": "What went well — 2-3 sentences of specific praise referencing the maths topics they performed well on.",
      "ebi": "Even better if — 2-3 sentences of specific, actionable improvement advice referencing the topics they need to work on."
    }
  ],
  "interventions": [
    {
      "student_name": "Exact student name",
      "target_grade": 7,
      "current_percentage": 45.0,
      "weakest_topics": ["Topic 1", "Topic 2", "Topic 3"]
    }
  ],
  "class_summary": "2-3 sentences summarising overall class performance, key strengths and priority areas for reteaching."
}

Rules:
- Return ONLY valid JSON. No markdown code fences. No commentary before or after the JSON.
- qla: one entry per unique topic in the assessment. If multiple questions share a topic, combine them. avg_percentage is the class mean for that topic rounded to 1 decimal place. students_below_40 is the count of students scoring below 40% on that topic.
- feedback: one entry for EVERY student. www and ebi must reference specific maths topics from this assessment. Be encouraging but honest.
- interventions: include only students whose overall percentage suggests they are at risk of missing their target grade. Include their 3 weakest topics. Sort by most in need of intervention first (lowest percentage first).
- class_summary: reference specific topics. Mention both strengths and weaknesses.`;

  // ── Call Claude API ─────────────────────────────────────────────────────────
  let responseText: string;
  try {
    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
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
