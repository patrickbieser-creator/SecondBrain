import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { unauthorized, ok, notFound, badRequest } from "@/lib/api";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return unauthorized();

  const { id } = await params;
  const body = await req.json();
  if (!Array.isArray(body.subtasks) || body.subtasks.length === 0) {
    return badRequest("subtasks array is required");
  }

  const parent = await db.task.findFirst({
    where: { id, userId: session.userId },
  });
  if (!parent) return notFound();

  const created = await Promise.all(
    body.subtasks.map((s: { title: string; effortMinutes?: number; energyRequired?: string }) =>
      db.task.create({
        data: {
          userId: session.userId,
          domainId: parent.domainId,
          projectId: parent.projectId,
          parentTaskId: id,
          title: s.title,
          effortMinutes: s.effortMinutes ?? null,
          energyRequired: s.energyRequired ?? parent.energyRequired,
          status: "NEXT",
          impact: parent.impact,
          urgency: parent.urgency,
        },
      })
    )
  );

  return ok({ subtasks: created });
}
