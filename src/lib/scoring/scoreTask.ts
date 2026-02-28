import { daysSince, daysUntil } from "@/lib/utils/time";

export type ScoreContext = {
  currentDomainId?: string;
  deepWork?: boolean;
  now: Date;
};

export type ScoreComponents = {
  base: number;
  deadlinePressure: number;
  effortFit: number;
  momentum: number;
  staleness: number;
  switchPenalty: number;
  blockedCapApplied: boolean;
};

export type ScoreResult = {
  priorityScore: number;
  components: ScoreComponents;
  explanation: string;
};

// Minimal task shape needed for scoring
export type ScoringTask = {
  id: string;
  domainId: string;
  status: string;
  deadlineAt: Date | null;
  snoozedUntil: Date | null;
  effortMinutes: number | null;
  impact: number;
  urgency: number;
  strategicValue: number;
  riskOfDelay: number;
  isBlocker: boolean;
  lastTouchedAt: Date | null;
  createdAt: Date;
  // If provided, blockers can be pre-resolved before calling
  hasUnresolvedDeps?: boolean;
};

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function scoreTask(task: ScoringTask, ctx: ScoreContext): ScoreResult {
  const { now, currentDomainId, deepWork = false } = ctx;

  // Zero out for terminal statuses
  if (
    task.status === "WAITING" ||
    task.status === "SOMEDAY" ||
    task.status === "DONE"
  ) {
    return zero(task, "Status is WAITING/SOMEDAY/DONE");
  }

  // Zero out for active snooze
  if (task.snoozedUntil && task.snoozedUntil > now) {
    return zero(task, "Task is snoozed");
  }

  // Base score components
  const I = task.impact / 5;
  const U = task.urgency / 5;
  const S = task.strategicValue / 5;
  const R = task.riskOfDelay / 5;
  const B = task.isBlocker ? 1 : 0;
  const base = 0.3 * I + 0.25 * U + 0.2 * S + 0.15 * R + 0.1 * B;

  // Deadline pressure
  let deadlinePressure = 0;
  if (task.deadlineAt) {
    const d = daysUntil(task.deadlineAt);
    if (d <= 0) {
      deadlinePressure = 1; // overdue
    } else {
      deadlinePressure = clamp(Math.exp(-d / 4), 0, 1);
    }
  }

  // Effort fit
  const t = task.effortMinutes ?? 60;
  const effortFit = 1 / (1 + t / 90);

  // Momentum
  const refDate = task.lastTouchedAt ?? task.createdAt;
  const rt = daysSince(refDate);
  const momentum = clamp(1 - rt / 7, 0, 1);

  // Staleness boost
  const age = daysSince(task.createdAt);
  const staleness = clamp(age / 30, 0, 1) * 0.15;

  // Switch penalty
  let switchPenalty = 0;
  if (currentDomainId && task.domainId !== currentDomainId) {
    const isQuick = task.effortMinutes != null && task.effortMinutes <= 10;
    if (deepWork) {
      switchPenalty = isQuick ? 0.1 : 0.25;
    } else {
      switchPenalty = isQuick ? 0.05 : 0.15;
    }
  }

  let score01 =
    base +
    0.35 * deadlinePressure +
    0.2 * effortFit +
    0.1 * momentum +
    staleness -
    switchPenalty;

  const blockedCapApplied = task.hasUnresolvedDeps === true;
  if (blockedCapApplied) {
    score01 = score01 * 0.4;
  }

  const priorityScore = Math.round(100 * clamp(score01, 0, 1));

  const components: ScoreComponents = {
    base,
    deadlinePressure,
    effortFit,
    momentum,
    staleness,
    switchPenalty,
    blockedCapApplied,
  };

  const explanation = buildExplanation(priorityScore, components, task);

  return { priorityScore, components, explanation };
}

function zero(task: ScoringTask, reason: string): ScoreResult {
  return {
    priorityScore: 0,
    components: {
      base: 0,
      deadlinePressure: 0,
      effortFit: 0,
      momentum: 0,
      staleness: 0,
      switchPenalty: 0,
      blockedCapApplied: false,
    },
    explanation: `0: ${reason}`,
  };
}

function fmt(n: number, sign = true): string {
  const s = n.toFixed(2);
  return sign && n >= 0 ? `+${s}` : s;
}

function buildExplanation(
  score: number,
  c: ScoreComponents,
  task: ScoringTask
): string {
  const parts: string[] = [];
  if (c.deadlinePressure > 0)
    parts.push(`deadline (${fmt(0.35 * c.deadlinePressure)})`);
  parts.push(`impact/urgency (${fmt(c.base)})`);
  parts.push(`effort-fit (${fmt(0.2 * c.effortFit)})`);
  if (c.momentum > 0) parts.push(`momentum (${fmt(0.1 * c.momentum)})`);
  if (c.staleness > 0) parts.push(`staleness (${fmt(c.staleness)})`);
  parts.push(`switch (${fmt(-c.switchPenalty)})`);
  if (c.blockedCapApplied) parts.push("blocked-cap (×0.4)");
  return `${score}: ${parts.join(", ")}`;
}
