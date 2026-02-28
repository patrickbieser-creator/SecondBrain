"use client";

import { cn } from "@/lib/utils";

interface ScoreBadgeProps {
  score: number;
  className?: string;
}

function scoreColor(score: number): string {
  if (score >= 70) return "bg-red-100 text-red-800 border-red-200";
  if (score >= 40) return "bg-yellow-100 text-yellow-800 border-yellow-200";
  return "bg-green-100 text-green-800 border-green-200";
}

export function ScoreBadge({ score, className }: ScoreBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold",
        scoreColor(score),
        className
      )}
      aria-label={`Priority score ${score}`}
    >
      {score}
    </span>
  );
}
