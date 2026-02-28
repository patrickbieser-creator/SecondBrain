import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { today } from "@/lib/utils/time";
import { unauthorized, ok } from "@/lib/api";

export async function GET() {
  const session = await getSession();
  if (!session) return unauthorized();

  const plan = await db.dailyPlan.findUnique({
    where: { userId_planDate: { userId: session.userId, planDate: today() } },
  });

  if (!plan) return ok(null);

  return ok({
    ...plan,
    planJson: JSON.parse(plan.planJson),
    inputsJson: JSON.parse(plan.inputsJson),
  });
}
