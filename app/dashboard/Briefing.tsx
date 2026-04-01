"use client";

import Link from "next/link";

/* ── Types ── */

export type TrendPoint = { date: string; avg_pct: number };

export type ClassBriefing = {
  id: string;
  name: string;
  year_group: number;
  exam_board: string;
  tier: string;
  student_count: number;
  students_below_target: number;
  last_assessment: {
    id: string;
    title: string;
    date: string;
    avg_pct: number;
  } | null;
  weak_topics: string[];
  trend: TrendPoint[];
  suggested_action: string;
};

/* ── Sparkline ── */

function Sparkline({ data }: { data: TrendPoint[] }) {
  if (data.length < 2) return null;

  const values = data.map((d) => d.avg_pct);
  const min = Math.min(...values) - 5;
  const max = Math.max(...values) + 5;
  const range = max - min || 1;

  const w = 80;
  const h = 32;
  const padY = 4;

  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = padY + (1 - (v - min) / range) * (h - padY * 2);
    return `${x},${y}`;
  });

  const last = values[values.length - 1];
  const prev = values[values.length - 2];
  const trending = last > prev ? "up" : last < prev ? "down" : "flat";
  const lineColor =
    trending === "up" ? "#16a34a" : trending === "down" ? "#dc2626" : "var(--text-secondary)";

  return (
    <div className="flex items-center gap-2">
      <svg width={w} height={h} className="flex-shrink-0">
        <polyline
          className="sparkline-line"
          fill="none"
          stroke={lineColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points.join(" ")}
        />
        <circle
          cx={w}
          cy={padY + (1 - (last - min) / range) * (h - padY * 2)}
          r="2.5"
          fill={lineColor}
        />
      </svg>
      <span
        className="text-xs font-medium tabular-nums"
        style={{ color: lineColor }}
      >
        {trending === "up" ? "+" : ""}
        {Math.round(last - prev)}%
      </span>
    </div>
  );
}

/* ── Time helpers ── */

function timeAgo(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const days = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 14) return "1w ago";
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 60) return "1mo ago";
  return `${Math.floor(days / 30)}mo ago`;
}

function pctColor(pct: number): string {
  if (pct >= 70) return "#16a34a";
  if (pct >= 40) return "#d97706";
  return "#dc2626";
}

/* ── Main Briefing Component ── */

