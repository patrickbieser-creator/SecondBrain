type ScoreBadgeProps = {
  score: number;
};

export function ScoreBadge({ score }: ScoreBadgeProps) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "0.25rem 0.5rem",
        borderRadius: 999,
        background: "var(--card)",
        border: "1px solid var(--accent)",
        fontSize: 12
      }}
      aria-label={`Priority score ${score}`}
    >
      Score: {score.toFixed(1)}
    </span>
  );
}
