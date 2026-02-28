"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Plus } from "lucide-react";
import { toast } from "sonner";

type Domain = { id: string; name: string; color: string | null };
type Project = { id: string; name: string };

interface NewTaskDialogProps {
  onCreated: () => void;
}

const ENERGY = ["LOW", "MED", "HIGH"] as const;

export function NewTaskDialog({ onCreated }: NewTaskDialogProps) {
  const [open, setOpen] = useState(false);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [saving, setSaving] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [domainId, setDomainId] = useState("");
  const [projectId, setProjectId] = useState("none");
  const [effortMinutes, setEffortMinutes] = useState("");
  const [energyRequired, setEnergyRequired] = useState<"LOW" | "MED" | "HIGH">("MED");
  const [impact, setImpact] = useState("3");
  const [urgency, setUrgency] = useState("3");
  const [strategicValue, setStrategicValue] = useState("0");
  const [riskOfDelay, setRiskOfDelay] = useState("0");
  const [isBlocker, setIsBlocker] = useState(false);
  const [deadlineAt, setDeadlineAt] = useState("");

  useEffect(() => {
    if (!open) return;
    fetch("/api/domains")
      .then((r) => r.json())
      .then((d: Domain[]) => {
        setDomains(d);
        if (d.length > 0 && !domainId) setDomainId(d[0].id);
      });
  }, [open]);

  useEffect(() => {
    if (!domainId) return;
    fetch(`/api/projects?domainId=${domainId}`)
      .then((r) => r.json())
      .then(setProjects);
  }, [domainId]);

  const reset = () => {
    setTitle("");
    setDescription("");
    setDomainId("");
    setProjectId("none");
    setEffortMinutes("");
    setEnergyRequired("MED");
    setImpact("3");
    setUrgency("3");
    setStrategicValue("0");
    setRiskOfDelay("0");
    setIsBlocker(false);
    setDeadlineAt("");
  };

  const submit = async () => {
    if (!title.trim()) { toast.error("Title is required"); return; }
    if (!domainId) { toast.error("Domain is required"); return; }

    setSaving(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description || undefined,
          domainId,
          projectId: projectId !== "none" ? projectId : undefined,
          effortMinutes: effortMinutes ? parseInt(effortMinutes) : undefined,
          energyRequired,
          impact: parseInt(impact),
          urgency: parseInt(urgency),
          strategicValue: parseInt(strategicValue),
          riskOfDelay: parseInt(riskOfDelay),
          isBlocker,
          deadlineAt: deadlineAt || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error ?? "Failed to create task");
        return;
      }
      toast.success("Task created");
      setOpen(false);
      reset();
      onCreated();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus className="h-3.5 w-3.5 mr-1" />
          New Task
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Task</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Title */}
          <div className="space-y-1">
            <Label htmlFor="new-task-title">Title *</Label>
            <Input
              id="new-task-title"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to get done?"
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional details"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Domain */}
            <div className="space-y-1">
              <Label>Domain *</Label>
              <Select value={domainId} onValueChange={setDomainId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pick domain" />
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

            {/* Project */}
            <div className="space-y-1">
              <Label>Project</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
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
                min={1}
              />
            </div>

            {/* Energy */}
            <div className="space-y-1">
              <Label>Energy</Label>
              <Select
                value={energyRequired}
                onValueChange={(v) => setEnergyRequired(v as typeof energyRequired)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ENERGY.map((e) => (
                    <SelectItem key={e} value={e}>{e}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Impact */}
            <div className="space-y-1">
              <Label>Impact (1–5)</Label>
              <Select value={impact} onValueChange={setImpact}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
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
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1,2,3,4,5].map((n) => (
                    <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Strategic Value */}
            <div className="space-y-1">
              <Label>Strategic (0–5)</Label>
              <Select value={strategicValue} onValueChange={setStrategicValue}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
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
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[0,1,2,3,4,5].map((n) => (
                    <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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

          {/* Blocker */}
          <div className="flex items-center gap-3">
            <Switch
              id="is-blocker"
              checked={isBlocker}
              onCheckedChange={setIsBlocker}
            />
            <Label htmlFor="is-blocker">This task blocks others</Label>
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={submit} disabled={saving} className="flex-1">
              {saving ? "Creating…" : "Create Task"}
            </Button>
            <Button
              variant="outline"
              onClick={() => { setOpen(false); reset(); }}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
