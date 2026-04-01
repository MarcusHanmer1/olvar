"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { bulkAddStudents } from "./actions";

interface Props {
  classId: string;
}

type ParsedRow = { name: string; target_grade: number | null };

// ── Header matching ───────────────────────────────────────────────────────────

const NAME_PATTERNS = [
  "name", "student name", "student_name", "pupil name", "pupil_name",
  "student", "pupil", "full name", "full_name", "learner", "learner name",
];

const GRADE_PATTERNS = [
  "target", "target grade", "target_grade", "grade", "predicted grade",
  "predicted_grade", "predicted", "target (1-9)", "target grade (1-9)",
];

function matchCol(header: string, patterns: string[]): boolean {
  const h = header.trim().toLowerCase().replace(/[_\-]/g, " ");
  return patterns.some((p) => h === p);
}

function detectDelimiter(firstLine: string): string {
  const commas = (firstLine.match(/,/g) || []).length;
  const tabs = (firstLine.match(/\t/g) || []).length;
  const semis = (firstLine.match(/;/g) || []).length;
  if (tabs >= commas && tabs >= semis && tabs > 0) return "\t";
  if (semis > commas && semis > 0) return ";";
  return ",";
}

function parseCsvLine(line: string, delim: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === delim) {
        result.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
  }
  result.push(current.trim());
  return result;
}

function parseGrade(val: string): number | null {
  const n = parseInt(val.trim(), 10);
  if (Number.isNaN(n) || n < 1 || n > 9) return null;
  return n;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function CsvImportModal({ classId }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [parsed, setParsed] = useState<ParsedRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");

  function reset() {
    setParsed([]);
    setParseError(null);
    setSaveError(null);
    setFileName("");
    if (fileRef.current) fileRef.current.value = "";
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setParseError(null);
    setSaveError(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      if (!text || !text.trim()) {
        setParseError("File is empty.");
        return;
      }

      const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);

      if (lines.length < 2) {
        setParseError("File must have a header row and at least one data row.");
        return;
      }

      const delim = detectDelimiter(lines[0]);
      const headers = parseCsvLine(lines[0], delim);

      let nameIdx = headers.findIndex((h) => matchCol(h, NAME_PATTERNS));
      if (nameIdx === -1) nameIdx = 0;

      const gradeIdx = headers.findIndex((h) => matchCol(h, GRADE_PATTERNS));

      const rows: ParsedRow[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = parseCsvLine(lines[i], delim);
        const name = (cols[nameIdx] || "").trim();
        if (!name) continue;

        const grade =
          gradeIdx >= 0 && cols[gradeIdx] !== undefined
            ? parseGrade(cols[gradeIdx])
            : null;

        rows.push({ name, target_grade: grade });
      }

      if (rows.length === 0) {
        setParseError("No valid student rows found in the file.");
        return;
      }

      setParsed(rows);
      setOpen(true);
    };

    reader.readAsText(file);
  }

  async function handleConfirm() {
    setSaving(true);
    setSaveError(null);

    const result = await bulkAddStudents(classId, parsed);

    setSaving(false);
    if (result.error) {
      setSaveError(result.error);
    } else {
      setOpen(false);
      reset();
      router.refresh();
    }
  }

  function handleClose() {
    if (saving) return;
    setOpen(false);
    reset();
  }

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => fileRef.current?.click()}
        className="btn-secondary inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
        style={{ border: "1px solid var(--border)", color: "var(--text-secondary)", backgroundColor: "var(--surface)" }}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M6 8V1M3 3.5L6 1l3 2.5M1 8v2.5h10V8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Import CSV
      </button>

      <input ref={fileRef} type="file" accept=".csv,.tsv,.txt" onChange={handleFile} style={{ display: "none" }} />

      {/* Parse error toast */}
      {parseError && !open && (
        <div
          style={{
            position: "fixed", bottom: "24px", right: "24px", zIndex: 60,
            padding: "10px 16px", borderRadius: "12px", fontSize: "13px",
            color: "#dc2626", backgroundColor: "var(--rag-red-bg)",
            border: "1px solid #fecaca", boxShadow: "var(--shadow-md)", maxWidth: "380px",
          }}
        >
          {parseError}
        </div>
      )}

      {/* Preview modal */}
      {open && (
        <div className="modal-backdrop" onClick={handleClose}>
          <div
            style={{
              backgroundColor: "var(--surface)", border: "1px solid var(--border)",
              borderRadius: "16px", boxShadow: "var(--shadow-md)",
              width: "100%", maxWidth: "540px", maxHeight: "80vh",
              display: "flex", flexDirection: "column",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "16px 20px", borderBottom: "1px solid var(--border)", flexShrink: 0,
              }}
            >
              <div>
                <h2 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                  Import students
                </h2>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: "2px 0 0" }}>
                  {fileName} · {parsed.length} {parsed.length === 1 ? "student" : "students"} found
                </p>
              </div>
              <button
                onClick={handleClose}
                className="btn-ghost w-7 h-7 flex items-center justify-center"
                style={{ color: "var(--text-secondary)" }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Table */}
            <div style={{ overflowY: "auto", flex: 1 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    {["#", "Name", "Target"].map((h, i) => (
                      <th
                        key={h}
                        style={{
                          padding: i === 1 ? "10px 12px" : "10px 20px",
                          textAlign: "left", fontWeight: 500, fontSize: "11px",
                          color: "var(--text-secondary)", backgroundColor: "var(--surface-secondary)",
                          position: "sticky", top: 0, zIndex: 1,
                          width: i === 1 ? "99%" : undefined,
                          whiteSpace: i === 2 ? "nowrap" : undefined,
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parsed.map((row, i) => (
                    <tr
                      key={i}
                      className="student-row"
                      style={{ borderBottom: i < parsed.length - 1 ? "1px solid var(--border)" : undefined }}
                    >
                      <td style={{ padding: "8px 20px", color: "var(--text-secondary)", fontVariantNumeric: "tabular-nums", fontSize: "12px" }}>
                        {i + 1}
                      </td>
                      <td style={{ padding: "8px 12px", color: "var(--text-primary)", fontWeight: 500 }}>
                        {row.name}
                      </td>
                      <td style={{ padding: "8px 20px", color: row.target_grade ? "var(--text-primary)" : "var(--text-secondary)", fontVariantNumeric: "tabular-nums" }}>
                        {row.target_grade ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div
              style={{
                padding: "14px 20px", borderTop: "1px solid var(--border)",
                display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0,
              }}
            >
              {saveError ? (
                <span style={{ fontSize: "12px", color: "#dc2626", flex: 1 }}>{saveError}</span>
              ) : (
                <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                  {parsed.filter((r) => r.target_grade === null).length > 0 &&
                    `${parsed.filter((r) => r.target_grade === null).length} without target grade`}
                </span>
              )}
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={handleClose}
                  className="btn-secondary"
                  style={{
                    padding: "7px 16px", borderRadius: "9999px", fontSize: "13px", fontWeight: 600,
                    border: "1px solid var(--border)", color: "var(--text-secondary)", backgroundColor: "var(--surface)", cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={saving}
                  className="btn-primary"
                  style={{
                    padding: "7px 16px", borderRadius: "9999px", fontSize: "13px", fontWeight: 700,
                    border: "none", backgroundColor: "#0d9488", color: "#ffffff",
                    cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1,
                  }}
                >
                  {saving ? "Importing…" : `Import ${parsed.length} ${parsed.length === 1 ? "student" : "students"}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
