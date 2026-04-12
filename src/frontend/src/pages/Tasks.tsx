import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { mockBackend } from "../../../../vendor/core-infrastructure/dist/mocks/backend.js";
import {
  AlertCircle,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  ListTodo,
  Play,
  Plus,
  StopCircle,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useMemo, useState } from "react";

import {
  useActiveSession,
  useAddSubject,
  useDeleteTask,
  useEndFocus,
  useRemoveSubject,
  useStartFocus,
  useSubjects,
  useTasks,
  useUpdateTaskStatus,
} from "../hooks/use-study-data";
import { addTask } from "../lib/backend-client";
import { TaskDifficulty, TaskStatus } from "../types/study";
import type { TaskUnit } from "../types/study";

// ── Dark palette ──────────────────────────────────────────────────────────────

const dark = {
  card: "#1e2128",
  cardAlt: "#252830",
  border: "#2d3748",
  textPrimary: "#f1f5f9",
  textSecondary: "#94a3b8",
  textMuted: "#64748b",
  inputBg: "#252830",
  badgeBlue: { bg: "#1e3a5f", text: "#93c5fd", border: "#2a5080" },
  badgeGreen: { bg: "#1a3d2b", text: "#6ee7b7", border: "#1e4d30" },
  badgeYellow: { bg: "#3d2b00", text: "#fcd34d", border: "#5c4200" },
  badgeRed: { bg: "#3d1515", text: "#fca5a5", border: "#5c2020" },
  badgeGray: { bg: "#252830", text: "#94a3b8", border: "#2d3748" },
};

// ── Priority Score Calculator ─────────────────────────────────────────────────

const DIFFICULTY_MULTIPLIER: Record<string, number> = {
  [TaskDifficulty.Low]: 1,
  [TaskDifficulty.Medium]: 2,
  [TaskDifficulty.High]: 3,
  Med: 2,
};

function computePriorityScore(task: TaskUnit): number {
  const deadline = task.deadline ? new Date(task.deadline) : null;
  const daysLeft = deadline
    ? Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  let urgency = 20;
  if (daysLeft !== null) {
    if (daysLeft <= 1) urgency = 100;
    else if (daysLeft <= 3) urgency = 80;
    else if (daysLeft <= 7) urgency = 60;
    else if (daysLeft <= 14) urgency = 40;
  }

  const mult = DIFFICULTY_MULTIPLIER[task.difficulty] ?? 1;
  return urgency * mult;
}

// ── Filter types ──────────────────────────────────────────────────────────────

type FilterTab = "All" | TaskStatus;

const FILTER_TABS: { id: FilterTab; label: string }[] = [
  { id: "All", label: "All" },
  { id: TaskStatus.Scheduled, label: "Scheduled" },
  { id: TaskStatus.InProgress, label: "In Progress" },
  { id: TaskStatus.Completed, label: "Completed" },
];

// ── Badge components ──────────────────────────────────────────────────────────

