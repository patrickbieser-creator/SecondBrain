import { db } from "@/lib/db";
import { recompute } from "@/lib/scoring/recompute";
import { today } from "@/lib/utils/time";

export type PlanBucket = {
  label: "Must" | "Should" | "Could";
  tasks: PlanTask[];
  totalMinutes: number;
};

export type PlanTask = {
  id: string;
  title: string;
  domainId: string;
  domainName: string;
  domainColor: string | null;
  priorityScore: number;
  effortMinutes: number;
};

export type GeneratedPlan = {
  date: string;
  availableMinutes: number;
  buckets: PlanBucket[];
};

export async function generatePlan(
  userId: string,
  opts: {
    availableMinutes?: number;
    deepWork?: boolean;
    domainFocusId?: string | null;
  }
): Promise<GeneratedPlan> {
  // Get user settings for defaults
  const settings = await db.userSettings.findUnique({ where: { userId } });
  const availableMinutes =
    opts.availableMinutes ?? settings?.defaultAvailableMinutes ?? 240;

  // Check for recent scoring (within 10 minutes)
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
  const recentRun = await db.scoringRun.findFirst({
    where: { userId, scoredAt: { gte: tenMinutesAgo } },
    orderBy: { scoredAt: "desc" },
  });

  let scoredTasks: Awaited<ReturnType<typeof recompute>>;
  if (recentRun) {
    // Reuse recent scores
    const runs = await db.scoringRun.findMany({
      where: { userId, scoredAt: { gte: tenMinutesAgo } },
      orderBy: [{ taskId: "asc" }, { scoredAt: "desc" }],
      distinct: ["taskId"],
      include: {
        task: { include: { domain: true } },
      },
    });

    const tasks = runs.map((r) => ({
      id: r.task.id,
      title: r.task.title,
      domainId: r.task.domainId,
      domainName: r.task.domain.name,
      domainColor: r.task.domain.color,
      priorityScore: r.priorityScore,
      explanation: r.explanation,
      effortMinutes: r.task.effortMinutes,
      energyRequired: r.task.energyRequired,
      status: r.task.status,
      deadlineAt: r.task.deadlineAt,
    }));

    tasks.sort((a, b) => b.priorityScore - a.priorityScore);
    scoredTasks = {
      now: tasks.slice(0, 3),
      next: tasks.slice(0, 10),
      scoredAt: recentRun.scoredAt.toISOString(),
    };
  } else {
    scoredTasks = await recompute(userId, {
      currentDomainId: opts.domainFocusId ?? undefined,
      deepWork: opts.deepWork,
    });
  }

  // Build plan buckets using all scored tasks (not just top 10)
  const allTasks = scoredTasks.next.map((t) => ({
    ...t,
    effortMinutes: t.effortMinutes ?? 30,
  }));

  const mustTarget = availableMinutes * 0.6;
  const shouldTarget = availableMinutes * 0.3;

  const must: PlanTask[] = [];
  const should: PlanTask[] = [];
  const could: PlanTask[] = [];

  let mustMinutes = 0;
  let shouldMinutes = 0;

  // Domain batching: group same-domain tasks within 5 score points together
  const sorted = [...allTasks].sort((a, b) => b.priorityScore - a.priorityScore);

  for (const task of sorted) {
    const planTask: PlanTask = {
      id: task.id,
      title: task.title,
      domainId: task.domainId,
      domainName: task.domainName,
      domainColor: task.domainColor,
      priorityScore: task.priorityScore,
      effortMinutes: task.effortMinutes ?? 30,
    };

    if (mustMinutes < mustTarget) {
      must.push(planTask);
      mustMinutes += planTask.effortMinutes;
    } else if (shouldMinutes < shouldTarget) {
      should.push(planTask);
      shouldMinutes += planTask.effortMinutes;
    } else {
      could.push(planTask);
    }
  }

  const plan: GeneratedPlan = {
    date: today(),
    availableMinutes,
    buckets: [
      { label: "Must", tasks: must, totalMinutes: mustMinutes },
      { label: "Should", tasks: should, totalMinutes: shouldMinutes },
      {
        label: "Could",
        tasks: could,
        totalMinutes: could.reduce((s, t) => s + t.effortMinutes, 0),
      },
    ],
  };

  // Upsert DailyPlan
  await db.dailyPlan.upsert({
    where: { userId_planDate: { userId, planDate: today() } },
    update: {
      generatedAt: new Date(),
      planJson: JSON.stringify(plan),
      inputsJson: JSON.stringify(opts),
    },
    create: {
      userId,
      planDate: today(),
      planJson: JSON.stringify(plan),
      inputsJson: JSON.stringify(opts),
    },
  });

  return plan;
}
