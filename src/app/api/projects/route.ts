import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { unauthorized, ok, badRequest } from "@/lib/api";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return unauthorized();

  const { searchParams } = new URL(req.url);
  const domainId = searchParams.get("domainId") ?? undefined;
  const status = searchParams.get("status") ?? "ACTIVE";

  const projects = await db.project.findMany({
    where: {
      userId: session.userId,
      ...(domainId ? { domainId } : {}),
      status,
    },
    include: { domain: true },
    orderBy: { name: "asc" },
  });
  return ok(projects);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return unauthorized();

  const body = await req.json();
  if (!body.domainId) return badRequest("domainId is required");
  if (!body.name) return badRequest("name is required");

  const project = await db.project.create({
    data: {
      userId: session.userId,
      domainId: body.domainId,
      name: body.name,
      description: body.description ?? null,
      deadlineAt: body.deadlineAt ? new Date(body.deadlineAt) : null,
      status: body.status ?? "ACTIVE",
    },
  });
  return ok(project);
}
