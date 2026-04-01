import Anthropic from "@anthropic-ai/sdk";
import { buildAnalysisPrompt } from "@/lib/prompts";

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

  const prompt = buildAnalysisPrompt({
    title: body.title,
    date: body.date,
    className: body.className,
    examBoard: body.examBoard,
    tier: body.tier,
    totalMarks,
    questions: body.questions,
    students: body.students,
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
