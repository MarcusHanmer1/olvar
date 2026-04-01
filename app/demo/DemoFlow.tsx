"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import ResultsView from "@/app/class/[id]/results/[assessmentId]/ResultsView";

// ─── Demo data ────────────────────────────────────────────────────────────────

const DEMO_CLASS = "Demo: Year 11 Higher";
const DEMO_BOARD = "AQA";
const DEMO_TIER = "Higher";

const STUDENTS = [
  { id: "s1", name: "Emily Chen", target_grade: 8 },
  { id: "s2", name: "James Wilson", target_grade: 7 },
  { id: "s3", name: "Sophie Ahmed", target_grade: 6 },
  { id: "s4", name: "Oliver Brown", target_grade: 5 },
  { id: "s5", name: "Amara Osei", target_grade: 7 },
  { id: "s6", name: "Liam Murphy", target_grade: 6 },
  { id: "s7", name: "Zara Patel", target_grade: 8 },
  { id: "s8", name: "Ryan Taylor", target_grade: 5 },
];

const QUESTIONS = [
  { id: "q1", number: 1, max_marks: 5, topic: "Fractions" },
  { id: "q2", number: 2, max_marks: 4, topic: "Solving linear equations" },
  { id: "q3", number: 3, max_marks: 5, topic: "Pythagoras' theorem" },
  { id: "q4", number: 4, max_marks: 3, topic: "Percentages" },
  { id: "q5", number: 5, max_marks: 6, topic: "Simultaneous equations" },
  { id: "q6", number: 6, max_marks: 4, topic: "Trigonometry (SOHCAHTOA)" },
];

const TITLE = "Demo Mock Paper 1";
const DATE = new Date().toISOString().slice(0, 10);

// ─── Colour helpers ───────────────────────────────────────────────────────────

function cellColors(
  score: number,
  max: number
): { bg: string; border: string } {
  if (score > max) return { bg: "var(--rag-red-bg)", border: "#fca5a5" };
  const pct = score / max;
  if (pct >= 0.7) return { bg: "var(--rag-green-bg)", border: "var(--border)" };
  if (pct >= 0.4) return { bg: "var(--rag-amber-bg)", border: "var(--border)" };
  return { bg: "var(--rag-red-bg)", border: "var(--border)" };
}

function ragColor(pct: number): string {
  if (pct >= 0.7) return "#16a34a";
  if (pct >= 0.4) return "#d97706";
  return "#dc2626";
}

// ─── Types for results ────────────────────────────────────────────────────────

