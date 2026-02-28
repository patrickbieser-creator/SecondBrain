"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { ScoreBadge } from "@/components/common/ScoreBadge";
import { WhyPopover } from "@/components/common/WhyPopover";
import { DomainPill } from "@/components/common/DomainPill";
import { Clock, Zap, Pencil } from "lucide-react";

type ScoredTask = {
  id: string;
  title: string;
  domainId: string;
  domainName: string;
  domainColor: string | null;
  priorityScore: number;
  explanation: string;
  effortMinutes: number | null;
  energyRequired: string;
  status: string;
  deadlineAt: Date | string | null;
};

interface NowListProps {
  tasks: ScoredTask[];
  onComplete?: (id: string) => void;
}

export function NowList({ tasks, onComplete }: NowListProps) {
  if (tasks.length === 0) {
    return (
      <div className="text-muted-foreground text-sm py-6 text-center">
        No tasks scored — add some tasks or adjust filters.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task, i) => (
        <Card
          key={task.id}
          className="border-l-4 hover:shadow-md transition-shadow"
          style={{
            borderLeftColor:
              i === 0 ? "#ef4444" : i === 1 ? "#f97316" : "#eab308",
          }}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                    #{i + 1}
                  </span>
                  <Link
                    href={`/focus?taskId=${task.id}`}
                    className="font-semibold text-sm hover:underline line-clamp-2"
                  >
                    {task.title}
                  </Link>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <DomainPill name={task.domainName} color={task.domainColor} />
                  {task.effortMinutes && (
                    <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {task.effortMinutes}m
                    </span>
                  )}
                  <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                    <Zap className="h-3 w-3" />
                    {task.energyRequired}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <ScoreBadge score={task.priorityScore} />
                <WhyPopover explanation={task.explanation} />
                <Link
                  href={`/tasks/${task.id}`}
                  className="p-1 text-muted-foreground hover:text-foreground"
                  title="Edit task"
                >
                  <Pencil className="h-3 w-3" />
                </Link>
                {onComplete && (
                  <button
                    onClick={() => onComplete(task.id)}
                    className="text-xs text-green-600 hover:text-green-800 px-1"
                    title="Mark done"
                  >
                    ✓
                  </button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
