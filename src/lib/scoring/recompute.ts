import { db } from "@/lib/db";
import { scoreTask, ScoreContext } from "@/lib/scoring/scoreTask";

export type RecomputeResult = {
  now: ScoredTask[];
  next: ScoredTask[];
  scoredAt: string;
};

export type ScoredTask = {
  id: string;
  title: string;
  domainId: string;
  domainName: string;
  domainColor: string | null;
  priorityScore: number;
  explanation: string;
  effortMinutes: number | null;
  energyRequired: string;
  status: string;
  deadlineAt: Date | null;
};

export async function recompute(
  userId: string,
  ctx: Omit<ScoreContext, "now"> & { domainId?: string; projectId?: string }
): Promise<RecomputeResult> {
  const now = new Date();

  const where = {
    userId,
    status: { in: ["NEXT", "IN_PROGRESS"] },
    ...(ctx.domainId ? { domainId: ctx.domainId } : {}),
    ...(ctx.projectId ? { projectId: ctx.projectId } : {}),
  };

  const tasks = await db.task.findMany({
    where,
    include: {
      domain: true,
      dependencies: {
        include: { dependsOnTask: { select: { status: true } } },
      },
    },
  });

  const scored: (ScoredTask & { priorityScore: number })[] = [];

  for (const task of tasks) {
    const hasUnresolvedDeps = task.dependencies.some(
      (dep) => dep.dependsOnTask.status !== "DONE"
    );

    const result = scoreTask(
      {
        id: task.id,
        domainId: task.domainId,
        status: task.status,
        deadlineAt: task.deadlineAt,
        snoozedUntil: task.snoozedUntil,
        effortMinutes: task.effortMinutes,
        impact: task.impact,
        urgency: task.urgency,
        strategicValue: task.strategicValue,
        riskOfDelay: task.riskOfDelay,
        isBlocker: task.isBlocker,
        lastTouchedAt: task.lastTouchedAt,
        createdAt: task.createdAt,
        hasUnresolvedDeps,
      },
      { ...ctx, now }
    );

    // Persist scoring run
    await db.scoringRun.create({
      data: {
        userId,
        taskId: task.id,
        priorityScore: result.priorityScore,
        scoreComponents: JSON.stringify(result.components),
        explanation: result.explanation,
        context: JSON.stringify({
          currentDomainId: ctx.currentDomainId,
          deepWork: ctx.deepWork,
        }),
      },
    });

    scored.push({
      id: task.id,
      title: task.title,
      domainId: task.domainId,
      domainName: task.domain.name,
      domainColor: task.domain.color,
      priorityScore: result.priorityScore,
      explanation: result.explanation,
      effortMinutes: task.effortMinutes,
      energyRequired: task.energyRequired,
      status: task.status,
      deadlineAt: task.deadlineAt,
    });
  }

  // Sort descending
  scored.sort((a, b) => b.priorityScore - a.priorityScore);

  return {
    now: scored.slice(0, 3),
    next: scored.slice(0, 10),
    scoredAt: now.toISOString(),
  };
}