function StatusBadge({ status, isDark }: { status: string; isDark: boolean }) {
  type BadgeCfg = { label: string; bg: string; text: string; border: string };
  const configs: Record<string, BadgeCfg> = isDark
    ? {
        [TaskStatus.Scheduled]: {
          label: "Scheduled",
          bg: dark.badgeBlue.bg,
          text: dark.badgeBlue.text,
          border: dark.badgeBlue.border,
        },
        [TaskStatus.InProgress]: {
          label: "In Progress",
          bg: dark.badgeYellow.bg,
          text: dark.badgeYellow.text,
          border: dark.badgeYellow.border,
        },
        Active: {
          label: "In Progress",
          bg: dark.badgeYellow.bg,
          text: dark.badgeYellow.text,
          border: dark.badgeYellow.border,
        },
        [TaskStatus.Completed]: {
          label: "Completed",
          bg: dark.badgeGreen.bg,
          text: dark.badgeGreen.text,
          border: dark.badgeGreen.border,
        },
      }
    : {
        [TaskStatus.Scheduled]: {
          label: "Scheduled",
          bg: "#eff6ff",
          text: "#1d4ed8",
          border: "#bfdbfe",
        },
        [TaskStatus.InProgress]: {
          label: "In Progress",
          bg: "#fffbeb",
          text: "#b45309",
          border: "#fde68a",
        },
        Active: {
          label: "In Progress",
          bg: "#fffbeb",
          text: "#b45309",
          border: "#fde68a",
        },
        [TaskStatus.Completed]: {
          label: "Completed",
          bg: "#f0fdf4",
          text: "#166534",
          border: "#bbf7d0",
        },
      };

  const cfg =
    configs[status] ??
    (isDark
      ? {
          label: status,
          bg: dark.badgeGray.bg,
          text: dark.badgeGray.text,
          border: dark.badgeGray.border,
        }
      : { label: status, bg: "#f9fafb", text: "#374151", border: "#e5e7eb" });

  return (
    <span
      className="text-xs px-2 py-0.5 rounded-full font-medium"
      style={{
        background: cfg.bg,
        color: cfg.text,
        border: `1px solid ${cfg.border}`,
      }}
    >
      {cfg.label}
    </span>
  );
}

function DiffBadge({
  difficulty,
  isDark,
}: { difficulty: string; isDark: boolean }) {
  type BadgeCfg = { label: string; bg: string; text: string; border: string };
  const configs: Record<string, BadgeCfg> = isDark
    ? {
        [TaskDifficulty.Low]: {
          label: "Low",
          bg: dark.badgeGreen.bg,
          text: dark.badgeGreen.text,
          border: dark.badgeGreen.border,
        },
        [TaskDifficulty.Medium]: {
          label: "Medium",
          bg: dark.badgeYellow.bg,
          text: dark.badgeYellow.text,
          border: dark.badgeYellow.border,
        },
        Med: {
          label: "Medium",
          bg: dark.badgeYellow.bg,
          text: dark.badgeYellow.text,
          border: dark.badgeYellow.border,
        },
        [TaskDifficulty.High]: {
          label: "High",
          bg: dark.badgeRed.bg,
          text: dark.badgeRed.text,
          border: dark.badgeRed.border,
        },
      }
    : {
        [TaskDifficulty.Low]: {
          label: "Low",
          bg: "#f0fdf4",
          text: "#166534",
          border: "#bbf7d0",
        },
        [TaskDifficulty.Medium]: {
          label: "Medium",
          bg: "#fff7ed",
          text: "#c2410c",
          border: "#fed7aa",
        },
        Med: {
          label: "Medium",
          bg: "#fff7ed",
          text: "#c2410c",
          border: "#fed7aa",
        },
        [TaskDifficulty.High]: {
          label: "High",
          bg: "#fef2f2",
          text: "#b91c1c",
          border: "#fecaca",
        },
      };

  const cfg =
    configs[difficulty] ??
    (isDark
      ? {
          label: difficulty,
          bg: dark.badgeGray.bg,
          text: dark.badgeGray.text,
          border: dark.badgeGray.border,
        }
      : {
          label: difficulty,
          bg: "#f9fafb",
          text: "#374151",
          border: "#e5e7eb",
        });

  return (
    <span
      className="text-xs px-2 py-0.5 rounded-full font-medium"
      style={{
        background: cfg.bg,
        color: cfg.text,
        border: `1px solid ${cfg.border}`,
      }}
    >
      {cfg.label}
    </span>
  );
}

// ── Priority Score Bar ────────────────────────────────────────────────────────

