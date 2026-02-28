"use client";

import { cn } from "@/lib/utils";

interface DomainPillProps {
  name: string;
  color?: string | null;
  className?: string;
}

export function DomainPill({ name, color, className }: DomainPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        "bg-secondary text-secondary-foreground",
        className
      )}
    >
      {color && (
        <span
          className="h-2 w-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: color }}
        />
      )}
      {name}
    </span>
  );
}
