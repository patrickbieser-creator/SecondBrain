import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { unauthorized, ok, badRequest } from "@/lib/api";

export async function GET() {
  const session = await getSession();
  if (!session) return unauthorized();

  const domains = await db.domain.findMany({
    where: { userId: session.userId, status: "ACTIVE" },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  return ok(domains);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return unauthorized();

  const body = await req.json();
  if (!body.name) return badRequest("name is required");

  const domain = await db.domain.create({
    data: {
      userId: session.userId,
      name: body.name,
      color: body.color ?? null,
      sortOrder: body.sortOrder ?? 0,
    },
  });
  return ok(domain);
}
