import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { unauthorized, ok } from "@/lib/api";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return unauthorized();

  const body = await req.json().catch(() => ({}));

  const session2 = await db.focusSession.create({
    data: {
      userId: session.userId,
      taskId: body.taskId ?? null,
      mode: body.mode ?? "SINGLE_THREAD",
    },
  });

  return ok(session2);
}
