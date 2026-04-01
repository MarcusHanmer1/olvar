import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Nav from "@/components/Nav";
import AssessmentFlow from "./AssessmentFlow";
import { getTemplates } from "./template-actions";

export default async function AssessPage({
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
    .select("id, name")
    .eq("class_id", id)
    .order("name", { ascending: true });

  if (!students || students.length === 0) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg)" }}>
        <Nav email={user.email ?? ""} />
        <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-10">
          <Link
            href={`/class/${id}`}
            className="inline-flex items-center gap-1.5 text-sm mb-6"
            style={{ color: "var(--text-secondary)", textDecoration: "none" }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 3L5 7l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {cls.name}
          </Link>
          <div
            className="rounded-xl flex flex-col items-center justify-center py-20 text-center"
            style={{ backgroundColor: "var(--surface)", border: "1px dashed var(--border)" }}
          >
            <p className="text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>No students in this class</p>
            <p className="text-sm mb-5" style={{ color: "var(--text-secondary)" }}>
              Add students before creating an assessment.
            </p>
            <Link
              href={`/class/${id}`}
              className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{ backgroundColor: "#0d9488", color: "#ffffff", textDecoration: "none" }}
            >
              Add students
            </Link>
          </div>
        </main>
      </div>
    );
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
            <path d="M9 3L5 7l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {cls.name}
        </Link>

        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight mb-1" style={{ color: "var(--text-primary)" }}>
            New assessment
          </h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {students.length} {students.length === 1 ? "student" : "students"} · {cls.exam_board} {cls.tier}
          </p>
        </div>

        <AssessmentFlow classId={id} students={students} templates={await getTemplates()} />
      </main>
    </div>
  );
}
