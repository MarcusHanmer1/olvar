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

  const w = 120;
  const h = 36;
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
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points.join(" ")}
          style={{ transition: "stroke-width 0.15s ease" }}
        />
        <circle
          cx={(values.length - 1) / (values.length - 1) * w}
          cy={padY + (1 - (last - min) / range) * (h - padY * 2)}
          r="3"
          fill={lineColor}
        />
      </svg>
      <span
        className={`text-xs font-semibold ${
          trending === "up"
            ? "trend-up"
            : trending === "down"
            ? "trend-down"
            : "trend-flat"
        }`}
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
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 14) return "1 week ago";
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 60) return "1 month ago";
  return `${Math.floor(days / 30)} months ago`;
}

function pctColor(pct: number): string {
  if (pct >= 70) return "#16a34a";
  if (pct >= 40) return "#d97706";
  return "#dc2626";
}

/* ── Summary sentence ── */

function buildSummary(classes: ClassBriefing[]): string {
  if (classes.length === 0) {
    return "Welcome to Olvar. Add your first class to get started.";
  }

  const withAssessments = classes.filter((c) => c.last_assessment);
  const totalStudents = classes.reduce((s, c) => s + c.student_count, 0);
  const belowTarget = classes.reduce((s, c) => s + c.students_below_target, 0);
  const allWeak = classes.flatMap((c) => c.weak_topics);
  const uniqueWeak = [...new Set(allWeak)];

  if (withAssessments.length === 0) {
    return `You have ${classes.length} ${classes.length === 1 ? "class" : "classes"} with ${totalStudents} students. Run your first assessment to unlock insights.`;
  }

  const parts: string[] = [];

  if (belowTarget > 0) {
    parts.push(
      `${belowTarget} ${belowTarget === 1 ? "student is" : "students are"} below target across your classes`
    );
  }

  if (uniqueWeak.length > 0) {
    const top3 = uniqueWeak.slice(0, 3);
    parts.push(
      `${top3.join(", ")} ${uniqueWeak.length > 3 ? `and ${uniqueWeak.length - 3} more topics` : ""} need attention`
    );
  }

  if (parts.length === 0) {
    return `Your ${withAssessments.length} assessed ${withAssessments.length === 1 ? "class is" : "classes are"} looking strong. Keep it up.`;
  }

  return parts.join(". ") + ".";
}

/* ── Main Briefing Component ── */

