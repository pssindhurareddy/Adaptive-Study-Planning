import { Skeleton } from "@/components/ui/skeleton";
// Analytics Dashboard - Enhanced with defensive checks and BigInt support
import { useTheme } from "next-themes";
import { useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TooltipProps } from "recharts";
import {
  useAnalytics,
  useDashboard,
  useSubjectLeaderboard,
} from "../hooks/use-study-data";
import type { SubjectLeaderboardEntry } from "../types/study";

// ── Dark palette ──────────────────────────────────────────────────────────────

const dark = {
  card: "#1e2128",
  cardAlt: "#252830",
  border: "#2d3748",
  textPrimary: "#f1f5f9",
  textSecondary: "#94a3b8",
  textMuted: "#64748b",
};

// ── Tooltip ───────────────────────────────────────────────────────────────────

function makeChartTooltip(isDark: boolean) {
  return function ChartTooltipInner({
    active,
    payload,
    label,
  }: TooltipProps<number, string>) {
    if (!active || !payload?.length) return null;
    return (
      <div
        className="rounded-md px-3 py-2 shadow text-sm"
        style={{
          background: isDark ? dark.card : "#ffffff",
          border: `1px solid ${isDark ? dark.border : "#e5e7eb"}`,
        }}
      >
        <p
          className="text-xs mb-1"
          style={{ color: isDark ? dark.textMuted : "#6b7280" }}
        >
          {label}
        </p>
        {payload.map((entry) => (
          <div
            key={String(entry.dataKey)}
            className="flex items-center gap-1.5"
          >
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: String(entry.color) }}
            />
            <span
              className="font-semibold"
              style={{ color: isDark ? dark.textPrimary : "#111827" }}
            >
              {entry.value}
            </span>
            <span style={{ color: isDark ? dark.textMuted : "#6b7280" }}>
              {entry.name}
            </span>
          </div>
        ))}
      </div>
    );
  };
}

// ── Section card ──────────────────────────────────────────────────────────────

function SectionCard({
  title,
  sub,
  children,
  ocid,
  isDark,
}: {
  title: string;
  sub?: string;
  children: React.ReactNode;
  ocid?: string;
  isDark: boolean;
}) {
  return (
    <div
      className="rounded-lg p-5"
      style={{
        background: isDark ? dark.card : "#ffffff",
        border: `1px solid ${isDark ? dark.border : "#e5e7eb"}`,
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      }}
      data-ocid={ocid}
    >
      <div className="mb-4">
        <h2
          className="font-semibold text-base"
          style={{ color: isDark ? dark.textPrimary : "#1f2937" }}
        >
          {title}
        </h2>
        {sub && (
          <p
            className="text-xs font-mono mt-0.5"
            style={{ color: isDark ? dark.textMuted : "#6b7280" }}
          >
            {sub}
          </p>
        )}
      </div>
      {children}
    </div>
  );
}

// ── Stat box ──────────────────────────────────────────────────────────────────

function StatBox({
  label,
  value,
  note,
  ocid,
  isDark,
}: {
  label: string;
  value: string;
  note?: string;
  ocid?: string;
  isDark: boolean;
}) {
  return (
    <div
      className="rounded-lg p-4"
      style={{
        background: isDark ? dark.card : "#ffffff",
        border: `1px solid ${isDark ? dark.border : "#e5e7eb"}`,
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      }}
      data-ocid={ocid}
    >
      <p
        className="text-xs font-semibold uppercase tracking-wide mb-1"
        style={{ color: isDark ? dark.textMuted : "#6b7280" }}
      >
        {label}
      </p>
      <p
        className="text-3xl font-bold leading-none"
        style={{ color: isDark ? dark.textPrimary : "#111827" }}
      >
        {value}
      </p>
      {note && (
        <p
          className="text-xs font-mono mt-1.5"
          style={{ color: isDark ? "#60a5fa" : "#2563eb" }}
        >
          {note}
        </p>
      )}
    </div>
  );
}

