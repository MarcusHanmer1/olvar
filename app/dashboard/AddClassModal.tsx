"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClass } from "./actions";

const YEAR_GROUPS = [7, 8, 9, 10, 11, 12, 13];
const EXAM_BOARDS = ["AQA", "Edexcel", "OCR", "WJEC"] as const;

export default function AddClassModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [yearGroup, setYearGroup] = useState<number>(11);
  const [examBoard, setExamBoard] = useState<string>("AQA");
  const [tier, setTier] = useState<"Higher" | "Foundation">("Higher");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openModal() {
    setName("");
    setYearGroup(11);
    setExamBoard("AQA");
    setTier("Higher");
    setError(null);
    setOpen(true);
  }

  function closeModal() {
    if (loading) return;
    setOpen(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Class name is required.");
      return;
    }
    setError(null);
    setLoading(true);

    const result = await createClass({
      name,
      year_group: yearGroup,
      exam_board: examBoard,
      tier,
    });

    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      setOpen(false);
      router.refresh();
    }
  }

  return (
    <>
      <button
        onClick={openModal}
        className="btn-primary inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-bold"
        style={{ backgroundColor: "#0d9488", color: "#ffffff" }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        Add class
      </button>

      {open && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div
            className="w-full max-w-md rounded-2xl p-6"
            style={{
              backgroundColor: "var(--surface)",
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-md)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[17px] font-extrabold" style={{ color: "var(--text-primary)" }}>
                New class
              </h2>
              <button
                onClick={closeModal}
                className="btn-ghost w-8 h-8 flex items-center justify-center"
                style={{ color: "var(--text-secondary)" }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="class-name" className="text-[13px] font-bold" style={{ color: "var(--text-primary)" }}>
                  Class name
                </label>
                <input
                  id="class-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. 11A/Ma1 – Top Set"
                  className="w-full rounded-xl px-3 py-2.5 text-[15px] outline-none transition-colors"
                  style={{
                    border: "1px solid var(--border)",
                    color: "var(--text-primary)",
                    backgroundColor: "var(--surface)",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#0d9488";
                    e.target.style.boxShadow = "0 0 0 3px rgba(13, 148, 136, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "var(--border)";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="year-group" className="text-[13px] font-bold" style={{ color: "var(--text-primary)" }}>
                    Year group
                  </label>
                  <select
                    id="year-group"
                    value={yearGroup}
                    onChange={(e) => setYearGroup(parseInt(e.target.value))}
                    className="w-full rounded-xl px-3 py-2.5 text-[15px] outline-none transition-colors"
                    style={{ border: "1px solid var(--border)", color: "var(--text-primary)", backgroundColor: "var(--surface)" }}
                    onFocus={(e) => { e.target.style.borderColor = "#0d9488"; e.target.style.boxShadow = "0 0 0 3px rgba(13, 148, 136, 0.1)"; }}
                    onBlur={(e) => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; }}
                  >
                    {YEAR_GROUPS.map((y) => (
                      <option key={y} value={y}>Year {y}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="exam-board" className="text-[13px] font-bold" style={{ color: "var(--text-primary)" }}>
                    Exam board
                  </label>
                  <select
                    id="exam-board"
                    value={examBoard}
                    onChange={(e) => setExamBoard(e.target.value)}
                    className="w-full rounded-xl px-3 py-2.5 text-[15px] outline-none transition-colors"
                    style={{ border: "1px solid var(--border)", color: "var(--text-primary)", backgroundColor: "var(--surface)" }}
                    onFocus={(e) => { e.target.style.borderColor = "#0d9488"; e.target.style.boxShadow = "0 0 0 3px rgba(13, 148, 136, 0.1)"; }}
                    onBlur={(e) => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; }}
                  >
                    {EXAM_BOARDS.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[13px] font-bold" style={{ color: "var(--text-primary)" }}>Tier</span>
                <div className="flex rounded-full overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                  {(["Higher", "Foundation"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTier(t)}
                      className="flex-1 py-2.5 text-[13px] font-bold transition-colors"
                      style={{
                        backgroundColor: tier === t ? "#0d9488" : "var(--surface)",
                        color: tier === t ? "#ffffff" : "var(--text-secondary)",
                        borderRight: t === "Higher" ? "1px solid var(--border)" : undefined,
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <p
                  className="text-[13px] rounded-xl px-3 py-2.5"
                  style={{ color: "#dc2626", backgroundColor: "var(--rag-red-bg)", border: "1px solid #fecaca" }}
                >
                  {error}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn-secondary px-5 py-2.5 rounded-full text-[13px] font-bold"
                  style={{ border: "1px solid var(--border)", color: "var(--text-secondary)", backgroundColor: "var(--surface)" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary px-5 py-2.5 rounded-full text-[13px] font-bold transition-opacity"
                  style={{ backgroundColor: "#0d9488", color: "#ffffff", opacity: loading ? 0.6 : 1 }}
                >
                  {loading ? "Creating…" : "Create class"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
