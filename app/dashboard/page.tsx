import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "./SignOutButton";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: teacher } = await supabase
    .from("teachers")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const name = teacher?.full_name || user.email;

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#fafaf9" }}>
      {/* Nav */}
      <nav
        className="border-b"
        style={{
          backgroundColor: "#ffffff",
          borderColor: "#e5e5e4",
        }}
      >
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <span
            className="text-base font-semibold tracking-tight"
            style={{ color: "#1c1c1a" }}
          >
            Olvar
          </span>
          <div className="flex items-center gap-4">
            <span className="text-sm" style={{ color: "#6b6b67" }}>
              {user.email}
            </span>
            <SignOutButton />
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h1
            className="text-3xl font-semibold tracking-tight mb-3"
            style={{ color: "#1c1c1a" }}
          >
            Welcome to Olvar
            {name ? (
              <span style={{ color: "#0d9488" }}>, {name.split(" ")[0]}</span>
            ) : null}
            .
          </h1>
          <p className="text-base" style={{ color: "#6b6b67" }}>
            Your dashboard is being built. Check back soon.
          </p>
        </div>
      </main>
    </div>
  );
}
