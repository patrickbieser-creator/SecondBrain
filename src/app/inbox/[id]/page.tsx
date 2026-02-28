"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

type InboxItem = {
  id: string;
  rawText: string;
  capturedAt: string;
  status: string;
};
type Domain = { id: string; name: string; color: string | null };

export default function TriagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [item, setItem] = useState<InboxItem | null>(null);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [type, setType] = useState<"TASK" | "PROJECT" | "SOMEDAY" | "NOTE">(
    "TASK"
  );
  const [domainId, setDomainId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [effortMinutes, setEffortMinutes] = useState("");
  const [impact, setImpact] = useState("3");
  const [urgency, setUrgency] = useState("3");
  const [strategicValue, setStrategicValue] = useState("0");
  const [riskOfDelay, setRiskOfDelay] = useState("0");
  const [tags, setTags] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/inbox?status=UNPROCESSED`)
      .then((r) => r.json())
      .then((items: InboxItem[]) => {
        const found = items.find((i) => i.id === id);
        if (found) {
          setItem(found);
          setTitle(found.rawText.slice(0, 100));
        }
      });
    fetch("/api/domains")
      .then((r) => r.json())
      .then((d: Domain[]) => {
        setDomains(d);
        if (d.length > 0) setDomainId(d[0].id);
      });
  }, [id]);

  const triage = async (andNext = false) => {
    setSaving(true);
    try {
      const body: Record<string, unknown> = { type };
      if (type === "TASK" || type === "SOMEDAY") {
        body.task = {
          title,
          description: description || undefined,
          domainId,
          effortMinutes: effortMinutes ? parseInt(effortMinutes) : undefined,
          impact: parseInt(impact),
          urgency: parseInt(urgency),
          strategicValue: parseInt(strategicValue),
          riskOfDelay: parseInt(riskOfDelay),
          tags: tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        };
      } else if (type === "PROJECT") {
        body.project = { name: title, description: description || undefined, domainId };
      }

      const res = await fetch(`/api/inbox/${id}/triage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        toast.success("Triaged!");
        if (andNext) {
          router.push("/inbox");
        } else {
          router.push("/today");
        }
      } else {
        const err = await res.json();
        toast.error(err.error ?? "Triage failed");
      }
    } finally {
      setSaving(false);
    }
  };

  const discard = async () => {
    await fetch(`/api/inbox/${id}/triage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "NOTE" }),
    });
    toast.success("Discarded");
    router.push("/inbox");
  };

  if (!item) return <div className="p-6">Loading…</div>;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Triage</h1>
      <p className="text-xs text-muted-foreground mb-6">
        Captured{" "}
        {formatDistanceToNow(new Date(item.capturedAt), { addSuffix: true })}
      </p>

      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Raw text
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">{item.rawText}</p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {/* Type */}
        <div className="grid grid-cols-4 gap-2">
          {(["TASK", "PROJECT", "SOMEDAY", "NOTE"] as const).map((t) => (
            <Button
              key={t}
              variant={type === t ? "default" : "outline"}
              size="sm"
              onClick={() => setType(t)}
            >
              {t}
            </Button>
          ))}
        </div>

        {type !== "NOTE" && (
          <>
            <div className="space-y-1">
              <Label>Domain</Label>
              <Select value={domainId} onValueChange={setDomainId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select domain" />
                </SelectTrigger>
                <SelectContent>
                  {domains.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>{type === "PROJECT" ? "Project name" : "Title"} *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Task title"
              />
            </div>

            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional details"
                rows={2}
              />
            </div>
          </>
        )}

        {(type === "TASK" || type === "SOMEDAY") && (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Effort (minutes)</Label>
              <Input
                type="number"
                value={effortMinutes}
                onChange={(e) => setEffortMinutes(e.target.value)}
                placeholder="30"
              />
            </div>
            <div className="space-y-1">
              <Label>Impact (1-5)</Label>
              <Select value={impact} onValueChange={setImpact}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Urgency (1-5)</Label>
              <Select value={urgency} onValueChange={setUrgency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Tags (comma-separated)</Label>
              <Input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="email, quick"
              />
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button onClick={() => triage(false)} disabled={saving}>
            Save → Today
          </Button>
          <Button variant="outline" onClick={() => triage(true)} disabled={saving}>
            Save + Next
          </Button>
          <Button variant="ghost" onClick={discard} disabled={saving}>
            Discard
          </Button>
        </div>
      </div>
    </div>
  );
}
