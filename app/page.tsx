import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#fafaf9" }}>
      {/* Nav */}
      <nav
        className="sticky top-0 z-50 border-b"
        style={{
          backgroundColor: "rgba(250, 250, 249, 0.9)",
          borderColor: "#e5e5e4",
          backdropFilter: "blur(8px)",
        }}
      >
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <span
            className="text-base font-semibold tracking-tight"
            style={{ color: "#1c1c1a" }}
          >
            Olvar
          </span>
          <div className="flex items-center gap-3">
            <Link
              href="/demo"
              className="btn-secondary text-sm font-medium px-4 py-1.5 rounded-md"
              style={{ border: "1px solid #e5e5e4", color: "#6b6b67" }}
            >
              Try demo
            </Link>
            <Link
              href="/login"
              className="btn-primary text-sm font-medium px-4 py-1.5 rounded-md"
              style={{ backgroundColor: "#0d9488", color: "#ffffff" }}
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        {/* Hero */}
        <section className="max-w-5xl mx-auto px-6 pt-24 pb-20 text-center">
          <div
            className="animate-fade-in-up delay-0 inline-flex items-center gap-2 text-xs font-medium px-3 py-1 rounded-full mb-8"
            style={{
              backgroundColor: "#f0fdfa",
              color: "#0d9488",
              border: "1px solid #ccfbf1",
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: "#0d9488" }}
            />
            Built for UK GCSE maths teachers
          </div>

          <h1
            className="animate-fade-in-up delay-1 text-5xl font-semibold tracking-tight leading-tight mb-6 max-w-2xl mx-auto"
            style={{ color: "#1c1c1a" }}
          >
            Post-marking admin,{" "}
            <span style={{ color: "#0d9488" }}>done in 10 minutes.</span>
          </h1>

          <p
            className="animate-fade-in-up delay-2 text-lg leading-relaxed max-w-xl mx-auto mb-10"
            style={{ color: "#6b6b67" }}
          >
            Enter your class marks once. Olvar generates question-level
            analysis, personalised student feedback, intervention lists, and
            export files — instantly.
          </p>

          <div className="animate-fade-in-up delay-3 flex items-center justify-center gap-4">
            <Link
              href="/login"
              className="btn-primary inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium"
              style={{ backgroundColor: "#0d9488", color: "#ffffff" }}
            >
              Get started free
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M1 7h12M7 1l6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
            <Link
              href="/demo"
              className="btn-secondary inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium"
              style={{ border: "1px solid #e5e5e4", color: "#6b6b67" }}
            >
              Try it now
            </Link>
          </div>
        </section>

        {/* Stats bar */}
        <section
          className="border-y"
          style={{ borderColor: "#e5e5e4", backgroundColor: "#ffffff" }}
        >
          <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-3">
            {[
              { value: "3–4 hrs", label: "of admin per assessment" },
              { value: "10 min", label: "with Olvar" },
              { value: "100%", label: "GCSE-aligned topics" },
            ].map((stat, i) => (
              <div
                key={stat.value}
                className="px-8 text-center"
                style={{
                  borderLeft: i > 0 ? "1px solid #e5e5e4" : undefined,
                }}
              >
                <div
                  className="text-3xl font-semibold tracking-tight mb-1 tabular-nums"
                  style={{ color: "#1c1c1a" }}
                >
                  {stat.value}
                </div>
                <div className="text-sm" style={{ color: "#6b6b67" }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="max-w-5xl mx-auto px-6 py-20">
          <div className="text-center mb-14">
            <h2
              className="text-2xl font-semibold tracking-tight mb-3"
              style={{ color: "#1c1c1a" }}
            >
              How it works
            </h2>
            <p className="text-base" style={{ color: "#6b6b67" }}>
              Three steps. No spreadsheet formulas. No manual formatting.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {[
              {
                step: "01",
                title: "Enter your marks",
                body: "Add your class to Olvar, define the questions and topics, then type marks directly into the grid — it feels as fast as a spreadsheet.",
              },
              {
                step: "02",
                title: "Click Analyse",
                body: "Olvar sends your data to Claude AI and runs a full question-level analysis across every student, topic, and strand.",
              },
              {
                step: "03",
                title: "Download everything",
                body: "You get QLA tables, WWW/EBI feedback per student, an intervention list sorted by gap-to-target, and CSV exports for Arbor or SIMS.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="rounded-xl p-6"
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e5e5e4",
                }}
              >
                <div
                  className="text-xs font-semibold mb-4 tabular-nums"
                  style={{ color: "#0d9488" }}
                >
                  {item.step}
                </div>
                <h3
                  className="text-base font-semibold mb-2"
                  style={{ color: "#1c1c1a" }}
                >
                  {item.title}
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "#6b6b67" }}
                >
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* What you get */}
        <section
          className="border-t"
          style={{ borderColor: "#e5e5e4" }}
        >
          <div className="max-w-5xl mx-auto px-6 py-20">
            <div className="text-center mb-14">
              <h2
                className="text-2xl font-semibold tracking-tight mb-3"
                style={{ color: "#1c1c1a" }}
              >
                Everything you need after marking
              </h2>
              <p className="text-base" style={{ color: "#6b6b67" }}>
                No more copying data into templates. It&rsquo;s all there, ready to
                share.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <rect
                        x="1"
                        y="1"
                        width="16"
                        height="16"
                        rx="3"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                      <path
                        d="M5 6h8M5 9h5M5 12h6"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  ),
                  title: "Question-Level Analysis",
                  body: "See exactly which topics your class struggled with, ranked by class average, with colour-coded performance bands.",
                },
                {
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <circle
                        cx="9"
                        cy="6"
                        r="3"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                      <path
                        d="M3 16c0-3.314 2.686-6 6-6s6 2.686 6 6"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  ),
                  title: "Personalised Student Feedback",
                  body: "WWW and EBI comments written for every student — ready to paste into reports or share as handouts.",
                },
                {
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path
                        d="M9 1v10M9 11l-3-3M9 11l3-3"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M3 13v2a1 1 0 001 1h10a1 1 0 001-1v-2"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  ),
                  title: "CSV Exports",
                  body: "Download clean CSVs formatted for Arbor, SIMS, and department tracking spreadsheets. No reformatting needed.",
                },
                {
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path
                        d="M9 2L2 7v8a1 1 0 001 1h12a1 1 0 001-1V7L9 2z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M6 16v-5h6v5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ),
                  title: "Intervention List",
                  body: "Students sorted by gap-to-target grade, with their weakest topics highlighted. Know exactly who to prioritise.",
                },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="flex gap-4 rounded-xl p-6"
                  style={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e5e5e4",
                  }}
                >
                  <div
                    className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: "#f0fdfa", color: "#0d9488" }}
                  >
                    {feature.icon}
                  </div>
                  <div>
                    <h3
                      className="text-sm font-semibold mb-1"
                      style={{ color: "#1c1c1a" }}
                    >
                      {feature.title}
                    </h3>
                    <p
                      className="text-sm leading-relaxed"
                      style={{ color: "#6b6b67" }}
                    >
                      {feature.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section
          className="border-t"
          style={{ borderColor: "#e5e5e4", backgroundColor: "#ffffff" }}
        >
          <div className="max-w-5xl mx-auto px-6 py-20 text-center">
            <h2
              className="text-2xl font-semibold tracking-tight mb-4"
              style={{ color: "#1c1c1a" }}
            >
              Ready to get your evenings back?
            </h2>
            <p
              className="text-base mb-8 max-w-md mx-auto"
              style={{ color: "#6b6b67" }}
            >
              Join maths teachers who&rsquo;ve stopped spending their Sunday afternoons
              reformatting spreadsheets.
            </p>
            <Link
              href="/login"
              className="btn-primary inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium"
              style={{ backgroundColor: "#0d9488", color: "#ffffff" }}
            >
              Get started free
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M1 7h12M7 1l6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t" style={{ borderColor: "#e5e5e4" }}>
        <div className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
          <span
            className="text-sm font-medium"
            style={{ color: "#1c1c1a" }}
          >
            Olvar
          </span>
          <span className="text-sm" style={{ color: "#6b6b67" }}>
            Built for UK GCSE maths teachers
          </span>
        </div>
      </footer>
    </div>
  );
}
