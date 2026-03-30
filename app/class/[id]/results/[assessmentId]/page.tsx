import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Nav from "@/components/Nav";
import ResultsView from "./ResultsView";

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

  // Verify class ownership
  const { data: cls } = await supabase
    .from("classes")
    .select("id, name, year_group, exam_board, tier")
    .eq("id", id)
    .eq("teacher_id", user.id)
    .single();
  if (!cls) notFound();

  // Fetch assessment
  const { data: assessment } = await supabase
    .from("assessments")
    .select("id, title, date, total_marks, questions")
    .eq("id", assessmentId)
    .eq("class_id", id)
    .single();
  if (!assessment) notFound();

  // Fetch analysis (most recent for this assessment)
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

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#fafaf9" }}>
      <Nav email={user.email ?? ""} />

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-10">
        {/* Breadcrumb */}
        <Link
          href={`/class/${id}`}
          className="inline-flex items-center gap-1.5 text-sm mb-6"
          style={{ color: "#6b6b67", textDecoration: "none" }}
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
            style={{ color: "#1c1c1a" }}
          >
            {assessment.title}
          </h1>
          <p className="text-sm" style={{ color: "#6b6b67" }}>
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
        />
      </main>
    </div>
  );
}