// ── Rank medal ────────────────────────────────────────────────────────────────

function RankMedal({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <span title="1st Place" className="text-lg">
        🥇
      </span>
    );
  if (rank === 2)
    return (
      <span title="2nd Place" className="text-lg">
        🥈
      </span>
    );
  if (rank === 3)
    return (
      <span title="3rd Place" className="text-lg">
        🥉
      </span>
    );
  return (
    <span
      className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold rounded-full"
      style={{ background: dark.cardAlt, color: dark.textMuted }}
    >
      {rank}
    </span>
  );
}

// ── Leaderboard row ───────────────────────────────────────────────────────────

function LeaderboardRow({
  entry,
  rank,
  isDark,
}: {
  entry: SubjectLeaderboardEntry;
  rank: number;
  isDark: boolean;
}) {
  const rate = Math.round(Number(entry.completionRate));
  const isTop = rank <= 3;

  const rateColor =
    rate >= 70
      ? isDark
        ? "#4ade80"
        : "#16a34a"
      : rate >= 40
        ? isDark
          ? "#fbbf24"
          : "#ca8a04"
        : isDark
          ? "#f87171"
          : "#dc2626";

  return (
    <tr
      className="last:border-0 transition-colors"
      style={{ borderBottom: `1px solid ${isDark ? dark.border : "#f3f4f6"}` }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLTableRowElement).style.background = isDark
          ? dark.cardAlt
          : "#f9fafb";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLTableRowElement).style.background =
          "transparent";
      }}
      data-ocid={`leaderboard-row-${rank}`}
    >
      <td className="py-3 px-4 w-12 text-center">
        <RankMedal rank={rank} />
      </td>
      <td className="py-3 px-4">
        <span
          className="text-sm font-medium"
          style={{
            color: isTop
              ? isDark
                ? dark.textPrimary
                : "#111827"
              : isDark
                ? dark.textSecondary
                : "#374151",
          }}
        >
          {entry.subjectName}
        </span>
      </td>
      <td
        className="py-3 px-4 text-right font-mono text-sm"
        style={{ color: isDark ? dark.textSecondary : "#4b5563" }}
      >
        {Number(entry.totalTasks)}
      </td>
      <td
        className="py-3 px-4 text-right font-mono text-sm"
        style={{ color: isDark ? dark.textSecondary : "#4b5563" }}
      >
        {Number(entry.completedTasks)}
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2 justify-end">
          <div
            className="w-20 rounded-full overflow-hidden h-2"
            style={{ background: isDark ? "#2d3748" : "#f3f4f6" }}
          >
            <div
              className="h-full rounded-full"
              style={{ width: `${rate}%`, backgroundColor: rateColor }}
            />
          </div>
          <span
            className="font-mono text-sm font-semibold w-10 text-right"
            style={{ color: rateColor }}
          >
            {rate}%
          </span>
        </div>
      </td>
    </tr>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function AnalyticsSkeleton() {
  return (
    <div className="p-6 space-y-5">
      <div className="space-y-1.5">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-4 w-56" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-56 rounded-lg" />
      <Skeleton className="h-64 rounded-lg" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Skeleton className="h-56 rounded-lg" />
        <Skeleton className="h-56 rounded-lg" />
      </div>
    </div>
  );
}

// ── Subject colors ─────────────────────────────────────────────────────────────

