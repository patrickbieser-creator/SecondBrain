import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { unauthorized, ok, notFound } from "@/lib/api";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return unauthorized();

  const { id } = await params;
  const body = await req.json();

  const existing = await db.task.findFirst({
    where: { id, userId: session.userId },
  });
  if (!existing) return notFound();

  const task = await db.task.update({
    where: { id },
    data: {
      ...(body.title !== undefined ? { title: body.title } : {}),
      ...(body.description !== undefined ? { description: body.description } : {}),
      ...(body.status !== undefined ? { status: body.status } : {}),
      ...(body.domainId !== undefined ? { domainId: body.domainId } : {}),
      ...(body.projectId !== undefined ? { projectId: body.projectId } : {}),
      ...(body.effortMinutes !== undefined ? { effortMinutes: body.effortMinutes } : {}),
      ...(body.energyRequired !== undefined ? { energyRequired: body.energyRequired } : {}),
      ...(body.impact !== undefined ? { impact: body.impact } : {}),
      ...(body.urgency !== undefined ? { urgency: body.urgency } : {}),
      ...(body.strategicValue !== undefined ? { strategicValue: body.strategicValue } : {}),
      ...(body.riskOfDelay !== undefined ? { riskOfDelay: body.riskOfDelay } : {}),
      ...(body.isBlocker !== undefined ? { isBlocker: body.isBlocker } : {}),
      ...(body.deadlineAt !== undefined
        ? { deadlineAt: body.deadlineAt ? new Date(body.deadlineAt) : null }
        : {}),
      lastTouchedAt: new Date(),
    },
    include: { domain: true },
  });

  return ok(task);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return unauthorized();

  const { id } = await params;

  const task = await db.task.findFirst({
    where: { id, userId: session.userId },
    include: { domain: true, project: true, taskTags: { include: { tag: true } } },
  });
  if (!task) return notFound();
  return ok(task);
}
