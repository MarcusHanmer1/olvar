"use client";

import { useState, useCallback } from "react";

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
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ragColor(pct: number): string {
  if (pct >= 70) return "#16a34a";
  if (pct >= 40) return "#d97706";
  return "#dc2626";
}

function ragBg(pct: number): string {
  if (pct >= 70) return "#f0fdf4";
  if (pct >= 40) return "#fffbeb";
  return "#fef2f2";
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
}: Props) {
  // Sort QLA weakest to strongest
  const sortedQla = [...qla].sort(
    (a, b) => a.avg_percentage - b.avg_percentage
  );

  // Feedback accordion state
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

  // CSV exports
  function exportQla() {
    const header = "Topic,Avg %,Students Below 40%\n";
    const rows = sortedQla
      .map(
        (q) =>
          `${escapeCsv(q.topic)},${q.avg_percentage.toFixed(1)},${q.students_below_40}`
      )
      .join("\n");
    downloadCsv(`QLA — ${assessmentTitle}.csv`, header + rows);
  }

  function exportFeedback() {
    const header = "Student,WWW,EBI\n";
    const rows = feedback
      .map(
        (f) =>
          `${escapeCsv(f.student_name)},${escapeCsv(f.www)},${escapeCsv(f.ebi)}`
      )
      .join("\n");
    downloadCsv(`Feedback — ${assessmentTitle}.csv`, header + rows);
  }

  function exportInterventions() {
    const header = "Student,Target Grade,Current %,Weakest Topics\n";
    const rows = interventions
      .map(
        (i) =>
          `${escapeCsv(i.student_name)},${i.target_grade},${i.current_percentage.toFixed(1)},${escapeCsv(i.weakest_topics.join("; "))}`
      )
      .join("\n");
    downloadCsv(`Interventions — ${assessmentTitle}.csv`, header + rows);
  }

  // Max percentage for bar chart scaling
  const maxPct = Math.max(...sortedQla.map((q) => q.avg_percentage), 1);
  const barScale = Math.min(100, Math.max(maxPct, 50));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
      {/* ── Class summary ──────────────────────────────────────────────────── */}
      <div
        style={{
          padding: "16px 20px",
          borderRadius: "10px",
          backgroundColor: "#f0fdfa",
          border: "1px solid #ccfbf1",
          fontSize: "14px",
          lineHeight: 1.65,
          color: "#1c1c1a",
        }}
      >
        {classSummary}
      </div>

      {/* ── QLA Overview ───────────────────────────────────────────────────── */}
      <section>
        <SectionHeader title="Question Level Analysis" />
        <div
          style={{
            borderRadius: "12px",
            border: "1px solid #e5e5e4",
            backgroundColor: "#ffffff",
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
                borderBottom:
                  i < sortedQla.length - 1
                    ? "1px solid #f0f0ef"
                    : undefined,
              }}
            >
              {/* Topic name */}
              <span
                style={{
                  width: "200px",
                  flexShrink: 0,
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "#1c1c1a",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                title={q.topic}
              >
                {q.topic}
              </span>

              {/* Bar */}
              <div
                style={{
                  flex: 1,
                  height: "22px",
                  borderRadius: "4px",
                  backgroundColor: "#f4f4f3",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${(q.avg_percentage / barScale) * 100}%`,
                    borderRadius: "4px",
                    backgroundColor: ragBg(q.avg_percentage),
                    border: `1px solid ${ragColor(q.avg_percentage)}30`,
                    transition: "width 0.3s ease",
                  }}
                />
              </div>

              {/* Percentage */}
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

              {/* Students below 40% */}
              {q.students_below_40 > 0 && (
                <span
                  style={{
                    fontSize: "11px",
                    padding: "2px 8px",
                    borderRadius: "6px",
                    backgroundColor: "#fef2f2",
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

      {/* ── Student Feedback ───────────────────────────────────────────────── */}
      <section>
        <SectionHeader title="Student Feedback" />
        <div
          style={{
            borderRadius: "12px",
            border: "1px solid #e5e5e4",
            backgroundColor: "#ffffff",
            overflow: "hidden",
          }}
        >
          {feedback.map((f, i) => {
            const isOpen = openStudent === f.student_name;
            return (
              <div
                key={f.student_name}
                style={{
                  borderBottom:
                    i < feedback.length - 1
                      ? "1px solid #f0f0ef"
                      : undefined,
                }}
              >
                {/* Header row */}
                <button
                  onClick={() =>
                    setOpenStudent(isOpen ? null : f.student_name)
                  }
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",
                    padding: "12px 18px",
                    border: "none",
                    backgroundColor: isOpen ? "#fafaf9" : "#ffffff",
                    cursor: "pointer",
                    textAlign: "left",
                    color: "#1c1c1a",
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
                      transform: isOpen
                        ? "rotate(180deg)"
                        : "rotate(0deg)",
                      transition: "transform 0.15s ease",
                      flexShrink: 0,
                    }}
                  >
                    <path
                      d="M3 5l4 4 4-4"
                      stroke="#6b6b67"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>

                {/* Expanded content */}
                {isOpen && (
                  <div style={{ padding: "0 18px 16px 18px" }}>
                    {/* WWW */}
                    <div style={{ marginBottom: "14px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          marginBottom: "6px",
                        }}
                      >
                        <span
                          style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            backgroundColor: "#16a34a",
                            flexShrink: 0,
                          }}
                        />
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.04em",
                            color: "#16a34a",
                          }}
                        >
                          What went well
                        </span>
                      </div>
                      <p
                        style={{
                          fontSize: "13px",
                          lineHeight: 1.65,
                          color: "#1c1c1a",
                          margin: 0,
                          paddingLeft: "14px",
                        }}
                      >
                        {f.www}
                      </p>
                    </div>

                    {/* EBI */}
                    <div style={{ marginBottom: "14px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          marginBottom: "6px",
                        }}
                      >
                        <span
                          style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            backgroundColor: "#d97706",
                            flexShrink: 0,
                          }}
                        />
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.04em",
                            color: "#d97706",
                          }}
                        >
                          Even better if
                        </span>
                      </div>
                      <p
                        style={{
                          fontSize: "13px",
                          lineHeight: 1.65,
                          color: "#1c1c1a",
                          margin: 0,
                          paddingLeft: "14px",
                        }}
                      >
                        {f.ebi}
                      </p>
                    </div>

                    {/* Copy button */}
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <button
                        onClick={() => copyFeedback(f)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          fontSize: "12px",
                          fontWeight: 500,
                          color:
                            copiedName === f.student_name
                              ? "#16a34a"
                              : "#6b6b67",
                          backgroundColor: "transparent",
                          border: "1px solid #e5e5e4",
                          borderRadius: "6px",
                          padding: "5px 10px",
                          cursor: "pointer",
                        }}
                      >
                        {copiedName === f.student_name ? (
                          <>
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 12 12"
                              fill="none"
                            >
                              <path
                                d="M2 6l3 3 5-5"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                            Copied
                          </>
                        ) : (
                          <>
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 12 12"
                              fill="none"
                            >
                              <rect
                                x="3.5"
                                y="3.5"
                                width="7"
                                height="7"
                                rx="1.5"
                                stroke="currentColor"
                                strokeWidth="1.2"
                              />
                              <path
                                d="M8.5 3.5V2a1.5 1.5 0 00-1.5-1.5H2A1.5 1.5 0 00.5 2v5A1.5 1.5 0 002 8.5h1.5"
                                stroke="currentColor"
                                strokeWidth="1.2"
                              />
                            </svg>
                            Copy feedback
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Intervention List ──────────────────────────────────────────────── */}
      {interventions.length > 0 && (
        <section>
          <SectionHeader title="Intervention List" />
          <div
            style={{
              borderRadius: "12px",
              border: "1px solid #e5e5e4",
              backgroundColor: "#ffffff",
              overflow: "hidden",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "13px",
              }}
            >
              <thead>
                <tr style={{ borderBottom: "2px solid #e5e5e4" }}>
                  {["Student", "Target", "Current", "Gap", "Weakest topics"].map(
                    (h) => (
                      <th
                        key={h}
                        style={{
                          padding: "10px 16px",
                          textAlign: "left",
                          fontWeight: 500,
                          fontSize: "11px",
                          color: "#6b6b67",
                          backgroundColor: "#fafaf9",
                        }}
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {interventions.map((entry, i) => {
                  // Simple grade-to-percentage mapping for gap calculation
                  const gradeThreshold = entry.target_grade * 10 + 5; // rough: grade 7 ≈ 75%
                  const gap = entry.current_percentage - gradeThreshold;

                  return (
                    <tr
                      key={entry.student_name}
                      className="student-row"
                      style={{
                        borderBottom:
                          i < interventions.length - 1
                            ? "1px solid #f0f0ef"
                            : undefined,
                      }}
                    >
                      <td
                        style={{
                          padding: "10px 16px",
                          fontWeight: 500,
                          color: "#1c1c1a",
                        }}
                      >
                        {entry.student_name}
                      </td>
                      <td
                        style={{
                          padding: "10px 16px",
                          fontVariantNumeric: "tabular-nums",
                          color: "#1c1c1a",
                        }}
                      >
                        {entry.target_grade}
                      </td>
                      <td
                        style={{
                          padding: "10px 16px",
                          fontWeight: 600,
                          fontVariantNumeric: "tabular-nums",
                          color: ragColor(entry.current_percentage),
                        }}
                      >
                        {entry.current_percentage.toFixed(0)}%
                      </td>
                      <td
                        style={{
                          padding: "10px 16px",
                          fontWeight: 600,
                          fontVariantNumeric: "tabular-nums",
                          color: gap < 0 ? "#dc2626" : "#16a34a",
                        }}
                      >
                        {gap > 0 ? "+" : ""}
                        {gap.toFixed(0)}%
                      </td>
                      <td style={{ padding: "10px 16px" }}>
                        <div
                          style={{
                            display: "flex",
                            gap: "6px",
                            flexWrap: "wrap",
                          }}
                        >
                          {entry.weakest_topics.map((t) => (
                            <span
                              key={t}
                              style={{
                                fontSize: "11px",
                                padding: "2px 8px",
                                borderRadius: "5px",
                                backgroundColor: "#fef2f2",
                                color: "#dc2626",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {t}
                            </span>
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

      {/* ── Exports ────────────────────────────────────────────────────────── */}
      <section>
        <SectionHeader title="Export" />
        <div
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          <ExportButton label="QLA (CSV)" onClick={exportQla} />
          <ExportButton label="Feedback (CSV)" onClick={exportFeedback} />
          {interventions.length > 0 && (
            <ExportButton
              label="Interventions (CSV)"
              onClick={exportInterventions}
            />
          )}
        </div>
      </section>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <h2
      style={{
        fontSize: "14px",
        fontWeight: 600,
        color: "#1c1c1a",
        marginBottom: "10px",
      }}
    >
      {title}
    </h2>
  );
}

function ExportButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "8px 16px",
        borderRadius: "8px",
        border: "1px solid #e5e5e4",
        backgroundColor: "#ffffff",
        color: "#6b6b67",
        fontSize: "13px",
        fontWeight: 500,
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "#0d9488";
        (e.currentTarget as HTMLElement).style.color = "#0d9488";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "#e5e5e4";
        (e.currentTarget as HTMLElement).style.color = "#6b6b67";
      }}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path
          d="M7 1v9M3 7l4 4 4-4M2 12h10"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {label}
    </button>
  );
}