const BAR_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
];

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Analytics() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const { data: analyticsData, isLoading: analyticsLoading } = useAnalytics();
  const { data: dashboardData, isLoading: dashboardLoading } = useDashboard();
  const { data: leaderboardData, isLoading: leaderboardLoading } =
    useSubjectLeaderboard();

  const focusHistory = useMemo(
    () =>
      (analyticsData?.focusScoreHistory ?? []).map((d) => ({
        date: (d.date || "").length > 5 ? (d.date || "").slice(5) : (d.date || ""),
        score: Number(d.score || 0),
      })),
    [analyticsData],
  );

  const subjectBarData = useMemo(
    () =>
      (analyticsData?.subjectPerformance ?? []).map((s) => ({
        name:
          (s.subjectName || "").length > 10
            ? `${(s.subjectName || "").slice(0, 9)}…`
            : (s.subjectName || ""),
        tasks: Number(s.completedTasks || 0),
        score: Number(s.avgScore || 0),
      })),
    [analyticsData],
  );

  if (analyticsLoading || dashboardLoading || leaderboardLoading) {
    return <AnalyticsSkeleton />;
  }

  const scores = focusHistory.map((d) => d.score);
  const avgFocus =
    scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;
  const totalHours = (analyticsData?.weeklyHours ?? []).reduce(
    (sum, d) => sum + Number(d.hours),
    0,
  );
  const totalSessions = focusHistory.length;
  const focusScore = Number(dashboardData?.focusScore ?? 0);
  const completedTasks = Number(dashboardData?.completedTasks ?? 0);
  const totalTasks = Number(dashboardData?.totalTasks ?? 0);
  const completionRate =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const leaderboard = [...(leaderboardData ?? [])].sort(
    (a, b) => Number(b.completionRate) - Number(a.completionRate),
  );

  const gridColor = isDark ? "#2d3748" : "#f3f4f6";
  const axisColor = isDark ? dark.textMuted : "#9ca3af";

  return (
    <div
      className="p-6 md:p-8 max-w-5xl flex flex-col gap-5"
      style={{ background: isDark ? "#13151a" : "#f9fafb", minHeight: "100%" }}
      data-ocid="analytics-page"
    >
      {/* Page header */}
      <div>
        <h1
          className="text-2xl font-bold"
          style={{ color: isDark ? dark.textPrimary : "#111827" }}
        >
          Analytics
        </h1>
        <p
          className="text-sm mt-1"
          style={{ color: isDark ? dark.textMuted : "#6b7280" }}
        >
          Study performance overview
        </p>
      </div>

      {/* Weekly Summary Stats */}
      <div
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        data-ocid="weekly-summary"
      >
        <StatBox
          label="Weekly Study Hours"
          value={`${totalHours.toFixed(1)}h`}
          ocid="stat-weekly-hours"
          isDark={isDark}
        />
        <StatBox
          label="Avg Focus Score"
          value={`${avgFocus.toFixed(0)}`}
          ocid="stat-avg-focus"
          isDark={isDark}
        />
        <StatBox
          label="Total Sessions"
          value={`${totalSessions}`}
          ocid="stat-total-sessions"
          isDark={isDark}
        />
      </div>

      {/* Subject Performance Leaderboard */}
      <SectionCard
        title="Subject Performance Leaderboard"
        ocid="leaderboard-section"
        isDark={isDark}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr
                style={{
                  borderBottom: `1px solid ${isDark ? dark.border : "#e5e7eb"}`,
                }}
              >
                {[
                  { label: "Rank", align: "center" },
                  { label: "Subject Name", align: "left" },
                  { label: "Total Tasks", align: "right" },
                  { label: "Completed", align: "right" },
                  { label: "Completion Rate (%)", align: "right" },
                ].map((col) => (
                  <th
                    key={col.label}
                    className="pb-2 px-4 text-xs font-semibold uppercase tracking-wide"
                    style={{
                      textAlign: col.align as React.CSSProperties["textAlign"],
                      color: isDark ? dark.textMuted : "#6b7280",
                    }}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leaderboard.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-10 text-center text-sm"
                    style={{ color: isDark ? dark.textMuted : "#9ca3af" }}
                    data-ocid="leaderboard-empty"
                  >
                    No subjects yet. Add subjects and complete tasks to see
                    rankings.
                  </td>
                </tr>
              ) : (
                leaderboard.map((entry, i) => (
                  <LeaderboardRow
                    key={entry.subjectId}
                    entry={entry}
                    rank={i + 1}
                    isDark={isDark}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
        {leaderboard.length > 0 && (
          <p
            className="mt-3 text-xs"
            style={{ color: isDark ? dark.textMuted : "#9ca3af" }}
          >
            Subjects ranked by completion rate
          </p>
        )}
      </SectionCard>

      {/* 7-Day Focus Score History */}
      <SectionCard
        title="7-Day Focus Score History"
        ocid="focus-history-chart"
        isDark={isDark}
      >
        <div style={{ height: "240px" }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={focusHistory}
              margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
            >
              <defs>
                <linearGradient id="focusAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="#3b82f6"
                    stopOpacity={isDark ? 0.3 : 0.18}
                  />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                stroke={gridColor}
                strokeDasharray="3 3"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fill: axisColor, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: axisColor, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={makeChartTooltip(isDark)} />
              <Area
                type="monotone"
                dataKey="score"
                name="Focus Score"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#focusAreaGrad)"
                dot={{ fill: "#3b82f6", r: 3, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <p
          className="mt-2 text-xs"
          style={{ color: isDark ? dark.textMuted : "#9ca3af" }}
        >
          Focus score over the last 7 days
        </p>
      </SectionCard>

      {/* Subject Performance Chart */}
      <SectionCard
        title="Subject Performance Chart"
        ocid="subject-chart"
        isDark={isDark}
      >
        <div style={{ height: "240px" }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={subjectBarData}
              margin={{ top: 20, right: 8, left: -16, bottom: 0 }}
            >
              <CartesianGrid
                stroke={gridColor}
                strokeDasharray="3 3"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tick={{ fill: axisColor, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: axisColor, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={makeChartTooltip(isDark)} />
              <Bar
                dataKey="tasks"
                name="Completed Tasks"
                radius={[4, 4, 0, 0]}
                maxBarSize={36}
              >
                <LabelList
                  dataKey="tasks"
                  position="top"
                  style={{
                    fill: isDark ? dark.textSecondary : "#6b7280",
                    fontSize: 11,
                  }}
                />
                {subjectBarData.map((entry, idx) => (
                  <Cell
                    key={`cell-${entry.name}`}
                    fill={BAR_COLORS[idx % BAR_COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p
          className="mt-2 text-xs"
          style={{ color: isDark ? dark.textMuted : "#9ca3af" }}
        >
          Completed tasks per subject
        </p>
      </SectionCard>

      {/* Overall completion banner */}
      <div
        className="rounded-lg p-4 flex items-center gap-6 flex-wrap"
        style={{
          background: isDark ? dark.card : "#ffffff",
          border: `1px solid ${isDark ? dark.border : "#e5e7eb"}`,
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        }}
        data-ocid="completion-banner"
      >
        <div>
          <p
            className="text-xs font-semibold uppercase tracking-wide mb-1"
            style={{ color: isDark ? dark.textMuted : "#6b7280" }}
          >
            Task Completion Rate
          </p>
          <p
            className="text-3xl font-bold leading-none"
            style={{ color: isDark ? "#60a5fa" : "#1d4ed8" }}
          >
            {completionRate.toFixed(0)}%
          </p>
          <p
            className="text-xs mt-1"
            style={{ color: isDark ? dark.textMuted : "#9ca3af" }}
          >
            completed / total tasks
          </p>
        </div>
        <div className="flex-1" style={{ minWidth: "180px" }}>
          <div
            className="flex items-center justify-between text-xs mb-1 font-mono"
            style={{ color: isDark ? dark.textMuted : "#6b7280" }}
          >
            <span>Current Focus</span>
            <span
              className="font-semibold"
              style={{ color: isDark ? dark.textSecondary : "#374151" }}
            >
              {focusScore}/100
            </span>
          </div>
          <div
            className="w-full rounded-full overflow-hidden h-2.5"
            style={{ background: isDark ? "#2d3748" : "#f3f4f6" }}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(100, completionRate)}%`,
                background: "#3b82f6",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
