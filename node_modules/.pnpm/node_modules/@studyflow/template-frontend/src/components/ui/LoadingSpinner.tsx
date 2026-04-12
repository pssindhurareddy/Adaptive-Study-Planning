interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  centered?: boolean;
}

const SIZE_MAP = { sm: 20, md: 36, lg: 56 };
const STROKE_MAP = { sm: 2.5, md: 3, lg: 3.5 };

export function LoadingSpinner({
  size = "md",
  className = "",
  centered = false,
}: LoadingSpinnerProps) {
  const px = SIZE_MAP[size];
  const strokeWidth = STROKE_MAP[size];
  const radius = (px - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = px / 2;
  const gradId = `sg-${size}`;
  const glowId = `sg-glow-${size}`;

  const spinner = (
    <div
      className={`inline-flex items-center justify-center ${className}`}
      aria-label="Loading"
    >
      {/* Outer glow halo for md/lg */}
      {size !== "sm" && (
        <span
          className="absolute rounded-full animate-pulse"
          style={{
            width: px + 12,
            height: px + 12,
            background:
              "radial-gradient(circle, oklch(0.65 0.25 280 / 0.18) 0%, transparent 70%)",
          }}
          aria-hidden="true"
        />
      )}
      <svg
        width={px}
        height={px}
        viewBox={`0 0 ${px} ${px}`}
        className="animate-spin relative"
        style={{ animationDuration: "0.9s" }}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="oklch(0.65 0.25 280)" />
            <stop offset="50%" stopColor="oklch(0.55 0.22 245)" />
            <stop
              offset="100%"
              stopColor="oklch(0.68 0.22 200)"
              stopOpacity="0"
            />
          </linearGradient>
          <filter id={glowId} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Track ring */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="oklch(0.22 0.01 280 / 0.25)"
          strokeWidth={strokeWidth}
        />

        {/* Gradient arc */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${circumference * 0.72} ${circumference * 0.28}`}
          filter={size !== "sm" ? `url(#${glowId})` : undefined}
        />
      </svg>
    </div>
  );

  if (centered) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16">
        <div className="relative flex items-center justify-center">
          {spinner}
        </div>
        <p
          className="font-body text-xs animate-pulse"
          style={{ color: "oklch(0.5 0.06 280)" }}
        >
          Loading…
        </p>
      </div>
    );
  }

  return (
    <div className="relative flex items-center justify-center">{spinner}</div>
  );
}
