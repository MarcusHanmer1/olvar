"use client";

import { useState, useCallback } from "react";

// ─── Types ──────────────────────────────────────────────────────────────────

type QlaEntry = {
  topic: string;
  avg_percentage: number;
  students_below_40: number;
};

type Question = {
  number: number;
  question: string;
  marks: number;
  topic: string;
};

type MarkSchemeEntry = {
  number: number;
  marks_breakdown: string;
  answer: string;
  common_misconceptions: string;
};

type GeneratedSet = {
  id: string | null;
  questions: Question[];
  mark_scheme: MarkSchemeEntry[];
  total_marks: number;
  created_at: string;
};

type HistoryEntry = {
  id: string;
  topics: string[];
  questions_data: {
    questions: Question[];
    mark_scheme: MarkSchemeEntry[];
    total_marks: number;
  };
  created_at: string;
};

interface Props {
  qla: QlaEntry[];
  classId: string;
  className: string;
  examBoard: string;
  tier: string;
  yearGroup: number;
  history?: HistoryEntry[];
  apiEndpoint?: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

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

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ─── PDF Generation ─────────────────────────────────────────────────────────

function generatePdf(
  questions: Question[],
  markScheme: MarkSchemeEntry[],
  totalMarks: number,
  className: string,
  topics: string[]
) {
  const today = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const topicLine = topics.join(", ");

  const questionsHtml = questions
    .map(
      (q) =>
        `<div style="margin-bottom:20px;">
          <p style="margin:0 0 6px 0;"><strong>${q.number}.</strong> ${q.question.replace(/\n/g, "<br/>")}</p>
          <p style="margin:0;text-align:right;color:#666;font-size:12px;">[${q.marks} mark${q.marks !== 1 ? "s" : ""}]</p>
          <div style="margin-top:8px;border-bottom:1px dotted #ccc;height:${Math.max(q.marks * 24, 48)}px;"></div>
        </div>`
    )
    .join("");

  const markSchemeHtml = markScheme
    .map(
      (ms) =>
        `<div style="margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid #e5e5e5;">
          <p style="margin:0 0 6px 0;font-weight:600;">Question ${ms.number}</p>
          <p style="margin:0 0 4px 0;font-size:13px;"><strong>Answer:</strong> ${ms.answer.replace(/\n/g, "<br/>")}</p>
          <p style="margin:0 0 4px 0;font-size:13px;white-space:pre-line;"><strong>Marks:</strong> ${ms.marks_breakdown.replace(/\\n/g, "\n")}</p>
          ${ms.common_misconceptions ? `<p style="margin:0;font-size:12px;color:#666;"><strong>Watch for:</strong> ${ms.common_misconceptions}</p>` : ""}
        </div>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Practice Questions — ${className}</title>
  <style>
    @media print { .page-break { page-break-before: always; } }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #1c1c1a; max-width: 700px; margin: 0 auto; padding: 40px 32px; }
    h1 { font-size: 20px; margin: 0 0 4px 0; }
    .meta { font-size: 13px; color: #6b6b67; margin-bottom: 24px; }
    .section-title { font-size: 16px; font-weight: 700; margin: 32px 0 16px 0; padding-bottom: 8px; border-bottom: 2px solid #1c1c1a; }
    .total { text-align: right; font-weight: 600; margin-top: 16px; font-size: 15px; }
  </style>
</head>
<body>
  <h1>${className} — Practice Questions</h1>
  <p class="meta">${today} · Focus: ${topicLine} · Total: ${totalMarks} marks</p>
  <div class="section-title">Questions</div>
  ${questionsHtml}
  <p class="total">Total: ${totalMarks} marks</p>

  <div class="page-break"></div>

  <h1>${className} — Mark Scheme</h1>
  <p class="meta">${today} · Focus: ${topicLine}</p>
  <div class="section-title">Mark Scheme</div>
  ${markSchemeHtml}
</body>
</html>`;

  const printWindow = window.open("", "_blank");
  if (!printWindow) return;
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => printWindow.print(), 300);
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function PracticeQuestions({
  qla,
  classId,
  className,
  examBoard,
  tier,
  yearGroup,
  history: initialHistory = [],
  apiEndpoint = "/api/v1/generate-questions",
}: Props) {
  // Sort QLA by weakest first
  const sorted = [...qla].sort((a, b) => a.avg_percentage - b.avg_percentage);

  // State
  const [mode, setMode] = useState<"idle" | "selecting" | "generating" | "viewing">("idle");
  const [selectedTopics, setSelectedTopics] = useState<Map<string, number>>(new Map());
  const [result, setResult] = useState<GeneratedSet | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>(initialHistory);

  // Open topic selector with 3 weakest pre-selected
  const openSelector = useCallback(() => {
    const initial = new Map<string, number>();
    sorted.slice(0, 3).forEach((t) => initial.set(t.topic, t.avg_percentage));
    setSelectedTopics(initial);
    setError(null);
    setMode("selecting");
  }, [sorted]);

  // Toggle a topic
  function toggleTopic(topic: string, pct: number) {
    setSelectedTopics((prev) => {
      const next = new Map(prev);
      if (next.has(topic)) {
        next.delete(topic);
      } else {
        next.set(topic, pct);
      }
      return next;
    });
  }

  // Generate questions
  async function handleGenerate() {
    if (selectedTopics.size === 0) return;

    const topics = Array.from(selectedTopics.entries()).map(([topic, avg_percentage]) => ({
      topic,
      avg_percentage,
    }));

    setMode("generating");
    setError(null);

    try {
      const res = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId,
          topics,
          examBoard,
          tier,
          yearGroup,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to generate questions. Please try again.");
        setMode("selecting");
        return;
      }

      const data = await res.json();
      setResult({
        id: data.id,
        questions: data.questions,
        mark_scheme: data.mark_scheme,
        total_marks: data.total_marks,
        created_at: data.created_at,
      });

      // Add to history
      if (data.id) {
        setHistory((prev) => [
          {
            id: data.id,
            topics: topics.map((t) => t.topic),
            questions_data: {
              questions: data.questions,
              mark_scheme: data.mark_scheme,
              total_marks: data.total_marks,
            },
            created_at: data.created_at,
          },
          ...prev,
        ]);
      }

      setMode("viewing");
    } catch {
      setError("Network error. Please try again.");
      setMode("selecting");
    }
  }

  // View a historical set
  function viewHistoryEntry(entry: HistoryEntry) {
    setResult({
      id: entry.id,
      questions: entry.questions_data.questions,
      mark_scheme: entry.questions_data.mark_scheme,
      total_marks: entry.questions_data.total_marks,
      created_at: entry.created_at,
    });
    setMode("viewing");
  }

  const generatingTopics = Array.from(selectedTopics.keys()).join(", ");

  return (
    <div>
      {/* ── Idle: CTA + History ── */}
      {mode === "idle" && (
        <div>
          <div
            style={{
              borderRadius: "16px",
              border: "1px solid var(--summary-border)",
              background: "var(--summary-bg)",
              padding: "20px 24px",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  backgroundColor: "#0d9488",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path
                    d="M9 1.5L10.8 5.1L14.5 5.4L11.6 8.1L12.4 12L9 10.2L5.6 12L6.4 8.1L3.5 5.4L7.2 5.1L9 1.5Z"
                    stroke="#ffffff"
                    strokeWidth="1.3"
                    strokeLinejoin="round"
                    fill="rgba(255,255,255,0.25)"
                  />
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <p
                  style={{
                    fontSize: "15px",
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    margin: "0 0 4px 0",
                  }}
                >
                  Generate practice questions
                </p>
                <p
                  style={{
                    fontSize: "13px",
                    color: "var(--text-secondary)",
                    margin: "0 0 14px 0",
                    lineHeight: 1.5,
                  }}
                >
                  Olvar can generate practice questions targeting your class&apos;s weakest
                  topics — ready to print and hand out.
                </p>
                <button
                  onClick={openSelector}
                  className="btn-primary"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "9px 20px",
                    borderRadius: "9999px",
                    fontSize: "13px",
                    fontWeight: 700,
                    backgroundColor: "#0d9488",
                    color: "#ffffff",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path
                      d="M7 1.5L8.4 4.2L11.5 4.5L9.1 6.7L9.7 9.8L7 8.4L4.3 9.8L4.9 6.7L2.5 4.5L5.6 4.2L7 1.5Z"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      strokeLinejoin="round"
                      fill="rgba(255,255,255,0.2)"
                    />
                  </svg>
                  Generate questions
                </button>
              </div>
            </div>
          </div>

          {/* History */}
          {history.length > 0 && (
            <div style={{ marginTop: "16px" }}>
              <p
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                  marginBottom: "8px",
                }}
              >
                Previously generated
              </p>
              <div
                style={{
                  borderRadius: "12px",
                  border: "1px solid var(--border)",
                  backgroundColor: "var(--surface)",
                  overflow: "hidden",
                }}
              >
                {history.map((entry, i) => (
                  <button
                    key={entry.id}
                    onClick={() => viewHistoryEntry(entry)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      width: "100%",
                      padding: "10px 16px",
                      border: "none",
                      borderBottom:
                        i < history.length - 1 ? "1px solid var(--border)" : undefined,
                      backgroundColor: "var(--surface)",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "background-color 0.1s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = "var(--surface-hover)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = "var(--surface)")
                    }
                  >
                    <div>
                      <span
                        style={{
                          fontSize: "13px",
                          fontWeight: 500,
                          color: "var(--text-primary)",
                        }}
                      >
                        {entry.topics.join(", ")}
                      </span>
                      <span
                        style={{
                          fontSize: "12px",
                          color: "var(--text-secondary)",
                          marginLeft: "8px",
                        }}
                      >
                        {formatDate(entry.created_at)}
                      </span>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path
                        d="M5 3l4 4-4 4"
                        stroke="var(--text-secondary)"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Topic Selection ── */}
      {mode === "selecting" && (
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
              padding: "16px 20px",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <p
              style={{
                fontSize: "15px",
                fontWeight: 600,
                color: "var(--text-primary)",
                margin: "0 0 4px 0",
              }}
            >
              Select topics to target
            </p>
            <p
              style={{
                fontSize: "13px",
                color: "var(--text-secondary)",
                margin: 0,
              }}
            >
              We&apos;ve selected the 3 weakest topics. Adjust if needed.
            </p>
          </div>

          <div>
            {sorted.map((t, i) => {
              const isSelected = selectedTopics.has(t.topic);
              return (
                <button
                  key={t.topic}
                  onClick={() => toggleTopic(t.topic, t.avg_percentage)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    width: "100%",
                    padding: "10px 20px",
                    border: "none",
                    borderBottom:
                      i < sorted.length - 1 ? "1px solid var(--border)" : undefined,
                    backgroundColor: isSelected ? "var(--accent-light)" : "var(--surface)",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "background-color 0.1s",
                  }}
                >
                  {/* Checkbox */}
                  <div
                    style={{
                      width: "18px",
                      height: "18px",
                      borderRadius: "4px",
                      border: isSelected
                        ? "2px solid #0d9488"
                        : "2px solid var(--border-strong)",
                      backgroundColor: isSelected ? "#0d9488" : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      transition: "all 0.1s",
                    }}
                  >
                    {isSelected && (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path
                          d="M2.5 6l2.5 2.5 5-5"
                          stroke="#fff"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>

                  {/* Topic name */}
                  <span
                    style={{
                      flex: 1,
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "var(--text-primary)",
                    }}
                  >
                    {t.topic}
                  </span>

                  {/* Percentage badge */}
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      fontVariantNumeric: "tabular-nums",
                      padding: "2px 8px",
                      borderRadius: "6px",
                      backgroundColor: ragBg(t.avg_percentage),
                      color: ragColor(t.avg_percentage),
                    }}
                  >
                    {t.avg_percentage.toFixed(0)}%
                  </span>
                </button>
              );
            })}
          </div>

          {/* Error */}
          {error && (
            <div
              style={{
                margin: "0 20px 12px 20px",
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

          {/* Actions */}
          <div
            style={{
              padding: "12px 20px",
              borderTop: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <button
              onClick={() => setMode("idle")}
              className="btn-secondary"
              style={{
                padding: "8px 16px",
                borderRadius: "9999px",
                fontSize: "13px",
                fontWeight: 600,
                border: "1px solid var(--border)",
                backgroundColor: "var(--surface)",
                color: "var(--text-secondary)",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              disabled={selectedTopics.size === 0}
              className="btn-primary"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 20px",
                borderRadius: "9999px",
                fontSize: "13px",
                fontWeight: 700,
                backgroundColor: "#0d9488",
                color: "#ffffff",
                border: "none",
                cursor: selectedTopics.size > 0 ? "pointer" : "not-allowed",
                opacity: selectedTopics.size > 0 ? 1 : 0.5,
              }}
            >
              Generate {selectedTopics.size} topic{selectedTopics.size !== 1 ? "s" : ""}
            </button>
          </div>
        </div>
      )}

      {/* ── Generating ── */}
      {mode === "generating" && (
        <div
          style={{
            borderRadius: "16px",
            border: "1px solid var(--border)",
            backgroundColor: "var(--surface)",
            padding: "48px 24px",
            textAlign: "center",
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
              margin: "0 auto 16px",
            }}
          />
          <p
            style={{
              fontSize: "15px",
              fontWeight: 600,
              color: "var(--text-primary)",
              margin: "0 0 4px 0",
            }}
          >
            Olvar is writing practice questions...
          </p>
          <p
            style={{
              fontSize: "13px",
              color: "var(--text-secondary)",
              margin: 0,
            }}
          >
            Targeting {generatingTopics}
          </p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* ── Viewing Results ── */}
      {mode === "viewing" && result && (
        <div>
          {/* Actions bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "16px",
            }}
          >
            <button
              onClick={() => {
                setResult(null);
                setMode("idle");
              }}
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
              Back
            </button>
            <button
              onClick={() =>
                generatePdf(
                  result.questions,
                  result.mark_scheme,
                  result.total_marks,
                  className,
                  result.questions.map((q) => q.topic).filter((v, i, a) => a.indexOf(v) === i)
                )
              }
              className="btn-primary"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 18px",
                borderRadius: "9999px",
                fontSize: "13px",
                fontWeight: 700,
                backgroundColor: "#0d9488",
                color: "#ffffff",
                border: "none",
                cursor: "pointer",
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
              Download as PDF
            </button>
          </div>

          {/* Questions */}
          <div
            style={{
              borderRadius: "16px",
              border: "1px solid var(--border)",
              backgroundColor: "var(--surface)",
              overflow: "hidden",
              marginBottom: "24px",
            }}
          >
            <div
              style={{
                padding: "14px 20px",
                borderBottom: "1px solid var(--border)",
                backgroundColor: "var(--surface-secondary)",
              }}
            >
              <h3
                style={{
                  fontSize: "15px",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  margin: 0,
                }}
              >
                Questions
              </h3>
              <p
                style={{
                  fontSize: "12px",
                  color: "var(--text-secondary)",
                  margin: "2px 0 0 0",
                }}
              >
                {result.questions.length} questions · {result.total_marks} marks
              </p>
            </div>

            {result.questions.map((q, i) => (
              <div
                key={q.number}
                style={{
                  padding: "14px 20px",
                  borderBottom:
                    i < result.questions.length - 1
                      ? "1px solid var(--border)"
                      : undefined,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "12px",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <p
                      style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "var(--text-primary)",
                        margin: "0 0 6px 0",
                      }}
                    >
                      {q.number}.
                    </p>
                    <p
                      style={{
                        fontSize: "14px",
                        lineHeight: 1.65,
                        color: "var(--text-primary)",
                        margin: 0,
                        whiteSpace: "pre-line",
                      }}
                    >
                      {q.question}
                    </p>
                  </div>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 500,
                      color: "var(--text-secondary)",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                      marginTop: "2px",
                    }}
                  >
                    [{q.marks} mark{q.marks !== 1 ? "s" : ""}]
                  </span>
                </div>
                <span
                  className="topic-tag"
                  style={{
                    display: "inline-block",
                    marginTop: "8px",
                  }}
                >
                  {q.topic}
                </span>
              </div>
            ))}
          </div>

          {/* Mark Scheme */}
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
                padding: "14px 20px",
                borderBottom: "1px solid var(--border)",
                backgroundColor: "var(--surface-secondary)",
              }}
            >
              <h3
                style={{
                  fontSize: "15px",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  margin: 0,
                }}
              >
                Mark Scheme
              </h3>
            </div>

            {result.mark_scheme.map((ms, i) => (
              <div
                key={ms.number}
                style={{
                  padding: "14px 20px",
                  borderBottom:
                    i < result.mark_scheme.length - 1
                      ? "1px solid var(--border)"
                      : undefined,
                }}
              >
                <p
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    margin: "0 0 6px 0",
                  }}
                >
                  Question {ms.number}
                </p>
                <p
                  style={{
                    fontSize: "13px",
                    lineHeight: 1.6,
                    color: "var(--text-primary)",
                    margin: "0 0 6px 0",
                  }}
                >
                  <strong>Answer:</strong> {ms.answer}
                </p>
                <p
                  style={{
                    fontSize: "13px",
                    lineHeight: 1.6,
                    color: "var(--text-primary)",
                    margin: "0 0 6px 0",
                    whiteSpace: "pre-line",
                  }}
                >
                  <strong>Marks:</strong>{" "}
                  {ms.marks_breakdown.replace(/\\n/g, "\n")}
                </p>
                {ms.common_misconceptions && (
                  <p
                    style={{
                      fontSize: "12px",
                      color: "var(--text-secondary)",
                      margin: 0,
                      fontStyle: "italic",
                    }}
                  >
                    Watch for: {ms.common_misconceptions}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
