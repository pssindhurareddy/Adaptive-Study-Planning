import { TaskStatus } from "../../types/study";

interface StatusBadgeProps {
  status: TaskStatus | string;
  size?: "sm" | "md";
}

type BadgeConfig = {
  label: string;
  bg: string;
  text: string;
  dot: string;
  border: string;
  glow?: string;
};

const STATUS_CONFIG: Record<string, BadgeConfig> = {
  [TaskStatus.Scheduled]: {
    label: "Scheduled",
    bg: "rgba(99,102,241,0.15)",
    text: "#a5b4fc",
    dot: "#818cf8",
    border: "rgba(99,102,241,0.35)",
  },
  [TaskStatus.InProgress]: {
    label: "In Progress",
    bg: "rgba(251,191,36,0.15)",
    text: "#fde047",
    dot: "#fbbf24",
    border: "rgba(251,191,36,0.35)",
    glow: "rgba(251,191,36,0.5)",
  },
  // Legacy "Active" from backend — map same as InProgress
  Active: {
    label: "In Progress",
    bg: "rgba(251,191,36,0.15)",
    text: "#fde047",
    dot: "#fbbf24",
    border: "rgba(251,191,36,0.35)",
    glow: "rgba(251,191,36,0.5)",
  },
  [TaskStatus.Completed]: {
    label: "Completed",
    bg: "rgba(52,211,153,0.15)",
    text: "#6ee7b7",
    dot: "#34d399",
    border: "rgba(52,211,153,0.3)",
  },
};

export function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
  const cfg = STATUS_CONFIG[status] ?? {
    label: String(status),
    bg: "rgba(107,114,128,0.2)",
    text: "#9ca3af",
    dot: "#6b7280",
    border: "rgba(107,114,128,0.3)",
  };
  const isActive = status === TaskStatus.InProgress || status === "Active";
  const padClass =
    size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs";
  const dotClass = size === "sm" ? "w-1.5 h-1.5" : "w-2 h-2";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium leading-none ${padClass}`}
      style={{
        background: cfg.bg,
        color: cfg.text,
        border: `1px solid ${cfg.border}`,
      }}
    >
      <span
        className={`rounded-full flex-shrink-0 ${dotClass} ${isActive ? "animate-pulse" : ""}`}
        style={{
          background: cfg.dot,
          boxShadow: isActive && cfg.glow ? `0 0 5px ${cfg.glow}` : undefined,
        }}
      />
      {cfg.label}
    </span>
  );
}

/* Standalone overdue variant */
interface OverdueBadgeProps {
  size?: "sm" | "md";
}

export function OverdueBadge({ size = "sm" }: OverdueBadgeProps) {
  const padClass =
    size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs";
  const dotClass = size === "sm" ? "w-1.5 h-1.5" : "w-2 h-2";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium leading-none ${padClass}`}
      style={{
        background: "rgba(239,68,68,0.15)",
        color: "#fca5a5",
        border: "1px solid rgba(239,68,68,0.3)",
      }}
    >
      <span
        className={`rounded-full flex-shrink-0 animate-pulse ${dotClass}`}
        style={{
          background: "#f87171",
          boxShadow: "0 0 5px rgba(239,68,68,0.6)",
        }}
      />
      Overdue
    </span>
  );
}
