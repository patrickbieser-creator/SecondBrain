import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { unauthorized, ok, badRequest } from "@/lib/api";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return unauthorized();

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const domainId = searchParams.get("domainId") ?? undefined;
  const projectId = searchParams.get("projectId") ?? undefined;
  const limit = parseInt(searchParams.get("limit") ?? "100", 10);

  const tasks = await db.task.findMany({
    where: {
      userId: session.userId,
      ...(status
        ? { status }
        : { status: { notIn: ["DONE"] } }),
      ...(domainId ? { domainId } : {}),
      ...(projectId ? { projectId } : {}),
    },
    include: { domain: true, project: true },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return ok(tasks);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return unauthorized();

  const body = await req.json();
  if (!body.title) return badRequest("title is required");
  if (!body.domainId) return badRequest("domainId is required");

  const task = await db.task.create({
    data: {
      userId: session.userId,
      domainId: body.domainId,
      projectId: body.projectId ?? null,
      parentTaskId: body.parentTaskId ?? null,
      title: body.title,
      description: body.description ?? null,
      status: body.status ?? "NEXT",
      effortMinutes: body.effortMinutes ?? null,
      energyRequired: body.energyRequired ?? "MED",
      deadlineAt: body.deadlineAt ? new Date(body.deadlineAt) : null,
      impact: body.impact ?? 3,
      urgency: body.urgency ?? 3,
      strategicValue: body.strategicValue ?? 0,
      riskOfDelay: body.riskOfDelay ?? 0,
      isBlocker: body.isBlocker ?? false,
    },
    include: { domain: true },
  });

  await db.activityLog.create({
    data: {
      userId: session.userId,
      entityType: "Task",
      entityId: task.id,
      action: "CREATE",
      detailJson: JSON.stringify({ title: task.title }),
    },
  });

  return ok(task);
}
