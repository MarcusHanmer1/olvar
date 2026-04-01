import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Nav from "@/components/Nav";
import ClassDetail, { Student } from "./ClassDetail";

export default async function ClassPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

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

  const { data: students } = await supabase
    .from("students")
    .select("id, name, target_grade")
    .eq("class_id", id)
    .order("name", { ascending: true });

  const rows = (students ?? []) as Student[];

  // Fetch assessments with marks for average calculation
  const { data: assessments } = await supabase
    .from("assessments")
    .select("id, title, date, total_marks, marks(scores)")
    .eq("class_id", id)
    .order("date", { ascending: false });

  const assessmentRows = (assessments ?? []) as {
    id: string;
    title: string;
    date: string;
    total_marks: number;
    marks: { scores: (number | null)[] }[];
  }[];

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg)" }}>
      <Nav email={user.email ?? ""} />

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-10">
        {/* Back link */}
        <Link
          href="/dashboard"
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
          All classes
        </Link>

        {/* Class header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1
              className="text-2xl font-semibold tracking-tight mb-2"
              style={{ color: "var(--text-primary)" }}
            >
              {cls.name}
            </h1>
            <div className="flex items-center gap-1.5 flex-wrap">
              {[`Year ${cls.year_group}`, cls.exam_board, cls.tier].map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-0.5 rounded-md"
                  style={{ backgroundColor: "var(--surface-secondary)", color: "var(--text-secondary)" }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <Link
            href={`/class/${id}/assess`}
            className="btn-primary inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold"
            style={{ backgroundColor: "#0d9488", color: "#ffffff", textDecoration: "none" }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            New assessment
          </Link>
        </div>

        {/* Student list */}
        <ClassDetail classId={id} students={rows} />

        {/* Assessment history */}
        {assessmentRows.length > 0 && (
          <div className="mt-8">
            <h2
              className="text-sm font-semibold mb-3"
              style={{ color: "var(--text-primary)" }}
            >
              Assessments
            </h2>
            <div
              className="rounded-xl overflow-hidden"
              style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
            >
              {assessmentRows.map((a, i) => {
                // Compute class average percentage
                let avgPct: number | null = null;
                if (a.marks.length > 0 && a.total_marks > 0) {
                  const studentTotals = a.marks.map((m) =>
                    m.scores.reduce<number>((sum, s) => sum + (s ?? 0), 0)
                  );
                  const classTotal = studentTotals.reduce((s, v) => s + v, 0);
                  avgPct = (classTotal / (a.marks.length * a.total_marks)) * 100;
                }

                const pctColor =
                  avgPct === null
                    ? "#6b6b67"
                    : avgPct >= 70
                      ? "#16a34a"
                      : avgPct >= 40
                        ? "#d97706"
                        : "#dc2626";

                return (
                  <Link
                    key={a.id}
                    href={`/class/${id}/results/${a.id}`}
                    className="class-card flex items-center justify-between px-5 py-4"
                    style={{
                      textDecoration: "none",
                      borderBottom:
                        i < assessmentRows.length - 1
                          ? "1px solid var(--border)"
                          : undefined,
                      display: "flex",
                    }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className="text-sm font-medium truncate"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {a.title}
                      </span>
                      <span
                        className="text-xs flex-shrink-0"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {a.date}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {avgPct !== null && (
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded-md tabular-nums"
                          style={{
                            color: pctColor,
                            backgroundColor:
                              avgPct >= 70
                                ? "#f0fdf4"
                                : avgPct >= 40
                                  ? "#fffbeb"
                                  : "#fef2f2",
                          }}
                        >
                          {avgPct.toFixed(0)}%
                        </span>
                      )}
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                        className="flex-shrink-0"
                      >
                        <path
                          d="M3 7h8M7 3l4 4-4 4"
                          stroke="#6b6b67"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
