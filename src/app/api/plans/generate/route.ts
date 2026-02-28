import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { generatePlan } from "@/lib/plans/generatePlan";
import { unauthorized, ok } from "@/lib/api";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return unauthorized();

  const body = await req.json().catch(() => ({}));

  const plan = await generatePlan(session.userId, {
    availableMinutes: body.availableMinutes,
    deepWork: body.deepWork,
    domainFocusId: body.domainFocusId,
  });

  return ok(plan);
}
