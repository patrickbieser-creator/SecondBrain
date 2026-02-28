"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ScoreBadge } from "@/components/common/ScoreBadge";
import { DomainPill } from "@/components/common/DomainPill";
import { WhyPopover } from "@/components/common/WhyPopover";
import { toast } from "sonner";
import { Play, Square, CheckCircle, SkipForward } from "lucide-react";

type Task = {
  id: string;
  title: string;
  description: string | null;
  effortMinutes: number | null;
  status: string;
  domain: { name: string; color: string | null };
};

type LatestScore = {
  priorityScore: number;
  explanation: string;
};

function FocusInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const taskId = searchParams.get("taskId");

  const [task, setTask] = useState<Task | null>(null);
  const [score, setScore] = useState<LatestScore | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!taskId) return;
    fetch(`/api/tasks/${taskId}`)
      .then((r) => r.json())
      .then(setTask);
  }, [taskId]);

  const tick = useCallback(() => {
    setElapsed((e) => e + 1);
  }, []);

  const startTimer = async () => {
    try {
      const res = await fetch("/api/focus/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, mode: "SINGLE_THREAD" }),
      });
      const data = await res.json();
      setSessionId(data.id);
      setRunning(true);
      intervalRef.current = setInterval(tick, 1000);
    } catch {
      toast.error("Failed to start session");
    }
  };

  const stopTimer = async () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
    if (!sessionId) return;
    try {
      await fetch("/api/focus/stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      toast.success(`Session saved: ${formatTime(elapsed)}`);
    } catch {
      toast.error("Failed to stop session");
    }
  };

  const markDone = async () => {
    if (running) await stopTimer();
    if (!taskId) return;
    await fetch(`/api/tasks/${taskId}/complete`, { method: "POST" });
    toast.success("Task complete!");
    router.push("/today");
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  function formatTime(s: number) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  }

  if (!taskId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <p className="text-muted-foreground mb-4">No task selected.</p>
        <Button onClick={() => router.push("/today")}>Go to Today</Button>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading task…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-background">
      <div className="w-full max-w-lg space-y-8">
        {/* Task info */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-2">
            <DomainPill name={task.domain.name} color={task.domain.color} />
          </div>
          <h1 className="text-3xl font-bold">{task.title}</h1>
          {task.description && (
            <p className="text-muted-foreground">{task.description}</p>
          )}
          {task.effortMinutes && (
            <p className="text-sm text-muted-foreground">
              Estimated: {task.effortMinutes}m
            </p>
          )}
        </div>

        {/* Timer */}
        <div className="text-center">
          <div className="text-6xl font-mono font-bold tabular-nums">
            {formatTime(elapsed)}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          {!running ? (
            <Button size="lg" onClick={startTimer} className="gap-2">
              <Play className="h-5 w-5" /> Start
            </Button>
          ) : (
            <Button size="lg" variant="outline" onClick={stopTimer} className="gap-2">
              <Square className="h-5 w-5" /> Pause
            </Button>
          )}
          <Button
            size="lg"
            variant="default"
            onClick={markDone}
            className="gap-2 bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="h-5 w-5" /> Done
          </Button>
          <Button
            size="lg"
            variant="ghost"
            onClick={() => router.push("/today")}
            className="gap-2"
          >
            <SkipForward className="h-5 w-5" /> Skip
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function FocusPage() {
  return (
    <Suspense fallback={<div className="p-8 text-muted-foreground">Loading…</div>}>
      <FocusInner />
    </Suspense>
  );
}
