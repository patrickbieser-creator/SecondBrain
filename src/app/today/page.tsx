"use client";

import { useState, useEffect, useCallback } from "react";
import { NowList } from "@/components/today/NowList";
import { NextList } from "@/components/today/NextList";
import { DailyPlanPanel } from "@/components/today/DailyPlanPanel";
import { InboxPreview } from "@/components/today/InboxPreview";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RefreshCw, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { NewTaskDialog } from "@/components/today/NewTaskDialog";

type Domain = { id: string; name: string; color: string | null };
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
  deadlineAt: string | null;
};
type PlanBucket = {
  label: "Must" | "Should" | "Could";
  tasks: {
    id: string;
    title: string;
    domainName: string;
    domainColor: string | null;
    priorityScore: number;
    effortMinutes: number;
  }[];
  totalMinutes: number;
};

export default function TodayPage() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [selectedDomainId, setSelectedDomainId] = useState<string>("all");
  const [deepWork, setDeepWork] = useState(false);
  const [nowTasks, setNowTasks] = useState<ScoredTask[]>([]);
  const [nextTasks, setNextTasks] = useState<ScoredTask[]>([]);
  const [planBuckets, setPlanBuckets] = useState<PlanBucket[]>([]);
  const [availableMinutes, setAvailableMinutes] = useState(240);
  const [inboxItems, setInboxItems] = useState<
    { id: string; rawText: string; capturedAt: string }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetch("/api/domains")
      .then((r) => r.json())
      .then(setDomains)
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetch("/api/inbox?status=UNPROCESSED&limit=5")
      .then((r) => r.json())
      .then(setInboxItems)
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetch("/api/plans/today")
      .then((r) => r.json())
      .then((data) => {
        if (data?.planJson) {
          setPlanBuckets(data.planJson.buckets ?? []);
          setAvailableMinutes(data.planJson.availableMinutes ?? 240);
        }
      })
      .catch(console.error);
  }, []);

  const recompute = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/scoring/recompute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope: selectedDomainId !== "all" ? "DOMAIN" : "ALL",
          domainId: selectedDomainId !== "all" ? selectedDomainId : undefined,
          context: {
            currentDomainId:
              selectedDomainId !== "all" ? selectedDomainId : undefined,
            deepWork,
          },
        }),
      });
      const data = await res.json();
      setNowTasks(data.now ?? []);
      setNextTasks(data.next ?? []);
    } catch {
      toast.error("Failed to recompute scores");
    } finally {
      setLoading(false);
    }
  }, [selectedDomainId, deepWork]);

  useEffect(() => {
    recompute();
  }, [recompute]);

  const generatePlan = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/plans/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deepWork,
          domainFocusId: selectedDomainId !== "all" ? selectedDomainId : null,
        }),
      });
      const data = await res.json();
      setPlanBuckets(data.buckets ?? []);
      setAvailableMinutes(data.availableMinutes ?? 240);
      toast.success("Daily plan generated");
    } catch {
      toast.error("Failed to generate plan");
    } finally {
      setGenerating(false);
    }
  };

  const completeTask = async (id: string) => {
    await fetch(`/api/tasks/${id}/complete`, { method: "POST" });
    toast.success("Task marked done");
    recompute();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Today</h1>
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={selectedDomainId} onValueChange={setSelectedDomainId}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All domains" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Domains</SelectItem>
              {domains.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <Switch
              id="deep-work"
              checked={deepWork}
              onCheckedChange={setDeepWork}
            />
            <Label htmlFor="deep-work" className="text-sm cursor-pointer">
              Deep Work
            </Label>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={recompute}
            disabled={loading}
          >
            <RefreshCw
              className={`h-3.5 w-3.5 mr-1 ${loading ? "animate-spin" : ""}`}
            />
            Recompute
          </Button>

          <NewTaskDialog onCreated={recompute} />

          <Button size="sm" onClick={generatePlan} disabled={generating}>
            <Sparkles className="h-3.5 w-3.5 mr-1" />
            {generating ? "Generating…" : "Generate Plan"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              NOW — Top 3
            </h2>
            <NowList tasks={nowTasks} onComplete={completeTask} />
          </section>

          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              NEXT — Up to 10
            </h2>
            <NextList tasks={nextTasks} onComplete={completeTask} />
          </section>
        </div>

        <div className="space-y-6">
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Daily Plan
            </h2>
            {planBuckets.length > 0 ? (
              <DailyPlanPanel
                buckets={planBuckets}
                availableMinutes={availableMinutes}
              />
            ) : (
              <div className="text-muted-foreground text-sm text-center py-4">
                No plan yet — click Generate Plan
              </div>
            )}
          </section>

          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Inbox Preview
            </h2>
            <InboxPreview items={inboxItems} />
          </section>
        </div>
      </div>
    </div>
  );
}
