import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

const anthropic = new Anthropic();

export async function POST(request: Request) {
  const supabase = await createClient();

  // ── Auth ──
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  // ── Parse body ──
  const body = await request.json();
  const {
    classId,
    topics,
    examBoard,
    tier,
    yearGroup,
  }: {
    classId: string;
    topics: { topic: string; avg_percentage: number }[];
    examBoard: string;
    tier: string;
    yearGroup: number;
  } = body;

  if (!classId || !topics?.length || !examBoard || !tier || !yearGroup) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  // ── Verify class ownership ──
  const { data: cls } = await supabase
    .from("classes")
    .select("id, teacher_id")
    .eq("id", classId)
    .eq("teacher_id", user.id)
    .single();

  if (!cls) {
    return Response.json({ error: "Class not found" }, { status: 404 });
  }

  // ── Build topic list with subtopics from GCSE data ──
  const topicList = topics
    .map((t) => `- ${t.topic} (class average: ${t.avg_percentage.toFixed(0)}%)`)
    .join("\n");

  // ── Build prompt ──
  const prompt = `You are an expert UK secondary maths teacher and exam question writer. Generate a set of practice questions for GCSE maths students. The questions must be in the style of ${examBoard} past papers. Tier: ${tier}. Year group: ${yearGroup}.

Target these specific weak topics:
${topicList}

Generate 8-12 questions with a total of approximately 30-40 marks. Structure them in increasing difficulty — start with 1-2 mark confidence builders, build to 3-4 mark standard questions, and finish with 1-2 challenging 4-5 mark questions that combine topics where possible.

For each question:
- Write the question exactly as it would appear on an exam paper, including any diagrams described in text (e.g. "The diagram shows a circle with centre O...")
- State the mark allocation in square brackets [3 marks]
- Use the exact command words the exam board uses (Show that, Work out, Calculate, Prove, Explain)

After all questions, provide a complete mark scheme with:
- Acceptable answers and mark allocation per step (M for method, A for accuracy, B for independent marks)
- Common misconceptions to watch for
- Where to award follow-through marks

Return the result as a JSON object with this exact structure:
{
  "questions": [
    {
      "number": 1,
      "question": "The full question text as it would appear on an exam paper.",
      "marks": 2,
      "topic": "The topic this question targets"
    }
  ],
  "mark_scheme": [
    {
      "number": 1,
      "marks_breakdown": "B1 for correct method\\nA1 for correct answer",
      "answer": "The correct answer",
      "common_misconceptions": "Common mistakes students make"
    }
  ],
  "total_marks": 34
}

Rules:
- Return ONLY valid JSON. No markdown code fences. No commentary before or after.
- Questions must be mathematically correct and appropriate for ${tier} tier GCSE.
- The mark scheme must be detailed enough for a teacher to mark consistently.
- Use realistic numbers and contexts that ${examBoard} would use.`;

  // ── Call Claude API ──
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

  // ── Parse response ──
  let cleaned = responseText.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  }

  let parsed: {
    questions: {
      number: number;
      question: string;
      marks: number;
      topic: string;
    }[];
    mark_scheme: {
      number: number;
      marks_breakdown: string;
      answer: string;
      common_misconceptions: string;
    }[];
    total_marks: number;
  };

  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return Response.json(
      { error: "Failed to parse Claude response as JSON" },
      { status: 502 }
    );
  }

  // ── Save to generated_questions ──
  const { data: saved, error: insertErr } = await supabase
    .from("generated_questions")
    .insert({
      class_id: classId,
      topics: topics.map((t) => t.topic),
      questions_data: parsed,
    })
    .select("id, created_at")
    .single();

  if (insertErr) {
    // Table might not exist yet — still return the data
    return Response.json({ ...parsed, id: null, created_at: new Date().toISOString() });
  }

  return Response.json({ ...parsed, id: saved.id, created_at: saved.created_at });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return Response.json({ error: "id is required" }, { status: 400 });
  }

  // RLS ensures only the owning teacher can delete
  const { error } = await supabase
    .from("generated_questions")
    .delete()
    .eq("id", id);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ success: true });
}
