"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { deleteAssessment } from "./assess/actions";

export type AssessmentRow = {
  id: string;
  title: string;
  date: string;
  total_marks: number;
  marks: { scores: (number | null)[] }[];
};

export default function AssessmentList({
  classId,
  assessments,
}: {
  classId: string;
  assessments: AssessmentRow[];
}) {
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete(assessmentId: string) {
    startTransition(async () => {
      const result = await deleteAssessment(assessmentId, classId);
      if (result.error) {
        alert(result.error);
      }
      setConfirmId(null);
    });
  }

  return (
    <div className="mt-8">
      <h2
        className="text-sm font-semibold mb-3"
        style={{ color: "var(--text-primary)" }}
      >
        Assessments
      </h2>
      <div
        className="rounded-xl overflow-hidden"
        style={{
          backgroundColor: "var(--surface)",
          border: "1px solid var(--border)",
        }}
      >
        {assessments.map((a, i) => {
          let avgPct: number | null = null;
          if (a.marks.length > 0 && a.total_marks > 0) {
            const studentTotals = a.marks.map((m) =>
              m.scores.reduce<number>((sum, s) => sum + (s ?? 0), 0)
            );
            const classTotal = studentTotals.reduce((s, v) => s + v, 0);
            avgPct = (classTotal / (a.marks.length * a.total_marks)) * 100;
          }

          const pctColor =
            avgPct === null
              ? "#6b6b67"
              : avgPct >= 70
                ? "#16a34a"
                : avgPct >= 40
                  ? "#d97706"
                  : "#dc2626";

          const isConfirming = confirmId === a.id;

          return (
            <div
              key={a.id}
              className="flex items-center justify-between px-5 py-4 class-card"
              style={{
                borderBottom:
                  i < assessments.length - 1
                    ? "1px solid var(--border)"
                    : undefined,
              }}
            >
              {isConfirming ? (
                <div className="flex items-center gap-3 w-full">
                  <span
                    className="text-sm"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Delete <strong>{a.title}</strong>? This cannot be undone.
                  </span>
                  <div className="flex items-center gap-2 ml-auto">
                    <button
                      onClick={() => setConfirmId(null)}
                      disabled={isPending}
                      className="text-xs px-3 py-1.5 rounded-md font-medium"
                      style={{
                        color: "var(--text-secondary)",
                        backgroundColor: "var(--surface-secondary)",
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleDelete(a.id)}
                      disabled={isPending}
                      className="text-xs px-3 py-1.5 rounded-md font-medium"
                      style={{
                        color: "#ffffff",
                        backgroundColor: "#dc2626",
                        opacity: isPending ? 0.6 : 1,
                      }}
                    >
                      {isPending ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <Link
                    href={`/class/${classId}/results/${a.id}`}
                    className="flex items-center gap-3 min-w-0 flex-1"
                    style={{ textDecoration: "none" }}
                  >
                    <span
                      className="text-sm font-medium truncate"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {a.title}
                    </span>
                    <span
                      className="text-xs flex-shrink-0"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {a.date}
                    </span>
                  </Link>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {avgPct !== null && (
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-md tabular-nums"
                        style={{
                          color: pctColor,
                          backgroundColor:
                            avgPct >= 70
                              ? "#f0fdf4"
                              : avgPct >= 40
                                ? "#fffbeb"
                                : "#fef2f2",
                        }}
                      >
                        {avgPct.toFixed(0)}%
                      </span>
                    )}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setConfirmId(a.id);
                      }}
                      className="p-1 rounded-md hover:bg-red-50 transition-colors"
                      style={{ color: "#6b6b67" }}
                      title="Delete assessment"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                      >
                        <path
                          d="M2.5 4h9M5 4V2.5h4V4M5.5 6v4M8.5 6v4M3.5 4l.5 7.5h6l.5-7.5"
                          stroke="currentColor"
                          strokeWidth="1.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                    <Link
                      href={`/class/${classId}/results/${a.id}`}
                      style={{ textDecoration: "none" }}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                        className="flex-shrink-0"
                      >
                        <path
                          d="M3 7h8M7 3l4 4-4 4"
                          stroke="#6b6b67"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </Link>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
