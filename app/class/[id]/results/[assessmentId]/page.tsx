import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Nav from "@/components/Nav";
import ResultsView from "./ResultsView";
import PracticeQuestions from "./PracticeQuestions";

export type TopicComparison = {
  topic: string;
  current_avg: number;
  previous_avg: number;
  change: number;
};

export type StudentDecline = {
  student_name: string;
  current_pct: number;
  previous_pct: number;
  change: number;
};

export type ComparisonData = {
  previous_title: string;
  previous_date: string;
  topic_changes: TopicComparison[];
  student_declines: StudentDecline[];
  current_class_avg: number;
  previous_class_avg: number;
};

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ id: string; assessmentId: string }>;
}) {
  const { id, assessmentId } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: cls } = await supabase
    .from("classes")
    .select("id, name, year_group, exam_board, tier")
    .eq("id", id)
    .eq("teacher_id", user.id)
    .single();
  if (!cls) notFound();

  const { data: assessment } = await supabase
    .from("assessments")
    .select("id, title, date, total_marks, questions")
    .eq("id", assessmentId)
    .eq("class_id", id)
    .single();
  if (!assessment) notFound();

  const { data: analysis } = await supabase
    .from("analysis_results")
    .select("qla_data, feedback, intervention_list, generated_at")
    .eq("assessment_id", assessmentId)
    .order("generated_at", { ascending: false })
    .limit(1)
    .single();
  if (!analysis) notFound();

  const qlaData = analysis.qla_data as {
    qla: { topic: string; avg_percentage: number; students_below_40: number }[];
    class_summary: string;
  };
  const feedback = analysis.feedback as {
    student_name: string;
    www: string;
    ebi: string;
  }[];
  const interventions = analysis.intervention_list as {
    student_name: string;
    target_grade: number;
    current_percentage: number;
    weakest_topics: string[];
  }[];

  /* ── Fetch previously generated question sets for this class ── */
  const { data: generatedHistory } = await supabase
    .from("generated_questions")
    .select("id, topics, questions_data, created_at")
    .eq("class_id", id)
    .order("created_at", { ascending: false })
    .limit(10);

  const practiceHistory = (generatedHistory ?? []) as {
    id: string;
    topics: string[];
    questions_data: {
      questions: { number: number; question: string; marks: number; topic: string }[];
      mark_scheme: { number: number; marks_breakdown: string; answer: string; common_misconceptions: string }[];
      total_marks: number;
    };
    created_at: string;
  }[];

  /* ── Comparison: find previous assessment for same class ── */
  let comparison: ComparisonData | null = null;

  const { data: allAssessments } = await supabase
    .from("assessments")
    .select("id, title, date, total_marks")
    .eq("class_id", id)
    .order("date", { ascending: true });

  if (allAssessments && allAssessments.length > 1) {
    // Find the assessment immediately before the current one
    const currentIdx = allAssessments.findIndex((a) => a.id === assessmentId);
    if (currentIdx > 0) {
      const prevAssessment = allAssessments[currentIdx - 1];

      // Fetch previous analysis
      const { data: prevAnalysis } = await supabase
        .from("analysis_results")
        .select("qla_data")
        .eq("assessment_id", prevAssessment.id)
        .order("generated_at", { ascending: false })
        .limit(1)
        .single();

      if (prevAnalysis) {
        const prevQla = (prevAnalysis.qla_data as { qla: { topic: string; avg_percentage: number }[] })?.qla ?? [];
        const currQla = qlaData.qla ?? [];

        // Build topic comparison — match topics that appear in both
        const prevTopicMap = new Map(prevQla.map((t) => [t.topic, t.avg_percentage]));
        const topicChanges: TopicComparison[] = [];

        for (const curr of currQla) {
          const prevAvg = prevTopicMap.get(curr.topic);
          if (prevAvg !== undefined) {
            topicChanges.push({
              topic: curr.topic,
              current_avg: curr.avg_percentage,
              previous_avg: prevAvg,
              change: curr.avg_percentage - prevAvg,
            });
          }
        }

        // Sort by absolute change descending
        topicChanges.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));

        // Fetch marks for both assessments to compare student percentages
        const { data: currentMarks } = await supabase
          .from("marks")
          .select("student_id, scores")
          .eq("assessment_id", assessmentId);

        const { data: prevMarks } = await supabase
          .from("marks")
          .select("student_id, scores")
          .eq("assessment_id", prevAssessment.id);

        // Get student names
        const studentIds = [
          ...new Set([
            ...(currentMarks ?? []).map((m) => m.student_id),
            ...(prevMarks ?? []).map((m) => m.student_id),
          ]),
        ];

        const { data: students } = await supabase
          .from("students")
          .select("id, name")
          .in("id", studentIds);

        const studentNameMap = new Map((students ?? []).map((s) => [s.id, s.name]));

        const prevMarksMap = new Map(
          (prevMarks ?? []).map((m) => [m.student_id, m.scores as number[]])
        );

        const studentDeclines: StudentDecline[] = [];
        const currentTotal = assessment.total_marks;
        const prevTotal = prevAssessment.total_marks;

        for (const cm of currentMarks ?? []) {
          const prevScores = prevMarksMap.get(cm.student_id);
          if (!prevScores || currentTotal <= 0 || prevTotal <= 0) continue;

          const currSum = (cm.scores as number[]).reduce((a, b) => a + b, 0);
          const prevSum = prevScores.reduce((a, b) => a + b, 0);
          const currPct = (currSum / currentTotal) * 100;
          const prevPct = (prevSum / prevTotal) * 100;
          const change = currPct - prevPct;

          if (change < -10) {
            studentDeclines.push({
              student_name: studentNameMap.get(cm.student_id) ?? "Unknown",
              current_pct: currPct,
              previous_pct: prevPct,
              change,
            });
          }
        }

        // Sort by biggest decline
        studentDeclines.sort((a, b) => a.change - b.change);

        // Class averages
        const currAvg =
          (currentMarks ?? []).length > 0 && currentTotal > 0
            ? (currentMarks ?? []).reduce((s, m) => {
                return s + (m.scores as number[]).reduce((a, b) => a + b, 0) / currentTotal * 100;
              }, 0) / (currentMarks ?? []).length
            : 0;

        const prevAvg =
          (prevMarks ?? []).length > 0 && prevTotal > 0
            ? (prevMarks ?? []).reduce((s, m) => {
                return s + (m.scores as number[]).reduce((a, b) => a + b, 0) / prevTotal * 100;
              }, 0) / (prevMarks ?? []).length
            : 0;

        comparison = {
          previous_title: prevAssessment.title,
          previous_date: prevAssessment.date,
          topic_changes: topicChanges,
          student_declines: studentDeclines,
          current_class_avg: currAvg,
          previous_class_avg: prevAvg,
        };
      }
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg)" }}>
      <Nav email={user.email ?? ""} />

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-10">
        {/* Breadcrumb */}
        <Link
          href={`/class/${id}`}
          className="inline-flex items-center gap-1.5 text-sm mb-6"
          style={{ color: "var(--text-secondary)", textDecoration: "none" }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M9 3L5 7l4 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {cls.name}
        </Link>

        {/* Page header */}
        <div className="mb-8">
          <h1
            className="text-2xl font-semibold tracking-tight mb-1"
            style={{ color: "var(--text-primary)" }}
          >
            {assessment.title}
          </h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {assessment.date} · {assessment.total_marks} marks ·{" "}
            {cls.exam_board} {cls.tier}
          </p>
        </div>

        <ResultsView
          classId={id}
          assessmentTitle={assessment.title as string}
          qla={qlaData.qla}
          classSummary={qlaData.class_summary}
          feedback={feedback}
          interventions={interventions}
          comparison={comparison}
        />

        {/* Practice Questions — placed after QLA in the results flow */}
        <div style={{ marginTop: "32px" }}>
          <h2
            style={{
              fontSize: "15px",
              fontWeight: 700,
              color: "var(--text-primary)",
              marginBottom: "10px",
            }}
          >
            Practice Questions
          </h2>
          <PracticeQuestions
            qla={qlaData.qla}
            classId={id}
            className={cls.name}
            examBoard={cls.exam_board}
            tier={cls.tier}
            yearGroup={cls.year_group}
            history={practiceHistory}
          />
        </div>
      </main>
    </div>
  );
}
