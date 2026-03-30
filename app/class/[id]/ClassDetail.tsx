"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addStudent, updateStudent, deleteStudent } from "./actions";

export type Student = {
  id: string;
  name: string;
  target_grade: number | null;
};

interface Props {
  classId: string;
  students: Student[];
}

const GRADES = [1, 2, 3, 4, 5, 6, 7, 8, 9];

function GradeBadge({ grade }: { grade: number | null }) {
  if (grade === null) return <span style={{ color: "#6b6b67" }}>—</span>;

  const color =
    grade >= 7
      ? { bg: "#f0fdf4", text: "#16a34a" }
      : grade >= 4
      ? { bg: "#fffbeb", text: "#d97706" }
      : { bg: "#fef2f2", text: "#dc2626" };

  return (
    <span
      className="text-xs font-semibold px-2 py-0.5 rounded-md tabular-nums"
      style={{ backgroundColor: color.bg, color: color.text }}
    >
      {grade}
    </span>
  );
}

export default function ClassDetail({ classId, students }: Props) {
  const router = useRouter();

  // Editing a row
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editGrade, setEditGrade] = useState<number>(5);

  // Confirming a delete
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Add student form
  const [showAdd, setShowAdd] = useState(false);
  const [addName, setAddName] = useState("");
  const [addGrade, setAddGrade] = useState<number>(5);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startEdit(s: Student) {
    setEditingId(s.id);
    setEditName(s.name);
    setEditGrade(s.target_grade ?? 5);
    setDeletingId(null);
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setError(null);
  }

  async function saveEdit(studentId: string) {
    if (!editName.trim()) return;
    setBusy(true);
    setError(null);
    const result = await updateStudent(studentId, classId, {
      name: editName,
      target_grade: editGrade,
    });
    setBusy(false);
    if (result.error) {
      setError(result.error);
    } else {
      setEditingId(null);
      router.refresh();
    }
  }

  async function confirmDelete(studentId: string) {
    setBusy(true);
    setError(null);
    const result = await deleteStudent(studentId, classId);
    setBusy(false);
    if (result.error) {
      setError(result.error);
    } else {
      setDeletingId(null);
      router.refresh();
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!addName.trim()) return;
    setBusy(true);
    setError(null);
    const result = await addStudent(classId, {
      name: addName,
      target_grade: addGrade,
    });
    setBusy(false);
    if (result.error) {
      setError(result.error);
    } else {
      setAddName("");
      setAddGrade(5);
      setShowAdd(false);
      router.refresh();
    }
  }

  const inputStyle = {
    border: "1px solid #e5e5e4",
    color: "#1c1c1a",
    backgroundColor: "#ffffff",
    borderRadius: "6px",
    padding: "4px 8px",
    fontSize: "14px",
    outline: "none",
  };

  const selectStyle = {
    ...inputStyle,
    cursor: "pointer",
  };

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ backgroundColor: "#ffffff", border: "1px solid #e5e5e4" }}
    >
      {/* Section header */}
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: "1px solid #e5e5e4" }}
      >
        <div className="flex items-center gap-2.5">
          <h2 className="text-sm font-semibold" style={{ color: "#1c1c1a" }}>
            Students
          </h2>
          {students.length > 0 && (
            <span
              className="text-xs px-2 py-0.5 rounded-full tabular-nums"
              style={{ backgroundColor: "#f4f4f3", color: "#6b6b67" }}
            >
              {students.length}
            </span>
          )}
        </div>
        {!showAdd && (
          <button
            onClick={() => {
              setShowAdd(true);
              setAddName("");
              setAddGrade(5);
              setError(null);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ backgroundColor: "#0d9488", color: "#ffffff" }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.backgroundColor = "#0f766e")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.backgroundColor = "#0d9488")
            }
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M6 1v10M1 6h10"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            Add student
          </button>
        )}
      </div>

      {/* Error banner */}
      {error && (
        <div
          className="px-5 py-3 text-xs"
          style={{
            backgroundColor: "#fef2f2",
            color: "#dc2626",
            borderBottom: "1px solid #fecaca",
          }}
        >
          {error}
        </div>
      )}

      {/* Table */}
      {students.length > 0 ? (
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: "1px solid #e5e5e4" }}>
              <th
                className="text-left px-5 py-3 text-xs font-medium"
                style={{ color: "#6b6b67", width: "99%" }}
              >
                Name
              </th>
              <th
                className="text-left px-4 py-3 text-xs font-medium whitespace-nowrap"
                style={{ color: "#6b6b67" }}
              >
                Target
              </th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {students.map((s, i) => {
              const isEditing = editingId === s.id;
              const isDeleting = deletingId === s.id;
              const rowBorder =
                i < students.length - 1 || showAdd
                  ? "1px solid #e5e5e4"
                  : undefined;

              return (
                <tr
                  key={s.id}
                  className="student-row"
                  style={{ borderBottom: rowBorder }}
                >
                  {isEditing ? (
                    <>
                      <td className="px-5 py-2.5">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          style={{ ...inputStyle, width: "100%", maxWidth: "280px" }}
                          onFocus={(e) => (e.target.style.borderColor = "#0d9488")}
                          onBlur={(e) => (e.target.style.borderColor = "#e5e5e4")}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEdit(s.id);
                            if (e.key === "Escape") cancelEdit();
                          }}
                        />
                      </td>
                      <td className="px-4 py-2.5">
                        <select
                          value={editGrade}
                          onChange={(e) => setEditGrade(parseInt(e.target.value))}
                          style={selectStyle}
                          onFocus={(e) => (e.target.style.borderColor = "#0d9488")}
                          onBlur={(e) => (e.target.style.borderColor = "#e5e5e4")}
                        >
                          {GRADES.map((g) => (
                            <option key={g} value={g}>
                              {g}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-5 py-2.5">
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={() => saveEdit(s.id)}
                            disabled={busy}
                            className="text-xs font-medium px-3 py-1.5 rounded-md"
                            style={{
                              backgroundColor: "#0d9488",
                              color: "#ffffff",
                              opacity: busy ? 0.6 : 1,
                            }}
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="text-xs font-medium px-3 py-1.5 rounded-md"
                            style={{
                              border: "1px solid #e5e5e4",
                              color: "#6b6b67",
                              backgroundColor: "#ffffff",
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </>
                  ) : isDeleting ? (
                    <>
                      <td className="px-5 py-2.5">
                        <span className="text-sm" style={{ color: "#1c1c1a" }}>
                          {s.name}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <GradeBadge grade={s.target_grade} />
                      </td>
                      <td className="px-5 py-2.5">
                        <div className="flex items-center gap-2 justify-end">
                          <span className="text-xs" style={{ color: "#6b6b67" }}>
                            Remove student?
                          </span>
                          <button
                            onClick={() => confirmDelete(s.id)}
                            disabled={busy}
                            className="text-xs font-medium px-3 py-1.5 rounded-md"
                            style={{
                              backgroundColor: "#dc2626",
                              color: "#ffffff",
                              opacity: busy ? 0.6 : 1,
                            }}
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setDeletingId(null)}
                            className="text-xs font-medium px-3 py-1.5 rounded-md"
                            style={{
                              border: "1px solid #e5e5e4",
                              color: "#6b6b67",
                              backgroundColor: "#ffffff",
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-5 py-3">
                        <span className="text-sm" style={{ color: "#1c1c1a" }}>
                          {s.name}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <GradeBadge grade={s.target_grade} />
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            onClick={() => startEdit(s)}
                            className="text-xs px-2.5 py-1 rounded-md transition-colors"
                            style={{ color: "#6b6b67" }}
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLElement).style.backgroundColor = "#f4f4f3";
                              (e.currentTarget as HTMLElement).style.color = "#1c1c1a";
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                              (e.currentTarget as HTMLElement).style.color = "#6b6b67";
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              setDeletingId(s.id);
                              setEditingId(null);
                            }}
                            className="text-xs px-2.5 py-1 rounded-md transition-colors"
                            style={{ color: "#6b6b67" }}
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLElement).style.backgroundColor = "#fef2f2";
                              (e.currentTarget as HTMLElement).style.color = "#dc2626";
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                              (e.currentTarget as HTMLElement).style.color = "#6b6b67";
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              );
            })}

            {/* Add student inline form */}
            {showAdd && (
              <tr style={{ backgroundColor: "#fafaf9" }}>
                <td className="px-5 py-2.5" colSpan={3}>
                  <form
                    onSubmit={handleAdd}
                    className="flex items-center gap-3"
                  >
                    <input
                      type="text"
                      placeholder="Student name"
                      value={addName}
                      onChange={(e) => setAddName(e.target.value)}
                      style={{ ...inputStyle, flex: 1 }}
                      onFocus={(e) => (e.target.style.borderColor = "#0d9488")}
                      onBlur={(e) => (e.target.style.borderColor = "#e5e5e4")}
                      autoFocus
                    />
                    <select
                      value={addGrade}
                      onChange={(e) => setAddGrade(parseInt(e.target.value))}
                      style={selectStyle}
                      onFocus={(e) => (e.target.style.borderColor = "#0d9488")}
                      onBlur={(e) => (e.target.style.borderColor = "#e5e5e4")}
                    >
                      {GRADES.map((g) => (
                        <option key={g} value={g}>
                          Grade {g}
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      disabled={busy || !addName.trim()}
                      className="text-xs font-medium px-3 py-1.5 rounded-md whitespace-nowrap"
                      style={{
                        backgroundColor: "#0d9488",
                        color: "#ffffff",
                        opacity: busy || !addName.trim() ? 0.5 : 1,
                      }}
                    >
                      Add student
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAdd(false)}
                      className="text-xs font-medium px-3 py-1.5 rounded-md"
                      style={{
                        border: "1px solid #e5e5e4",
                        color: "#6b6b67",
                        backgroundColor: "#ffffff",
                      }}
                    >
                      Cancel
                    </button>
                  </form>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      ) : !showAdd ? (
        /* Empty state */
        <div className="py-14 flex flex-col items-center justify-center text-center">
          <p className="text-sm font-medium mb-1" style={{ color: "#1c1c1a" }}>
            No students yet
          </p>
          <p className="text-sm mb-5" style={{ color: "#6b6b67" }}>
            Add students to this class to start tracking their progress.
          </p>
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium"
            style={{ backgroundColor: "#0d9488", color: "#ffffff" }}
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path
                d="M6.5 1v11M1 6.5h11"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            Add first student
          </button>
        </div>
      ) : (
        /* Add form with no existing students */
        <div className="px-5 py-4" style={{ backgroundColor: "#fafaf9" }}>
          <form onSubmit={handleAdd} className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Student name"
              value={addName}
              onChange={(e) => setAddName(e.target.value)}
              style={{ ...inputStyle, flex: 1 }}
              onFocus={(e) => (e.target.style.borderColor = "#0d9488")}
              onBlur={(e) => (e.target.style.borderColor = "#e5e5e4")}
              autoFocus
            />
            <select
              value={addGrade}
              onChange={(e) => setAddGrade(parseInt(e.target.value))}
              style={selectStyle}
              onFocus={(e) => (e.target.style.borderColor = "#0d9488")}
              onBlur={(e) => (e.target.style.borderColor = "#e5e5e4")}
            >
              {GRADES.map((g) => (
                <option key={g} value={g}>
                  Grade {g}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={busy || !addName.trim()}
              className="text-xs font-medium px-3 py-1.5 rounded-md whitespace-nowrap"
              style={{
                backgroundColor: "#0d9488",
                color: "#ffffff",
                opacity: busy || !addName.trim() ? 0.5 : 1,
              }}
            >
              Add student
            </button>
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="text-xs font-medium px-3 py-1.5 rounded-md"
              style={{
                border: "1px solid #e5e5e4",
                color: "#6b6b67",
                backgroundColor: "#ffffff",
              }}
            >
              Cancel
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
