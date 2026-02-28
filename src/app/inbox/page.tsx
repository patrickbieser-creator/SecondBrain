"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDistanceToNow } from "date-fns";
import { Plus, ArrowRight } from "lucide-react";
import { toast } from "sonner";

type InboxItem = {
  id: string;
  rawText: string;
  capturedAt: string;
  status: string;
};

export default function InboxPage() {
  const [items, setItems] = useState<InboxItem[]>([]);
  const [newText, setNewText] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () => {
    fetch("/api/inbox?status=UNPROCESSED&limit=50")
      .then((r) => r.json())
      .then(setItems)
      .catch(console.error);
  };

  useEffect(load, []);

  const capture = async () => {
    if (!newText.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/inbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText: newText }),
      });
      if (res.ok) {
        setNewText("");
        load();
        toast.success("Captured to inbox");
      }
    } catch {
      toast.error("Failed to capture");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Inbox</h1>

      {/* Capture box */}
      <div className="mb-6 space-y-2">
        <Textarea
          placeholder="What's on your mind? Press Ctrl+Enter to capture…"
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.ctrlKey) capture();
          }}
          className="resize-none"
          rows={3}
        />
        <div className="flex justify-end">
          <Button onClick={capture} disabled={saving || !newText.trim()}>
            <Plus className="h-4 w-4 mr-1" />
            Capture
          </Button>
        </div>
      </div>

      {/* Item list */}
      {items.length === 0 ? (
        <div className="text-center text-muted-foreground py-12">
          Inbox empty — nice work!
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground mb-3">
            {items.length} unprocessed item{items.length !== 1 ? "s" : ""}
          </p>
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm line-clamp-2">{item.rawText}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatDistanceToNow(new Date(item.capturedAt), {
                    addSuffix: true,
                  })}
                </p>
              </div>
              <Link href={`/inbox/${item.id}`}>
                <Button variant="outline" size="sm">
                  Triage <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
