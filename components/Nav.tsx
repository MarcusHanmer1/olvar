"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "./ThemeProvider";

interface NavProps {
  email: string;
  userName?: string;
}

export default function Nav({ email, userName }: NavProps) {
  const router = useRouter();
  const supabase = createClient();
  const { theme, toggle } = useTheme();

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const initials = userName
    ? userName
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : email.slice(0, 2).toUpperCase();

  return (
    <nav
      className="sticky top-0 z-50 border-b"
      style={{
        backgroundColor: theme === "dark" ? "rgba(0, 0, 0, 0.85)" : "rgba(255, 255, 255, 0.85)",
        borderColor: "var(--border)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div className="max-w-2xl mx-auto px-4 h-[53px] flex items-center justify-between">
        <a
          href="/dashboard"
          className="flex items-center gap-2 text-[15px] font-bold tracking-tight"
          style={{ color: "var(--text-primary)", textDecoration: "none" }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ backgroundColor: "#0d9488", color: "#ffffff" }}
          >
            O
          </div>
          Olvar
        </a>

        <div className="flex items-center gap-1">
          {/* Dark mode toggle */}
          <button
            onClick={toggle}
            className="btn-ghost w-9 h-9 flex items-center justify-center"
            style={{ color: "var(--text-secondary)" }}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? (
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <circle cx="9" cy="9" r="4" stroke="currentColor" strokeWidth="1.5" />
                <path d="M9 1v2M9 15v2M1 9h2M15 9h2M3.34 3.34l1.42 1.42M13.24 13.24l1.42 1.42M3.34 14.66l1.42-1.42M13.24 4.76l1.42-1.42" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M15.5 10.4A7 7 0 017.6 2.5a7 7 0 107.9 7.9z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ backgroundColor: "var(--surface-secondary)" }}>
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
              style={{ backgroundColor: "#0d9488", color: "#ffffff" }}
            >
              {initials}
            </div>
            <span className="text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>
              {userName || email.split("@")[0]}
            </span>
          </div>
          <button
            onClick={signOut}
            className="btn-ghost text-[13px] font-medium px-3 py-1.5"
            style={{ color: "var(--text-secondary)" }}
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}
