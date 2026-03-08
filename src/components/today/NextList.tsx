"use client";

import Link from "next/link";
import { ScoreBadge } from "@/components/common/ScoreBadge";
import { WhyPopover } from "@/components/common/WhyPopover";
import { DomainPill } from "@/components/common/DomainPill";
import { Clock } from "lucide-react";

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

interface NextListProps {
  tasks: ScoredTask[];
  onComplete?: (id: string) => void;
}

export function NextList({ tasks, onComplete }: NextListProps) {
  if (tasks.length === 0) {
    return (
      <div className="text-muted-foreground text-sm py-4 text-center">
        No upcoming tasks.
      </div>
    );
  }

  return (
    <div className="divide-y">
      {tasks.map((task, i) => (
        <div key={task.id} className="flex items-center gap-3 py-2.5 px-1">
          <span className="text-xs text-muted-foreground w-5 text-right flex-shrink-0">
            {i + 1}
          </span>
          <ScoreBadge score={task.priorityScore} />
          <div className="flex-1 min-w-0">
            <Link
              href={`/tasks/${task.id}`}
              className="text-sm hover:underline line-clamp-1"
            >
              {task.title}
            </Link>
            <div className="flex items-center gap-2 mt-0.5">
              <DomainPill name={task.domainName} color={task.domainColor} />
              {task.effortMinutes && (
                <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {task.effortMinutes}m
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <WhyPopover explanation={task.explanation} />
            {onComplete && (
              <button
                onClick={() => onComplete(task.id)}
                className="text-xs text-green-600 hover:text-green-800"
                title="Mark done"
              >
                ✓
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