function PriorityBar({ score, isDark }: { score: number; isDark: boolean }) {
  const max = 300;
  const pct = Math.min(100, Math.round((score / max) * 100));
  const barColor = pct >= 70 ? "#f87171" : pct >= 40 ? "#fb923c" : "#4ade80";
  return (
    <div className="flex items-center gap-2">
      <div
        className="flex-1 h-1.5 rounded-full overflow-hidden"
        style={{ background: isDark ? "#2d3748" : "#f3f4f6" }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: barColor }}
        />
      </div>
      <span
        className="text-xs font-mono font-semibold w-8 text-right"
        style={{ color: isDark ? dark.textSecondary : "#374151" }}
      >
        {score}
      </span>
    </div>
  );
}

// ── Subject Color Tag ─────────────────────────────────────────────────────────

const SUBJECT_COLORS_LIGHT = [
  { bg: "#f5f3ff", text: "#6d28d9" },
  { bg: "#e0f2fe", text: "#0369a1" },
  { bg: "#ccfbf1", text: "#0f766e" },
  { bg: "#fdf2f8", text: "#9d174d" },
  { bg: "#fffbeb", text: "#92400e" },
  { bg: "#eef2ff", text: "#3730a3" },
];

const SUBJECT_COLORS_DARK = [
  { bg: "#2d1f5e", text: "#c4b5fd" },
  { bg: "#0c2844", text: "#7dd3fc" },
  { bg: "#0d2e2a", text: "#5eead4" },
  { bg: "#2d0f28", text: "#f9a8d4" },
  { bg: "#2d1f00", text: "#fbbf24" },
  { bg: "#1e2044", text: "#a5b4fc" },
];

function subjectColorIdx(subjectId: string) {
  let hash = 0;
  for (let i = 0; i < subjectId.length; i++) {
    hash = (hash * 31 + subjectId.charCodeAt(i)) % SUBJECT_COLORS_LIGHT.length;
  }
  return hash;
}

// ── Task Card ─────────────────────────────────────────────────────────────────

