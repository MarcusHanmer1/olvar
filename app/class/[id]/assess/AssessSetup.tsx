"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import topicsData from "@/data/gcse-topics.json";
import {
  saveTemplate,
  deleteTemplate,
  type Template,
  type TemplateQuestion,
} from "./template-actions";

type TopicEntry = { id: string; label: string; strand: string; tier: string; subtopics: string[] };
const TOPICS: TopicEntry[] = topicsData;

type QRow = { id: string; max_marks: number; topic: string };

export type SetupQuestion = {
  id: string;
  number: number;
  max_marks: number;
  topic: string;
};

interface Props {
  templates: Template[];
  onStart: (title: string, date: string, questions: SetupQuestion[]) => void;
}

// ── Topic combobox ────────────────────────────────────────────────────────────

function TopicCombobox({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? TOPICS.filter(
        (t) =>
          t.label.toLowerCase().includes(q) ||
          t.strand.toLowerCase().includes(q)
      )
    : TOPICS;
  const shown = filtered.slice(0, 10);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const pick = useCallback(
    (label: string) => {
      onChange(label);
      setQuery(label);
      setOpen(false);
      setHi(0);
    },
    [onChange]
  );

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) {
      if (e.key !== "Tab" && e.key !== "Escape") setOpen(true);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHi((h) => Math.min(h + 1, shown.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHi((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (shown[hi]) pick(shown[hi].label);
    } else if (e.key === "Escape" || e.key === "Tab") {
      setOpen(false);
    } else {
      setHi(0);
    }
  }

  return (
    <div ref={wrapRef} style={{ position: "relative", flex: 1, minWidth: 0, zIndex: open ? 50 : 0 }}>
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setHi(0);
        }}
        onFocus={(e) => {
          setOpen(true);
          e.target.style.borderColor = "#0d9488";
        }}
        onBlur={(e) => {
          e.target.style.borderColor = "var(--border)";
          setTimeout(() => setOpen(false), 120);
        }}
        onKeyDown={handleKeyDown}
        placeholder="Search topics…"
        autoComplete="off"
        style={{
          width: "100%",
          border: "1px solid var(--border)",
          borderRadius: "8px",
          padding: "5px 10px",
          fontSize: "13px",
          color: "var(--text-primary)",
          outline: "none",
          backgroundColor: "var(--surface)",
        }}
      />

      {open && shown.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            zIndex: 100,
            backgroundColor: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "10px",
            boxShadow: "var(--shadow-md)",
            overflow: "hidden",
            maxHeight: "240px",
            overflowY: "auto",
          }}
        >
          {shown.map((t, i) => (
            <div
              key={t.label}
              onMouseDown={() => pick(t.label)}
              style={{
                padding: "7px 12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer",
                backgroundColor: i === hi ? "var(--accent-light)" : "var(--surface)",
                color: "var(--text-primary)",
                fontSize: "13px",
                gap: "8px",
              }}
            >
              <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {t.label}
              </span>
              <span
                style={{
                  fontSize: "10px",
                  color: "var(--text-secondary)",
                  backgroundColor: "var(--surface-secondary)",
                  padding: "1px 6px",
                  borderRadius: "4px",
                  flexShrink: 0,
                }}
              >
                {t.strand}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main setup component ──────────────────────────────────────────────────────

export default function AssessSetup({ templates, onStart }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(today);
  const [questions, setQuestions] = useState<QRow[]>([
    { id: crypto.randomUUID(), max_marks: 5, topic: "" },
  ]);
  const [error, setError] = useState<string | null>(null);

  const [localTemplates, setLocalTemplates] = useState<Template[]>(templates);
  const [templateMenuOpen, setTemplateMenuOpen] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateSaving, setTemplateSaving] = useState(false);
  const [templateMsg, setTemplateMsg] = useState<string | null>(null);
  const templateMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (templateMenuRef.current && !templateMenuRef.current.contains(e.target as Node)) {
        setTemplateMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  function loadTemplate(t: Template) {
    setQuestions(t.questions.map((q) => ({ id: crypto.randomUUID(), max_marks: q.max_marks, topic: q.topic })));
    setTemplateMenuOpen(false);
    setError(null);
  }

  async function handleSaveTemplate() {
    if (!templateName.trim()) return;
    setTemplateSaving(true);
    setTemplateMsg(null);
    const tplQuestions: TemplateQuestion[] = questions.map((q) => ({ max_marks: q.max_marks, topic: q.topic }));
    const result = await saveTemplate(templateName.trim(), tplQuestions);
    setTemplateSaving(false);
    if (result.error) {
      setTemplateMsg(result.error);
    } else {
      setLocalTemplates((prev) => [{ id: crypto.randomUUID(), name: templateName.trim(), questions: tplQuestions }, ...prev]);
      setTemplateName("");
      setSaveModalOpen(false);
      setTemplateMsg("Template saved");
      setTimeout(() => setTemplateMsg(null), 2000);
    }
  }

  async function handleDeleteTemplate(id: string) {
    const result = await deleteTemplate(id);
    if (!result.error) setLocalTemplates((prev) => prev.filter((t) => t.id !== id));
  }

  function addQ() {
    setQuestions((qs) => [...qs, { id: crypto.randomUUID(), max_marks: 5, topic: "" }]);
  }

  function removeQ(id: string) {
    setQuestions((qs) => (qs.length > 1 ? qs.filter((q) => q.id !== id) : qs));
  }

  function updateQ(id: string, patch: Partial<QRow>) {
    setQuestions((qs) => qs.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  }

  function moveUp(i: number) {
    if (i === 0) return;
    setQuestions((qs) => { const n = [...qs]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; return n; });
  }

  function moveDown(i: number) {
    setQuestions((qs) => { if (i >= qs.length - 1) return qs; const n = [...qs]; [n[i], n[i + 1]] = [n[i + 1], n[i]]; return n; });
  }

  function handleStart() {
    if (!title.trim()) { setError("Assessment title is required."); return; }
    if (!date) { setError("Date is required."); return; }
    if (questions.some((q) => q.max_marks < 1)) { setError("All questions must have at least 1 mark."); return; }
    setError(null);
    onStart(title.trim(), date, questions.map((q, i) => ({ ...q, number: i + 1 })));
  }

  const totalMarks = questions.reduce((s, q) => s + q.max_marks, 0);

  const inputBase: React.CSSProperties = {
    border: "1px solid var(--border)",
    borderRadius: "8px",
    padding: "8px 12px",
    fontSize: "14px",
    color: "var(--text-primary)",
    outline: "none",
    backgroundColor: "var(--surface)",
    width: "100%",
  };

  return (
    <div style={{ maxWidth: "680px" }}>
      {/* Template bar */}
      {(localTemplates.length > 0 || templateMsg) && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          {localTemplates.length > 0 ? (
            <div ref={templateMenuRef} style={{ position: "relative" }}>
              <button
                onClick={() => setTemplateMenuOpen((o) => !o)}
                className="btn-secondary"
                style={{
                  display: "inline-flex", alignItems: "center", gap: "6px",
                  fontSize: "13px", fontWeight: 600, padding: "7px 14px", borderRadius: "9999px",
                  border: "1px solid var(--border)", color: "var(--text-secondary)", backgroundColor: "var(--surface)", cursor: "pointer",
                }}
              >
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <rect x="1" y="1" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.3" />
                  <path d="M4 4.5h5M4 6.5h5M4 8.5h3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
                </svg>
                Load template
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ marginLeft: "2px" }}>
                  <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {templateMenuOpen && (
                <div
                  style={{
                    position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 100,
                    backgroundColor: "var(--surface)", border: "1px solid var(--border)",
                    borderRadius: "10px", boxShadow: "var(--shadow-md)", overflow: "hidden",
                    minWidth: "240px", maxHeight: "280px", overflowY: "auto",
                  }}
                >
                  {localTemplates.map((t) => (
                    <div key={t.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", borderBottom: "1px solid var(--border)" }}>
                      <button
                        onMouseDown={() => loadTemplate(t)}
                        style={{ flex: 1, padding: "9px 14px", textAlign: "left", border: "none", backgroundColor: "transparent", cursor: "pointer", fontSize: "13px", color: "var(--text-primary)" }}
                        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "var(--accent-light)")}
                        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "transparent")}
                      >
                        <span style={{ fontWeight: 500 }}>{t.name}</span>
                        <span style={{ display: "block", fontSize: "11px", color: "var(--text-secondary)", marginTop: "1px" }}>
                          {t.questions.length} {t.questions.length === 1 ? "question" : "questions"} · {t.questions.reduce((s, q) => s + q.max_marks, 0)} marks
                        </span>
                      </button>
                      <button
                        onMouseDown={() => handleDeleteTemplate(t.id)}
                        title="Delete template"
                        className="btn-ghost"
                        style={{ width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", border: "none", backgroundColor: "transparent", color: "var(--text-secondary)", cursor: "pointer", marginRight: "8px", flexShrink: 0 }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#dc2626"; (e.currentTarget as HTMLElement).style.backgroundColor = "var(--rag-red-bg)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)"; (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}
                      >
                        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                          <path d="M1 1l9 9M10 1L1 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : <div />}

          {templateMsg && (
            <span style={{ fontSize: "12px", color: "#16a34a", fontWeight: 500 }}>{templateMsg}</span>
          )}
        </div>
      )}

      {/* Title + Date */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "16px", marginBottom: "28px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>Assessment title</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Mock Paper 1 · Non-Calculator" style={inputBase}
            onFocus={(e) => (e.target.style.borderColor = "#0d9488")} onBlur={(e) => (e.target.style.borderColor = "var(--border)")} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ ...inputBase, width: "148px" }}
            onFocus={(e) => (e.target.style.borderColor = "#0d9488")} onBlur={(e) => (e.target.style.borderColor = "var(--border)")} />
        </div>
      </div>

      {/* Questions */}
      <div style={{ marginBottom: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
          <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>Questions</span>
          <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
            {questions.length} {questions.length === 1 ? "question" : "questions"} · {totalMarks} {totalMarks === 1 ? "mark" : "marks"} total
          </span>
        </div>

        <div style={{ borderRadius: "12px", border: "1px solid var(--border)", backgroundColor: "var(--surface)" }}>
          {questions.map((q, i) => (
            <div key={q.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", borderBottom: i < questions.length - 1 ? "1px solid var(--border)" : undefined, position: "relative" }}>
              <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", width: "22px", flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>Q{i + 1}</span>

              <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Max</span>
                <input
                  type="number" min={1} max={99} value={q.max_marks}
                  onChange={(e) => updateQ(q.id, { max_marks: Math.max(1, parseInt(e.target.value) || 1) })}
                  style={{ width: "50px", border: "1px solid var(--border)", borderRadius: "6px", padding: "5px 6px", fontSize: "13px", textAlign: "center", color: "var(--text-primary)", outline: "none", backgroundColor: "var(--surface)" }}
                  onFocus={(e) => (e.target.style.borderColor = "#0d9488")} onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
                />
              </div>

              <TopicCombobox value={q.topic} onChange={(v) => updateQ(q.id, { topic: v })} />

              <div style={{ display: "flex", alignItems: "center", gap: "0px", flexShrink: 0 }}>
                <IconBtn title="Move up" disabled={i === 0} onClick={() => moveUp(i)}>
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M1.5 7.5L5.5 3.5L9.5 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </IconBtn>
                <IconBtn title="Move down" disabled={i === questions.length - 1} onClick={() => moveDown(i)}>
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M1.5 3.5L5.5 7.5L9.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </IconBtn>
                <IconBtn title="Remove question" disabled={questions.length === 1} onClick={() => removeQ(q.id)} danger>
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M1 1l9 9M10 1L1 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                </IconBtn>
              </div>
            </div>
          ))}
        </div>

        {/* Add question + Save as template */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "10px" }}>
          <button onClick={addQ} className="btn-secondary"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 600, padding: "7px 14px", borderRadius: "9999px", border: "1px solid var(--border)", color: "var(--text-secondary)", backgroundColor: "var(--surface)", cursor: "pointer" }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
            Add question
          </button>

          <button onClick={() => { setTemplateName(title || ""); setSaveModalOpen(true); }} className="btn-secondary"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 600, padding: "7px 14px", borderRadius: "9999px", border: "1px solid var(--border)", color: "var(--text-secondary)", backgroundColor: "var(--surface)", cursor: "pointer" }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M9 1H3a1 1 0 00-1 1v8a1 1 0 001 1h6a1 1 0 001-1V3.5L7.5 1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" /><path d="M7 1v3h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Save as template
          </button>
        </div>
      </div>

      {/* Save template modal */}
      {saveModalOpen && (
        <div className="modal-backdrop" onClick={() => !templateSaving && setSaveModalOpen(false)}>
          <div style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", boxShadow: "var(--shadow-md)", width: "100%", maxWidth: "400px", padding: "20px" }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 14px" }}>Save as template</h3>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: "0 0 12px" }}>
              Saves the current {questions.length} {questions.length === 1 ? "question" : "questions"} and their topic mappings.
            </p>
            <input type="text" value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="Template name, e.g. Paper 1 Non-Calc" autoFocus
              onKeyDown={(e) => { if (e.key === "Enter") handleSaveTemplate(); if (e.key === "Escape") setSaveModalOpen(false); }}
              style={{ ...inputBase, marginBottom: "16px" }}
              onFocus={(e) => (e.target.style.borderColor = "#0d9488")} onBlur={(e) => (e.target.style.borderColor = "var(--border)")} />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <button onClick={() => setSaveModalOpen(false)} disabled={templateSaving} className="btn-secondary"
                style={{ padding: "7px 16px", borderRadius: "9999px", fontSize: "13px", fontWeight: 600, border: "1px solid var(--border)", color: "var(--text-secondary)", backgroundColor: "var(--surface)", cursor: "pointer" }}>
                Cancel
              </button>
              <button onClick={handleSaveTemplate} disabled={templateSaving || !templateName.trim()} className="btn-primary"
                style={{ padding: "7px 16px", borderRadius: "9999px", fontSize: "13px", fontWeight: 700, border: "none", backgroundColor: "#0d9488", color: "#ffffff", cursor: templateSaving || !templateName.trim() ? "not-allowed" : "pointer", opacity: templateSaving || !templateName.trim() ? 0.6 : 1 }}>
                {templateSaving ? "Saving…" : "Save template"}
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div style={{ marginTop: "16px", padding: "10px 14px", borderRadius: "12px", fontSize: "13px", color: "#dc2626", backgroundColor: "var(--rag-red-bg)", border: "1px solid #fecaca" }}>
          {error}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "24px" }}>
        <button onClick={handleStart} className="btn-primary"
          style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "10px 22px", borderRadius: "9999px", fontSize: "14px", fontWeight: 700, backgroundColor: "#0d9488", color: "#ffffff", border: "none", cursor: "pointer" }}>
          Start entering marks
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      </div>
    </div>
  );
}

// ── Small icon button helper ──────────────────────────────────────────────────

function IconBtn({ children, onClick, disabled, title, danger }: {
  children: React.ReactNode; onClick: () => void; disabled?: boolean; title?: string; danger?: boolean;
}) {
  return (
    <button onClick={onClick} disabled={disabled} title={title}
      style={{ width: "26px", height: "26px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "9999px", border: "none", backgroundColor: "transparent", color: disabled ? "var(--border-strong)" : "var(--text-secondary)", cursor: disabled ? "not-allowed" : "pointer", flexShrink: 0 }}
      onMouseEnter={(e) => { if (disabled) return; (e.currentTarget as HTMLElement).style.backgroundColor = danger ? "var(--rag-red-bg)" : "var(--surface-secondary)"; (e.currentTarget as HTMLElement).style.color = danger ? "#dc2626" : "var(--text-primary)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; (e.currentTarget as HTMLElement).style.color = disabled ? "var(--border-strong)" : "var(--text-secondary)"; }}
    >
      {children}
    </button>
  );
}
