"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import topicsData from "@/data/gcse-topics.json";

type TopicEntry = { label: string; strand: string };
const TOPICS: TopicEntry[] = topicsData;

type QRow = { id: string; max_marks: number; topic: string };

export type SetupQuestion = {
  id: string;
  number: number;
  max_marks: number;
  topic: string;
};

interface Props {
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

  // Keep query in sync if parent resets value
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

  // Close on outside mousedown
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
    <div ref={wrapRef} style={{ position: "relative", flex: 1, minWidth: 0 }}>
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
          e.target.style.borderColor = "#e5e5e4";
          // Delay so onMouseDown on dropdown item fires first
          setTimeout(() => setOpen(false), 120);
        }}
        onKeyDown={handleKeyDown}
        placeholder="Search topics…"
        autoComplete="off"
        style={{
          width: "100%",
          border: "1px solid #e5e5e4",
          borderRadius: "6px",
          padding: "5px 10px",
          fontSize: "13px",
          color: "#1c1c1a",
          outline: "none",
          backgroundColor: "#ffffff",
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
            backgroundColor: "#ffffff",
            border: "1px solid #e5e5e4",
            borderRadius: "8px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
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
                backgroundColor: i === hi ? "#f0fdfa" : "#ffffff",
                color: "#1c1c1a",
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
                  color: "#6b6b67",
                  backgroundColor: "#f4f4f3",
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

export default function AssessSetup({ onStart }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(today);
  const [questions, setQuestions] = useState<QRow[]>([
    { id: crypto.randomUUID(), max_marks: 5, topic: "" },
  ]);
  const [error, setError] = useState<string | null>(null);

  function addQ() {
    setQuestions((qs) => [
      ...qs,
      { id: crypto.randomUUID(), max_marks: 5, topic: "" },
    ]);
  }

  function removeQ(id: string) {
    setQuestions((qs) => (qs.length > 1 ? qs.filter((q) => q.id !== id) : qs));
  }

  function updateQ(id: string, patch: Partial<QRow>) {
    setQuestions((qs) => qs.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  }

  function moveUp(i: number) {
    if (i === 0) return;
    setQuestions((qs) => {
      const n = [...qs];
      [n[i - 1], n[i]] = [n[i], n[i - 1]];
      return n;
    });
  }

  function moveDown(i: number) {
    setQuestions((qs) => {
      if (i >= qs.length - 1) return qs;
      const n = [...qs];
      [n[i], n[i + 1]] = [n[i + 1], n[i]];
      return n;
    });
  }

  function handleStart() {
    if (!title.trim()) {
      setError("Assessment title is required.");
      return;
    }
    if (!date) {
      setError("Date is required.");
      return;
    }
    if (questions.some((q) => q.max_marks < 1)) {
      setError("All questions must have at least 1 mark.");
      return;
    }
    setError(null);
    onStart(
      title.trim(),
      date,
      questions.map((q, i) => ({ ...q, number: i + 1 }))
    );
  }

  const totalMarks = questions.reduce((s, q) => s + q.max_marks, 0);

  const inputBase: React.CSSProperties = {
    border: "1px solid #e5e5e4",
    borderRadius: "8px",
    padding: "8px 12px",
    fontSize: "14px",
    color: "#1c1c1a",
    outline: "none",
    backgroundColor: "#ffffff",
    width: "100%",
  };

  return (
    <div style={{ maxWidth: "680px" }}>
      {/* Title + Date */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "16px", marginBottom: "28px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "12px", fontWeight: 500, color: "#1c1c1a" }}>
            Assessment title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Mock Paper 1 · Non-Calculator"
            style={inputBase}
            onFocus={(e) => (e.target.style.borderColor = "#0d9488")}
            onBlur={(e) => (e.target.style.borderColor = "#e5e5e4")}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "12px", fontWeight: 500, color: "#1c1c1a" }}>
            Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{ ...inputBase, width: "148px" }}
            onFocus={(e) => (e.target.style.borderColor = "#0d9488")}
            onBlur={(e) => (e.target.style.borderColor = "#e5e5e4")}
          />
        </div>
      </div>

      {/* Questions */}
      <div style={{ marginBottom: "8px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "10px",
          }}
        >
          <span style={{ fontSize: "12px", fontWeight: 500, color: "#1c1c1a" }}>
            Questions
          </span>
          <span style={{ fontSize: "12px", color: "#6b6b67" }}>
            {questions.length} {questions.length === 1 ? "question" : "questions"} ·{" "}
            {totalMarks} {totalMarks === 1 ? "mark" : "marks"} total
          </span>
        </div>

        <div
          style={{
            borderRadius: "10px",
            border: "1px solid #e5e5e4",
            overflow: "hidden",
            backgroundColor: "#ffffff",
          }}
        >
          {questions.map((q, i) => (
            <div
              key={q.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 14px",
                borderBottom:
                  i < questions.length - 1 ? "1px solid #f0f0ef" : undefined,
              }}
            >
              {/* Q number */}
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#6b6b67",
                  width: "22px",
                  flexShrink: 0,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                Q{i + 1}
              </span>

              {/* Max marks */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  flexShrink: 0,
                }}
              >
                <span style={{ fontSize: "12px", color: "#6b6b67" }}>Max</span>
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={q.max_marks}
                  onChange={(e) =>
                    updateQ(q.id, {
                      max_marks: Math.max(1, parseInt(e.target.value) || 1),
                    })
                  }
                  style={{
                    width: "50px",
                    border: "1px solid #e5e5e4",
                    borderRadius: "6px",
                    padding: "5px 6px",
                    fontSize: "13px",
                    textAlign: "center",
                    color: "#1c1c1a",
                    outline: "none",
                    backgroundColor: "#ffffff",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#0d9488")}
                  onBlur={(e) => (e.target.style.borderColor = "#e5e5e4")}
                />
              </div>

              {/* Topic combobox */}
              <TopicCombobox
                value={q.topic}
                onChange={(v) => updateQ(q.id, { topic: v })}
              />

              {/* Reorder + remove */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0px",
                  flexShrink: 0,
                }}
              >
                <IconBtn
                  title="Move up"
                  disabled={i === 0}
                  onClick={() => moveUp(i)}
                >
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                    <path
                      d="M1.5 7.5L5.5 3.5L9.5 7.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </IconBtn>
                <IconBtn
                  title="Move down"
                  disabled={i === questions.length - 1}
                  onClick={() => moveDown(i)}
                >
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                    <path
                      d="M1.5 3.5L5.5 7.5L9.5 3.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </IconBtn>
                <IconBtn
                  title="Remove question"
                  disabled={questions.length === 1}
                  onClick={() => removeQ(q.id)}
                  danger
                >
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                    <path
                      d="M1 1l9 9M10 1L1 10"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </IconBtn>
              </div>
            </div>
          ))}
        </div>

        {/* Add question */}
        <button
          onClick={addQ}
          style={{
            marginTop: "10px",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "13px",
            fontWeight: 500,
            padding: "7px 14px",
            borderRadius: "8px",
            border: "1px solid #e5e5e4",
            color: "#6b6b67",
            backgroundColor: "#ffffff",
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
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M6 1v10M1 6h10"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          Add question
        </button>
      </div>

      {error && (
        <div
          style={{
            marginTop: "16px",
            padding: "10px 14px",
            borderRadius: "8px",
            fontSize: "13px",
            color: "#dc2626",
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
          }}
        >
          {error}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "24px" }}>
        <button
          onClick={handleStart}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 22px",
            borderRadius: "10px",
            fontSize: "14px",
            fontWeight: 600,
            backgroundColor: "#0d9488",
            color: "#ffffff",
            border: "none",
            cursor: "pointer",
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLElement).style.backgroundColor = "#0f766e")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLElement).style.backgroundColor = "#0d9488")
          }
        >
          Start entering marks
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M3 7h8M7 3l4 4-4 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ── Small icon button helper ──────────────────────────────────────────────────

function IconBtn({
  children,
  onClick,
  disabled,
  title,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        width: "26px",
        height: "26px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "5px",
        border: "none",
        backgroundColor: "transparent",
        color: disabled ? "#d1d1cf" : "#6b6b67",
        cursor: disabled ? "not-allowed" : "pointer",
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        if (disabled) return;
        (e.currentTarget as HTMLElement).style.backgroundColor = danger
          ? "#fef2f2"
          : "#f4f4f3";
        (e.currentTarget as HTMLElement).style.color = danger
          ? "#dc2626"
          : "#1c1c1a";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
        (e.currentTarget as HTMLElement).style.color = disabled
          ? "#d1d1cf"
          : "#6b6b67";
      }}
    >
      {children}
    </button>
  );
}
