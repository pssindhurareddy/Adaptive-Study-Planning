import { Skeleton } from "@/components/ui/skeleton";
// Refreshed Analytics metadata
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  Clock,
  ListOrdered,
  RefreshCw,
  StopCircle,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useMemo } from "react";
import {
  useActiveSession,
  useDailySchedule,
  useDashboard,
  useEndFocus,
  usePriorityQueue,
  useStartFocus,
  useTaskStats,
  useTasks,
  useUser,
  useUpdateUser,
} from "../hooks/use-study-data";
import { TaskDifficulty, TaskStatus } from "../types/study";

// ── Dark-mode color palette ───────────────────────────────────────────────────

const dark = {
  card: "#1e2128",
  cardAlt: "#252830",
  border: "#2d3748",
  textPrimary: "#f1f5f9",
  textSecondary: "#94a3b8",
  textMuted: "#64748b",
  badgeBlue: { bg: "#1e3a5f", text: "#93c5fd" },
  badgeGreen: { bg: "#1a3d2b", text: "#6ee7b7" },
  badgeYellow: { bg: "#3d2b00", text: "#fcd34d" },
  badgeRed: { bg: "#3d1515", text: "#fca5a5" },
  badgeGray: { bg: "#1e2128", text: "#94a3b8" },
  inputBg: "#252830",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const difficultyColorsLight: Record<
  TaskDifficulty,
  { bg: string; text: string }
> = {
  [TaskDifficulty.Low]: { bg: "#dcfce7", text: "#166534" },
  [TaskDifficulty.Medium]: { bg: "#fef9c3", text: "#854d0e" },
  [TaskDifficulty.High]: { bg: "#fee2e2", text: "#991b1b" },
};

const difficultyColorsDark: Record<
  TaskDifficulty,
  { bg: string; text: string }
> = {
  [TaskDifficulty.Low]: { bg: dark.badgeGreen.bg, text: dark.badgeGreen.text },
  [TaskDifficulty.Medium]: {
    bg: dark.badgeYellow.bg,
    text: dark.badgeYellow.text,
  },
  [TaskDifficulty.High]: { bg: dark.badgeRed.bg, text: dark.badgeRed.text },
};

function DiffBadge({
  diff,
  isDark,
}: { diff: TaskDifficulty | string; isDark: boolean }) {
  const d = diff as TaskDifficulty;
  const palette = isDark ? difficultyColorsDark : difficultyColorsLight;
  const c =
    palette[d] ??
    (isDark
      ? { bg: dark.badgeGray.bg, text: dark.badgeGray.text }
      : { bg: "#f3f4f6", text: "#374151" });
  return (
    <span
      className="text-xs px-2 py-0.5 rounded font-medium"
      style={{ background: c.bg, color: c.text }}
    >
      {diff}
    </span>
  );
}

function ScoreBadge({ score, isDark }: { score: number; isDark: boolean }) {
  const getBg = () => {
    if (isDark)
      return score >= 70
        ? dark.badgeGreen.bg
        : score >= 40
          ? dark.badgeYellow.bg
          : dark.badgeRed.bg;
    return score >= 70 ? "#dcfce7" : score >= 40 ? "#fef9c3" : "#fee2e2";
  };
  const getText = () => {
    if (isDark)
      return score >= 70
        ? dark.badgeGreen.text
        : score >= 40
          ? dark.badgeYellow.text
          : dark.badgeRed.text;
    return score >= 70 ? "#166534" : score >= 40 ? "#854d0e" : "#991b1b";
  };
  return (
    <span
      className="text-xs font-mono px-2 py-0.5 rounded"
      style={{ background: getBg(), color: getText() }}
    >
      {score}
    </span>
  );
}

// ── Section Header ────────────────────────────────────────────────────────────

function SectionHeader({
  icon,
  title,
  isDark,
}: {
  icon: React.ReactNode;
  title: string;
  isDark: boolean;
}) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-1">
        <span style={{ color: isDark ? dark.textSecondary : "#374151" }}>
          {icon}
        </span>
        <h2
          style={{
            fontSize: "1.05rem",
            fontWeight: 600,
            color: isDark ? dark.textPrimary : "#1f2937",
          }}
        >
          {title}
        </h2>
      </div>
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  accent,
  ocid,
  isDark,
}: {
  label: string;
  value: string | number;
  sub: string;
  accent: string;
  ocid?: string;
  isDark: boolean;
}) {
  return (
    <div
      className="rounded-lg p-5 flex flex-col gap-1"
      style={{
        background: isDark ? dark.card : "#ffffff",
        border: `1px solid ${isDark ? dark.border : "#e5e7eb"}`,
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      }}
      data-ocid={ocid}
    >
      <p
        style={{
          fontSize: "12px",
          fontWeight: 500,
          color: isDark ? dark.textMuted : "#6b7280",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontSize: "2rem",
          fontWeight: 700,
          lineHeight: 1.1,
          color: accent,
        }}
      >
        {value}
      </p>
      <p
        style={{ fontSize: "12px", color: isDark ? dark.textMuted : "#9ca3af" }}
      >
        {sub}
      </p>
    </div>
  );
}

