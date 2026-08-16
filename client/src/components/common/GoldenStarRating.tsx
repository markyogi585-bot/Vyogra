export function GoldenStar({ size = 18, filled = true }: { size?: number; filled?: boolean }) {
  const gradientId = `gold-grad-${Math.random().toString(36).substring(2, 7)}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? `url(#${gradientId})` : "none"}
      stroke={filled ? "#d97706" : "#cbd5e1"}
      strokeWidth={filled ? "1" : "1.5"}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        filter: filled ? "drop-shadow(0 2px 4px rgba(234, 179, 8, 0.4))" : "none",
        transition: "transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
        display: "inline-block",
        verticalAlign: "middle",
      }}
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fde047" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
      </defs>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

export function GoldenStarRating({ rating = 5, max = 5, size = 18, showScore = true, label }: { rating?: number; max?: number; size?: number; showScore?: boolean; label?: string }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 3, verticalAlign: "middle" }}>
      {[...Array(max)].map((_, i) => (
        <GoldenStar key={i} size={size} filled={i < Math.floor(rating)} />
      ))}
      {showScore && (
        <strong style={{ marginLeft: 6, fontSize: size * 0.85, color: "#183a37", fontWeight: 800 }}>
          {rating.toFixed(1)}
        </strong>
      )}
      {label && (
        <span style={{ marginLeft: 6, fontSize: size * 0.75, color: "#718079" }}>
          ({label})
        </span>
      )}
    </div>
  );
}
