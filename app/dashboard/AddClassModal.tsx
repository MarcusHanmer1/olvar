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

    const result = await createClass({ name, year_group: yearGroup, exam_board: examBoard, tier });

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
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium"
        style={{ backgroundColor: "#0d9488", color: "#ffffff" }}
        onMouseEnter={(e) =>
          ((e.currentTarget as HTMLElement).style.backgroundColor = "#0f766e")
        }
        onMouseLeave={(e) =>
          ((e.currentTarget as HTMLElement).style.backgroundColor = "#0d9488")
        }
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path
            d="M7 1v12M1 7h12"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        Add class
      </button>

      {open && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div
            className="w-full max-w-md rounded-xl p-6"
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #e5e5e4",
              boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2
                className="text-base font-semibold"
                style={{ color: "#1c1c1a" }}
              >
                New class
              </h2>
              <button
                onClick={closeModal}
                className="w-7 h-7 flex items-center justify-center rounded-md transition-colors"
                style={{ color: "#6b6b67" }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLElement).style.backgroundColor = "#f4f4f3")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLElement).style.backgroundColor = "transparent")
                }
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M1 1l12 12M13 1L1 13"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Name */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="class-name"
                  className="text-xs font-medium"
                  style={{ color: "#1c1c1a" }}
                >
                  Class name
                </label>
                <input
                  id="class-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. 11A/Ma1 – Top Set"
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style={{ border: "1px solid #e5e5e4", color: "#1c1c1a" }}
                  onFocus={(e) => (e.target.style.borderColor = "#0d9488")}
                  onBlur={(e) => (e.target.style.borderColor = "#e5e5e4")}
                />
              </div>

              {/* Year group + Exam board */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="year-group"
                    className="text-xs font-medium"
                    style={{ color: "#1c1c1a" }}
                  >
                    Year group
                  </label>
                  <select
                    id="year-group"
                    value={yearGroup}
                    onChange={(e) => setYearGroup(parseInt(e.target.value))}
                    className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                    style={{ border: "1px solid #e5e5e4", color: "#1c1c1a", backgroundColor: "#ffffff" }}
                    onFocus={(e) => (e.target.style.borderColor = "#0d9488")}
                    onBlur={(e) => (e.target.style.borderColor = "#e5e5e4")}
                  >
                    {YEAR_GROUPS.map((y) => (
                      <option key={y} value={y}>
                        Year {y}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="exam-board"
                    className="text-xs font-medium"
                    style={{ color: "#1c1c1a" }}
                  >
                    Exam board
                  </label>
                  <select
                    id="exam-board"
                    value={examBoard}
                    onChange={(e) => setExamBoard(e.target.value)}
                    className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                    style={{ border: "1px solid #e5e5e4", color: "#1c1c1a", backgroundColor: "#ffffff" }}
                    onFocus={(e) => (e.target.style.borderColor = "#0d9488")}
                    onBlur={(e) => (e.target.style.borderColor = "#e5e5e4")}
                  >
                    {EXAM_BOARDS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tier */}
              <div className="flex flex-col gap-1.5">
                <span
                  className="text-xs font-medium"
                  style={{ color: "#1c1c1a" }}
                >
                  Tier
                </span>
                <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid #e5e5e4" }}>
                  {(["Higher", "Foundation"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTier(t)}
                      className="flex-1 py-2 text-sm font-medium transition-colors"
                      style={{
                        backgroundColor: tier === t ? "#0d9488" : "#ffffff",
                        color: tier === t ? "#ffffff" : "#6b6b67",
                        borderRight: t === "Higher" ? "1px solid #e5e5e4" : undefined,
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <p
                  className="text-xs rounded-lg px-3 py-2"
                  style={{
                    color: "#dc2626",
                    backgroundColor: "#fef2f2",
                    border: "1px solid #fecaca",
                  }}
                >
                  {error}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-lg text-sm font-medium"
                  style={{
                    border: "1px solid #e5e5e4",
                    color: "#6b6b67",
                    backgroundColor: "#ffffff",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-opacity"
                  style={{
                    backgroundColor: "#0d9488",
                    color: "#ffffff",
                    opacity: loading ? 0.6 : 1,
                  }}
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