type QlaEntry = {
  topic: string;
  avg_percentage: number;
  students_below_40: number;
};
type FeedbackEntry = { student_name: string; www: string; ebi: string };
type InterventionEntry = {
  student_name: string;
  target_grade: number;
  current_percentage: number;
  weakest_topics: string[];
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function DemoFlow() {
  const nS = STUDENTS.length;
  const nQ = QUESTIONS.length;
  const maxPossible = QUESTIONS.reduce((s, q) => s + q.max_marks, 0);

  // Step management
  const [step, setStep] = useState<"grid" | "analysing" | "results">("grid");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Results data
  const [results, setResults] = useState<{
    qla: QlaEntry[];
    feedback: FeedbackEntry[];
    interventions: InterventionEntry[];
    class_summary: string;
  } | null>(null);

  // ── Mutable refs ────────────────────────────────────────────────────────────

  const marks = useRef<(number | null)[][]>(
    Array.from({ length: nS }, () => Array<number | null>(nQ).fill(null))
  );
  const inputs = useRef<(HTMLInputElement | null)[][]>(
    Array.from({ length: nS }, () =>
      Array<HTMLInputElement | null>(nQ).fill(null)
    )
  );
  const totalSpans = useRef<(HTMLElement | null)[]>(
    Array<HTMLElement | null>(nS).fill(null)
  );
  const avgSpans = useRef<(HTMLElement | null)[]>(
    Array<HTMLElement | null>(nQ).fill(null)
  );

  // ── Imperative updates ──────────────────────────────────────────────────────

  function refreshTotal(si: number) {
    const row = marks.current[si];
    const hasAny = row.some((v) => v !== null);
    const total = hasAny
      ? row.reduce<number>((s, v) => s + (v ?? 0), 0)
      : null;
    const el = totalSpans.current[si];
    if (!el) return;
    if (total === null) {
      el.textContent = "—";
      el.style.color = "var(--text-secondary)";
      el.style.fontWeight = "400";
    } else {
      el.textContent = `${total}/${maxPossible}`;
      el.style.color = ragColor(total / maxPossible);
      el.style.fontWeight = "600";
    }
  }

  function refreshAvg(qi: number) {
    const max = QUESTIONS[qi].max_marks;
    const col = marks.current
      .map((row) => row[qi])
      .filter((v): v is number => v !== null && v <= max);
    const el = avgSpans.current[qi];
    if (!el) return;
    if (col.length === 0) {
      el.textContent = "—";
      el.style.color = "var(--text-secondary)";
    } else {
      const avg = col.reduce((s, v) => s + v, 0) / col.length;
      el.textContent = avg.toFixed(1);
      el.style.color = ragColor(avg / max);
    }
  }

  function handleChange(si: number, qi: number, raw: string) {
    const max = QUESTIONS[qi].max_marks;
    const parsed = raw === "" ? null : parseInt(raw, 10);
    const value = parsed === null || Number.isNaN(parsed) ? null : parsed;
    marks.current[si][qi] = value;

    const el = inputs.current[si][qi];
    if (el) {
      if (value === null) {
        el.style.backgroundColor = "";
        el.style.borderColor = "var(--border)";
      } else {
        const { bg, border } = cellColors(value, max);
        el.style.backgroundColor = bg;
        el.style.borderColor = border;
      }
    }
    refreshTotal(si);
    refreshAvg(qi);
  }

  function handleKeyDown(
    e: React.KeyboardEvent<HTMLInputElement>,
    si: number,
    qi: number
  ) {
    const t = e.currentTarget;
    if (e.key === "Tab") {
      e.preventDefault();
      if (qi + 1 < nQ) inputs.current[si][qi + 1]?.focus();
      else if (si + 1 < nS) inputs.current[si + 1][0]?.focus();
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (si + 1 < nS) inputs.current[si + 1][qi]?.focus();
    } else if (e.key === "ArrowRight") {
      if (t.selectionStart === t.value.length) {
        e.preventDefault();
        inputs.current[si]?.[qi + 1]?.focus();
      }
    } else if (e.key === "ArrowLeft") {
      if (t.selectionStart === 0) {
        e.preventDefault();
        inputs.current[si]?.[qi - 1]?.focus();
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      inputs.current[si + 1]?.[qi]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      inputs.current[si - 1]?.[qi]?.focus();
    }
  }

  // ── Analyse ─────────────────────────────────────────────────────────────────

  async function handleAnalyse() {
    // Check at least some marks entered
    const hasAny = marks.current.some((row) => row.some((v) => v !== null));
    if (!hasAny) {
      setError("Enter some marks first — try filling in a few cells.");
      return;
    }

    setStep("analysing");
    setStatus("Analysing with AI — this may take a moment…");
    setError(null);

    try {
      const res = await fetch("/api/demo-analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: TITLE,
          date: DATE,
          className: DEMO_CLASS,
          examBoard: DEMO_BOARD,
          tier: DEMO_TIER,
          questions: QUESTIONS.map(({ number, max_marks, topic }) => ({
            number,
            max_marks,
            topic,
          })),
          students: STUDENTS.map((s, si) => ({
            name: s.name,
            target_grade: s.target_grade,
            scores: marks.current[si],
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setStep("grid");
        setError(data.error || "Analysis failed. Please try again.");
        return;
      }

      const data = await res.json();
      setResults({
        qla: data.qla,
        feedback: data.feedback,
        interventions: data.interventions,
        class_summary: data.class_summary,
      });
      setStep("results");
    } catch {
      setStep("grid");
      setError("Network error. Please try again.");
    }
  }

  // ── Layout constants ────────────────────────────────────────────────────────

  const CELL_W = 52;
  const NAME_W = 180;
  const TOTAL_W = 90;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "var(--bg)" }}
    >
      {/* Demo banner */}
      <div
        style={{
          backgroundColor: "var(--accent-light)",
          borderBottom: "1px solid var(--summary-border)",
          padding: "8px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "12px",
          fontSize: "13px",
        }}
      >
        <span style={{ color: "#0d9488" }}>
          This is a demo — sign up free to save your classes and data.
        </span>
        <Link
          href="/login"
          style={{
            color: "#0d9488",
            fontWeight: 600,
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          Sign up
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M2 6h8M6 2l4 4-4 4"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
      </div>

      {/* Nav */}
      <nav
        style={{
          backgroundColor: "var(--surface)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="text-base font-semibold tracking-tight"
            style={{ color: "var(--text-primary)", textDecoration: "none" }}
          >
            Olvar
          </Link>
          <Link
            href="/login"
            className="text-sm font-medium px-4 py-1.5 rounded-md"
            style={{ backgroundColor: "#0d9488", color: "#ffffff", textDecoration: "none" }}
          >
            Sign up free
          </Link>
        </div>
      </nav>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-10">
        {/* Header */}
        <div className="mb-6">
          <h1
            className="text-2xl font-semibold tracking-tight mb-1"
            style={{ color: "var(--text-primary)" }}
          >
            {step === "results" ? TITLE : "Try Olvar"}
          </h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {step === "results"
              ? `${DATE} · ${maxPossible} marks · ${DEMO_BOARD} ${DEMO_TIER}`
              : `${DEMO_CLASS} · ${STUDENTS.length} students · ${QUESTIONS.length} questions · ${maxPossible} marks`}
          </p>
        </div>

        {/* ── Results view ─────────────────────────────────────────────── */}
        {step === "results" && results && (
          <div>
            <div style={{ marginBottom: "24px" }}>
              <button
                onClick={() => setStep("grid")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "13px",
                  color: "var(--text-secondary)",
                  backgroundColor: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px 0",
                }}
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
                Back to marks
              </button>
            </div>
            <ResultsView
              classId="demo"
              assessmentTitle={TITLE}
              qla={results.qla}
              classSummary={results.class_summary}
              feedback={results.feedback}
              interventions={results.interventions}
            />
          </div>
        )}

        {/* ── Analysing spinner ────────────────────────────────────────── */}
        {step === "analysing" && (
          <div
            className="rounded-xl flex flex-col items-center justify-center py-24 text-center"
            style={{
              backgroundColor: "var(--surface)",
              border: "1px solid var(--border)",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                border: "3px solid var(--border)",
                borderTopColor: "#0d9488",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
                marginBottom: "16px",
              }}
            />
            <p
              className="text-sm font-medium"
              style={{ color: "var(--text-primary)" }}
            >
              {status || "Analysing…"}
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
              Claude is generating QLA, feedback, and interventions
            </p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* ── Mark entry grid ──────────────────────────────────────────── */}
        {step === "grid" && (
          <div>
            {/* Legend */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: "12px",
                marginBottom: "12px",
              }}
            >
              {[
                { label: "≥70%", bg: "var(--rag-green-bg)", text: "#16a34a" },
                { label: "40–69%", bg: "var(--rag-amber-bg)", text: "#d97706" },
                { label: "<40%", bg: "var(--rag-red-bg)", text: "#dc2626" },
              ].map((l) => (
                <span
                  key={l.label}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    fontSize: "11px",
                    color: l.text,
                  }}
                >
                  <span
                    style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: "2px",
                      backgroundColor: l.bg,
                      border: `1px solid ${l.text}40`,
                    }}
                  />
                  {l.label}
                </span>
              ))}
            </div>

            {/* Grid */}
            <div
              style={{
                borderRadius: "12px",
                border: "1px solid var(--border)",
                backgroundColor: "var(--surface)",
                overflowX: "auto",
              }}
            >
              <table
                style={{
                  borderCollapse: "collapse",
                  tableLayout: "fixed",
                  width: `${NAME_W + nQ * CELL_W + TOTAL_W}px`,
                  minWidth: "100%",
                  fontSize: "13px",
                }}
              >
                <colgroup>
                  <col style={{ width: `${NAME_W}px` }} />
                  {QUESTIONS.map((q) => (
                    <col key={q.id} style={{ width: `${CELL_W}px` }} />
                  ))}
                  <col style={{ width: `${TOTAL_W}px` }} />
                </colgroup>

                <thead>
                  {/* Topic row */}
                  <tr>
                    <th
                      style={{
                        padding: "6px 14px",
                        borderBottom: "1px solid var(--border)",
                        borderRight: "1px solid var(--border)",
                        position: "sticky",
                        left: 0,
                        backgroundColor: "var(--surface-secondary)",
                        zIndex: 3,
                      }}
                    />
                    {QUESTIONS.map((q) => (
                      <th
                        key={q.id}
                        title={q.topic}
                        style={{
                          padding: "5px 2px",
                          borderBottom: "1px solid var(--border)",
                          borderRight: "1px solid var(--border)",
                          textAlign: "center",
                          fontWeight: 400,
                          fontSize: "10px",
                          color: "var(--text-secondary)",
                          overflow: "hidden",
                          whiteSpace: "nowrap",
                          textOverflow: "ellipsis",
                          backgroundColor: "var(--surface-secondary)",
                          maxWidth: `${CELL_W}px`,
                        }}
                      >
                        {q.topic.length > 9
                          ? q.topic.slice(0, 8) + "…"
                          : q.topic}
                      </th>
                    ))}
                    <th
                      style={{
                        backgroundColor: "var(--surface-secondary)",
                        borderBottom: "1px solid var(--border)",
                        position: "sticky",
                        right: 0,
                        zIndex: 3,
                      }}
                    />
                  </tr>

                  {/* Q number row */}
                  <tr>
                    <th
                      style={{
                        padding: "7px 14px",
                        borderBottom: "2px solid var(--border-strong)",
                        borderRight: "1px solid var(--border)",
                        textAlign: "left",
                        fontWeight: 500,
                        fontSize: "11px",
                        color: "var(--text-secondary)",
                        position: "sticky",
                        left: 0,
                        backgroundColor: "var(--surface-secondary)",
                        zIndex: 3,
                      }}
                    >
                      Student
                    </th>
                    {QUESTIONS.map((q) => (
                      <th
                        key={q.id}
                        style={{
                          padding: "4px 2px",
                          borderBottom: "2px solid var(--border-strong)",
                          borderRight: "1px solid var(--border)",
                          textAlign: "center",
                          backgroundColor: "var(--surface-secondary)",
                          lineHeight: 1.3,
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: "12px",
                            color: "var(--text-primary)",
                          }}
                        >
                          Q{q.number}
                        </span>
                        <br />
                        <span
                          style={{
                            fontWeight: 400,
                            fontSize: "10px",
                            color: "var(--text-secondary)",
                          }}
                        >
                          /{q.max_marks}
                        </span>
                      </th>
                    ))}
                    <th
                      style={{
                        padding: "4px 8px",
                        borderBottom: "2px solid var(--border-strong)",
                        borderLeft: "1px solid var(--border)",
                        textAlign: "center",
                        backgroundColor: "var(--surface-secondary)",
                        position: "sticky",
                        right: 0,
                        zIndex: 3,
                        lineHeight: 1.3,
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: "12px",
                          color: "var(--text-primary)",
                        }}
                      >
                        Total
                      </span>
                      <br />
                      <span
                        style={{
                          fontWeight: 400,
                          fontSize: "10px",
                          color: "var(--text-secondary)",
                        }}
                      >
                        /{maxPossible}
                      </span>
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {STUDENTS.map((s, si) => (
                    <tr key={s.id} className="student-row">
                      <td
                        style={{
                          padding: "3px 14px",
                          borderBottom: "1px solid var(--border)",
                          borderRight: "1px solid var(--border)",
                          fontWeight: 500,
                          fontSize: "13px",
                          color: "var(--text-primary)",
                          whiteSpace: "nowrap",
                          position: "sticky",
                          left: 0,
                          backgroundColor: "var(--surface)",
                          zIndex: 1,
                        }}
                      >
                        {s.name}
                      </td>

                      {QUESTIONS.map((q, qi) => (
                        <td
                          key={q.id}
                          style={{
                            padding: "2px",
                            borderBottom: "1px solid var(--border)",
                            borderRight: "1px solid var(--border)",
                          }}
                        >
                          <input
                            ref={(el) => {
                              inputs.current[si][qi] = el;
                            }}
                            type="number"
                            min={0}
                            max={q.max_marks}
                            defaultValue=""
                            onChange={(e) =>
                              handleChange(si, qi, e.target.value)
                            }
                            onKeyDown={(e) => handleKeyDown(e, si, qi)}
                            onFocus={(e) => e.target.select()}
                            className="mark-cell-input"
                            style={{
                              display: "block",
                              width: "100%",
                              height: "34px",
                              textAlign: "center",
                              border: "1px solid var(--border)",
                              borderRadius: "4px",
                              outline: "none",
                              fontFamily: "inherit",
                              fontSize: "13px",
                              fontVariantNumeric: "tabular-nums",
                              backgroundColor: "transparent",
                              color: "var(--text-primary)",
                            }}
                          />
                        </td>
                      ))}

                      <td
                        style={{
                          padding: "3px 10px",
                          borderBottom: "1px solid var(--border)",
                          borderLeft: "1px solid var(--border)",
                          textAlign: "center",
                          fontSize: "12px",
                          fontVariantNumeric: "tabular-nums",
                          position: "sticky",
                          right: 0,
                          backgroundColor: "var(--surface-secondary)",
                          zIndex: 1,
                        }}
                      >
                        <span
                          ref={(el) => {
                            totalSpans.current[si] = el;
                          }}
                          style={{ color: "var(--text-secondary)" }}
                        >
                          —
                        </span>
                      </td>
                    </tr>
                  ))}

                  {/* Averages row */}
                  <tr>
                    <td
                      style={{
                        padding: "7px 14px",
                        borderTop: "2px solid var(--border-strong)",
                        borderRight: "1px solid var(--border)",
                        fontWeight: 600,
                        fontSize: "11px",
                        color: "var(--text-secondary)",
                        position: "sticky",
                        left: 0,
                        backgroundColor: "var(--surface-secondary)",
                        zIndex: 1,
                      }}
                    >
                      Class avg
                    </td>
                    {QUESTIONS.map((q, qi) => (
                      <td
                        key={q.id}
                        style={{
                          padding: "7px 2px",
                          borderTop: "2px solid var(--border-strong)",
                          borderRight: "1px solid var(--border)",
                          textAlign: "center",
                          backgroundColor: "var(--surface-secondary)",
                          fontSize: "12px",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        <span
                          ref={(el) => {
                            avgSpans.current[qi] = el;
                          }}
                          style={{ color: "var(--text-secondary)" }}
                        >
                          —
                        </span>
                      </td>
                    ))}
                    <td
                      style={{
                        borderTop: "2px solid var(--border-strong)",
                        borderLeft: "1px solid var(--border)",
                        backgroundColor: "var(--surface-secondary)",
                        position: "sticky",
                        right: 0,
                        zIndex: 1,
                      }}
                    />
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Error */}
            {error && (
              <div
                style={{
                  marginTop: "16px",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  color: "#dc2626",
                  backgroundColor: "var(--rag-red-bg)",
                  border: "1px solid #fecaca",
                }}
              >
                {error}
              </div>
            )}

            {/* Analyse button */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: "24px",
              }}
            >
              <button
                onClick={handleAnalyse}
                className="btn-primary"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "11px 28px",
                  borderRadius: "12px",
                  fontSize: "15px",
                  fontWeight: 700,
                  backgroundColor: "#0d9488",
                  color: "#ffffff",
                  border: "none",
                  cursor: "pointer",
                  letterSpacing: "-0.01em",
                }}
              >
                <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
                  <path
                    d="M8.5 2L10 5.5L14 6L11 9l.7 4L8.5 11.5 5.3 13l.7-4L3 6l4-.5L8.5 2z"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinejoin="round"
                    fill="rgba(255,255,255,0.2)"
                  />
                </svg>
                Analyse
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
