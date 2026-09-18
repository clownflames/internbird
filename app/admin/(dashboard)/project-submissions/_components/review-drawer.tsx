"use client";

import { useEffect, useState } from "react";
import {
  ExternalLink,
  Globe,
  FileText,
  Paperclip,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Clock,
  RotateCcw,
  Save,
  Lock,
} from "lucide-react";
import { FiGithub as GithubIcon } from "react-icons/fi";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

import type { AdminSubmission, SubmissionStatus } from "../actions";

const statusConfig: Record<
  SubmissionStatus,
  { label: string; color: string }
> = {
  locked: { label: "Locked", color: "bg-muted text-muted-foreground" },
  unlocked: {
    label: "Not started",
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  in_progress: {
    label: "In progress",
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  submitted: {
    label: "Submitted",
    color: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  },
  under_review: {
    label: "Under review",
    color: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  },
  approved: {
    label: "Approved",
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  rejected: {
    label: "Rejected",
    color: "bg-red-500/10 text-red-600 dark:text-red-400",
  },
  completed: {
    label: "Completed",
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
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

/* =========================================================
   REVIEW DRAWER
========================================================= */

export function ReviewDrawer({
  submission,
  open,
  onOpenChange,
  onMarkUnderReview,
  onApprove,
  onReject,
  onReset,
}: {
  submission: AdminSubmission | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMarkUnderReview: (sub: AdminSubmission) => void;
  onApprove: (
    sub: AdminSubmission,
    score: number,
    feedback: string
  ) => void;
  onReject: (sub: AdminSubmission) => void;
  onReset: (sub: AdminSubmission) => void;
}) {
  const [score, setScore] = useState<string>("");
  const [feedback, setFeedback] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // reset form when submission changes
  useEffect(() => {
    if (submission) {
      setScore(submission.score?.toString() ?? "");
      setFeedback(submission.feedback ?? "");
      setError(null);
    }
  }, [submission]);

  if (!submission) return null;

  const cfg = statusConfig[submission.status];
  const canReview =
    submission.status === "submitted" ||
    submission.status === "under_review";

  const canReset =
    submission.status === "approved" ||
    submission.status === "rejected" ||
    submission.status === "completed";

  function handleApprove() {
    setError(null);
    const parsed = Number(score);
    if (!Number.isFinite(parsed) || parsed < 0) {
      setError("Please enter a valid score");
      return;
    }
    if (parsed > submission!.projectTotalScore) {
      setError(
        `Score cannot exceed ${submission!.projectTotalScore}`
      );
      return;
    }
    onApprove(submission!, parsed, feedback);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[92vh] overflow-y-auto rounded-t-2xl p-0 gap-0"
      >
        <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-muted" />

        {/* HEADER */}
        <SheetHeader className="px-5 pt-4 pb-3 text-left">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
              {submission.projectImage ? (
                <img
                  src={submission.projectImage}
                  alt={submission.projectTitle}
                  className="h-full w-full object-cover"
                />
              ) : (
                <FileText className="h-6 w-6 text-muted-foreground" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <SheetTitle className="text-left text-lg leading-tight">
                {submission.projectTitle}
              </SheetTitle>
              <SheetDescription className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                <span>{submission.internshipName}</span>
                <span className="text-muted-foreground/50">·</span>
                <span>
                  {submission.projectTotalScore} pts (pass:{" "}
                  {submission.projectPassingScore})
                </span>
              </SheetDescription>

              <div className="mt-2">
                <Badge
                  className={cn(
                    "gap-1 rounded-full border-0 text-[10px] font-medium",
                    cfg.color
                  )}
                >
                  {cfg.label}
                </Badge>
              </div>
            </div>
          </div>
        </SheetHeader>

        <Separator />

        {/* BODY */}
        <div className="space-y-5 px-5 py-5">
          {/* Student */}
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Student
            </h3>
            <div className="flex items-center gap-3 rounded-md border bg-muted/20 p-3">
              <Avatar className="h-10 w-10">
                <AvatarImage
                  src={submission.userImage ?? undefined}
                  alt={submission.userName}
                />
                <AvatarFallback>
                  {getInitials(submission.userName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {submission.userName}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {submission.userEmail}
                </p>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Timeline
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <TimelineRow label="Started" value={submission.startedAt} />
              <TimelineRow label="Submitted" value={submission.submittedAt} />
              <TimelineRow
                label="Deadline"
                value={submission.deadlineAt}
                highlight
              />
              <TimelineRow label="Reviewed" value={submission.reviewedAt} />
            </div>
          </div>

          {/* Submission links */}
          {(submission.githubUrl ||
            submission.liveUrl ||
            submission.submissionUrl) && (
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Links
              </h3>
              <div className="space-y-1.5">
                {submission.githubUrl && (
                  <SubmissionLink
                    icon={GithubIcon}
                    label="GitHub repository"
                    url={submission.githubUrl}
                  />
                )}
                {submission.liveUrl && (
                  <SubmissionLink
                    icon={Globe}
                    label="Live demo"
                    url={submission.liveUrl}
                  />
                )}
                {submission.submissionUrl && (
                  <SubmissionLink
                    icon={ExternalLink}
                    label="Other link"
                    url={submission.submissionUrl}
                  />
                )}
              </div>
            </div>
          )}

          {/* Files */}
          {submission.submissionFiles.length > 0 && (
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Files ({submission.submissionFiles.length})
              </h3>
              <div className="space-y-1.5">
                {submission.submissionFiles.map((f, i) => (
                  <a
                    key={i}
                    href={f.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-md border bg-muted/20 px-3 py-2 text-xs transition-colors hover:bg-muted"
                  >
                    <Paperclip className="h-3.5 w-3.5 shrink-0 text-primary" />
                    <span className="line-clamp-1 flex-1">{f.name}</span>
                    {f.size && (
                      <span className="text-[10px] text-muted-foreground">
                        {(f.size / 1024).toFixed(1)} KB
                      </span>
                    )}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {submission.submissionNotes && (
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Student notes
              </h3>
              <p className="whitespace-pre-wrap rounded-md border bg-muted/20 p-3 text-xs leading-relaxed text-muted-foreground">
                {submission.submissionNotes}
              </p>
            </div>
          )}

          {/* Review section */}
          {canReview && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Review
                </h3>

                {error && (
                  <div className="flex items-start gap-2 rounded-md border border-red-500/30 bg-red-500/5 px-3 py-2 text-xs text-red-600 dark:text-red-400">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="grid gap-2">
                  <Label className="text-xs">
                    Score (out of {submission.projectTotalScore})
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    max={submission.projectTotalScore}
                    value={score}
                    onChange={(e) => setScore(e.target.value)}
                    placeholder={`Passing: ${submission.projectPassingScore}`}
                  />
                </div>

                <div className="grid gap-2">
                  <Label className="text-xs">
                    Feedback (optional)
                  </Label>
                  <Textarea
                    rows={4}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Share your feedback with the student..."
                  />
                </div>
              </div>
            </>
          )}

          {/* Show existing review if already reviewed */}
          {(submission.status === "approved" ||
            submission.status === "rejected" ||
            submission.status === "completed") &&
            submission.score !== null && (
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Review result
                </h3>
                <div
                  className={cn(
                    "rounded-md border p-3 text-xs",
                    submission.status === "approved" ||
                      submission.status === "completed"
                      ? "border-emerald-500/30 bg-emerald-500/5"
                      : "border-red-500/30 bg-red-500/5"
                  )}
                >
                  <p className="font-semibold">
                    Score:{" "}
                    <span className="text-base">
                      {submission.score}/{submission.projectTotalScore}
                    </span>
                  </p>
                  {submission.feedback && (
                    <p className="mt-1.5 whitespace-pre-wrap text-muted-foreground">
                      {submission.feedback}
                    </p>
                  )}
                  {submission.reviewedByName && (
                    <p className="mt-1.5 text-[10px] text-muted-foreground">
                      Reviewed by {submission.reviewedByName}
                    </p>
                  )}
                </div>
              </div>
            )}
        </div>

        {/* FOOTER */}
        <div className="sticky bottom-0 border-t bg-background/95 px-5 py-3 backdrop-blur">
          {submission.status === "submitted" && (
            <div className="mb-2 flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => onMarkUnderReview(submission)}
                className="gap-2"
              >
                <Clock className="h-4 w-4" />
                Mark under review
              </Button>
            </div>
          )}

          {canReview ? (
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                variant="outline"
                className="flex-1 gap-2 border-red-500/40 text-red-600 hover:bg-red-500/5 hover:text-red-600"
                onClick={() => onReject(submission)}
              >
                <XCircle className="h-4 w-4" />
                Reject
              </Button>
              <Button
                className="flex-1 gap-2"
                onClick={handleApprove}
              >
                <CheckCircle2 className="h-4 w-4" />
                Approve
              </Button>
            </div>
          ) : canReset ? (
            <Button
              variant="outline"
              onClick={() => onReset(submission)}
              className="w-full gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset to in-progress
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full"
            >
              Close
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* =========================================================
   HELPERS
========================================================= */

function TimelineRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string | null;
  highlight?: boolean;
}) {
  return (
    <div className="flex flex-col rounded-md border bg-muted/20 px-2 py-1.5">
      <span className="text-[10px] uppercase text-muted-foreground">
        {label}
      </span>
      <span
        className={cn(
          "text-xs font-medium",
          highlight && "text-amber-600 dark:text-amber-400"
        )}
      >
        {value ? new Date(value).toLocaleDateString() : "—"}
      </span>
    </div>
  );
}

function SubmissionLink({
  icon: Icon,
  label,
  url,
}: {
  icon: typeof GithubIcon;
  label: string;
  url: string;
}) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 rounded-md border bg-muted/20 px-3 py-2 text-xs transition-colors hover:bg-muted"
    >
      <Icon className="h-3.5 w-3.5 shrink-0 text-primary" />
      <span className="font-medium">{label}</span>
      <ExternalLink className="ml-auto h-3 w-3 text-muted-foreground" />
    </a>
  );
}