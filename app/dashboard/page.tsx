import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Nav from "@/components/Nav";
import AddClassModal from "./AddClassModal";
import Briefing, { type ClassBriefing, type TrendPoint } from "./Briefing";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  /* ── Fetch teacher name ── */
  const { data: teacher } = await supabase
    .from("teachers")
    .select("full_name")
    .eq("id", user.id)
    .single();

  /* ── Fetch classes with students ── */
  const { data: classes } = await supabase
    .from("classes")
    .select("id, name, year_group, exam_board, tier, students(id, target_grade)")
    .order("created_at", { ascending: false });

  const rows = (classes ?? []) as {
    id: string;
    name: string;
    year_group: number;
    exam_board: string;
    tier: string;
    students: { id: string; target_grade: number }[];
  }[];

  /* ── Fetch all assessments for these classes ── */
  const classIds = rows.map((c) => c.id);

  let assessmentMap: Record<
    string,
    { id: string; title: string; date: string; total_marks: number; class_id: string }[]
  > = {};
  let marksMap: Record<string, { student_id: string; scores: number[] }[]> = {};
  let analysisMap: Record<
    string,
    { qla_data: { topic: string; avg_percentage: number }[] | null }
  > = {};

  if (classIds.length > 0) {
    const { data: assessments } = await supabase
      .from("assessments")
      .select("id, title, date, total_marks, class_id")
      .in("class_id", classIds)
      .order("date", { ascending: true });

    for (const a of assessments ?? []) {
      if (!assessmentMap[a.class_id]) assessmentMap[a.class_id] = [];
      assessmentMap[a.class_id].push(a);
    }

    const assessmentIds = (assessments ?? []).map((a) => a.id);

    if (assessmentIds.length > 0) {
      const { data: marks } = await supabase
        .from("marks")
        .select("assessment_id, student_id, scores")
        .in("assessment_id", assessmentIds);

      for (const m of marks ?? []) {
        if (!marksMap[m.assessment_id]) marksMap[m.assessment_id] = [];
        marksMap[m.assessment_id].push(m);
      }

      const { data: analyses } = await supabase
        .from("analysis_results")
        .select("assessment_id, qla_data")
        .in("assessment_id", assessmentIds)
        .order("generated_at", { ascending: false });

      for (const a of analyses ?? []) {
        if (!analysisMap[a.assessment_id]) {
          analysisMap[a.assessment_id] = a;
        }
      }
    }
  }

  /* ── Compute briefing data per class ── */
  const briefings: ClassBriefing[] = rows.map((cls) => {
    const students = cls.students ?? [];
    const assessments = assessmentMap[cls.id] ?? [];
    const studentCount = students.length;

    const trend: TrendPoint[] = [];
    for (const assessment of assessments) {
      const marks = marksMap[assessment.id] ?? [];
      if (marks.length === 0) continue;
      const totalMarks = assessment.total_marks;
      if (totalMarks <= 0) continue;
      const avgPct =
        marks.reduce((sum, m) => {
          const studentTotal = (m.scores ?? []).reduce(
            (a: number, b: number) => a + b,
            0
          );
          return sum + (studentTotal / totalMarks) * 100;
        }, 0) / marks.length;
      trend.push({ date: assessment.date, avg_pct: avgPct });
    }

    const lastAssessment = assessments.length > 0 ? assessments[assessments.length - 1] : null;
    let lastAvgPct = 0;
    if (lastAssessment) {
      const lastMarks = marksMap[lastAssessment.id] ?? [];
      if (lastMarks.length > 0 && lastAssessment.total_marks > 0) {
        lastAvgPct =
          lastMarks.reduce((sum, m) => {
            const t = (m.scores ?? []).reduce((a: number, b: number) => a + b, 0);
            return sum + (t / lastAssessment.total_marks) * 100;
          }, 0) / lastMarks.length;
      }
    }

    const weakTopics: string[] = [];
    if (lastAssessment && analysisMap[lastAssessment.id]) {
      const qla = analysisMap[lastAssessment.id].qla_data;
      if (Array.isArray(qla)) {
        const weak = qla
          .filter((t) => t.avg_percentage < 50)
          .sort((a, b) => a.avg_percentage - b.avg_percentage);
        weakTopics.push(...weak.map((t) => t.topic));
      }
    }

    let belowTarget = 0;
    if (lastAssessment) {
      const lastMarks = marksMap[lastAssessment.id] ?? [];
      for (const m of lastMarks) {
        const studentTotal = (m.scores ?? []).reduce(
          (a: number, b: number) => a + b,
          0
        );
        const pct = lastAssessment.total_marks > 0
          ? (studentTotal / lastAssessment.total_marks) * 100
          : 0;
        const student = students.find((s) => s.id === m.student_id);
        if (student) {
          const targetPct = student.target_grade * 10;
          if (pct < targetPct) belowTarget++;
        }
      }
    }

    let suggestedAction = "Run your first assessment to unlock insights.";
    if (lastAssessment) {
      if (weakTopics.length > 0 && belowTarget > 0) {
        suggestedAction = `Focus revision on ${weakTopics[0]} — ${belowTarget} ${belowTarget === 1 ? "student needs" : "students need"} intervention before the next assessment.`;
      } else if (weakTopics.length > 0) {
        suggestedAction = `${weakTopics[0]} was the weakest topic — consider a targeted starter activity next lesson.`;
      } else if (belowTarget > 0) {
        suggestedAction = `${belowTarget} ${belowTarget === 1 ? "student is" : "students are"} below target. Review their progress and consider small-group support.`;
      } else if (lastAvgPct >= 70) {
        suggestedAction = "Strong results across the board. Consider a stretch assessment or extension work.";
      } else {
        suggestedAction = "Results are steady. A quick recap on weaker areas could push averages higher.";
      }
    } else if (studentCount === 0) {
      suggestedAction = "Add students to this class, then run an assessment.";
    }

    return {
      id: cls.id,
      name: cls.name,
      year_group: cls.year_group,
      exam_board: cls.exam_board,
      tier: cls.tier,
      student_count: studentCount,
      students_below_target: belowTarget,
      last_assessment: lastAssessment
        ? {
            id: lastAssessment.id,
            title: lastAssessment.title,
            date: lastAssessment.date,
            avg_pct: lastAvgPct,
          }
        : null,
      weak_topics: weakTopics,
      trend,
      suggested_action: suggestedAction,
    };
  });

  const firstName = teacher?.full_name?.split(" ")[0] ?? "";
  const greeting = getGreeting(firstName);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg)" }}>
      <Nav email={user.email ?? ""} userName={teacher?.full_name ?? undefined} />

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-10">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1
              className="text-2xl font-semibold tracking-tight"
              style={{ color: "var(--text-primary)" }}
            >
              {greeting}
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
              Here&rsquo;s what Olvar has been working on.
            </p>
          </div>
          <AddClassModal />
        </div>

        <Briefing classes={briefings} />
      </main>
    </div>
  );
}

function getGreeting(name: string): string {
  const hour = new Date().getHours();
  const who = name ? `, ${name}` : "";
  if (hour < 12) return `Good morning${who}`;
  if (hour < 17) return `Good afternoon${who}`;
  return `Good evening${who}`;
}
