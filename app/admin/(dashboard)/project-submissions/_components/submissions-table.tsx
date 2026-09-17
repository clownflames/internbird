"use client";

import {
  Loader2,
  Eye,
  Globe,
  ExternalLink,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  PlayCircle,
  Lock,
  RotateCcw,
  Send,
} from "lucide-react";

import {FiGithub as Github} from 'react-icons/fi'

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";

import type { AdminSubmission, SubmissionStatus } from "../actions";

/* =========================================================
   STATUS CONFIG
========================================================= */

const statusConfig: Record<
  SubmissionStatus,
  { label: string; color: string; icon: typeof Lock }
> = {
  locked: {
    label: "Locked",
    color: "bg-muted text-muted-foreground",
    icon: Lock,
  },
  unlocked: {
    label: "Not started",
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    icon: PlayCircle,
  },
  in_progress: {
    label: "In progress",
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    icon: Clock,
  },
  submitted: {
    label: "Submitted",
    color: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    icon: Send,
  },
  under_review: {
    label: "Under review",
    color: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
    icon: AlertCircle,
  },
  approved: {
    label: "Approved",
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Rejected",
    color: "bg-red-500/10 text-red-600 dark:text-red-400",
    icon: XCircle,
  },
  completed: {
    label: "Completed",
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    icon: CheckCircle2,
  },
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function timeAgo(iso: string | null) {
  if (!iso) return "—";
  const ms = Date.now() - new Date(iso).getTime();
  const s = Math.floor(ms / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
}

/* =========================================================
   TABLE
========================================================= */

export function SubmissionsTable({
  submissions,
  loading,
  onView,
}: {
  submissions: AdminSubmission[];
  loading: boolean;
  onView: (sub: AdminSubmission) => void;
}) {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Internship</TableHead>
              <TableHead>Links</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead className="w-[70px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : submissions.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-32 text-center text-muted-foreground"
                >
                  No submissions found.
                </TableCell>
              </TableRow>
            ) : (
              submissions.map((sub) => {
                const cfg = statusConfig[sub.status];
                const StatusIcon = cfg.icon;

                return (
                  <TableRow key={sub.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={sub.userImage ?? undefined}
                            alt={sub.userName}
                          />
                          <AvatarFallback className="text-[10px]">
                            {getInitials(sub.userName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {sub.userName}
                          </span>
                          <span className="line-clamp-1 text-xs text-muted-foreground">
                            {sub.userEmail}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {sub.projectTitle}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {sub.projectTotalScore} pts ·{" "}
                          {sub.projectDurationDays}d
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="text-sm">
                      {sub.internshipName}
                    </TableCell>

                    <TableCell>
                      <div className="flex gap-1">
                        {sub.githubUrl && (
                          <a
                            href={sub.githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="GitHub"
                            className="inline-flex h-6 w-6 items-center justify-center rounded hover:bg-accent"
                          >
                            <Github className="h-3.5 w-3.5" />
                          </a>
                        )}
                        {sub.liveUrl && (
                          <a
                            href={sub.liveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Live"
                            className="inline-flex h-6 w-6 items-center justify-center rounded hover:bg-accent"
                          >
                            <Globe className="h-3.5 w-3.5" />
                          </a>
                        )}
                        {sub.submissionUrl && (
                          <a
                            href={sub.submissionUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Link"
                            className="inline-flex h-6 w-6 items-center justify-center rounded hover:bg-accent"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                        {!sub.githubUrl &&
                          !sub.liveUrl &&
                          !sub.submissionUrl &&
                          sub.submissionFiles.length === 0 && (
                            <span className="text-xs text-muted-foreground">
                              —
                            </span>
                          )}
                        {sub.submissionFiles.length > 0 && (
                          <span className="ml-1 text-[10px] text-muted-foreground">
                            {sub.submissionFiles.length} file
                            {sub.submissionFiles.length > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge
                        className={`gap-1 rounded-full border-0 text-[10px] font-medium ${cfg.color}`}
                      >
                        <StatusIcon className="h-2.5 w-2.5" />
                        {cfg.label}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      {sub.score !== null ? (
                        <span className="text-sm font-medium">
                          {sub.score}/{sub.projectTotalScore}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          —
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground">
                      {timeAgo(sub.submittedAt)}
                    </TableCell>

                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() => onView(sub)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}