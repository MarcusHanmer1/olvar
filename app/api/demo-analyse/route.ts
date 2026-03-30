import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

type DemoPayload = {
  title: string;
  date: string;
  className: string;
  examBoard: string;
  tier: string;
  questions: { number: number; max_marks: number; topic: string }[];
  students: { name: string; target_grade: number; scores: (number | null)[] }[];
};

export async function POST(request: Request) {
  let body: DemoPayload;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (
    !body.questions?.length ||
    !body.students?.length ||
    !body.title
  ) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const totalMarks = body.questions.reduce((s, q) => s + q.max_marks, 0);

  // ── Build prompt ────────────────────────────────────────────────────────────
  const questionLines = body.questions
    .map((q) => `  Q${q.number}: "${q.topic}" (max ${q.max_marks} marks)`)
    .join("\n");

  const studentLines = body.students
    .map((student) => {
      const filled = student.scores.map((s) => (s !== null ? s : 0));
      const total = filled.reduce((a, b) => a + b, 0);
      const pct = ((total / totalMarks) * 100).toFixed(1);

      const scoreList = body.questions
        .map(
          (q, i) =>
            `    Q${q.number} (${q.topic}, /${q.max_marks}): ${student.scores[i] ?? "—"}`
        )
        .join("\n");

      return `  ${student.name} (Target grade: ${student.target_grade})\n${scoreList}\n    Total: ${total}/${totalMarks} (${pct}%)`;
    })
    .join("\n\n");

  const prompt = `You are an expert UK GCSE mathematics teacher assistant. You analyse assessment results and produce detailed, actionable Question Level Analysis (QLA), personalised feedback, and intervention recommendations.

Here is the data from a GCSE maths assessment:

Assessment: "${body.title}"
Date: ${body.date}
Class: ${body.className} — ${body.examBoard} ${body.tier}
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
  let cleaned = responseText.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  }

  try {
    const parsed = JSON.parse(cleaned);
    return Response.json(parsed);
  } catch {
    return Response.json(
      { error: "Failed to parse Claude response as JSON" },
      { status: 502 }
    );
  }
}
