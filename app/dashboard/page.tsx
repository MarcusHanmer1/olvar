import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Nav from "@/components/Nav";
import AddClassModal from "./AddClassModal";
import Briefing, { type ClassBriefing, type TrendPoint, type Insight } from "./Briefing";

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

  /* ── Compute cross-class AI insights ── */
  const insights: Insight[] = [];

  // Collect all weak topics across classes with their class names
  const allWeakTopics: { topic: string; className: string; classId: string; pct: number }[] = [];
  for (const b of briefings) {
    if (b.last_assessment) {
      const assessments = assessmentMap[b.id] ?? [];
      const lastA = assessments[assessments.length - 1];
      if (lastA && analysisMap[lastA.id]) {
        const qla = analysisMap[lastA.id].qla_data;
        if (Array.isArray(qla)) {
          for (const t of qla) {
            if (t.avg_percentage < 50) {
              allWeakTopics.push({ topic: t.topic, className: b.name, classId: b.id, pct: t.avg_percentage });
            }
          }
        }
      }
    }
  }

  // Find topics that are weak across multiple classes
  const topicClassCount = new Map<string, string[]>();
  for (const wt of allWeakTopics) {
    const existing = topicClassCount.get(wt.topic) ?? [];
    if (!existing.includes(wt.className)) {
      existing.push(wt.className);
      topicClassCount.set(wt.topic, existing);
    }
  }
  for (const [topic, classNames] of topicClassCount) {
    if (classNames.length >= 2) {
      insights.push({
        icon: "alert",
        text: `${topic} is a weak spot across ${classNames.length} classes (${classNames.join(", ")}). Consider a department-wide intervention or shared resources.`,
      });
    }
  }

  // Classes with biggest improvement
  for (const b of briefings) {
    if (b.trend.length >= 2) {
      const last = b.trend[b.trend.length - 1].avg_pct;
      const prev = b.trend[b.trend.length - 2].avg_pct;
      const change = last - prev;
      if (change >= 10) {
        insights.push({
          icon: "trend-up",
          text: `${b.name} improved by ${Math.round(change)} percentage points since their last assessment — great progress.`,
          classId: b.id,
        });
      } else if (change <= -10) {
        insights.push({
          icon: "trend-down",
          text: `${b.name} dropped ${Math.round(Math.abs(change))} percentage points. Review the latest results to identify what went wrong.`,
          classId: b.id,
        });
      }
    }
  }

  // Classes with high below-target count
  for (const b of briefings) {
    if (b.students_below_target > 0 && b.student_count > 0) {
      const ratio = b.students_below_target / b.student_count;
      if (ratio >= 0.5) {
        insights.push({
          icon: "target",
          text: `${b.students_below_target} of ${b.student_count} students in ${b.name} are below their target grade. Intervention is needed before the next assessment.`,
          classId: b.id,
        });
      }
    }
  }

  // Classes performing well
  for (const b of briefings) {
    if (b.last_assessment && b.last_assessment.avg_pct >= 80 && b.weak_topics.length === 0) {
      insights.push({
        icon: "star",
        text: `${b.name} is performing strongly with an ${Math.round(b.last_assessment.avg_pct)}% class average and no weak topics. Consider stretch content or exam-style timed practice.`,
        classId: b.id,
      });
    }
  }

  // Unassessed classes with students
  for (const b of briefings) {
    if (!b.last_assessment && b.student_count > 0) {
      insights.push({
        icon: "target",
        text: `${b.name} has ${b.student_count} students but no assessments yet. Run one to unlock Olvar's analysis.`,
        classId: b.id,
      });
    }
  }

  // Limit to top 5 most important insights
  const topInsights = insights.slice(0, 5);

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

        <Briefing classes={briefings} insights={topInsights} />
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
