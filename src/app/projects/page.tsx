"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DomainPill } from "@/components/common/DomainPill";
import { ArrowRight, FolderOpen } from "lucide-react";

type Project = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  domain: { id: string; name: string; color: string | null };
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then(setProjects)
      .catch(console.error);
  }, []);

  // Group by domain
  const byDomain = projects.reduce<Record<string, Project[]>>((acc, p) => {
    const key = p.domain.name;
    acc[key] = [...(acc[key] ?? []), p];
    return acc;
  }, {});

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Projects</h1>

      {Object.keys(byDomain).length === 0 ? (
        <div className="text-center text-muted-foreground py-12">
          No projects yet.
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(byDomain).map(([domainName, projs]) => (
            <div key={domainName}>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                {domainName}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {projs.map((project) => (
                  <Link key={project.id} href={`/projects/${project.id}`}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <FolderOpen className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium text-sm">
                                {project.name}
                              </span>
                            </div>
                            {project.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {project.description}
                              </p>
                            )}
                            <div className="mt-2">
                              <DomainPill
                                name={project.domain.name}
                                color={project.domain.color}
                              />
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <Badge
                              variant={
                                project.status === "ACTIVE"
                                  ? "default"
                                  : "secondary"
                              }
                              className="text-xs"
                            >
                              {project.status}
                            </Badge>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
