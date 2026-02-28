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
  if (!body.until) return badRequest("until is required");

  const existing = await db.task.findFirst({
    where: { id, userId: session.userId },
  });
  if (!existing) return notFound();

  const task = await db.task.update({
    where: { id },
    data: { snoozedUntil: new Date(body.until) },
  });
  return ok(task);
}
