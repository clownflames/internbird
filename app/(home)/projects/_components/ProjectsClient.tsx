"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import {
  Briefcase,
  Clock,
  Trophy,
  CheckCircle2,
  Lock,
  PlayCircle,
  Send,
  RotateCcw,
  ChevronRight,
  ListChecks,
  Sparkles,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { ProjectDetailDrawer } from "./ProjectDetailDrawer";
import type { ProjectListItem, ProjectStatus } from "../actions";

/* =========================================================
   STATUS CONFIG
========================================================= */

const statusConfig: Record<
  ProjectStatus,
  {
    label: string;
    color: string;
    icon: typeof Lock;
    cta: string;
  }
> = {
  locked: {
    label: "Locked",
    color: "bg-muted text-muted-foreground",
    icon: Lock,
    cta: "Pass end exam to unlock",
  },
  unlocked: {
    label: "Ready to start",
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    icon: PlayCircle,
    cta: "Start project",
  },
  in_progress: {
    label: "In progress",
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    icon: Clock,
    cta: "Continue",
  },
  submitted: {
    label: "Submitted",
    color: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    icon: Send,
    cta: "Under review",
  },
  under_review: {
    label: "Under review",
    color: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    icon: Clock,
    cta: "Under review",
  },
  approved: {
    label: "Approved",
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    icon: CheckCircle2,
    cta: "Completed",
  },
  rejected: {
    label: "Rejected",
    color: "bg-red-500/10 text-red-600 dark:text-red-400",
    icon: RotateCcw,
    cta: "Resubmit",
  },
  completed: {
    label: "Completed",
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    icon: Trophy,
    cta: "Completed",
  },
};

type TabKey = "all" | "pending" | "in_progress" | "completed";

/* =========================================================
   MAIN CLIENT
========================================================= */

export function ProjectsClient({
  initialProjects,
}: {
  initialProjects: ProjectListItem[];
}) {
  const [projects, setProjects] = useState<ProjectListItem[]>(initialProjects);
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Keep reference to the last snapshot we synced from, so we don't
  // re-run the sync when server sends the same array reference.
  const lastServerSnapshotRef = useRef(initialProjects);

  // Sync server → client ONLY when it's genuinely a new array reference.
  // This is safe because Next.js will give us a new reference only when
  // the server actually re-rendered with fresh data.
  useEffect(() => {
    if (lastServerSnapshotRef.current === initialProjects) return;
    lastServerSnapshotRef.current = initialProjects;

    setProjects((prev) => {
      // quick length check
      if (prev.length !== initialProjects.length) return initialProjects;

      // shallow compare by id + status
      const changed = initialProjects.some((p, i) => {
        const old = prev[i];
        return (
          !old ||
          old.id !== p.id ||
          old.status !== p.status ||
          old.submittedAt !== p.submittedAt ||
          old.score !== p.score
        );
      });

      return changed ? initialProjects : prev;
    });
  }, [initialProjects]);

  /* ---------- derived ---------- */
  const counts = useMemo(
    () => ({
      all: projects.length,
      pending: projects.filter(
        (p) => p.status === "unlocked" || p.status === "locked"
      ).length,
      in_progress: projects.filter(
        (p) =>
          p.status === "in_progress" ||
          p.status === "submitted" ||
          p.status === "under_review" ||
          p.status === "rejected"
      ).length,
      completed: projects.filter(
        (p) => p.status === "approved" || p.status === "completed"
      ).length,
    }),
    [projects]
  );

  const filtered = useMemo(() => {
    if (activeTab === "all") return projects;
    if (activeTab === "pending") {
      return projects.filter(
        (p) => p.status === "unlocked" || p.status === "locked"
      );
    }
    if (activeTab === "in_progress") {
      return projects.filter(
        (p) =>
          p.status === "in_progress" ||
          p.status === "submitted" ||
          p.status === "under_review" ||
          p.status === "rejected"
      );
    }
    if (activeTab === "completed") {
      return projects.filter(
        (p) => p.status === "approved" || p.status === "completed"
      );
    }
    return projects;
  }, [projects, activeTab]);

  /* ---------- drawer handlers ---------- */
  const openProject = (id: string) => {
    setSelectedId(id);
    setDrawerOpen(true);
  };

  const handleUpdate = (updated: ProjectListItem) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === updated.id ? updated : p))
    );
  };

  // 🔒 MEMOIZED — critical. Prevents new object reference on every render.
  const selectedProject = useMemo(
    () => projects.find((p) => p.id === selectedId) ?? null,
    [projects, selectedId]
  );

  /* ---------- empty state ---------- */
  if (projects.length === 0) {
    return (
      <div className="space-y-3">
        <HeaderCard
          counts={counts}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <HeaderCard
        counts={counts}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {filtered.length === 0 ? (
        <EmptyFilteredState tab={activeTab} />
      ) : (
        <div className="space-y-3">
          {filtered.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={() => openProject(project.id)}
            />
          ))}
        </div>
      )}

      <ProjectDetailDrawer
        project={selectedProject}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onUpdate={handleUpdate}
      />
    </div>
  );
}

