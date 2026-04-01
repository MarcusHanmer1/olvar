"use client";

import Link from "next/link";
import { useTheme } from "@/components/ThemeProvider";

export default function Home() {
  const { theme, toggle } = useTheme();

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg)" }}>
      {/* Nav */}
      <nav
        className="sticky top-0 z-50 border-b"
        style={{
          backgroundColor: theme === "dark" ? "rgba(0, 0, 0, 0.85)" : "rgba(255, 255, 255, 0.85)",
          borderColor: "var(--border)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="max-w-3xl mx-auto px-6 h-[53px] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ backgroundColor: "#0d9488", color: "#ffffff" }}
            >
              O
            </div>
            <span className="text-[15px] font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
              Olvar
            </span>
          </div>
          <div className="flex items-center gap-2">
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
            <Link
              href="/demo"
              className="btn-secondary text-[13px] font-bold px-4 py-2 rounded-full"
              style={{ border: "1px solid var(--border)", color: "var(--text-secondary)" }}
            >
              Try demo
            </Link>
            <Link
              href="/login"
              className="btn-primary text-[13px] font-bold px-4 py-2 rounded-full"
              style={{ backgroundColor: "#0d9488", color: "#ffffff" }}
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        {/* Hero */}
        <section className="max-w-3xl mx-auto px-6 pt-20 pb-16">
          <div className="max-w-xl">
            <div
              className="animate-fade-in-up delay-0 inline-flex items-center gap-2 text-[12px] font-bold px-3 py-1.5 rounded-full mb-6"
              style={{ backgroundColor: "var(--accent-light)", color: "#0d9488", border: "1px solid var(--summary-border)" }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#0d9488" }} />
              Built for UK GCSE maths teachers
            </div>

            <h1
              className="animate-fade-in-up delay-1 text-[42px] font-extrabold tracking-tight leading-[1.1] mb-5"
              style={{ color: "var(--text-primary)" }}
            >
              Your AI teaching
              <br />
              assistant for
              <br />
              <span style={{ color: "#0d9488" }}>post-marking admin.</span>
            </h1>

            <p className="animate-fade-in-up delay-2 text-[17px] leading-relaxed mb-8" style={{ color: "var(--text-secondary)" }}>
              Enter your class marks once. Olvar generates question-level
              analysis, personalised student feedback, and intervention lists
              — instantly.
            </p>

            <div className="animate-fade-in-up delay-3 flex items-center gap-3">
              <Link
                href="/login"
                className="btn-primary inline-flex items-center gap-2 px-6 py-3 rounded-full text-[15px] font-bold"
                style={{ backgroundColor: "#0d9488", color: "#ffffff" }}
              >
                Get started free
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <Link
                href="/demo"
                className="btn-secondary inline-flex items-center gap-2 px-6 py-3 rounded-full text-[15px] font-bold"
                style={{ border: "1px solid var(--border)", color: "var(--text-secondary)" }}
              >
                Try it now
              </Link>
            </div>
          </div>
        </section>

        {/* Stats bar */}
        <section className="border-y" style={{ borderColor: "var(--border)" }}>
          <div className="max-w-3xl mx-auto px-6 py-8 grid grid-cols-3">
            {[
              { value: "3–4 hrs", label: "of admin per assessment" },
              { value: "10 min", label: "with Olvar" },
              { value: "100%", label: "GCSE-aligned topics" },
            ].map((stat, i) => (
              <div
                key={stat.value}
                className="px-6 text-center"
                style={{ borderLeft: i > 0 ? "1px solid var(--border)" : undefined }}
              >
                <div className="text-[28px] font-extrabold tracking-tight mb-1 tabular-nums" style={{ color: "var(--text-primary)" }}>
                  {stat.value}
                </div>
                <div className="text-[13px]" style={{ color: "var(--text-secondary)" }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="max-w-3xl mx-auto px-6 py-16">
          <h2 className="text-[22px] font-extrabold tracking-tight mb-2" style={{ color: "var(--text-primary)" }}>
            How it works
          </h2>
          <p className="text-[15px] mb-10" style={{ color: "var(--text-secondary)" }}>
            Three steps. No spreadsheets. No manual formatting.
          </p>

          <div className="space-y-0 rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
            {[
              { step: "01", title: "Enter your marks", body: "Add your class, define the questions and topics, then type marks directly into the grid — it feels as fast as a spreadsheet." },
              { step: "02", title: "Click Analyse", body: "Olvar sends your data to AI and runs a full question-level analysis across every student, topic, and strand." },
              { step: "03", title: "Download everything", body: "You get QLA tables, WWW/EBI feedback per student, an intervention list sorted by gap-to-target, and CSV exports for Arbor or SIMS." },
            ].map((item, i) => (
              <div
                key={item.step}
                className="flex gap-4 px-5 py-5"
                style={{ borderBottom: i < 2 ? "1px solid var(--border)" : undefined }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-[13px] font-bold tabular-nums"
                  style={{ backgroundColor: "var(--accent-light)", color: "#0d9488" }}
                >
                  {item.step}
                </div>
                <div>
                  <h3 className="text-[15px] font-bold mb-1" style={{ color: "var(--text-primary)" }}>{item.title}</h3>
                  <p className="text-[14px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* What you get */}
        <section style={{ borderTop: "1px solid var(--border)" }}>
          <div className="max-w-3xl mx-auto px-6 py-16">
            <h2 className="text-[22px] font-extrabold tracking-tight mb-2" style={{ color: "var(--text-primary)" }}>
              Everything you need after marking
            </h2>
            <p className="text-[15px] mb-10" style={{ color: "var(--text-secondary)" }}>
              No more copying data into templates.
            </p>

            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="2" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="1.5" /><path d="M6 7h8M6 10h5M6 13h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>,
                  title: "Question-Level Analysis",
                  body: "See exactly which topics your class struggled with, ranked by average, with colour-coded performance bands.",
                },
                {
                  icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="7" r="3" stroke="currentColor" strokeWidth="1.5" /><path d="M4 17c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>,
                  title: "Personalised Feedback",
                  body: "WWW and EBI comments written for every student — ready to paste into reports or share as handouts.",
                },
                {
                  icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 2v10M10 12l-3-3M10 12l3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M4 14v3a1 1 0 001 1h10a1 1 0 001-1v-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>,
                  title: "CSV Exports",
                  body: "Download clean CSVs formatted for Arbor, SIMS, and department tracking spreadsheets.",
                },
                {
                  icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 3L3 8v8a1 1 0 001 1h12a1 1 0 001-1V8L10 3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /><path d="M7 17v-5h6v5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>,
                  title: "Intervention List",
                  body: "Students sorted by gap-to-target grade, with their weakest topics highlighted.",
                },
              ].map((feature) => (
                <div key={feature.title} className="surface-card flex gap-4 p-5">
                  <div
                    className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "var(--accent-light)", color: "#0d9488" }}
                  >
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="text-[15px] font-bold mb-1" style={{ color: "var(--text-primary)" }}>{feature.title}</h3>
                    <p className="text-[14px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>{feature.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{ borderTop: "1px solid var(--border)" }}>
          <div className="max-w-3xl mx-auto px-6 py-16 text-center">
            <h2 className="text-[22px] font-extrabold tracking-tight mb-3" style={{ color: "var(--text-primary)" }}>
              Ready to get your evenings back?
            </h2>
            <p className="text-[15px] mb-8 max-w-md mx-auto" style={{ color: "var(--text-secondary)" }}>
              Join maths teachers who&rsquo;ve stopped spending Sunday afternoons reformatting spreadsheets.
            </p>
            <Link
              href="/login"
              className="btn-primary inline-flex items-center gap-2 px-7 py-3 rounded-full text-[15px] font-bold"
              style={{ backgroundColor: "#0d9488", color: "#ffffff" }}
            >
              Get started free
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid var(--border)" }}>
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between">
          <span className="text-[13px] font-bold" style={{ color: "var(--text-primary)" }}>Olvar</span>
          <span className="text-[13px]" style={{ color: "var(--text-secondary)" }}>Built for UK GCSE maths teachers</span>
        </div>
      </footer>
    </div>
  );
}
