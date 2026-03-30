import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Nav from "@/components/Nav";
import AddClassModal from "./AddClassModal";

type ClassRow = {
  id: string;
  name: string;
  year_group: number;
  exam_board: string;
  tier: string;
  students: { count: number }[];
};

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: classes } = await supabase
    .from("classes")
    .select("id, name, year_group, exam_board, tier, students(count)")
    .order("created_at", { ascending: false });

  const rows = (classes ?? []) as ClassRow[];

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#fafaf9" }}>
      <Nav email={user.email ?? ""} />

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-10">
        {/* Page header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1
              className="text-2xl font-semibold tracking-tight"
              style={{ color: "#1c1c1a" }}
            >
              Your classes
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "#6b6b67" }}>
              {rows.length === 0
                ? "No classes yet — add your first one."
                : `${rows.length} ${rows.length === 1 ? "class" : "classes"}`}
            </p>
          </div>
          <AddClassModal />
        </div>

        {/* Class grid */}
        {rows.length === 0 ? (
          <div
            className="rounded-xl flex flex-col items-center justify-center py-20 text-center"
            style={{
              backgroundColor: "#ffffff",
              border: "1px dashed #e5e5e4",
            }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center mb-4"
              style={{ backgroundColor: "#f0fdfa" }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M10 2v16M2 10h16"
                  stroke="#0d9488"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <p className="text-sm font-medium mb-1" style={{ color: "#1c1c1a" }}>
              No classes yet
            </p>
            <p className="text-sm mb-5" style={{ color: "#6b6b67" }}>
              Add your first class to get started.
            </p>
            <AddClassModal />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {rows.map((cls) => {
              const count = cls.students?.[0]?.count ?? 0;
              return (
                <Link
                  key={cls.id}
                  href={`/class/${cls.id}`}
                  className="class-card rounded-xl p-5 flex flex-col gap-3"
                  style={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e5e5e4",
                    textDecoration: "none",
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h2
                      className="text-sm font-semibold leading-snug"
                      style={{ color: "#1c1c1a" }}
                    >
                      {cls.name}
                    </h2>
                    <svg
                      className="flex-shrink-0 mt-0.5"
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
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

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[`Year ${cls.year_group}`, cls.exam_board, cls.tier].map(
                      (tag) => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-0.5 rounded-md"
                          style={{
                            backgroundColor: "#f4f4f3",
                            color: "#6b6b67",
                          }}
                        >
                          {tag}
                        </span>
                      )
                    )}
                  </div>

                  <p className="text-xs" style={{ color: "#6b6b67" }}>
                    {count === 0
                      ? "No students"
                      : `${count} ${count === 1 ? "student" : "students"}`}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
