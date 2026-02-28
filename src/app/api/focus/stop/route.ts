import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { unauthorized, ok, badRequest, notFound } from "@/lib/api";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return unauthorized();

  const body = await req.json().catch(() => ({}));
  if (!body.sessionId) return badRequest("sessionId is required");

  const existing = await db.focusSession.findFirst({
    where: { id: body.sessionId, userId: session.userId },
  });
  if (!existing) return notFound("Focus session not found");

  const endedAt = new Date();
  const durationSeconds = existing.endedAt
    ? existing.durationSeconds
    : Math.round((endedAt.getTime() - existing.startedAt.getTime()) / 1000);

  const updated = await db.focusSession.update({
    where: { id: body.sessionId },
    data: {
      endedAt,
      durationSeconds,
      outcome: body.outcome ?? null,
    },
  });

  return ok(updated);
}
