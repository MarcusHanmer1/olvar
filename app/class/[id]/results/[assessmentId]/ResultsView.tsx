"use client";

import { useState, useCallback, useEffect } from "react";
import type { ComparisonData } from "./page";

// ─── Types ────────────────────────────────────────────────────────────────────

type QlaEntry = {
  topic: string;
  avg_percentage: number;
  students_below_40: number;
};

type FeedbackEntry = {
  student_name: string;
  www: string;
  ebi: string;
};

type InterventionEntry = {
  student_name: string;
  target_grade: number;
  current_percentage: number;
  weakest_topics: string[];
};

interface Props {
  classId: string;
  assessmentTitle: string;
  qla: QlaEntry[];
  classSummary: string;
  feedback: FeedbackEntry[];
  interventions: InterventionEntry[];
  comparison?: ComparisonData | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ragColor(pct: number): string {
  if (pct >= 70) return "#16a34a";
  if (pct >= 40) return "#d97706";
  return "#dc2626";
}

function ragBg(pct: number): string {
  if (pct >= 70) return "var(--rag-green-bg)";
  if (pct >= 40) return "var(--rag-amber-bg)";
  return "var(--rag-red-bg)";
}

function downloadCsv(filename: string, csvContent: string) {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function escapeCsv(s: string): string {
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ResultsView({
  classId,
  assessmentTitle,
  qla,
  classSummary,
  feedback,
  interventions,
  comparison,
}: Props) {
  const sortedQla = [...qla].sort(
    (a, b) => a.avg_percentage - b.avg_percentage
  );

  const [barsReady, setBarsReady] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setBarsReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const [openStudent, setOpenStudent] = useState<string | null>(null);
  const [copiedName, setCopiedName] = useState<string | null>(null);

  const copyFeedback = useCallback(
    async (entry: FeedbackEntry) => {
      const text = `${entry.student_name} — ${assessmentTitle}\n\nWWW (What Went Well):\n${entry.www}\n\nEBI (Even Better If):\n${entry.ebi}`;
      await navigator.clipboard.writeText(text);
      setCopiedName(entry.student_name);
      setTimeout(() => setCopiedName(null), 2000);
    },
    [assessmentTitle]
  );

  function exportQla() {
    const header = "Topic,Avg %,Students Below 40%\n";
    const rows = sortedQla
      .map((q) => `${escapeCsv(q.topic)},${q.avg_percentage.toFixed(1)},${q.students_below_40}`)
      .join("\n");
    downloadCsv(`QLA — ${assessmentTitle}.csv`, header + rows);
  }

  function exportFeedback() {
    const header = "Student,WWW,EBI\n";
    const rows = feedback
      .map((f) => `${escapeCsv(f.student_name)},${escapeCsv(f.www)},${escapeCsv(f.ebi)}`)
      .join("\n");
    downloadCsv(`Feedback — ${assessmentTitle}.csv`, header + rows);
  }

  function exportInterventions() {
    const header = "Student,Target Grade,Current %,Weakest Topics\n";
    const rows = interventions
      .map((i) => `${escapeCsv(i.student_name)},${i.target_grade},${i.current_percentage.toFixed(1)},${escapeCsv(i.weakest_topics.join("; "))}`)
      .join("\n");
    downloadCsv(`Interventions — ${assessmentTitle}.csv`, header + rows);
  }

  const maxPct = Math.max(...sortedQla.map((q) => q.avg_percentage), 1);
  const barScale = Math.min(100, Math.max(maxPct, 50));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
      {/* ── Class summary ── */}
      <div
        style={{
          padding: "16px 20px",
          borderRadius: "16px",
          backgroundColor: "var(--accent-light)",
          border: "1px solid var(--summary-border)",
          fontSize: "14px",
          lineHeight: 1.65,
          color: "var(--text-primary)",
        }}
      >
        {classSummary}
      </div>

      {/* ── Progress Comparison ── */}
      {comparison && <ComparisonSection comparison={comparison} />}

      {/* ── QLA Overview ── */}
      <section>
        <SectionHeader title="Question Level Analysis" />
        <div
          style={{
            borderRadius: "16px",
            border: "1px solid var(--border)",
            backgroundColor: "var(--surface)",
            overflow: "hidden",
          }}
        >
          {sortedQla.map((q, i) => (
            <div
              key={q.topic}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                padding: "10px 18px",
                borderBottom: i < sortedQla.length - 1 ? "1px solid var(--border)" : undefined,
              }}
            >
              <span
                style={{
                  width: "200px",
                  flexShrink: 0,
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "var(--text-primary)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                title={q.topic}
              >
                {q.topic}
              </span>

              <div
                className="qla-bar-track"
                style={{
                  flex: 1,
                  height: "22px",
                  borderRadius: "6px",
                  backgroundColor: "var(--surface-secondary)",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  className="qla-bar-fill"
                  style={{
                    height: "100%",
                    width: barsReady ? `${(q.avg_percentage / barScale) * 100}%` : "0%",
                    borderRadius: "6px",
                    backgroundColor: ragBg(q.avg_percentage),
                    border: `1px solid ${ragColor(q.avg_percentage)}30`,
                    transitionDelay: `${i * 40}ms`,
                  }}
                />
              </div>

              <span
                style={{
                  width: "52px",
                  textAlign: "right",
                  fontSize: "13px",
                  fontWeight: 700,
                  fontVariantNumeric: "tabular-nums",
                  color: ragColor(q.avg_percentage),
                  flexShrink: 0,
                }}
              >
                {q.avg_percentage.toFixed(0)}%
              </span>

              {q.students_below_40 > 0 && (
                <span
                  style={{
                    fontSize: "11px",
                    padding: "2px 8px",
                    borderRadius: "6px",
                    backgroundColor: "var(--rag-red-bg)",
                    color: "#dc2626",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  {q.students_below_40} below 40%
                </span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Student Feedback ── */}
      <section>
        <SectionHeader title="Student Feedback" />
        <div
          style={{
            borderRadius: "16px",
            border: "1px solid var(--border)",
            backgroundColor: "var(--surface)",
            overflow: "hidden",
          }}
        >
          {feedback.map((f, i) => {
            const isOpen = openStudent === f.student_name;
            return (
              <div
                key={f.student_name}
                style={{
                  borderBottom: i < feedback.length - 1 ? "1px solid var(--border)" : undefined,
                }}
              >
                <button
                  onClick={() => setOpenStudent(isOpen ? null : f.student_name)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",
                    padding: "12px 18px",
                    border: "none",
                    backgroundColor: isOpen ? "var(--surface-hover)" : "var(--surface)",
                    cursor: "pointer",
                    textAlign: "left",
                    color: "var(--text-primary)",
                    fontSize: "13px",
                    fontWeight: 500,
                    transition: "background-color 0.1s",
                  }}
                >
                  <span>{f.student_name}</span>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    style={{
                      transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.15s ease",
                      flexShrink: 0,
                    }}
                  >
                    <path d="M3 5l4 4 4-4" stroke="var(--text-secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                <div className="accordion-panel" data-open={isOpen}>
                  <div className="accordion-inner">
                    <div style={{ padding: "0 18px 16px 18px" }}>
                      <div style={{ marginBottom: "14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                          <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#16a34a", flexShrink: 0 }} />
                          <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "#16a34a" }}>
                            What went well
                          </span>
                        </div>
                        <p style={{ fontSize: "13px", lineHeight: 1.65, color: "var(--text-primary)", margin: 0, paddingLeft: "14px" }}>
                          {f.www}
                        </p>
                      </div>

                      <div style={{ marginBottom: "14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                          <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#d97706", flexShrink: 0 }} />
                          <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "#d97706" }}>
                            Even better if
                          </span>
                        </div>
                        <p style={{ fontSize: "13px", lineHeight: 1.65, color: "var(--text-primary)", margin: 0, paddingLeft: "14px" }}>
                          {f.ebi}
                        </p>
                      </div>

                      <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <button
                          onClick={() => copyFeedback(f)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            fontSize: "12px",
                            fontWeight: 500,
                            color: copiedName === f.student_name ? "#16a34a" : "var(--text-secondary)",
                            backgroundColor: "transparent",
                            border: "1px solid var(--border)",
                            borderRadius: "8px",
                            padding: "5px 10px",
                            cursor: "pointer",
                          }}
                        >
                          {copiedName === f.student_name ? (
                            <>
                              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                              Copied
                            </>
                          ) : (
                            <>
                              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                                <path d="M8.5 3.5V2a1.5 1.5 0 00-1.5-1.5H2A1.5 1.5 0 00.5 2v5A1.5 1.5 0 002 8.5h1.5" stroke="currentColor" strokeWidth="1.2" />
                              </svg>
                              Copy feedback
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Intervention List ── */}
      {interventions.length > 0 && (
        <section>
          <SectionHeader title="Intervention List" />
          <div
            style={{
              borderRadius: "16px",
              border: "1px solid var(--border)",
              backgroundColor: "var(--surface)",
              overflow: "hidden",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--border)" }}>
                  {["Student", "Target", "Current", "Gap", "Weakest topics"].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "10px 16px",
                        textAlign: "left",
                        fontWeight: 500,
                        fontSize: "11px",
                        color: "var(--text-secondary)",
                        backgroundColor: "var(--surface-secondary)",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {interventions.map((entry, i) => {
                  const gradeThreshold = entry.target_grade * 10 + 5;
                  const gap = entry.current_percentage - gradeThreshold;

                  return (
                    <tr
                      key={entry.student_name}
                      className="student-row intervention-row"
                      style={{
                        borderBottom: i < interventions.length - 1 ? "1px solid var(--border)" : undefined,
                        animationDelay: `${i * 50}ms`,
                      }}
                    >
                      <td style={{ padding: "10px 16px", fontWeight: 500, color: "var(--text-primary)" }}>
                        {entry.student_name}
                      </td>
                      <td style={{ padding: "10px 16px", fontVariantNumeric: "tabular-nums", color: "var(--text-primary)" }}>
                        {entry.target_grade}
                      </td>
                      <td style={{ padding: "10px 16px", fontWeight: 600, fontVariantNumeric: "tabular-nums", color: ragColor(entry.current_percentage) }}>
                        {entry.current_percentage.toFixed(0)}%
                      </td>
                      <td style={{ padding: "10px 16px", fontWeight: 600, fontVariantNumeric: "tabular-nums", color: gap < 0 ? "#dc2626" : "#16a34a" }}>
                        {gap > 0 ? "+" : ""}{gap.toFixed(0)}%
                      </td>
                      <td style={{ padding: "10px 16px" }}>
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                          {entry.weakest_topics.map((t) => (
                            <span key={t} className="topic-tag">{t}</span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── Exports ── */}
      <section>
        <SectionHeader title="Export" />
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <ExportButton label="QLA (CSV)" onClick={exportQla} />
          <ExportButton label="Feedback (CSV)" onClick={exportFeedback} />
          {interventions.length > 0 && (
            <ExportButton label="Interventions (CSV)" onClick={exportInterventions} />
          )}
        </div>
      </section>
    </div>
  );
}

// ─── Comparison Section ─────────────────────────────────────────────────────

function ComparisonSection({ comparison }: { comparison: ComparisonData }) {
  const classChange = comparison.current_class_avg - comparison.previous_class_avg;
  const improvements = comparison.topic_changes.filter((t) => t.change > 0);
  const declines = comparison.topic_changes.filter((t) => t.change < 0);

  // Biggest improvements (top 3)
  const topImprovements = [...improvements]
    .sort((a, b) => b.change - a.change)
    .slice(0, 3);

  // Biggest declines (top 3)
  const topDeclines = [...declines]
    .sort((a, b) => a.change - b.change)
    .slice(0, 3);

  return (
    <section>
      <SectionHeader title="Progress" />

      {/* Overview banner */}
      <div
        style={{
          borderRadius: "16px",
          border: "1px solid var(--border)",
          backgroundColor: "var(--surface)",
          overflow: "hidden",
          marginBottom: "16px",
        }}
      >
        <div
          style={{
            padding: "16px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "4px" }}>
              Compared to <strong style={{ color: "var(--text-primary)" }}>{comparison.previous_title}</strong>{" "}
              ({comparison.previous_date})
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Class average:</span>
              <span
                style={{
                  fontSize: "20px",
                  fontWeight: 700,
                  fontVariantNumeric: "tabular-nums",
                  color: "var(--text-primary)",
                }}
              >
                {comparison.current_class_avg.toFixed(0)}%
              </span>
              <span
                style={{
                  fontSize: "15px",
                  fontWeight: 700,
                  fontVariantNumeric: "tabular-nums",
                  color: classChange >= 0 ? "#16a34a" : "#dc2626",
                }}
              >
                {classChange >= 0 ? "+" : ""}{classChange.toFixed(1)}%
              </span>
              {classChange >= 0 ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 12V4M4 7l4-4 4 4" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 4v8M4 9l4 4 4-4" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <span
              className="stat-pill"
              style={{ backgroundColor: "var(--rag-green-bg)", color: "#16a34a" }}
            >
              {improvements.length} improved
            </span>
            <span
              className="stat-pill"
              style={{ backgroundColor: "var(--rag-red-bg)", color: "#dc2626" }}
            >
              {declines.length} declined
            </span>
          </div>
        </div>

        {/* Topic changes */}
        {(topImprovements.length > 0 || topDeclines.length > 0) && (
          <div style={{ padding: "16px 20px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              {/* Improvements */}
              <div>
                <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "#16a34a", marginBottom: "10px" }}>
                  Biggest improvements
                </p>
                {topImprovements.length === 0 ? (
                  <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>No topics improved</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {topImprovements.map((t) => (
                      <div key={t.topic} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginRight: "8px" }}>
                          {t.topic}
                        </span>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                          <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontVariantNumeric: "tabular-nums" }}>
                            {t.previous_avg.toFixed(0)}%
                          </span>
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6h8M6 2l4 4-4 4" stroke="var(--text-secondary)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <span style={{ fontSize: "12px", fontWeight: 600, color: "#16a34a", fontVariantNumeric: "tabular-nums" }}>
                            {t.current_avg.toFixed(0)}%
                          </span>
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: 700,
                              padding: "1px 6px",
                              borderRadius: "6px",
                              backgroundColor: "var(--rag-green-bg)",
                              color: "#16a34a",
                              fontVariantNumeric: "tabular-nums",
                            }}
                          >
                            +{t.change.toFixed(0)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Declines */}
              <div>
                <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "#dc2626", marginBottom: "10px" }}>
                  Biggest declines
                </p>
                {topDeclines.length === 0 ? (
                  <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>No topics declined</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {topDeclines.map((t) => (
                      <div key={t.topic} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginRight: "8px" }}>
                          {t.topic}
                        </span>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                          <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontVariantNumeric: "tabular-nums" }}>
                            {t.previous_avg.toFixed(0)}%
                          </span>
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6h8M6 2l4 4-4 4" stroke="var(--text-secondary)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <span style={{ fontSize: "12px", fontWeight: 600, color: "#dc2626", fontVariantNumeric: "tabular-nums" }}>
                            {t.current_avg.toFixed(0)}%
                          </span>
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: 700,
                              padding: "1px 6px",
                              borderRadius: "6px",
                              backgroundColor: "var(--rag-red-bg)",
                              color: "#dc2626",
                              fontVariantNumeric: "tabular-nums",
                            }}
                          >
                            {t.change.toFixed(0)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Students who dropped 10+ points */}
      {comparison.student_declines.length > 0 && (
        <div
          style={{
            borderRadius: "16px",
            border: "1px solid var(--border)",
            backgroundColor: "var(--surface)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "12px 20px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              borderBottom: "1px solid var(--border)",
              backgroundColor: "var(--rag-red-bg)",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.5 3h1v5h-1V4zm0 7h1v1h-1v-1z" fill="#dc2626" />
            </svg>
            <span style={{ fontSize: "13px", fontWeight: 700, color: "#dc2626" }}>
              {comparison.student_declines.length}{" "}
              {comparison.student_declines.length === 1 ? "student" : "students"} dropped 10+ percentage points
            </span>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Student", "Previous", "Current", "Change"].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "8px 20px",
                      textAlign: "left",
                      fontWeight: 500,
                      fontSize: "11px",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparison.student_declines.map((s, i) => (
                <tr
                  key={s.student_name}
                  className="student-row"
                  style={{
                    borderBottom: i < comparison.student_declines.length - 1 ? "1px solid var(--border)" : undefined,
                  }}
                >
                  <td style={{ padding: "10px 20px", fontWeight: 500, color: "var(--text-primary)" }}>
                    {s.student_name}
                  </td>
                  <td style={{ padding: "10px 20px", fontVariantNumeric: "tabular-nums", color: "var(--text-secondary)" }}>
                    {s.previous_pct.toFixed(0)}%
                  </td>
                  <td style={{ padding: "10px 20px", fontWeight: 600, fontVariantNumeric: "tabular-nums", color: ragColor(s.current_pct) }}>
                    {s.current_pct.toFixed(0)}%
                  </td>
                  <td style={{ padding: "10px 20px", fontWeight: 700, fontVariantNumeric: "tabular-nums", color: "#dc2626" }}>
                    {s.change.toFixed(0)}%
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ display: "inline", marginLeft: "4px", verticalAlign: "middle" }}>
                      <path d="M6 2v8M3 7l3 3 3-3" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <h2
      style={{
        fontSize: "15px",
        fontWeight: 700,
        color: "var(--text-primary)",
        marginBottom: "10px",
      }}
    >
      {title}
    </h2>
  );
}

function ExportButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="btn-secondary"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "8px 16px",
        borderRadius: "9999px",
        border: "1px solid var(--border)",
        backgroundColor: "var(--surface)",
        color: "var(--text-secondary)",
        fontSize: "13px",
        fontWeight: 600,
        cursor: "pointer",
      }}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M7 1v9M3 7l4 4 4-4M2 12h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {label}
    </button>
  );
}
