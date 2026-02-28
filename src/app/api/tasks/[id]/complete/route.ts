import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { unauthorized, ok, notFound } from "@/lib/api";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return unauthorized();

  const { id } = await params;

  const existing = await db.task.findFirst({
    where: { id, userId: session.userId },
  });
  if (!existing) return notFound();

  const now = new Date();
  const task = await db.task.update({
    where: { id },
    data: { status: "DONE", completedAt: now, lastTouchedAt: now },
  });

  await db.activityLog.create({
    data: {
      userId: session.userId,
      entityType: "Task",
      entityId: id,
      action: "COMPLETE",
      detailJson: JSON.stringify({ completedAt: now }),
    },
  });

  return ok(task);
}
