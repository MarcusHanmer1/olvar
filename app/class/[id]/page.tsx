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

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#fafaf9" }}>
      <Nav email={user.email ?? ""} />

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-10">
        {/* Back link */}
        <Link
          href="/dashboard"
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
          All classes
        </Link>

        {/* Class header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1
              className="text-2xl font-semibold tracking-tight mb-2"
              style={{ color: "#1c1c1a" }}
            >
              {cls.name}
            </h1>
            <div className="flex items-center gap-1.5 flex-wrap">
              {[`Year ${cls.year_group}`, cls.exam_board, cls.tier].map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-0.5 rounded-md"
                  style={{ backgroundColor: "#f4f4f3", color: "#6b6b67" }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <Link
            href={`/class/${id}/assess`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium"
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
      </main>
    </div>
  );
}
