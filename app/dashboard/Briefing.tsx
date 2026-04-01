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

export type Insight = {
  icon: "alert" | "trend-up" | "trend-down" | "star" | "target";
  text: string;
  classId?: string;
};

export default function Briefing({
  classes,
  insights = [],
}: {
  classes: ClassBriefing[];
  insights?: Insight[];
}) {
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

      {/* AI Insights */}
      {insights.length > 0 && (
        <div
          style={{
            borderRadius: "16px",
            border: "1px solid var(--summary-border)",
            background: "var(--summary-bg)",
            overflow: "hidden",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              borderBottom: "1px solid var(--summary-border)",
            }}
          >
            <div
              style={{
                width: "24px",
                height: "24px",
                borderRadius: "6px",
                backgroundColor: "#0d9488",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path
                  d="M8 1.5L9.4 4.5L12.5 4.8L10.1 7L10.7 10.2L8 8.7L5.3 10.2L5.9 7L3.5 4.8L6.6 4.5L8 1.5Z"
                  stroke="#ffffff"
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                  fill="rgba(255,255,255,0.25)"
                />
              </svg>
            </div>
            <span
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--text-primary)",
              }}
            >
              Olvar&apos;s insights
            </span>
          </div>
          <div>
            {insights.map((insight, i) => (
              <InsightRow key={i} insight={insight} isLast={i === insights.length - 1} />
            ))}
          </div>
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

/* ── Insight Row ── */

const insightIcons: Record<Insight["icon"], { color: string; bg: string; svg: string }> = {
  alert: {
    color: "#dc2626",
    bg: "var(--rag-red-bg)",
    svg: '<path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.5 3h1v5h-1V4zm0 7h1v1h-1v-1z" fill="currentColor"/>',
  },
  "trend-up": {
    color: "#16a34a",
    bg: "var(--rag-green-bg)",
    svg: '<path d="M8 12V4M4 7l4-4 4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
  },
  "trend-down": {
    color: "#dc2626",
    bg: "var(--rag-red-bg)",
    svg: '<path d="M8 4v8M4 9l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
  },
  star: {
    color: "#0d9488",
    bg: "var(--accent-light)",
    svg: '<path d="M8 2L9.4 5.5L13 5.8L10.2 8.2L11 12L8 10.2L5 12L5.8 8.2L3 5.8L6.6 5.5L8 2Z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round" fill="none"/>',
  },
  target: {
    color: "#d97706",
    bg: "var(--rag-amber-bg)",
    svg: '<circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.2" fill="none"/><circle cx="8" cy="8" r="3" stroke="currentColor" stroke-width="1.2" fill="none"/><circle cx="8" cy="8" r="1" fill="currentColor"/>',
  },
};

function InsightRow({ insight, isLast }: { insight: Insight; isLast: boolean }) {
  const icon = insightIcons[insight.icon];
  const content = (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "10px",
        padding: "10px 16px",
        borderBottom: isLast ? undefined : "1px solid var(--summary-border)",
        textDecoration: "none",
      }}
    >
      <div
        style={{
          width: "22px",
          height: "22px",
          borderRadius: "6px",
          backgroundColor: icon.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          color: icon.color,
          marginTop: "1px",
        }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="none"
          dangerouslySetInnerHTML={{ __html: icon.svg }}
        />
      </div>
      <span
        style={{
          fontSize: "13px",
          lineHeight: 1.5,
          color: "var(--text-primary)",
        }}
      >
        {insight.text}
      </span>
    </div>
  );

  if (insight.classId) {
    return (
      <Link
        href={`/class/${insight.classId}`}
        style={{ display: "block", textDecoration: "none", transition: "background-color 0.1s" }}
        className="briefing-card"
      >
        {content}
      </Link>
    );
  }

  return content;
}
