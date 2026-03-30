"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface NavProps {
  email: string;
}

export default function Nav({ email }: NavProps) {
  const router = useRouter();
  const supabase = createClient();

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <nav
      className="border-b"
      style={{ backgroundColor: "#ffffff", borderColor: "#e5e5e4" }}
    >
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <a
          href="/dashboard"
          className="text-base font-semibold tracking-tight"
          style={{ color: "#1c1c1a" }}
        >
          Olvar
        </a>
        <div className="flex items-center gap-4">
          <span className="text-sm" style={{ color: "#6b6b67" }}>
            {email}
          </span>
          <button
            onClick={signOut}
            className="text-sm font-medium px-3 py-1.5 rounded-md transition-colors"
            style={{
              border: "1px solid #e5e5e4",
              color: "#6b6b67",
              backgroundColor: "#ffffff",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "#1c1c1a";
              (e.currentTarget as HTMLElement).style.color = "#1c1c1a";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "#e5e5e4";
              (e.currentTarget as HTMLElement).style.color = "#6b6b67";
            }}
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}