export default function Briefing({ classes }: { classes: ClassBriefing[] }) {
  const summary = buildSummary(classes);
  const hasAnyData = classes.some((c) => c.last_assessment);

  return (
    <div>
      {/* Summary banner */}
      <div className="summary-banner px-5 py-4 mb-6">
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{ backgroundColor: "#0d9488", color: "#ffffff" }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M10 2a8 8 0 100 16 8 8 0 000-16zM9 6h2v5H9V6zm0 7h2v2H9v-2z"
                fill="currentColor"
              />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[15px] font-bold" style={{ color: "var(--text-primary)" }}>
                Olvar
              </span>
              <span
                className="text-[11px] font-medium px-1.5 py-0.5 rounded"
                style={{ backgroundColor: "var(--accent-light)", color: "#0d9488" }}
              >
                AI Assistant
              </span>
              <span className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
                · Just now
              </span>
            </div>
            <p className="text-[15px] leading-relaxed" style={{ color: "var(--text-primary)" }}>
              {summary}
            </p>
            {hasAnyData && (
              <div className="flex items-center gap-4 mt-3">
                <div className="stat-pill" style={{ backgroundColor: "var(--rag-green-bg)", color: "#16a34a" }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M7 1v12M3 5l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {classes.filter((c) => c.trend.length >= 2 && c.trend[c.trend.length - 1].avg_pct > c.trend[c.trend.length - 2].avg_pct).length} improving
                </div>
                <div className="stat-pill" style={{ backgroundColor: "var(--rag-red-bg)", color: "#dc2626" }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M7 1v12M3 9l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {classes.reduce((s, c) => s + c.students_below_target, 0)} below target
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Class briefing feed */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ border: "1px solid var(--border)" }}
      >
        <div
          className="px-4 py-3 flex items-center justify-between"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <h2 className="text-[15px] font-bold" style={{ color: "var(--text-primary)" }}>
            Your classes
          </h2>
          <span className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
            {classes.length} {classes.length === 1 ? "class" : "classes"}
          </span>
        </div>

        {classes.length === 0 ? (
          <div className="px-4 py-16 text-center">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: "var(--accent-light)" }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M5 12h14" stroke="#0d9488" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-[15px] font-bold mb-1" style={{ color: "var(--text-primary)" }}>
              No classes yet
            </p>
            <p className="text-[13px] mb-5" style={{ color: "var(--text-secondary)" }}>
              Add your first class and Olvar will start working for you.
            </p>
          </div>
        ) : (
          classes.map((cls) => (
            <Link
              key={cls.id}
              href={`/class/${cls.id}`}
              className="briefing-card block px-4 py-4"
              style={{ textDecoration: "none" }}
            >
              <div className="flex gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
                  style={{ backgroundColor: "var(--accent-light)", color: "#0d9488" }}
                >
                  Y{cls.year_group}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[15px] font-bold truncate" style={{ color: "var(--text-primary)" }}>
                      {cls.name}
                    </span>
                    <span className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
                      · {cls.exam_board} · {cls.tier}
                    </span>
                  </div>

                  <p className="text-[13px] mb-2" style={{ color: "var(--text-secondary)" }}>
                    {cls.student_count} students
                    {cls.last_assessment
                      ? ` · Last assessed ${timeAgo(cls.last_assessment.date)}`
                      : " · No assessments yet"}
                  </p>

                  {cls.last_assessment && (
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-[13px] font-medium" style={{ color: "var(--text-secondary)" }}>
                            Last result:
                          </span>
                          <span
                            className="text-[15px] font-bold tabular-nums"
                            style={{ color: pctColor(cls.last_assessment.avg_pct) }}
                          >
                            {Math.round(cls.last_assessment.avg_pct)}%
                          </span>
                          <span className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
                            avg on {cls.last_assessment.title}
                          </span>
                        </div>
                        {cls.trend.length >= 2 && <Sparkline data={cls.trend} />}
                      </div>

                      {cls.weak_topics.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[13px]" style={{ color: "var(--text-secondary)" }}>Weak:</span>
                          {cls.weak_topics.slice(0, 3).map((t) => (
                            <span key={t} className="topic-tag">{t}</span>
                          ))}
                          {cls.weak_topics.length > 3 && (
                            <span className="text-[12px] font-medium" style={{ color: "var(--text-secondary)" }}>
                              +{cls.weak_topics.length - 3} more
                            </span>
                          )}
                        </div>
                      )}

                      {cls.students_below_target > 0 && (
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#dc2626" }} />
                          <span className="text-[13px] font-medium" style={{ color: "#dc2626" }}>
                            {cls.students_below_target}{" "}
                            {cls.students_below_target === 1 ? "student" : "students"} below target
                          </span>
                        </div>
                      )}

                      <div
                        className="flex items-start gap-2 rounded-xl px-3 py-2.5 mt-1"
                        style={{ backgroundColor: "var(--accent-light)" }}
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 mt-0.5">
                          <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.5 3h1v1h-1V4zm0 2.5h1v5h-1v-5z" fill="#0d9488" />
                        </svg>
                        <span className="text-[13px] leading-snug" style={{ color: "#0d9488" }}>
                          {cls.suggested_action}
                        </span>
                      </div>
                    </div>
                  )}

                  {!cls.last_assessment && (
                    <div
                      className="flex items-center gap-2 rounded-xl px-3 py-2.5"
                      style={{ backgroundColor: "var(--accent-light)" }}
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.5 3h1v1h-1V4zm0 2.5h1v5h-1v-5z" fill="#0d9488" />
                      </svg>
                      <span className="text-[13px]" style={{ color: "#0d9488" }}>
                        Run your first assessment to unlock insights
                      </span>
                    </div>
                  )}
                </div>

                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 mt-1">
                  <path d="M6 4l4 4-4 4" stroke="var(--text-secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