function TaskCard({
  task,
  isCurrentlyActive,
  onStart,
  onComplete,
  onDelete,
  isStarting,
  isCompleting,
  isDeleting,
  isDark,
}: {
  task: TaskUnit;
  isCurrentlyActive: boolean;
  onStart: (id: number) => void;
  onComplete: (id: number) => void;
  onDelete: (id: number) => void;
  isStarting: boolean;
  isCompleting: boolean;
  isDeleting: boolean;
  isDark: boolean;
}) {
  const isCompleted = task.status === TaskStatus.Completed;
  const isInProgress =
    task.status === TaskStatus.InProgress ||
    (task.status as string) === "Active";
  const deadline = task.deadline ? new Date(task.deadline) : null;
  const daysLeft = deadline
    ? Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;
  const priority = computePriorityScore(task);
  const colorIdx = subjectColorIdx(String(task.subjectId));
  const subjectColor = isDark
    ? SUBJECT_COLORS_DARK[colorIdx]
    : SUBJECT_COLORS_LIGHT[colorIdx];

  return (
    <div
      className="rounded-lg p-4 transition-all"
      style={{
        background: isDark ? dark.card : "#ffffff",
        border: `1px solid ${isCurrentlyActive ? (isDark ? "#2a5080" : "#93c5fd") : isDark ? dark.border : "#e5e7eb"}`,
        boxShadow: isCurrentlyActive
          ? `0 0 0 1px ${isDark ? "#2a5080" : "#bfdbfe"}`
          : "0 1px 3px rgba(0,0,0,0.06)",
        opacity: isCompleted ? 0.72 : 1,
      }}
      data-ocid="task-card"
    >
      {/* Top row: title + badges */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3
            className="font-semibold text-base leading-snug"
            style={{
              color: isCompleted
                ? isDark
                  ? dark.textMuted
                  : "#9ca3af"
                : isDark
                  ? dark.textPrimary
                  : "#111827",
              textDecoration: isCompleted ? "line-through" : "none",
            }}
          >
            {task.title}
            {isCurrentlyActive && (
              <span
                className="ml-2 text-xs px-2 py-0.5 rounded-full font-normal"
                style={{ background: "#2563eb", color: "#fff" }}
              >
                Active Session
              </span>
            )}
          </h3>
          <div className="flex items-center gap-2 flex-wrap mt-1.5">
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: subjectColor.bg, color: subjectColor.text }}
            >
              <BookOpen size={10} className="inline mr-1" />
              {task.subjectName}
            </span>
            <DiffBadge difficulty={task.difficulty} isDark={isDark} />
            <StatusBadge status={task.status} isDark={isDark} />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {!isCompleted && (
            <>
              {!isInProgress && (
                <button
                  type="button"
                  onClick={() => onStart(task.id)}
                  disabled={isStarting}
                  className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium disabled:opacity-50 transition-colors"
                  style={{
                    background: "#2563eb",
                    color: "#fff",
                    border: "none",
                  }}
                  data-ocid="start-focus-btn"
                  aria-label={`Start focus session for ${task.title}`}
                >
                  <Play size={11} />
                  Start
                </button>
              )}
              <button
                type="button"
                onClick={() => onComplete(task.id)}
                disabled={isCompleting}
                className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium disabled:opacity-50 transition-colors"
                style={{
                  background: isDark ? dark.badgeGreen.bg : "#f0fdf4",
                  color: isDark ? dark.badgeGreen.text : "#166534",
                  border: `1px solid ${isDark ? dark.badgeGreen.border : "#bbf7d0"}`,
                }}
                data-ocid="complete-task-btn"
                aria-label={`Mark ${task.title} as complete`}
              >
                <CheckCircle2 size={11} />
                Done
              </button>
            </>
          )}
          {isCompleted && (
            <CheckCircle2
              size={18}
              style={{ color: "#059669", flexShrink: 0 }}
            />
          )}
          <button
            type="button"
            onClick={() => onDelete(task.id)}
            disabled={isDeleting}
            className="flex items-center justify-center w-7 h-7 rounded disabled:opacity-50 transition-colors"
            style={{ color: isDark ? dark.textMuted : "#d1d5db" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "#ef4444";
              (e.currentTarget as HTMLButtonElement).style.background = isDark
                ? "#3d1515"
                : "#fef2f2";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = isDark
                ? dark.textMuted
                : "#d1d5db";
              (e.currentTarget as HTMLButtonElement).style.background =
                "transparent";
            }}
            data-ocid="delete-task-btn"
            aria-label={`Delete ${task.title}`}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Meta row */}
      <div
        className="flex items-center gap-4 flex-wrap text-xs mb-3"
        style={{ color: isDark ? dark.textMuted : "#6b7280" }}
      >
        <span className="flex items-center gap-1">
          <Clock size={11} />
          {task.estimatedMinutes} min
        </span>
        {deadline && (
          <span
            className="flex items-center gap-1"
            style={{
              color:
                daysLeft !== null && daysLeft < 0
                  ? "#f87171"
                  : daysLeft !== null && daysLeft <= 2
                    ? "#fb923c"
                    : isDark
                      ? dark.textMuted
                      : "#6b7280",
              fontWeight: daysLeft !== null && daysLeft <= 2 ? 500 : undefined,
            }}
          >
            <Calendar size={11} />
            {deadline.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
            {daysLeft !== null && daysLeft < 0 && " (overdue)"}
            {daysLeft !== null && daysLeft >= 0 && daysLeft <= 2 && (
              <span> ({daysLeft}d left)</span>
            )}
          </span>
        )}
      </div>

      {/* Priority Score bar */}
      <div
        className="pt-2.5 mt-1"
        style={{ borderTop: `1px solid ${isDark ? dark.border : "#f3f4f6"}` }}
      >
        <div className="flex items-center justify-between mb-1">
          <span
            className="text-xs font-medium"
            style={{ color: isDark ? dark.textMuted : "#6b7280" }}
          >
            Priority Score
          </span>
        </div>
        <PriorityBar score={priority} isDark={isDark} />
      </div>
    </div>
  );
}