/* =========================================================
   HEADER CARD
========================================================= */

function HeaderCard({
  counts,
  activeTab,
  onTabChange,
}: {
  counts: {
    all: number;
    pending: number;
    in_progress: number;
    completed: number;
  };
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
}) {
  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: "all", label: "All", count: counts.all },
    { key: "pending", label: "Pending", count: counts.pending },
    { key: "in_progress", label: "In progress", count: counts.in_progress },
    { key: "completed", label: "Completed", count: counts.completed },
  ];

  return (
    <Card className="py-0 gap-0 border-primary/20">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15">
            <ListChecks className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Projects</h1>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Complete end exams to unlock projects. Submit and get approved
              to earn your certificate.
            </p>
          </div>
        </div>

        <div className="mt-4 flex gap-1 overflow-x-auto border-b scrollbar-thin">
          {tabs.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => onTabChange(tab.key)}
                className={cn(
                  "relative flex shrink-0 items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors",
                  active
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
                {tab.count > 0 && (
                  <Badge
                    variant={active ? "default" : "secondary"}
                    className="h-4 min-w-4 justify-center rounded-full px-1 text-[10px] leading-none"
                  >
                    {tab.count}
                  </Badge>
                )}
                {active && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
                )}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

/* =========================================================
   PROJECT CARD
========================================================= */

function ProjectCard({
  project,
  onClick,
}: {
  project: ProjectListItem;
  onClick: () => void;
}) {
  const config = statusConfig[project.status];
  const StatusIcon = config.icon;

  const isLocked = project.status === "locked";
  const isCompleted =
    project.status === "approved" || project.status === "completed";

  const deadlineInfo = useMemo(() => {
    if (project.status !== "in_progress" || !project.deadlineAt) return null;
    const ms = new Date(project.deadlineAt).getTime() - Date.now();
    if (ms > 0) {
      const days = Math.ceil(ms / (1000 * 60 * 60 * 24));
      return days > 1 ? `${days} days left` : "Due today";
    }
    return "Overdue";
  }, [project.status, project.deadlineAt]);

  return (
    <Card
      className={cn(
        "cursor-pointer py-0 gap-0 transition-all hover:border-primary/30",
        isLocked && "opacity-60"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
            {project.image ? (
              <img
                src={project.image}
                alt={project.title}
                className="h-full w-full object-cover"
              />
            ) : isLocked ? (
              <Lock className="h-5 w-5 text-muted-foreground" />
            ) : (
              <Sparkles className="h-5 w-5 text-primary" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3
                  className={cn(
                    "truncate text-sm font-semibold leading-tight",
                    isLocked && "text-muted-foreground"
                  )}
                >
                  {project.title}
                </h3>

                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Briefcase className="h-3 w-3" />
                    {project.internshipName}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {project.durationDays} days
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Trophy className="h-3 w-3" />
                    {project.totalScore} pts
                  </span>

                  {deadlineInfo && (
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 font-medium",
                        deadlineInfo === "Overdue"
                          ? "text-red-500"
                          : "text-amber-500"
                      )}
                    >
                      <Clock className="h-3 w-3" />
                      {deadlineInfo}
                    </span>
                  )}
                </div>
              </div>

              <Badge
                className={cn(
                  "shrink-0 gap-1 rounded-full border-0 text-[10px] font-medium",
                  config.color
                )}
              >
                <StatusIcon className="h-2.5 w-2.5" />
                {config.label}
              </Badge>
            </div>

            {project.description && (
              <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                {project.description}
              </p>
            )}

            {isCompleted && project.score !== null && (
              <div className="mt-2 flex items-center gap-2 text-[11px]">
                <span className="inline-flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-3 w-3" />
                  Score: {project.score}/{project.totalScore}
                </span>
              </div>
            )}
          </div>

          <ChevronRight className="h-4 w-4 shrink-0 self-center text-muted-foreground" />
        </div>

        <div className="mt-3 flex items-center justify-between gap-2 border-t pt-3">
          <p className="text-[11px] text-muted-foreground">{config.cta}</p>
          <Button
            size="sm"
            variant={isCompleted ? "outline" : "default"}
            className="h-7 text-[11px]"
            disabled={isLocked}
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            {isLocked
              ? "Locked"
              : isCompleted
              ? "View details"
              : project.status === "unlocked"
              ? "Start"
              : project.status === "in_progress"
              ? "Continue"
              : "View"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* =========================================================
   EMPTY STATES
========================================================= */

function EmptyState() {
  return (
    <Card className="py-0 gap-0">
      <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <ListChecks className="h-6 w-6 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium">No projects yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Register for an internship and pass the end exam to unlock
            projects.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyFilteredState({ tab }: { tab: TabKey }) {
  const map: Record<TabKey, string> = {
    all: "No projects",
    pending: "No pending projects",
    in_progress: "No projects in progress",
    completed: "No completed projects yet",
  };
  return (
    <Card className="py-0 gap-0">
      <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <ListChecks className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium">{map[tab]}</p>
      </CardContent>
    </Card>
  );
}