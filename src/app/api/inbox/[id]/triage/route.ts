import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { unauthorized, ok, badRequest, notFound } from "@/lib/api";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return unauthorized();

  const { id } = await params;
  const body = await req.json();

  const item = await db.inboxItem.findFirst({
    where: { id, userId: session.userId },
  });
  if (!item) return notFound("Inbox item not found");

  const type: string = body.type;
  if (!["TASK", "PROJECT", "NOTE", "SOMEDAY"].includes(type)) {
    return badRequest("type must be TASK|PROJECT|NOTE|SOMEDAY");
  }

  let triagedToTaskId: string | null = null;
  let triagedToProjectId: string | null = null;

  if (type === "TASK" || type === "SOMEDAY") {
    const taskData = body.task ?? {};
    if (!taskData.title) return badRequest("task.title is required");
    if (!taskData.domainId) return badRequest("task.domainId is required");

    const task = await db.task.create({
      data: {
        userId: session.userId,
        domainId: taskData.domainId,
        projectId: taskData.projectId ?? null,
        title: taskData.title,
        description: taskData.description ?? null,
        status: type === "SOMEDAY" ? "SOMEDAY" : "NEXT",
        effortMinutes: taskData.effortMinutes ?? null,
        energyRequired: taskData.energyRequired ?? "MED",
        deadlineAt: taskData.deadlineAt ? new Date(taskData.deadlineAt) : null,
        impact: taskData.impact ?? 3,
        urgency: taskData.urgency ?? 3,
        strategicValue: taskData.strategicValue ?? 0,
        riskOfDelay: taskData.riskOfDelay ?? 0,
        isBlocker: taskData.isBlocker ?? false,
      },
    });

    // Create tags if specified
    if (Array.isArray(taskData.tags)) {
      for (const tagName of taskData.tags) {
        const tag = await db.tag.upsert({
          where: { userId_name: { userId: session.userId, name: tagName } },
          update: {},
          create: { userId: session.userId, name: tagName },
        });
        await db.taskTag.create({
          data: { userId: session.userId, taskId: task.id, tagId: tag.id },
        });
      }
    }

    triagedToTaskId = task.id;
  } else if (type === "PROJECT") {
    const projectData = body.project ?? {};
    if (!projectData.name) return badRequest("project.name is required");
    if (!projectData.domainId) return badRequest("project.domainId is required");

    const project = await db.project.create({
      data: {
        userId: session.userId,
        domainId: projectData.domainId,
        name: projectData.name,
        description: projectData.description ?? null,
        deadlineAt: projectData.deadlineAt
          ? new Date(projectData.deadlineAt)
          : null,
      },
    });
    triagedToProjectId = project.id;
  }

  // Mark inbox item as TRIAGED
  await db.inboxItem.update({
    where: { id },
    data: {
      status: "TRIAGED",
      triagedToTaskId,
      triagedToProjectId,
    },
  });

  await db.activityLog.create({
    data: {
      userId: session.userId,
      entityType: "InboxItem",
      entityId: id,
      action: "TRIAGE",
      detailJson: JSON.stringify({
        type,
        triagedToTaskId,
        triagedToProjectId,
      }),
    },
  });

  return ok({ success: true, triagedToTaskId, triagedToProjectId });
}
