"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { saveAssessmentWithMarks } from "./actions";

export type GridQuestion = {
  id: string;
  number: number;
  max_marks: number;
  topic: string;
};

export type GridStudent = {
  id: string;
  name: string;
};

interface Props {
  classId: string;
  title: string;
  date: string;
  questions: GridQuestion[];
  students: GridStudent[];
  onBack: () => void;
}

// ─── Colour helpers ───────────────────────────────────────────────────────────

function cellColors(score: number, max: number): { bg: string; border: string } {
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

// ─── Component ────────────────────────────────────────────────────────────────

export default function MarkGrid({
  classId,
  title,
  date,
  questions,
  students,
  onBack,
}: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const nS = students.length;
  const nQ = questions.length;
  const maxPossible = questions.reduce((s, q) => s + q.max_marks, 0);

  const marks = useRef<(number | null)[][]>(
    Array.from({ length: nS }, () => Array<number | null>(nQ).fill(null))
  );

  const inputs = useRef<(HTMLInputElement | null)[][]>(
    Array.from({ length: nS }, () => Array<HTMLInputElement | null>(nQ).fill(null))
  );

  const totalSpans = useRef<(HTMLElement | null)[]>(Array<HTMLElement | null>(nS).fill(null));
  const avgSpans = useRef<(HTMLElement | null)[]>(Array<HTMLElement | null>(nQ).fill(null));

  function refreshTotal(si: number) {
    const row = marks.current[si];
    const hasAny = row.some((v) => v !== null);
    const total = hasAny ? row.reduce<number>((s, v) => s + (v ?? 0), 0) : null;
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
    const max = questions[qi].max_marks;
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
    const max = questions[qi].max_marks;
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

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>, si: number, qi: number) {
    const t = e.currentTarget;
    if (e.key === "Tab") {
      e.preventDefault();
      if (qi + 1 < nQ) inputs.current[si][qi + 1]?.focus();
      else if (si + 1 < nS) inputs.current[si + 1][0]?.focus();
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (si + 1 < nS) inputs.current[si + 1][qi]?.focus();
    } else if (e.key === "ArrowRight") {
      if (t.selectionStart === t.value.length) { e.preventDefault(); inputs.current[si]?.[qi + 1]?.focus(); }
    } else if (e.key === "ArrowLeft") {
      if (t.selectionStart === 0) { e.preventDefault(); inputs.current[si]?.[qi - 1]?.focus(); }
    } else if (e.key === "ArrowDown") {
      e.preventDefault(); inputs.current[si + 1]?.[qi]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault(); inputs.current[si - 1]?.[qi]?.focus();
    }
  }

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    setStatus("Saving marks…");

    const result = await saveAssessmentWithMarks({
      classId, title, date,
      questions: questions.map(({ number, max_marks, topic }) => ({ number, max_marks, topic })),
      marks: students.map((s, si) => ({ studentId: s.id, scores: marks.current[si] })),
    });

    if (result.error) { setSaving(false); setStatus(null); setSaveError(result.error); return; }

    setStatus("Analysing with AI — this may take a moment…");

    try {
      const res = await fetch("/api/analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assessmentId: result.assessmentId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setSaving(false); setStatus(null);
        setSaveError(data.error || "Analysis failed. Marks have been saved — you can retry later.");
        return;
      }
    } catch {
      setSaving(false); setStatus(null);
      setSaveError("Network error during analysis. Marks have been saved — you can retry later.");
      return;
    }

    router.push(`/class/${classId}/results/${result.assessmentId}`);
    router.refresh();
  }

  const CELL_W = 52;
  const NAME_W = 200;
  const TOTAL_W = 96;

  // Shared header cell bg
  const headerBg = "var(--surface-secondary)";

  return (
    <div>
      {/* Step header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <button onClick={onBack}
          style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--text-secondary)", backgroundColor: "transparent", border: "none", cursor: "pointer", padding: "4px 0" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-primary)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-secondary)")}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 3L5 7l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Edit questions
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {[
            { label: "≥70%", bg: "var(--rag-green-bg)", text: "#16a34a" },
            { label: "40–69%", bg: "var(--rag-amber-bg)", text: "#d97706" },
            { label: "<40%", bg: "var(--rag-red-bg)", text: "#dc2626" },
          ].map((l) => (
            <span key={l.label} style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "11px", color: l.text }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "2px", backgroundColor: l.bg, border: `1px solid ${l.text}40`, flexShrink: 0 }} />
              {l.label}
            </span>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div style={{ borderRadius: "16px", border: "1px solid var(--border)", backgroundColor: "var(--surface)", overflowX: "auto", overflowY: "visible" }}>
        <table style={{ borderCollapse: "collapse", tableLayout: "fixed", width: `${NAME_W + nQ * CELL_W + TOTAL_W}px`, minWidth: "100%", fontSize: "13px" }}>
          <colgroup>
            <col style={{ width: `${NAME_W}px` }} />
            {questions.map((q) => (<col key={q.id} style={{ width: `${CELL_W}px` }} />))}
            <col style={{ width: `${TOTAL_W}px` }} />
          </colgroup>

          <thead>
            {/* Topic abbreviations row */}
            <tr>
              <th style={{ padding: "6px 14px", borderBottom: "1px solid var(--border)", borderRight: "1px solid var(--border)", position: "sticky", left: 0, backgroundColor: headerBg, zIndex: 3 }} />
              {questions.map((q) => (
                <th key={q.id} title={q.topic}
                  style={{ padding: "5px 2px", borderBottom: "1px solid var(--border)", borderRight: "1px solid var(--border)", textAlign: "center", fontWeight: 400, fontSize: "10px", color: "var(--text-secondary)", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", backgroundColor: headerBg, maxWidth: `${CELL_W}px` }}>
                  {q.topic ? (q.topic.length > 9 ? q.topic.slice(0, 8) + "…" : q.topic) : ""}
                </th>
              ))}
              <th style={{ backgroundColor: headerBg, borderBottom: "1px solid var(--border)", position: "sticky", right: 0, zIndex: 3 }} />
            </tr>

            {/* Q number + /max row */}
            <tr>
              <th style={{ padding: "7px 14px", borderBottom: "2px solid var(--border)", borderRight: "1px solid var(--border)", textAlign: "left", fontWeight: 500, fontSize: "11px", color: "var(--text-secondary)", position: "sticky", left: 0, backgroundColor: headerBg, zIndex: 3 }}>
                Student
              </th>
              {questions.map((q) => (
                <th key={q.id} style={{ padding: "4px 2px", borderBottom: "2px solid var(--border)", borderRight: "1px solid var(--border)", textAlign: "center", backgroundColor: headerBg, lineHeight: 1.3 }}>
                  <span style={{ fontWeight: 700, fontSize: "12px", color: "var(--text-primary)" }}>Q{q.number}</span>
                  <br />
                  <span style={{ fontWeight: 400, fontSize: "10px", color: "var(--text-secondary)" }}>/{q.max_marks}</span>
                </th>
              ))}
              <th style={{ padding: "4px 8px", borderBottom: "2px solid var(--border)", borderLeft: "1px solid var(--border)", textAlign: "center", backgroundColor: headerBg, position: "sticky", right: 0, zIndex: 3, lineHeight: 1.3 }}>
                <span style={{ fontWeight: 700, fontSize: "12px", color: "var(--text-primary)" }}>Total</span>
                <br />
                <span style={{ fontWeight: 400, fontSize: "10px", color: "var(--text-secondary)" }}>/{maxPossible}</span>
              </th>
            </tr>
          </thead>

          <tbody>
            {students.map((s, si) => (
              <tr key={s.id} className="student-row">
                <td style={{ padding: "3px 14px", borderBottom: "1px solid var(--border)", borderRight: "1px solid var(--border)", fontWeight: 500, fontSize: "13px", color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", position: "sticky", left: 0, backgroundColor: "var(--surface)", zIndex: 1 }}>
                  {s.name}
                </td>

                {questions.map((q, qi) => (
                  <td key={q.id} style={{ padding: "2px", borderBottom: "1px solid var(--border)", borderRight: "1px solid var(--border)" }}>
                    <input
                      ref={(el) => { inputs.current[si][qi] = el; }}
                      type="number" min={0} max={q.max_marks} defaultValue=""
                      onChange={(e) => handleChange(si, qi, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, si, qi)}
                      onFocus={(e) => e.target.select()}
                      className="mark-cell-input"
                      style={{ display: "block", width: "100%", height: "34px", textAlign: "center", border: "1px solid var(--border)", borderRadius: "4px", outline: "none", fontFamily: "inherit", fontSize: "13px", fontVariantNumeric: "tabular-nums", backgroundColor: "transparent", color: "var(--text-primary)" }}
                    />
                  </td>
                ))}

                <td style={{ padding: "3px 10px", borderBottom: "1px solid var(--border)", borderLeft: "1px solid var(--border)", textAlign: "center", fontSize: "12px", fontVariantNumeric: "tabular-nums", position: "sticky", right: 0, backgroundColor: headerBg, zIndex: 1 }}>
                  <span ref={(el) => { totalSpans.current[si] = el; }} style={{ color: "var(--text-secondary)" }}>—</span>
                </td>
              </tr>
            ))}

            {/* Averages row */}
            <tr>
              <td style={{ padding: "7px 14px", borderTop: "2px solid var(--border)", borderRight: "1px solid var(--border)", fontWeight: 600, fontSize: "11px", color: "var(--text-secondary)", position: "sticky", left: 0, backgroundColor: headerBg, zIndex: 1 }}>
                Class avg
              </td>
              {questions.map((q, qi) => (
                <td key={q.id} style={{ padding: "7px 2px", borderTop: "2px solid var(--border)", borderRight: "1px solid var(--border)", textAlign: "center", backgroundColor: headerBg, fontSize: "12px", fontVariantNumeric: "tabular-nums" }}>
                  <span ref={(el) => { avgSpans.current[qi] = el; }} style={{ color: "var(--text-secondary)" }}>—</span>
                </td>
              ))}
              <td style={{ borderTop: "2px solid var(--border)", borderLeft: "1px solid var(--border)", backgroundColor: headerBg, position: "sticky", right: 0, zIndex: 1 }} />
            </tr>
          </tbody>
        </table>
      </div>

      {/* Save error */}
      {saveError && (
        <div style={{ marginTop: "16px", padding: "10px 14px", borderRadius: "12px", fontSize: "13px", color: "#dc2626", backgroundColor: "var(--rag-red-bg)", border: "1px solid #fecaca" }}>
          {saveError}
        </div>
      )}

      {/* Analyse button */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "24px" }}>
        <button onClick={handleSave} disabled={saving} className="btn-primary"
          style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "11px 28px", borderRadius: "9999px", fontSize: "15px", fontWeight: 700, backgroundColor: "#0d9488", color: "#ffffff", border: "none", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1, letterSpacing: "-0.01em" }}>
          {saving ? (
            status || "Saving…"
          ) : (
            <>
              <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
                <path d="M8.5 2L10 5.5L14 6L11 9l.7 4L8.5 11.5 5.3 13l.7-4L3 6l4-.5L8.5 2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" fill="rgba(255,255,255,0.2)" />
              </svg>
              Analyse
            </>
          )}
        </button>
      </div>
    </div>
  );
}
