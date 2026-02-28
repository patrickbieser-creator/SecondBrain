"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";

type InboxItem = {
  id: string;
  rawText: string;
  capturedAt: string | Date;
};

interface InboxPreviewProps {
  items: InboxItem[];
}

export function InboxPreview({ items }: InboxPreviewProps) {
  if (items.length === 0) {
    return (
      <div className="text-muted-foreground text-sm py-2 text-center">
        Inbox clear ✓
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between gap-2 py-1.5"
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm line-clamp-1">{item.rawText}</p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(item.capturedAt), {
                addSuffix: true,
              })}
            </p>
          </div>
          <Link href={`/inbox/${item.id}`}>
            <Button variant="outline" size="sm" className="h-6 text-xs flex-shrink-0">
              Triage
            </Button>
          </Link>
        </div>
      ))}
      <div className="pt-1">
        <Link href="/inbox">
          <Button variant="ghost" size="sm" className="w-full text-xs">
            <Inbox className="h-3.5 w-3.5 mr-1" /> View all inbox
          </Button>
        </Link>
      </div>
    </div>
  );
}
