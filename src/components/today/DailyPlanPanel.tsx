"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Clock } from "lucide-react";

type PlanTask = {
  id: string;
  title: string;
  domainName: string;
  domainColor: string | null;
  priorityScore: number;
  effortMinutes: number;
};

type PlanBucket = {
  label: "Must" | "Should" | "Could";
  tasks: PlanTask[];
  totalMinutes: number;
};

interface DailyPlanPanelProps {
  buckets: PlanBucket[];
  availableMinutes: number;
}

const bucketVariant: Record<string, "default" | "secondary" | "outline"> = {
  Must: "default",
  Should: "secondary",
  Could: "outline",
};

export function DailyPlanPanel({ buckets, availableMinutes }: DailyPlanPanelProps) {
  const totalPlanned = buckets.reduce((s, b) => s + b.totalMinutes, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          <Clock className="h-3.5 w-3.5 inline mr-1" />
          {totalPlanned}m planned of {availableMinutes}m available
        </span>
      </div>
      {buckets.map((bucket) => (
        <div key={bucket.label}>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant={bucketVariant[bucket.label]}>{bucket.label}</Badge>
            <span className="text-xs text-muted-foreground">
              {bucket.totalMinutes}m
            </span>
          </div>
          <div className="space-y-1">
            {bucket.tasks.length === 0 ? (
              <p className="text-xs text-muted-foreground pl-1">—</p>
            ) : (
              bucket.tasks.map((task) => (
                <Link
                  key={task.id}
                  href={`/focus?taskId=${task.id}`}
                  className="flex items-center gap-2 text-sm hover:bg-accent rounded px-1 py-0.5 group"
                >
                  {task.domainColor && (
                    <span
                      className="h-2 w-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: task.domainColor }}
                    />
                  )}
                  <span className="flex-1 line-clamp-1 group-hover:underline">
                    {task.title}
                  </span>
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {task.effortMinutes}m
                  </span>
                </Link>
              ))
            )}
          </div>
          <Separator className="mt-3" />
        </div>
      ))}
    </div>
  );
}
