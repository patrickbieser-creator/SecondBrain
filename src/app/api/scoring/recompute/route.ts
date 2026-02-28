import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { recompute } from "@/lib/scoring/recompute";
import { unauthorized, ok } from "@/lib/api";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return unauthorized();

  const body = await req.json().catch(() => ({}));
  const ctx = body.context ?? {};

  const result = await recompute(session.userId, {
    currentDomainId: ctx.currentDomainId,
    deepWork: ctx.deepWork,
    domainId: body.domainId,
    projectId: body.projectId,
  });

  return ok(result);
}