// ── Subject Manager Panel ─────────────────────────────────────────────────────

function SubjectManager({ isDark }: { isDark: boolean }) {
  const [newSubjectName, setNewSubjectName] = useState("");
  const { data: subjects = [] } = useSubjects();
  const addSubjectMutation = useAddSubject();
  const removeSubjectMutation = useRemoveSubject();

  function handleAddSubject(e: React.FormEvent) {
    e.preventDefault();
    const name = newSubjectName.trim();
    if (!name) return;
    addSubjectMutation.mutate(
      { name, weight: 1 },
      { onSuccess: () => setNewSubjectName("") },
    );
  }

  return (
    <div
      className="rounded-lg p-5"
      style={{
        background: isDark ? dark.card : "#ffffff",
        border: `1px solid ${isDark ? dark.border : "#e5e7eb"}`,
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      }}
      data-ocid="subject-manager"
    >
      <div className="flex items-center gap-2 mb-4">
        <Tag size={15} style={{ color: "#2563eb" }} />
        <h2
          className="font-semibold text-sm"
          style={{ color: isDark ? dark.textPrimary : "#111827" }}
        >
          Manage Subjects
        </h2>
      </div>

      {/* Add subject form */}
      <form
        onSubmit={handleAddSubject}
        className="flex items-center gap-2 mb-4"
      >
        <input
          placeholder="New subject name..."
          value={newSubjectName}
          onChange={(e) => setNewSubjectName(e.target.value)}
          className="flex-1 px-3 py-2 rounded text-sm outline-none focus:ring-2 focus:ring-blue-400"
          style={{
            background: isDark ? dark.inputBg : "#ffffff",
            border: `1px solid ${isDark ? dark.border : "#d1d5db"}`,
            color: isDark ? dark.textPrimary : "#111827",
          }}
          data-ocid="new-subject-input"
        />
        <button
          type="submit"
          disabled={addSubjectMutation.isPending || !newSubjectName.trim()}
          className="flex items-center gap-1.5 px-3 py-2 rounded text-sm font-medium disabled:opacity-50 transition-colors whitespace-nowrap"
          style={{ background: "#2563eb", color: "#fff", border: "none" }}
          data-ocid="add-subject-btn"
        >
          <Plus size={13} />
          Add
        </button>
      </form>

      {/* Subject list */}
      {subjects.length === 0 ? (
        <p
          className="text-sm text-center py-3"
          style={{ color: isDark ? dark.textMuted : "#9ca3af" }}
        >
          No subjects yet — add one above.
        </p>
      ) : (
        <div className="flex flex-col gap-1.5" data-ocid="subjects-list">
          {subjects.map((subject) => (
            <div
              key={subject.id}
              className="flex items-center justify-between px-3 py-2 rounded"
              style={{
                background: isDark ? dark.cardAlt : "#f9fafb",
                border: `1px solid ${isDark ? dark.border : "#e5e7eb"}`,
              }}
              data-ocid="subject-row"
            >
              <span
                className="text-sm font-medium"
                style={{ color: isDark ? dark.textPrimary : "#1f2937" }}
              >
                {subject.name}
              </span>
              <button
                type="button"
                onClick={() => removeSubjectMutation.mutate(subject.id)}
                disabled={removeSubjectMutation.isPending}
                className="flex items-center justify-center w-6 h-6 rounded transition-colors disabled:opacity-50"
                style={{ color: isDark ? dark.textMuted : "#d1d5db" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color =
                    "#ef4444";
                  (e.currentTarget as HTMLButtonElement).style.background =
                    isDark ? "#3d1515" : "#fef2f2";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = isDark
                    ? dark.textMuted
                    : "#d1d5db";
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "transparent";
                }}
                aria-label={`Remove subject ${subject.name}`}
                data-ocid="remove-subject-btn"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Add Task Form State ───────────────────────────────────────────────────────

interface FormState {
  subjectId: string;
  title: string;
  difficulty: string;
  estimatedMinutes: string;
  deadline: string;
}

// ── Tasks Page ────────────────────────────────────────────────────────────────

export default function Tasks() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [activeFilter, setActiveFilter] = useState<FilterTab>("All");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>({
    subjectId: "",
    title: "",
    difficulty: TaskDifficulty.Medium,
    estimatedMinutes: "60",
    deadline: "",
  });

  const { data: tasks = [], isLoading: tasksLoading } = useTasks();
  const { data: subjects = [] } = useSubjects();
  const { data: activeSession } = useActiveSession();
  const startFocus = useStartFocus();
  const endFocus = useEndFocus();
  const updateStatus = useUpdateTaskStatus();
  const deleteTask = useDeleteTask();

  const actor = mockBackend;
  const queryClient = useQueryClient();

  const addTaskMutation = useMutation({
    mutationFn: (f: FormState) =>
      addTask(
        actor,
        Number(f.subjectId),
        f.title,
        f.difficulty as TaskDifficulty,
        Number(f.estimatedMinutes),
        f.deadline,
      ),
    onSuccess: (newTask) => {
      queryClient.setQueryData<{ id: number }[]>(["tasks"], (old) =>
        old ? [...old, newTask] : [newTask],
      );
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setShowForm(false);
      setForm({
        subjectId: "",
        title: "",
        difficulty: TaskDifficulty.Medium,
        estimatedMinutes: "60",
        deadline: "",
      });
    },
  });

  const activeTaskId = activeSession?.taskId ?? null;

  const filteredTasks = useMemo(() => {
    let result = [...tasks];
    if (activeFilter !== "All") {
      if (activeFilter === TaskStatus.InProgress) {
        result = result.filter(
          (t) =>
            t.status === TaskStatus.InProgress ||
            (t.status as string) === "Active",
        );
      } else {
        result = result.filter((t) => t.status === activeFilter);
      }
    }
    result.sort((a, b) => computePriorityScore(b) - computePriorityScore(a));
    return result;
  }, [tasks, activeFilter]);

  const counts = useMemo(
    () => ({
      All: tasks.length,
      [TaskStatus.Scheduled]: tasks.filter(
        (t) => t.status === TaskStatus.Scheduled,
      ).length,
      [TaskStatus.InProgress]: tasks.filter(
        (t) =>
          t.status === TaskStatus.InProgress ||
          (t.status as string) === "Active",
      ).length,
      [TaskStatus.Completed]: tasks.filter(
        (t) => t.status === TaskStatus.Completed,
      ).length,
    }),
    [tasks],
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.subjectId || !form.title) return;
    addTaskMutation.mutate(form);
  }

  const cardStyle = {
    background: isDark ? dark.card : "#ffffff",
    border: `1px solid ${isDark ? dark.border : "#e5e7eb"}`,
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  };

  const inputStyle = {
    background: isDark ? dark.inputBg : "#ffffff",
    border: `1px solid ${isDark ? dark.border : "#d1d5db"}`,
    color: isDark ? dark.textPrimary : "#111827",
  };

  const labelStyle = { color: isDark ? dark.textSecondary : "#374151" };

  return (
    <div
      className="p-6 md:p-8 max-w-4xl mx-auto flex flex-col gap-5"
      style={{ minHeight: "100%", background: isDark ? "#13151a" : "#f9fafb" }}
    >
      {/* ── Page Header ── */}
      <div className="rounded-lg p-5" style={cardStyle}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1
              className="text-2xl font-bold"
              style={{ color: isDark ? dark.textPrimary : "#111827" }}
            >
              Task Manager
            </h1>
            <p
              className="text-sm mt-0.5"
              style={{ color: isDark ? dark.textMuted : "#6b7280" }}
            >
              Manage your study tasks and track progress
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-colors"
            style={{ background: "#2563eb", color: "#fff", border: "none" }}
            data-ocid="add-task-btn"
          >
            <Plus size={15} />
            Add Task
          </button>
        </div>
      </div>

      {/* ── Subject Manager ── */}
      <SubjectManager isDark={isDark} />

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
                  {tasks.find(
                    (t) => String(t.id) === String(activeSession.taskId),
                  )?.title ?? `Task #${activeSession.taskId}`}
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

      {/* ── Add Task Form ── */}
      {showForm && (
        <div
          className="rounded-lg overflow-hidden"
          style={{
            background: isDark ? dark.card : "#ffffff",
            border: `1px solid ${isDark ? "#2a5080" : "#bfdbfe"}`,
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          }}
          data-ocid="add-task-form"
        >
          <div
            className="flex items-center justify-between px-5 py-3"
            style={{
              background: isDark ? "#1a2744" : "#eff6ff",
              borderBottom: `1px solid ${isDark ? "#2a4a8c" : "#bfdbfe"}`,
            }}
          >
            <p
              className="font-semibold text-sm"
              style={{ color: isDark ? dark.textPrimary : "#1e40af" }}
            >
              New Task
            </p>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="transition-colors"
              style={{ color: isDark ? dark.textMuted : "#6b7280" }}
              aria-label="Close form"
              data-ocid="close-form-btn"
            >
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Subject */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium" style={labelStyle}>
                  Subject <span style={{ color: "#f87171" }}>*</span>
                </Label>
                <select
                  required
                  value={form.subjectId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, subjectId: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded text-sm outline-none focus:ring-2 focus:ring-blue-400"
                  style={inputStyle}
                  data-ocid="subject-select"
                >
                  <option value="">Select subject...</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium" style={labelStyle}>
                  Task Title <span style={{ color: "#f87171" }}>*</span>
                </Label>
                <input
                  required
                  placeholder="e.g. Chapter 5 Review"
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded text-sm outline-none focus:ring-2 focus:ring-blue-400"
                  style={inputStyle}
                  data-ocid="task-title-input"
                />
              </div>

              {/* Difficulty */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium" style={labelStyle}>
                  Difficulty
                </Label>
                <select
                  value={form.difficulty}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, difficulty: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded text-sm outline-none focus:ring-2 focus:ring-blue-400"
                  style={inputStyle}
                  data-ocid="difficulty-select"
                >
                  <option value={TaskDifficulty.Low}>Low</option>
                  <option value={TaskDifficulty.Medium}>Medium</option>
                  <option value={TaskDifficulty.High}>High</option>
                </select>
              </div>

              {/* Duration */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium" style={labelStyle}>
                  Estimated Minutes
                </Label>
                <input
                  required
                  type="number"
                  min={5}
                  max={480}
                  value={form.estimatedMinutes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, estimatedMinutes: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded text-sm outline-none focus:ring-2 focus:ring-blue-400"
                  style={inputStyle}
                  data-ocid="estimated-minutes-input"
                />
              </div>

              {/* Deadline */}
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label className="text-xs font-medium" style={labelStyle}>
                  Deadline{" "}
                  <span
                    className="font-normal text-[10px]"
                    style={{ color: isDark ? dark.textMuted : "#9ca3af" }}
                  >
                    (optional)
                  </span>
                </Label>
                <input
                  type="date"
                  value={form.deadline}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, deadline: e.target.value }))
                  }
                  className="px-3 py-2 rounded text-sm outline-none focus:ring-2 focus:ring-blue-400 max-w-xs"
                  style={inputStyle}
                  data-ocid="deadline-input"
                />
              </div>
            </div>

            <div
              className="flex items-center justify-end gap-3 mt-5 pt-4"
              style={{
                borderTop: `1px solid ${isDark ? dark.border : "#f3f4f6"}`,
              }}
            >
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded text-sm transition-colors"
                style={{ color: isDark ? dark.textSecondary : "#374151" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    isDark ? dark.cardAlt : "#f3f4f6";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "transparent";
                }}
                data-ocid="cancel-add-task-btn"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  addTaskMutation.isPending || !form.subjectId || !form.title
                }
                className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium disabled:opacity-50 transition-colors"
                style={{ background: "#2563eb", color: "#fff", border: "none" }}
                data-ocid="submit-add-task-btn"
              >
                {addTaskMutation.isPending ? (
                  "Adding..."
                ) : (
                  <>
                    <Plus size={13} />
                    Add Task
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Filter Tabs ── */}
      <div
        className="rounded-lg p-2 flex items-center gap-1 flex-wrap"
        style={cardStyle}
        data-ocid="filter-tabs"
      >
        {FILTER_TABS.map(({ id, label }) => {
          const active = activeFilter === id;
          const count = counts[id as keyof typeof counts] ?? 0;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setActiveFilter(id)}
              className="px-3 py-1.5 rounded text-sm font-medium transition-colors"
              style={{
                background: active ? "#2563eb" : "transparent",
                color: active
                  ? "#fff"
                  : isDark
                    ? dark.textSecondary
                    : "#374151",
              }}
              onMouseEnter={(e) => {
                if (!active)
                  (e.currentTarget as HTMLButtonElement).style.background =
                    isDark ? dark.cardAlt : "#f3f4f6";
              }}
              onMouseLeave={(e) => {
                if (!active)
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "transparent";
              }}
              data-ocid={`filter-tab-${id.toLowerCase()}`}
            >
              {label}
              <span
                className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs"
                style={{
                  background: active
                    ? "#1d4ed8"
                    : isDark
                      ? dark.cardAlt
                      : "#f3f4f6",
                  color: active
                    ? "#bfdbfe"
                    : isDark
                      ? dark.textMuted
                      : "#6b7280",
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Task List ── */}
      {tasksLoading ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
      ) : filteredTasks.length === 0 ? (
        <div
          className="flex flex-col items-center gap-3 py-16 rounded-lg text-center"
          style={{
            background: isDark ? dark.card : "#ffffff",
            border: `1px dashed ${isDark ? dark.border : "#d1d5db"}`,
          }}
          data-ocid="empty-tasks-state"
        >
          <ListTodo
            size={36}
            style={{ color: isDark ? dark.textMuted : "#d1d5db" }}
          />
          <div>
            <p
              className="font-medium text-base"
              style={{ color: isDark ? dark.textSecondary : "#374151" }}
            >
              {activeFilter === "All"
                ? "No tasks yet"
                : `No ${activeFilter} tasks`}
            </p>
            <p
              className="text-sm mt-1"
              style={{ color: isDark ? dark.textMuted : "#9ca3af" }}
            >
              {activeFilter === "All"
                ? "Click 'Add Task' above to create your first task"
                : "Change the filter to see other tasks"}
            </p>
          </div>
          {activeFilter === "All" && (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-colors mt-1"
              style={{ background: "#2563eb", color: "#fff", border: "none" }}
            >
              <Plus size={14} />
              Add First Task
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredTasks.map((task: TaskUnit) => (
            <TaskCard
              key={task.id}
              task={task}
              isDark={isDark}
              isCurrentlyActive={String(activeTaskId) === String(task.id)}
              onStart={(id) => startFocus.mutate(id)}
              onComplete={(id) =>
                updateStatus.mutate({
                  taskId: id,
                  status: TaskStatus.Completed,
                })
              }
              onDelete={(id) => deleteTask.mutate(id)}
              isStarting={
                startFocus.isPending && startFocus.variables === task.id
              }
              isCompleting={
                updateStatus.isPending &&
                updateStatus.variables?.taskId === task.id
              }
              isDeleting={
                deleteTask.isPending && deleteTask.variables === task.id
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
