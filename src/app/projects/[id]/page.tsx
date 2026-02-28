"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { ScoreBadge } from "@/components/common/ScoreBadge";
import { DomainPill } from "@/components/common/DomainPill";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

type Task = {
  id: string;
  title: string;
  status: string;
  effortMinutes: number | null;
  domain: { name: string; color: string | null };
};

type Project = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  domain: { name: string; color: string | null };
};

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    fetch(`/api/projects?domainId=all`)
      .then((r) => r.json())
      .then((projects: Project[]) => {
        const found = projects.find((p) => p.id === id);
        setProject(found ?? null);
      });
    fetch(`/api/tasks?projectId=${id}`)
      .then((r) => r.json())
      .then(setTasks);
  }, [id]);

  if (!project) return <div className="p-6 text-muted-foreground">Loading…</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Link href="/projects">
        <Button variant="ghost" size="sm" className="mb-4 gap-1">
          <ArrowLeft className="h-3.5 w-3.5" /> Projects
        </Button>
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold">{project.name}</h1>
        <div className="flex items-center gap-2 mt-1">
          <DomainPill name={project.domain.name} color={project.domain.color} />
        </div>
        {project.description && (
          <p className="text-muted-foreground mt-2">{project.description}</p>
        )}
      </div>

      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
        Tasks ({tasks.filter((t) => t.status !== "DONE").length} active)
      </h2>

      <div className="divide-y border rounded-lg">
        {tasks.length === 0 ? (
          <div className="p-4 text-muted-foreground text-sm text-center">
            No tasks in this project.
          </div>
        ) : (
          tasks.map((task) => (
            <Link
              key={task.id}
              href={`/focus?taskId=${task.id}`}
              className="flex items-center gap-3 p-3 hover:bg-accent/50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm ${
                    task.status === "DONE"
                      ? "line-through text-muted-foreground"
                      : ""
                  }`}
                >
                  {task.title}
                </p>
                <p className="text-xs text-muted-foreground">{task.status}</p>
              </div>
              {task.effortMinutes && (
                <span className="text-xs text-muted-foreground">
                  {task.effortMinutes}m
                </span>
              )}
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
