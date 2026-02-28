import { ScoreBadge } from "@/components/common/ScoreBadge";
import { scoreTask } from "@/lib/scoring";

export default function TodayPage() {
  const sample = scoreTask({ impact: 4, urgency: 4, effortMinutes: 30, blocker: false });

  return (
    <main style={{ padding: 24 }}>
      <h1>Today</h1>
      <p>Starter Today page for NOW/NEXT list implementation.</p>
      <ScoreBadge score={sample.priorityScore} />
      <p style={{ color: "var(--muted)" }}>{sample.explanation}</p>
    </main>
  );
}
