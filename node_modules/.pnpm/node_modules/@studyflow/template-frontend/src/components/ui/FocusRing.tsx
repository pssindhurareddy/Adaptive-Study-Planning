interface FocusRingProps {
  score: number; // 0-100
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
  showPercentSign?: boolean;
}

function getScoreColor(score: number): { primary: string; secondary: string } {
  if (score >= 80)
    return {
      primary: "oklch(0.65 0.25 280)",
      secondary: "oklch(0.68 0.22 200)",
    };
  if (score >= 60)
    return {
      primary: "oklch(0.55 0.22 245)",
      secondary: "oklch(0.65 0.22 280)",
    };
  if (score >= 40)
    return { primary: "oklch(0.75 0.18 60)", secondary: "oklch(0.65 0.2 40)" };
  return { primary: "oklch(0.62 0.2 20)", secondary: "oklch(0.55 0.18 30)" };
}

export function FocusRing({
  score,
  size = 140,
  strokeWidth = 11,
  label,
  sublabel,
  showPercentSign = true,
}: FocusRingProps) {
  const clampedScore = Math.max(0, Math.min(100, score));
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (clampedScore / 100) * circumference;
  const dashOffset = circumference - progress;
  const center = size / 2;
  const { primary, secondary } = getScoreColor(clampedScore);

  const gradId = `fr-grad-${size}`;
  const glowId = `fr-glow-${size}`;
  const trackGradId = `fr-track-${size}`;

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Focus score: ${clampedScore} out of 100`}
    >
      {/* Outer ambient glow */}
      <span
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${primary.replace(")", " / 0.15)")} 0%, transparent 70%)`,
          filter: "blur(8px)",
        }}
        aria-hidden="true"
      />

      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0"
        style={{ transform: "rotate(-90deg)" }}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={primary} />
            <stop offset="55%" stopColor={secondary.replace(")", "")} />
            <stop offset="100%" stopColor={primary} stopOpacity="0.7" />
          </linearGradient>

          <linearGradient id={trackGradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop
              offset="0%"
              stopColor="oklch(0.2 0.02 280)"
              stopOpacity="0.4"
            />
            <stop
              offset="100%"
              stopColor="oklch(0.18 0.015 280)"
              stopOpacity="0.25"
            />
          </linearGradient>

          <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outer decorative ring */}
        <circle
          cx={center}
          cy={center}
          r={radius + strokeWidth / 2 + 4}
          fill="none"
          stroke="oklch(0.25 0.02 280 / 0.2)"
          strokeWidth="1"
          strokeDasharray="3 6"
        />

        {/* Track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={`url(#${trackGradId})`}
          strokeWidth={strokeWidth}
        />

        {/* Progress arc */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          filter={`url(#${glowId})`}
          style={{
            transition: "stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
      </svg>

      {/* Center content */}
      <div
        className="relative z-10 flex flex-col items-center justify-center"
        style={{ transform: "rotate(0deg)" }}
      >
        {/* Score number */}
        <div className="flex items-start leading-none">
          <span
            className="font-display font-bold leading-none"
            style={{
              fontSize: size * 0.225,
              background: `linear-gradient(135deg, ${primary}, ${secondary})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              letterSpacing: "-0.03em",
              filter: `drop-shadow(0 0 8px ${primary.replace(")", " / 0.4)")})`,
            }}
          >
            {clampedScore}
          </span>
          {showPercentSign && (
            <span
              className="font-display font-bold mt-1.5"
              style={{
                fontSize: size * 0.085,
                color: secondary,
                opacity: 0.85,
              }}
            >
              %
            </span>
          )}
        </div>

        {/* Label */}
        {label && (
          <span
            className="font-body leading-none text-center mt-1"
            style={{
              fontSize: size * 0.082,
              color: "oklch(0.55 0.04 280)",
              maxWidth: size * 0.6,
            }}
          >
            {label}
          </span>
        )}

        {/* Sublabel */}
        {sublabel && (
          <span
            className="font-body font-medium leading-none text-center mt-0.5"
            style={{
              fontSize: size * 0.075,
              color: secondary,
              opacity: 0.85,
            }}
          >
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
}