// ── Task Stat Box ─────────────────────────────────────────────────────────────

function TaskStatBox({
  label,
  count,
  dotColor,
  bgColor,
  isDark,
}: {
  label: string;
  count: number;
  dotColor: string;
  bgColor: string;
  isDark: boolean;
}) {
  return (
    <div
      className="flex-1 flex flex-col items-center justify-center rounded-lg py-5 px-4 text-center"
      style={{
        background: isDark ? dark.cardAlt : bgColor,
        border: `1px solid ${isDark ? dark.border : "#e5e7eb"}`,
      }}
    >
      <span
        style={{
          fontSize: "2rem",
          fontWeight: 700,
          color: dotColor,
          lineHeight: 1,
        }}
      >
        {count}
      </span>
      <span
        className="flex items-center gap-1.5 mt-2"
        style={{
          fontSize: "13px",
          color: isDark ? dark.textSecondary : "#374151",
          fontWeight: 500,
        }}
      >
        <span
          className="w-2 h-2 rounded-full inline-block"
          style={{ background: dotColor, flexShrink: 0 }}
        />
        {label}
      </span>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function DashSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-6 max-w-5xl">
      <Skeleton className="h-7 w-56" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28 rounded-lg" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton className="h-64 rounded-lg md:col-span-2" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
      <Skeleton className="h-36 rounded-lg" />
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const { data: dashboard, isLoading } = useDashboard();
  const { data: tasks = [] } = useTasks();
  const { data: schedule = [], refetch: refetchSchedule } = useDailySchedule();
  const { data: priorityQueue = [] } = usePriorityQueue();
  const { data: taskStats } = useTaskStats();
  const { data: activeSession } = useActiveSession();
  const startFocus = useStartFocus();
  const endFocus = useEndFocus();
  const qc = useQueryClient();

  const scheduledTasks = useMemo(
    () => tasks.filter((t) => t.status === TaskStatus.Scheduled),
    [tasks],
  );

  const topPriorityQueue = useMemo(
    () => priorityQueue.slice(0, 5),
    [priorityQueue],
  );

  const completedTasks = useMemo(
    () => tasks.filter((t) => t.status === TaskStatus.Completed),
    [tasks],
  );

  const { data: userData } = useUser();
  const updateUser = useUpdateUser();

  if (isLoading) return <DashSkeleton />;

  const focusScore = Number(dashboard?.focusScore ?? 0);
  const studyStreak = Number(dashboard?.studyStreak ?? 0);
  const dailyProgress = Number(dashboard?.dailyProgress ?? 0);
  const totalTasks = Number(dashboard?.totalTasks ?? 0);
  const stabilityScore = Number(dashboard?.stabilityScore ?? 0);

  const scheduledCount = taskStats?.scheduledCount ?? 0;
  const inProgressCount = taskStats?.inProgressCount ?? 0;
  const completedCount = taskStats?.completedCount ?? 0;

  const activeTaskTitle = activeSession
    ? (activeSession.taskTitle || tasks.find((t) => t.id === activeSession.taskId)?.title)
    : null;

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });



  const handleRefreshSchedule = () => {
    qc.invalidateQueries({ queryKey: ["dailySchedule"] });
    qc.invalidateQueries({ queryKey: ["priorityQueue"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
  };

  // Shared card style
  const cardStyle = {
    background: isDark ? dark.card : "#ffffff",
    border: `1px solid ${isDark ? dark.border : "#e5e7eb"}`,
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  };

  const rowStyle = {
    background: isDark ? dark.cardAlt : "#f9fafb",
    border: `1px solid ${isDark ? dark.border : "#e5e7eb"}`,
  };

  const emptyStateStyle = {
    background: isDark ? dark.cardAlt : "#f9fafb",
    border: `1px dashed ${isDark ? dark.border : "#d1d5db"}`,
  };

  return (
    <div
      className="p-6 md:p-8 flex flex-col gap-6 max-w-5xl"
      style={{ background: isDark ? "#13151a" : "#f9fafb", minHeight: "100%" }}
    >
      {/* Page header */}
      <div>
        <h1
          style={{
            fontSize: "1.4rem",
            fontWeight: 700,
            color: isDark ? dark.textPrimary : "#111827",
          }}
        >
          Dashboard
        </h1>
        <p
          style={{
            fontSize: "13px",
            color: isDark ? dark.textMuted : "#6b7280",
            marginTop: "2px",
          }}
        >
          {today}
        </p>
      </div>

      <div
        className="flex items-center gap-3 p-3 rounded-lg"
        style={{
          background: isDark ? dark.card : "#fff",
          border: `1px solid ${isDark ? dark.border : "#e5e7eb"}`,
        }}
      >
        <Clock size={16} color={isDark ? "#60a5fa" : "#2563eb"} />
        <div className="flex-1">
          <p className="text-xs font-semibold" style={{ color: isDark ? dark.textSecondary : "#374151" }}>
            Schedule Start Preference
          </p>
          <p className="text-[11px]" style={{ color: isDark ? dark.textMuted : "#6b7280" }}>
            Set when your daily study blocks begin
          </p>
        </div>
        <input
          type="time"
          value={userData?.startTime ? (userData.startTime.includes('AM') || userData.startTime.includes('PM') ? "08:00" : userData.startTime) : "08:00"}
          onChange={(e) => {
            const newTime = e.target.value;
            // Optimistic update
            qc.setQueryData(["user"], (old: any) => ({ ...old, startTime: newTime }));
            
            if (userData) {
              updateUser.mutate({
                name: userData.name || "Student",
                maxDailyHours: userData.maxDailyHours || 8,
                fatigueLevel: userData.fatigueLevel || 0,
                startTime: newTime
              }, {
                onSuccess: () => {
                  // Force immediate refresh of schedule dependencies
                  qc.invalidateQueries({ queryKey: ["dailySchedule"] });
                  qc.invalidateQueries({ queryKey: ["user"] });
                }
              });
            }
          }}
          className="bg-transparent border rounded px-2 py-1 text-sm outline-none"
          style={{
            color: isDark ? dark.textPrimary : "#111827",
            borderColor: isDark ? dark.border : "#d1d5db",
          }}
        />
      </div>

      {/* ── TOP ROW: 4 Stat Cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          label="Focus Score"
          value={focusScore}
          sub="out of 100"
          accent="#4f46e5"
          ocid="focus-score-card"
          isDark={isDark}
        />
        <StatCard
          label="Study Streak"
          value={`${studyStreak}d`}
          sub="consecutive days"
          accent="#d97706"
          ocid="study-streak-card"
          isDark={isDark}
        />
        <StatCard
          label="Daily Progress"
          value={`${completedCount}/${totalTasks}`}
          sub="tasks completed"
          accent="#059669"
          ocid="daily-progress-card"
          isDark={isDark}
        />
        <StatCard
          label="Stability Score"
          value={stabilityScore}
          sub="consistency metric"
          accent="#7c3aed"
          ocid="stability-score-card"
          isDark={isDark}
        />
      </div>

      {/* ── Active Session Banner ── */}
      {activeSession && (
        <div
          className="rounded-lg p-4 md:p-5"
          style={{
            background: isDark ? "#1a2744" : "#eff6ff",
            border: `1px solid ${isDark ? "#2a4a8c" : "#bfdbfe"}`,
          }}
          data-ocid="active-focus-panel"
        >
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4 flex-1">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse flex-shrink-0" />
              <div className="flex-1">
                <p
                  className="text-xs font-medium"
                  style={{ color: isDark ? "#93c5fd" : "#1d4ed8" }}
                >
                  {activeSession.isBreak ? "Break" : "Focus Session"} · Session #{activeSession.sessionNumber}
                </p>
                <p
                  className="font-semibold text-sm mt-0.5"
                  style={{ color: isDark ? dark.textPrimary : "#1e40af" }}
                >
                  {activeTaskTitle}
                </p>
              </div>
              <div className="flex items-center gap-1 px-3 py-1.5 rounded text-sm font-semibold text-blue-400">
                <Clock size={14} />
                <span>25 min</span>
              </div>
            </div>
            <div className="flex items-center gap-2">

              <button
                type="button"
                onClick={() => endFocus.mutate()}
                disabled={endFocus.isPending}
                className="flex items-center gap-1.5 px-3 py-2 rounded text-sm font-medium disabled:opacity-50 transition-colors"
                style={{
                  background: isDark ? dark.cardAlt : "#1f2937",
                  color: "#fff",
                  border: `1px solid ${isDark ? dark.border : "transparent"}`,
                }}
                data-ocid="end-session-btn"
              >
                <StopCircle size={13} />
                End Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SECOND ROW: Schedule + Priority Queue ─────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Today's Schedule (wide left) */}
        <div
          className="rounded-lg p-5 md:col-span-2"
          style={cardStyle}
          data-ocid="schedule-section"
        >
          <div className="flex items-start justify-between mb-1">
            <SectionHeader
              icon={<CalendarClock size={16} />}
              title="Today's Schedule"
              isDark={isDark}
            />
            <button
              type="button"
              onClick={handleRefreshSchedule}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm"
              style={{
                background: isDark ? dark.cardAlt : "#f3f4f6",
                border: `1px solid ${isDark ? dark.border : "#d1d5db"}`,
                color: isDark ? dark.textSecondary : "#374151",
                flexShrink: 0,
              }}
              data-ocid="refresh-schedule-btn"
            >
              <RefreshCw size={12} />
              Refresh
            </button>
          </div>

          {schedule.length === 0 ? (
            <div
              className="text-center py-10 rounded-md"
              style={emptyStateStyle}
              data-ocid="schedule-empty-state"
            >
              <CalendarClock
                size={28}
                style={{
                  color: isDark ? dark.textMuted : "#9ca3af",
                  margin: "0 auto 8px",
                }}
              />
              <p
                style={{
                  color: isDark ? dark.textSecondary : "#374151",
                  fontSize: "14px",
                  fontWeight: 500,
                }}
              >
                No tasks scheduled today
              </p>
              <p
                style={{
                  color: isDark ? dark.textMuted : "#9ca3af",
                  fontSize: "12px",
                  marginTop: "4px",
                }}
              >
                Add tasks on the Tasks page to generate a schedule
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {schedule.map((block, idx) => (
                <div
                  key={`${block.taskId}-${idx}`}
                  className="flex items-center gap-3 rounded-md px-3 py-3"
                  style={rowStyle}
                  data-ocid="schedule-block-row"
                >
                  <span
                    className="font-mono text-xs px-2 py-1 rounded"
                    style={{
                      background: isDark ? "#1e2f5c" : "#e0e7ff",
                      color: isDark ? "#93c5fd" : "#4338ca",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}
                  >
                    {block.timeSlot}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p
                      className="font-medium truncate"
                      style={{
                        fontSize: "13px",
                        color: isDark ? dark.textPrimary : "#111827",
                      }}
                    >
                      {block.taskTitle}
                    </p>
                    <p
                      style={{
                        fontSize: "11px",
                        color: isDark ? dark.textMuted : "#6b7280",
                      }}
                    >
                      {block.subjectName}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className="flex items-center gap-1 text-xs"
                      style={{ color: isDark ? dark.textMuted : "#6b7280" }}
                    >
                      <Clock size={11} />
                      {block.estimatedMinutes}m
                    </span>
                    <ScoreBadge score={block.priorityScore} isDark={isDark} />
                    <DiffBadge diff={block.difficulty} isDark={isDark} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Priority Queue (right) */}
        <div
          className="rounded-lg p-5"
          style={cardStyle}
          data-ocid="priority-queue-section"
        >
          <SectionHeader
            icon={<ListOrdered size={16} />}
            title="Priority Queue"
            isDark={isDark}
          />

          {priorityQueue.length === 0 ? (
            <div
              className="text-center py-8 rounded-md"
              style={emptyStateStyle}
              data-ocid="priority-empty-state"
            >
              <ListOrdered
                size={24}
                style={{
                  color: isDark ? dark.textMuted : "#9ca3af",
                  margin: "0 auto 6px",
                }}
              />
              <p
                style={{
                  fontSize: "13px",
                  color: isDark ? dark.textSecondary : "#6b7280",
                }}
              >
                No pending tasks
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {topPriorityQueue.map((item, idx) => (
                <div
                  key={item.taskId}
                  className="flex items-start gap-2 rounded-md px-3 py-2.5"
                  style={rowStyle}
                  data-ocid="priority-queue-row"
                >
                  <span
                    className="font-mono font-bold text-sm w-5 text-center flex-shrink-0 mt-0.5"
                    style={{
                      color:
                        idx === 0
                          ? "#f87171"
                          : idx === 1
                            ? "#fb923c"
                            : isDark
                              ? dark.textSecondary
                              : "#374151",
                    }}
                  >
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p
                      className="font-medium truncate"
                      style={{
                        fontSize: "13px",
                        color: isDark ? dark.textPrimary : "#111827",
                      }}
                    >
                      {item.taskTitle}
                    </p>
                    <p
                      style={{
                        fontSize: "11px",
                        color: isDark ? dark.textMuted : "#6b7280",
                      }}
                    >
                      {item.subjectName} · due {item.deadline}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <ScoreBadge score={item.priorityScore} isDark={isDark} />
                      <DiffBadge diff={item.difficulty} isDark={isDark} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── THIRD ROW: Task Statistics ─────────────────────────────────────── */}
      <div
        className="rounded-lg p-5"
        style={cardStyle}
        data-ocid="task-stats-section"
      >
        <SectionHeader
          icon={<TrendingUp size={16} />}
          title="Task Statistics"
          isDark={isDark}
        />
        <div className="flex gap-3">
          <TaskStatBox
            label="Scheduled"
            count={scheduledCount}
            dotColor="#3b82f6"
            bgColor="#eff6ff"
            isDark={isDark}
          />
          <TaskStatBox
            label="In Progress"
            count={inProgressCount}
            dotColor="#d97706"
            bgColor="#fffbeb"
            isDark={isDark}
          />
          <TaskStatBox
            label="Completed"
            count={completedCount}
            dotColor="#059669"
            bgColor="#f0fdf4"
            isDark={isDark}
          />
        </div>
      </div>

      {/* ── BOTTOM ROW: Quick Start Focus ─────────────────────────────────── */}
      <div
          className="rounded-lg p-5"
          style={cardStyle}
          data-ocid="quick-start-section"
        >
          <SectionHeader
            icon={<Zap size={16} />}
            title="Quick Start Focus"
            isDark={isDark}
          />

          {scheduledTasks.length === 0 ? (
            <div
              className="text-center py-8 rounded-md"
              style={emptyStateStyle}
              data-ocid="quick-start-empty"
            >
              <BookOpen
                size={24}
                style={{
                  color: isDark ? dark.textMuted : "#9ca3af",
                  margin: "0 auto 6px",
                }}
              />
              <p
                style={{
                  fontSize: "13px",
                  color: isDark ? dark.textSecondary : "#6b7280",
                }}
              >
                No scheduled tasks ready to start
              </p>
              <p
                style={{
                  fontSize: "12px",
                  color: isDark ? dark.textMuted : "#9ca3af",
                  marginTop: "4px",
                }}
              >
                Add tasks on the Tasks page and schedule them
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {scheduledTasks.slice(0, 4).map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between rounded-md px-4 py-3"
                  style={rowStyle}
                  data-ocid="quick-start-row"
                >
                  <div className="min-w-0 flex-1">
                    <p
                      className="font-medium truncate"
                      style={{
                        fontSize: "13px",
                        color: isDark ? dark.textPrimary : "#111827",
                      }}
                    >
                      {task.title}
                    </p>
                    <p
                      style={{
                        fontSize: "11px",
                        color: isDark ? dark.textMuted : "#6b7280",
                      }}
                    >
                      {task.subjectName} · {task.estimatedMinutes}m ·{" "}
                      <span>due {task.deadline}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                    <DiffBadge diff={task.difficulty} isDark={isDark} />
                    <button
                      type="button"
                      onClick={() => startFocus.mutate(task.id)}
                      disabled={startFocus.isPending}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium disabled:opacity-50"
                      style={{
                        background: "#4f46e5",
                        color: "#ffffff",
                        border: "none",
                      }}
                      data-ocid="start-focus-btn"
                    >
                      <Clock size={12} />
                      Start
                    </button>
                  </div>
                </div>
              ))}
              {scheduledTasks.length > 4 && (
                <p
                  style={{
                    fontSize: "12px",
                    color: isDark ? dark.textMuted : "#9ca3af",
                    textAlign: "center",
                    paddingTop: "4px",
                  }}
                >
                  +{scheduledTasks.length - 4} more tasks on the Tasks page
                </p>
              )}
            </div>
          )}
        </div>


    </div>
  );
}
