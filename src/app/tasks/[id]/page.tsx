"use client";

import { useState, useEffect, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScoreBadge } from "@/components/common/ScoreBadge";
import { DomainPill } from "@/components/common/DomainPill";
import { ArrowLeft, Focus, CheckCircle, BellOff, Save } from "lucide-react";
import { toast } from "sonner";

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  domainId: string;
  projectId: string | null;
  effortMinutes: number | null;
  energyRequired: string;
  impact: number;
  urgency: number;
  strategicValue: number;
  riskOfDelay: number;
  isBlocker: boolean;
  deadlineAt: string | null;
  snoozedUntil: string | null;
  createdAt: string;
  domain: { name: string; color: string | null };
  project: { name: string } | null;
};

type Domain = { id: string; name: string; color: string | null };
type Project = { id: string; name: string };

const STATUS_OPTIONS = ["NEXT", "IN_PROGRESS", "WAITING", "SOMEDAY", "DONE"];
const ENERGY_OPTIONS = ["LOW", "MED", "HIGH"];

export default function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [task, setTask] = useState<Task | null>(null);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [score, setScore] = useState<{ priorityScore: number; explanation: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [snoozeDate, setSnoozeDate] = useState("");

  // Editable form state (mirrors task fields)
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("NEXT");
  const [domainId, setDomainId] = useState("");
  const [projectId, setProjectId] = useState("none");
  const [effortMinutes, setEffortMinutes] = useState("");
  const [energyRequired, setEnergyRequired] = useState("MED");
  const [impact, setImpact] = useState("3");
  const [urgency, setUrgency] = useState("3");
  const [strategicValue, setStrategicValue] = useState("0");
  const [riskOfDelay, setRiskOfDelay] = useState("0");
  const [isBlocker, setIsBlocker] = useState(false);
  const [deadlineAt, setDeadlineAt] = useState("");

  const loadTask = useCallback(async () => {
    const res = await fetch(`/api/tasks/${id}`);
    if (!res.ok) { router.push("/today"); return; }
    const t: Task = await res.json();
    setTask(t);
    // Populate form
    setTitle(t.title);
    setDescription(t.description ?? "");
    setStatus(t.status);
    setDomainId(t.domainId);
    setProjectId(t.projectId ?? "none");
    setEffortMinutes(t.effortMinutes?.toString() ?? "");
    setEnergyRequired(t.energyRequired);
    setImpact(t.impact.toString());
    setUrgency(t.urgency.toString());
    setStrategicValue(t.strategicValue.toString());
    setRiskOfDelay(t.riskOfDelay.toString());
    setIsBlocker(t.isBlocker);
    setDeadlineAt(
      t.deadlineAt ? new Date(t.deadlineAt).toISOString().slice(0, 10) : ""
    );
  }, [id, router]);

  const refreshScore = useCallback(async () => {
    const res = await fetch("/api/scoring/recompute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scope: "ALL", context: {} }),
    });
    const data = await res.json();
    const all: { id: string; priorityScore: number; explanation: string }[] = [
      ...(data.now ?? []),
      ...(data.next ?? []),
    ];
    const mine = all.find((t) => t.id === id);
    if (mine) setScore({ priorityScore: mine.priorityScore, explanation: mine.explanation });
  }, [id]);

  useEffect(() => {
    loadTask();
    fetch("/api/domains").then((r) => r.json()).then(setDomains);
  }, [loadTask]);

  useEffect(() => {
    if (!domainId) return;
    fetch(`/api/projects?domainId=${domainId}`).then((r) => r.json()).then(setProjects);
  }, [domainId]);

  useEffect(() => {
    refreshScore();
  }, [refreshScore]);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || null,
          status,
          domainId,
          projectId: projectId !== "none" ? projectId : null,
          effortMinutes: effortMinutes ? parseInt(effortMinutes) : null,
          energyRequired,
          impact: parseInt(impact),
          urgency: parseInt(urgency),
          strategicValue: parseInt(strategicValue),
          riskOfDelay: parseInt(riskOfDelay),
          isBlocker,
          deadlineAt: deadlineAt || null,
        }),
      });
      if (!res.ok) { toast.error("Save failed"); return; }
      toast.success("Saved");
      await refreshScore();
    } finally {
      setSaving(false);
    }
  };

  const markDone = async () => {
    await fetch(`/api/tasks/${id}/complete`, { method: "POST" });
    toast.success("Task complete!");
    router.push("/today");
  };

  const snooze = async () => {
    if (!snoozeDate) { toast.error("Pick a date first"); return; }
    await fetch(`/api/tasks/${id}/snooze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ until: new Date(snoozeDate).toISOString() }),
    });
    toast.success("Snoozed until " + snoozeDate);
    setSnoozeDate("");
    loadTask();
  };

  if (!task) {
    return <div className="p-6 text-muted-foreground">Loading…</div>;
  }

  const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
    NEXT: "default",
    IN_PROGRESS: "default",
    WAITING: "secondary",
    SOMEDAY: "outline",
    DONE: "secondary",
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <Link href="/today">
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowLeft className="h-3.5 w-3.5" /> Today
          </Button>
        </Link>
        <Badge variant={statusVariant[task.status] ?? "outline"}>
          {task.status}
        </Badge>
        <DomainPill name={task.domain.name} color={task.domain.color} />
        <div className="ml-auto flex gap-2">
          <Link href={`/focus?taskId=${id}`}>
            <Button size="sm" variant="outline" className="gap-1">
              <Focus className="h-3.5 w-3.5" /> Focus
            </Button>
          </Link>
          <Button
            size="sm"
            className="gap-1 bg-green-600 hover:bg-green-700"
            onClick={markDone}
          >
            <CheckCircle className="h-3.5 w-3.5" /> Done
          </Button>
        </div>
      </div>

      {/* Score card */}
      {score && (
        <Card>
          <CardContent className="p-4 flex items-start gap-4">
            <div className="flex flex-col items-center gap-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Score</p>
              <ScoreBadge score={score.priorityScore} className="text-base px-3 py-1" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                Breakdown
              </p>
              <p className="text-sm font-mono">{score.explanation}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Edit Task</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Title */}
          <div className="space-y-1">
            <Label>Title *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Status */}
            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Domain */}
            <div className="space-y-1">
              <Label>Domain *</Label>
              <Select value={domainId} onValueChange={setDomainId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {domains.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Project */}
            <div className="space-y-1">
              <Label>Project</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Effort */}
            <div className="space-y-1">
              <Label>Effort (min)</Label>
              <Input
                type="number"
                value={effortMinutes}
                onChange={(e) => setEffortMinutes(e.target.value)}
                placeholder="30"
              />
            </div>

            {/* Energy */}
            <div className="space-y-1">
              <Label>Energy</Label>
              <Select value={energyRequired} onValueChange={setEnergyRequired}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ENERGY_OPTIONS.map((e) => (
                    <SelectItem key={e} value={e}>{e}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Impact */}
            <div className="space-y-1">
              <Label>Impact (1–5)</Label>
              <Select value={impact} onValueChange={setImpact}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[1,2,3,4,5].map((n) => (
                    <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Urgency */}
            <div className="space-y-1">
              <Label>Urgency (1–5)</Label>
              <Select value={urgency} onValueChange={setUrgency}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[1,2,3,4,5].map((n) => (
                    <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Strategic Value */}
            <div className="space-y-1">
              <Label>Strategic value (0–5)</Label>
              <Select value={strategicValue} onValueChange={setStrategicValue}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[0,1,2,3,4,5].map((n) => (
                    <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Risk of Delay */}
            <div className="space-y-1">
              <Label>Risk of delay (0–5)</Label>
              <Select value={riskOfDelay} onValueChange={setRiskOfDelay}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[0,1,2,3,4,5].map((n) => (
                    <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Deadline */}
            <div className="space-y-1">
              <Label>Deadline</Label>
              <Input
                type="date"
                value={deadlineAt}
                onChange={(e) => setDeadlineAt(e.target.value)}
              />
            </div>
          </div>

          {/* Blocker */}
          <div className="flex items-center gap-3">
            <Switch
              id="is-blocker-edit"
              checked={isBlocker}
              onCheckedChange={setIsBlocker}
            />
            <Label htmlFor="is-blocker-edit">This task blocks others</Label>
          </div>

          <Button onClick={save} disabled={saving} className="w-full gap-2">
            <Save className="h-4 w-4" />
            {saving ? "Saving…" : "Save Changes"}
          </Button>
        </CardContent>
      </Card>

      {/* Snooze */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base text-muted-foreground">Snooze</CardTitle>
        </CardHeader>
        <CardContent>
          {task.snoozedUntil && (
            <p className="text-sm text-muted-foreground mb-3">
              Currently snoozed until {new Date(task.snoozedUntil).toLocaleDateString()}
            </p>
          )}
          <div className="flex gap-2">
            <Input
              type="date"
              value={snoozeDate}
              onChange={(e) => setSnoozeDate(e.target.value)}
              className="max-w-48"
            />
            <Button variant="outline" onClick={snooze} className="gap-1">
              <BellOff className="h-4 w-4" /> Snooze
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
