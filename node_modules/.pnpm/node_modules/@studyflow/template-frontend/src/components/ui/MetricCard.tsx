import type { ReactNode } from "react";

interface MetricCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: {
    direction: "up" | "down" | "neutral";
    value: string;
  };
  highlight?: boolean;
  accentColor?: "purple" | "blue" | "cyan" | "green" | "amber";
  className?: string;
  "data-ocid"?: string;
}

const ACCENT_COLORS = {
  purple: {
    icon: "oklch(0.65 0.25 280 / 0.18)",
    iconBorder: "oklch(0.65 0.25 280 / 0.3)",
    iconText: "oklch(0.75 0.22 280)",
    glow: "oklch(0.65 0.25 280 / 0.15)",
    gradient:
      "linear-gradient(135deg, oklch(0.65 0.25 280 / 0.22), oklch(0.55 0.22 245 / 0.1))",
    border: "oklch(0.65 0.25 280 / 0.35)",
  },
  blue: {
    icon: "oklch(0.42 0.18 245 / 0.2)",
    iconBorder: "oklch(0.42 0.18 245 / 0.35)",
    iconText: "oklch(0.68 0.18 245)",
    glow: "oklch(0.42 0.18 245 / 0.12)",
    gradient:
      "linear-gradient(135deg, oklch(0.42 0.18 245 / 0.2), oklch(0.35 0.15 245 / 0.1))",
    border: "oklch(0.42 0.18 245 / 0.35)",
  },
  cyan: {
    icon: "oklch(0.68 0.22 200 / 0.18)",
    iconBorder: "oklch(0.68 0.22 200 / 0.3)",
    iconText: "oklch(0.78 0.2 200)",
    glow: "oklch(0.68 0.22 200 / 0.12)",
    gradient:
      "linear-gradient(135deg, oklch(0.68 0.22 200 / 0.2), oklch(0.55 0.18 200 / 0.08))",
    border: "oklch(0.68 0.22 200 / 0.35)",
  },
  green: {
    icon: "oklch(0.6 0.18 145 / 0.18)",
    iconBorder: "oklch(0.6 0.18 145 / 0.3)",
    iconText: "oklch(0.7 0.18 145)",
    glow: "oklch(0.6 0.18 145 / 0.1)",
    gradient:
      "linear-gradient(135deg, oklch(0.6 0.18 145 / 0.18), oklch(0.5 0.15 145 / 0.08))",
    border: "oklch(0.6 0.18 145 / 0.35)",
  },
  amber: {
    icon: "oklch(0.75 0.18 60 / 0.18)",
    iconBorder: "oklch(0.75 0.18 60 / 0.3)",
    iconText: "oklch(0.85 0.18 60)",
    glow: "oklch(0.75 0.18 60 / 0.1)",
    gradient:
      "linear-gradient(135deg, oklch(0.75 0.18 60 / 0.18), oklch(0.65 0.15 60 / 0.08))",
    border: "oklch(0.75 0.18 60 / 0.35)",
  },
};

const TREND_STYLES = {
  up: { color: "oklch(0.72 0.16 145)", icon: "↑" },
  down: { color: "oklch(0.65 0.18 20)", icon: "↓" },
  neutral: { color: "oklch(0.5 0.04 280)", icon: "→" },
};

export function MetricCard({
  label,
  value,
  icon,
  trend,
  highlight = false,
  accentColor = "purple",
  className = "",
  "data-ocid": ocid,
}: MetricCardProps) {
  const accent = ACCENT_COLORS[accentColor];
  const trendStyle = trend ? TREND_STYLES[trend.direction] : null;

  return (
    <div
      data-ocid={ocid}
      className={`relative rounded-2xl p-5 overflow-hidden group transition-all duration-150 ease-out ${className}`}
      style={{
        background: highlight ? accent.gradient : "oklch(0.13 0.018 280 / 0.9)",
        border: `1px solid ${highlight ? accent.border : "oklch(0.22 0.015 280 / 0.6)"}`,
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        boxShadow: highlight
          ? `0 0 32px ${accent.glow}, 0 8px 24px oklch(0 0 0 / 0.25), inset 0 1px 0 oklch(1 0 0 / 0.06)`
          : "0 4px 20px oklch(0 0 0 / 0.25), inset 0 1px 0 oklch(1 0 0 / 0.04)",
      }}
    >
      {/* Hover lift effect overlay */}
      <span
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 pointer-events-none"
        style={{
          background: `linear-gradient(135deg, ${accent.glow}, transparent)`,
          transition: "opacity 0.15s ease",
        }}
        aria-hidden="true"
      />

      {/* Corner glow blob for highlighted */}
      {highlight && (
        <span
          className="absolute -top-6 -right-6 w-24 h-24 rounded-full pointer-events-none"
          style={{ background: accent.glow, filter: "blur(20px)" }}
          aria-hidden="true"
        />
      )}

      <div className="relative flex items-start justify-between gap-3">
        {/* Text content */}
        <div className="min-w-0 flex-1">
          <p
            className="font-mono text-[10px] uppercase tracking-[0.12em] mb-2 leading-none"
            style={{ color: "oklch(0.48 0.05 280)" }}
          >
            {label}
          </p>
          <p
            className="font-display font-bold leading-none truncate"
            style={{
              fontSize: "clamp(1.4rem, 2.5vw, 1.75rem)",
              color: "oklch(0.94 0.01 280)",
              letterSpacing: "-0.02em",
            }}
          >
            {value}
          </p>
          {trendStyle && trend && (
            <p
              className="flex items-center gap-1 text-[11px] font-body font-medium mt-1.5"
              style={{ color: trendStyle.color }}
            >
              <span>{trendStyle.icon}</span>
              <span>{trend.value}</span>
            </p>
          )}
        </div>

        {/* Icon badge */}
        {icon && (
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: accent.icon,
              border: `1px solid ${accent.iconBorder}`,
              color: accent.iconText,
              boxShadow: `0 2px 8px ${accent.glow}`,
            }}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
