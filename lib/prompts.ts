/**
 * Shared prompt builder for assessment analysis.
 * Used by both /api/analyse and /api/demo-analyse.
 */

type Question = { number: number; max_marks: number; topic: string };
type StudentData = {
  name: string;
  target_grade: number | null;
  scores: (number | null)[];
};

export function buildAnalysisPrompt(opts: {
  title: string;
  date: string;
  className: string;
  examBoard: string;
  tier: string;
  yearGroup?: number;
  totalMarks: number;
  questions: Question[];
  students: StudentData[];
}): string {
  const { title, date, className, examBoard, tier, totalMarks, questions, students } = opts;

  // Compute class averages per question for context
  const classAvgs = questions.map((q, qi) => {
    const validScores = students
      .map((s) => s.scores[qi])
      .filter((v): v is number => v !== null);
    if (validScores.length === 0) return 0;
    return validScores.reduce((a, b) => a + b, 0) / validScores.length;
  });

  const questionLines = questions
    .map(
      (q, i) =>
        `  Q${q.number}: "${q.topic}" (max ${q.max_marks} marks) — class avg: ${classAvgs[i].toFixed(1)}/${q.max_marks} (${((classAvgs[i] / q.max_marks) * 100).toFixed(0)}%)`
    )
    .join("\n");

  const studentLines = students
    .map((student) => {
      const filled = student.scores.map((s) => (s !== null ? s : 0));
      const total = filled.reduce((a, b) => a + b, 0);
      const pct = ((total / totalMarks) * 100).toFixed(1);

      const scoreList = questions
        .map((q, i) => {
          const score = student.scores[i] ?? 0;
          const diff = score - classAvgs[i];
          const diffStr = diff >= 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1);
          return `    Q${q.number} (${q.topic}, /${q.max_marks}): ${student.scores[i] ?? "—"} [vs class avg ${classAvgs[i].toFixed(1)}, ${diffStr}]`;
        })
        .join("\n");

      return `  ${student.name} (Target grade: ${student.target_grade ?? "not set"})\n${scoreList}\n    Total: ${total}/${totalMarks} (${pct}%)`;
    })
    .join("\n\n");

  return `You have two roles in this task. Read both carefully before generating output.

=== ROLE 1: Question Level Analyst ===

You are a data analyst computing QLA statistics from raw assessment data. Be precise and mathematical.

=== ROLE 2: Experienced UK Maths Teacher ===

You are an experienced UK secondary maths teacher writing personalised WWW/EBI feedback for individual students after a class assessment. You have high standards and you write feedback that is genuinely useful, not generic.

Here is the data from a GCSE maths assessment:

Assessment: "${title}"
Date: ${date}
Class: ${className} — ${examBoard} ${tier}
Total marks: ${totalMarks}

Questions (with class averages):
${questionLines}

Student Results (with comparison to class average per question):
${studentLines}

Return a JSON object with EXACTLY this structure:

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
      "www": "Personalised what went well feedback.",
      "ebi": "Personalised even better if feedback."
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

=== QLA RULES ===
- One entry per unique topic. If multiple questions share a topic, combine them.
- avg_percentage is the class mean for that topic rounded to 1 decimal place.
- students_below_40 is the count of students scoring below 40% on that topic.

=== FEEDBACK RULES (critical — read carefully) ===

You must write feedback for EVERY student. Each student's feedback must feel like it was written specifically for them. If you swapped the names and the feedback still made sense, it is too generic — rewrite it.

WWW (What Went Well):
- Reference the specific questions they did well on, not just topic names. Say what they demonstrated they can do. For example: "You handled the reverse percentage question (Q7) confidently, which is a skill many students struggle with at this stage."
- If they got full marks on something the class found hard (i.e. their score is above the class average), say so — that is meaningful praise.
- Vary your sentence structure. Do not start every WWW with "Strong performance" or "Excellent work" or "You demonstrated." Mix it up.
- 2-3 sentences.

EBI (Even Better If):
- Be specific about what went wrong, not just which topic. If they got 1 out of 3 on a question, say what the likely gap is: "You picked up the method mark on Q4 (solving by factorising) but dropped the accuracy marks — this often means the factorising step is going wrong rather than the setup. Practice factorising quadratics where the coefficient of x² is not 1."
- If a student is close to full marks on a topic (e.g. 2/3), the advice should be a targeted nudge. If they scored 0, they need a fundamentally different intervention — acknowledge that gap honestly.
- Reference their target grade. If targeting grade 8 and dropping marks on higher-tier content, say that. If targeting grade 5 and struggling with foundation content, adjust your tone and advice accordingly.
- Never say "practice this topic more" or "seek additional support" or "review your working" or "check your working carefully." These are filler phrases. Every sentence must contain specific insight that could only come from looking at this student's actual marks.
- Do not list every weakness. Focus on the 2 most impactful areas to work on first.
- 2-4 sentences depending on how much there is to say. A student who aced everything gets a short, targeted stretch goal. A struggling student gets more detail but prioritised.

TONE:
- Warm but direct. Like a teacher who knows the student and genuinely wants them to improve.
- Never use phrases like "solid mathematical understanding", "careful algebraic manipulation", "systematic approaches", "demonstrated understanding of", "good grasp of", or "solid foundation in." These are meaningless filler.

=== INTERVENTION RULES ===
- Include only students whose overall percentage suggests they are at risk of missing their target grade.
- Include their 3 weakest topics.
- Sort by most in need of intervention first (lowest percentage first).

=== CLASS SUMMARY RULES ===
- Reference specific topics and question numbers.
- Mention both strengths and weaknesses.
- 2-3 sentences.

=== OUTPUT RULES ===
- Return ONLY valid JSON. No markdown code fences. No commentary before or after the JSON.`;
}