export default function Briefing({ classes }: { classes: ClassBriefing[] }) {
  const totalStudents = classes.reduce((s, c) => s + c.student_count, 0);
  const totalBelowTarget = classes.reduce((s, c) => s + c.students_below_target, 0);
  const improvingCount = classes.filter(
    (c) =>
      c.trend.length >= 2 &&
      c.trend[c.trend.length - 1].avg_pct > c.trend[c.trend.length - 2].avg_pct
  ).length;

  return (
    <div>
      {/* Stats overview */}
      {classes.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <StatCard label="Classes" value={classes.length} />
          <StatCard label="Students" value={totalStudents} />
          <StatCard
            label="Improving"
            value={improvingCount}
            color={improvingCount > 0 ? "#16a34a" : undefined}
          />
          <StatCard
            label="Below target"
            value={totalBelowTarget}
            color={totalBelowTarget > 0 ? "#dc2626" : undefined}
          />
        </div>
      )}

      {/* Class cards */}
      {classes.length === 0 ? (
        <div
          className="rounded-2xl text-center py-20 px-6"
          style={{
            backgroundColor: "var(--surface)",
            border: "1px solid var(--border)",
          }}
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ backgroundColor: "var(--accent-light)" }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 5v14M5 12h14"
                stroke="#0d9488"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <p
            className="text-lg font-semibold mb-1.5"
            style={{ color: "var(--text-primary)" }}
          >
            No classes yet
          </p>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Add your first class and Olvar will start working for you.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {classes.map((cls) => (
            <ClassCard key={cls.id} cls={cls} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Stat Card ── */

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div
      className="rounded-xl px-4 py-3.5"
      style={{
        backgroundColor: "var(--surface)",
        border: "1px solid var(--border)",
      }}
    >
      <div
        className="text-[11px] font-medium uppercase tracking-wide mb-1"
        style={{ color: "var(--text-secondary)" }}
      >
        {label}
      </div>
      <div
        className="text-2xl font-bold tabular-nums"
        style={{ color: color ?? "var(--text-primary)" }}
      >
        {value}
      </div>
    </div>
  );
}

/* ── Class Card ── */

function ClassCard({ cls }: { cls: ClassBriefing }) {
  const hasAssessment = cls.last_assessment !== null;

  return (
    <Link
      href={`/class/${cls.id}`}
      className="group block rounded-2xl p-5 transition-all duration-150"
      style={{
        backgroundColor: "var(--surface)",
        border: "1px solid var(--border)",
        textDecoration: "none",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--border-strong)";
        e.currentTarget.style.backgroundColor = "var(--surface-hover)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border)";
        e.currentTarget.style.backgroundColor = "var(--surface)";
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3
            className="text-[15px] font-semibold mb-1.5"
            style={{ color: "var(--text-primary)" }}
          >
            {cls.name}
          </h3>
          <div className="flex items-center gap-1.5">
            {[`Y${cls.year_group}`, cls.exam_board, cls.tier].map((tag) => (
              <span
                key={tag}
                className="text-[11px] font-medium px-1.5 py-0.5 rounded"
                style={{
                  backgroundColor: "var(--surface-secondary)",
                  color: "var(--text-secondary)",
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <path
            d="M6 4l4 4-4 4"
            stroke="var(--text-secondary)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Meta line */}
      <div
        className="text-[13px] mb-4"
        style={{ color: "var(--text-secondary)" }}
      >
        {cls.student_count} students
        {hasAssessment && <span> · assessed {timeAgo(cls.last_assessment!.date)}</span>}
      </div>

      {/* Assessment data */}
      {hasAssessment && (
        <div className="space-y-3">
          {/* Score + trend */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span
                className="text-xl font-bold tabular-nums"
                style={{ color: pctColor(cls.last_assessment!.avg_pct) }}
              >
                {Math.round(cls.last_assessment!.avg_pct)}%
              </span>
              <span className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
                avg
              </span>
            </div>
            {cls.trend.length >= 2 && <Sparkline data={cls.trend} />}
          </div>

          {/* Tags row */}
          {(cls.weak_topics.length > 0 || cls.students_below_target > 0) && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {cls.students_below_target > 0 && (
                <span
                  className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md"
                  style={{ backgroundColor: "var(--rag-red-bg)", color: "#dc2626" }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full inline-block"
                    style={{ backgroundColor: "#dc2626" }}
                  />
                  {cls.students_below_target} below target
                </span>
              )}
              {cls.weak_topics.slice(0, 2).map((t) => (
                <span key={t} className="topic-tag">{t}</span>
              ))}
              {cls.weak_topics.length > 2 && (
                <span
                  className="text-[11px] font-medium"
                  style={{ color: "var(--text-secondary)" }}
                >
                  +{cls.weak_topics.length - 2}
                </span>
              )}
            </div>
          )}

          {/* AI insight */}
          <div
            className="flex items-start gap-2 rounded-lg px-3 py-2.5"
            style={{ backgroundColor: "var(--accent-light)" }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              className="flex-shrink-0 mt-px"
            >
              <path
                d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM8 5v3M8 10h.005"
                stroke="#0d9488"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-[12px] leading-relaxed" style={{ color: "#0d9488" }}>
              {cls.suggested_action}
            </span>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!hasAssessment && (
        <div
          className="flex items-center gap-2 rounded-lg px-3 py-2.5"
          style={{ backgroundColor: "var(--accent-light)" }}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
            <path
              d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM8 5v3M8 10h.005"
              stroke="#0d9488"
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-[12px]" style={{ color: "#0d9488" }}>
            {cls.suggested_action}
          </span>
        </div>
      )}
    </Link>
  );
}
