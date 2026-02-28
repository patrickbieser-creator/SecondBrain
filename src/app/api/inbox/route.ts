import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { unauthorized, ok, badRequest } from "@/lib/api";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return unauthorized();

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "UNPROCESSED";
  const limit = parseInt(searchParams.get("limit") ?? "50", 10);

  const items = await db.inboxItem.findMany({
    where: { userId: session.userId, status },
    orderBy: { capturedAt: "desc" },
    take: limit,
  });
  return ok(items);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return unauthorized();

  const body = await req.json();
  if (!body.rawText) return badRequest("rawText is required");

  const item = await db.inboxItem.create({
    data: {
      userId: session.userId,
      rawText: body.rawText,
      source: body.source ?? "MANUAL",
      status: "UNPROCESSED",
    },
  });

  await db.activityLog.create({
    data: {
      userId: session.userId,
      entityType: "InboxItem",
      entityId: item.id,
      action: "CAPTURE",
      detailJson: JSON.stringify({ rawText: body.rawText }),
    },
  });

  return ok(item);
}
