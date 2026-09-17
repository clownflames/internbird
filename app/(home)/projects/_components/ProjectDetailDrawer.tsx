"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import {
  Loader2,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  Trophy,
  Briefcase,
  ListChecks,
  Sparkles,
  ExternalLink,
  Globe,
  FileText,
  UploadCloud,
  Trash2,
  CalendarClock,
  Lock,
  PlayCircle,
  Send,
  RotateCcw,
  Paperclip,
} from "lucide-react";
import { FiGithub as Github } from "react-icons/fi";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

import {
  startProject,
  submitProject,
  getProjectUploadUrl,
  type ProjectListItem,
  type ProjectStatus,
} from "../actions";

/* =========================================================
   STATUS CONFIG
========================================================= */

const statusConfig: Record<
  ProjectStatus,
  { label: string; color: string; icon: typeof Lock }
> = {
  locked: {
    label: "Locked",
    color: "bg-muted text-muted-foreground",
    icon: Lock,
  },
  unlocked: {
    label: "Ready to start",
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
    color: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    icon: Clock,
  },
  approved: {
    label: "Approved",
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Rejected",
    color: "bg-red-500/10 text-red-600 dark:text-red-400",
    icon: RotateCcw,
  },
  completed: {
    label: "Completed",
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    icon: Trophy,
  },
};

/* =========================================================
   MAIN DRAWER
========================================================= */

type View = "details" | "submit";

interface Props {
  project: ProjectListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (updated: ProjectListItem) => void;
}

export function ProjectDetailDrawer({
  project,
  open,
  onOpenChange,
  onUpdate,
}: Props) {
  const [view, setView] = useState<View>("details");
  const lastProjectId = useRef<string | null>(null);

  // extract id — primitive, stable
  const projectId = project?.id ?? null;

  useEffect(() => {
    if (!open || !projectId) return;
    if (lastProjectId.current !== projectId) {
      lastProjectId.current = projectId;
      setView("details");
    }
  }, [open, projectId]);

  useEffect(() => {
    if (!open) lastProjectId.current = null;
  }, [open]);

  if (!project) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[92vh] overflow-y-auto rounded-t-2xl p-0 gap-0"
      >
        {view === "details" ? (
          <DetailsView
            key={project.id}
            project={project}
            onStartSubmit={() => setView("submit")}
            onOpenChange={onOpenChange}
            onUpdate={onUpdate}
          />
        ) : (
          <SubmitView
            key={`submit-${project.id}`}
            project={project}
            onCancel={() => setView("details")}
            onSuccess={(updated) => {
              onUpdate(updated);
              setView("details");
            }}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

/* =========================================================
   DETAILS VIEW
========================================================= */

function DetailsView({
  project,
  onStartSubmit,
  onOpenChange,
  onUpdate,
}: {
  project: ProjectListItem;
  onStartSubmit: () => void;
  onOpenChange: (open: boolean) => void;
  onUpdate: (updated: ProjectListItem) => void;
}) {
  const config = statusConfig[project.status];
  const StatusIcon = config.icon;

  const [starting, setStarting] = useState(false);
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isLocked = project.status === "locked";
  const isUnlocked = project.status === "unlocked";
  const isInProgress = project.status === "in_progress";
  const isSubmitted =
    project.status === "submitted" || project.status === "under_review";
  const isRejected = project.status === "rejected";
  const isCompleted =
    project.status === "approved" || project.status === "completed";

  const deadlineDisplay = useMemo(() => {
    if (!isInProgress || !project.deadlineAt) return null;
    const ms = new Date(project.deadlineAt).getTime() - Date.now();
    if (ms <= 0)
      return {
        text: "Deadline passed",
        color: "text-red-600 dark:text-red-400",
      };
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    return {
      text: days > 0 ? `${days}d ${hours}h left` : `${hours}h left`,
      color:
        days <= 1
          ? "text-red-600 dark:text-red-400"
          : days <= 3
          ? "text-amber-600 dark:text-amber-400"
          : "text-muted-foreground",
    };
  }, [isInProgress, project.deadlineAt]);

  function handleStart() {
    setError(null);
    setStarting(true);
    startTransition(async () => {
      const res = await startProject(project.id);
      setStarting(false);
      if (res.success) {
        onUpdate({
          ...project,
          status: "in_progress",
          startedAt: new Date().toISOString(),
          deadlineAt: new Date(
            Date.now() + project.durationDays * 24 * 60 * 60 * 1000
          ).toISOString(),
        });
        onStartSubmit();
      } else {
        setError(res.error ?? "Failed to start project");
      }
    });
  }

  return (
    <div className="flex flex-col">
      <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-muted" />

      <SheetHeader className="px-5 pt-4 pb-0 text-left">
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
            {project.image ? (
              <img
                src={project.image}
                alt={project.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <Sparkles className="h-7 w-7 text-muted-foreground" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <SheetTitle className="text-left text-lg leading-tight">
              {project.title}
            </SheetTitle>
            <SheetDescription className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
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
            </SheetDescription>

            <div className="mt-2">
              <Badge
                className={cn(
                  "gap-1 rounded-full border-0 text-[10px] font-medium",
                  config.color
                )}
              >
                <StatusIcon className="h-2.5 w-2.5" />
                {config.label}
              </Badge>
            </div>
          </div>
        </div>
      </SheetHeader>

      <div className="flex-1 space-y-5 px-5 py-5">
        {deadlineDisplay && (
          <div
            className={cn(
              "flex items-center gap-2 rounded-md border px-3 py-2 text-xs",
              deadlineDisplay.color.includes("red")
                ? "border-red-500/30 bg-red-500/5"
                : deadlineDisplay.color.includes("amber")
                ? "border-amber-500/30 bg-amber-500/5"
                : "border-muted bg-muted/40"
            )}
          >
            <CalendarClock
              className={cn("h-3.5 w-3.5 shrink-0", deadlineDisplay.color)}
            />
            <span className={cn("font-medium", deadlineDisplay.color)}>
              {deadlineDisplay.text}
            </span>
          </div>
        )}

        {isRejected && project.feedback && (
          <div className="rounded-md border border-red-500/30 bg-red-500/5 p-3">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-red-600 dark:text-red-400">
              <AlertCircle className="h-3.5 w-3.5" />
              Project needs revision
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              {project.feedback}
            </p>
          </div>
        )}

        {isCompleted && project.score !== null && (
          <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Project approved
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              You scored{" "}
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {project.score}/{project.totalScore}
              </span>
              {project.feedback && (
                <>
                  <br />
                  <span className="mt-1 inline-block">
                    {project.feedback}
                  </span>
                </>
              )}
            </p>
          </div>
        )}

        {isSubmitted && (
          <div className="rounded-md border border-purple-500/30 bg-purple-500/5 p-3 text-xs">
            <p className="flex items-center gap-1.5 font-semibold text-purple-600 dark:text-purple-400">
              <Clock className="h-3.5 w-3.5" />
              Submitted on{" "}
              {project.submittedAt
                ? new Date(project.submittedAt).toLocaleDateString()
                : "—"}
            </p>
            <p className="mt-1 text-muted-foreground">
              Your submission is under review. You'll be notified once
              evaluated.
            </p>
          </div>
        )}

        {isLocked && (
          <div className="rounded-md border border-muted bg-muted/40 p-3">
            <p className="flex items-center gap-1.5 text-xs font-semibold">
              <Lock className="h-3.5 w-3.5" />
              Locked
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Pass the end exam for this internship to unlock this project.
            </p>
          </div>
        )}

        {project.description && (
          <Section title="About this project">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {project.description}
            </p>
          </Section>
        )}

        {project.requirements.length > 0 && (
          <Section title="Requirements">
            <ul className="space-y-1.5">
              {project.requirements.map((r, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-muted-foreground"
                >
                  <ListChecks className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {project.skills.length > 0 && (
          <Section title="Skills you'll use">
            <div className="flex flex-wrap gap-1.5">
              {project.skills.map((s) => (
                <Badge
                  key={s}
                  variant="secondary"
                  className="rounded-md px-2.5 py-1 text-xs font-normal"
                >
                  {s}
                </Badge>
              ))}
            </div>
          </Section>
        )}

        {project.resources.length > 0 && (
          <Section title="Resources">
            <div className="space-y-1.5">
              {project.resources.map((r, i) => (
                <a
                  key={i}
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2 text-xs transition-colors hover:bg-muted"
                >
                  <ExternalLink className="h-3.5 w-3.5 shrink-0 text-primary" />
                  <span className="line-clamp-1 flex-1">{r.title}</span>
                  <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground" />
                </a>
              ))}
            </div>
          </Section>
        )}

        {project.attachments.length > 0 && (
          <Section title="Attachments">
            <div className="space-y-1.5">
              {project.attachments.map((a, i) => (
                <a
                  key={i}
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2 text-xs transition-colors hover:bg-muted"
                >
                  <Paperclip className="h-3.5 w-3.5 shrink-0 text-primary" />
                  <span className="line-clamp-1 flex-1">{a.name}</span>
                </a>
              ))}
            </div>
          </Section>
        )}

        {project.submissionId &&
          (isSubmitted || isCompleted || isRejected) && (
            <Section title="Your submission">
              <div className="space-y-2 rounded-md border bg-muted/20 p-3 text-xs">
                {project.githubUrl && (
                  <SubmissionLink
                    icon={Github}
                    label="GitHub"
                    url={project.githubUrl}
                  />
                )}
                {project.liveUrl && (
                  <SubmissionLink
                    icon={Globe}
                    label="Live demo"
                    url={project.liveUrl}
                  />
                )}
                {project.submissionUrl && (
                  <SubmissionLink
                    icon={ExternalLink}
                    label="Submission link"
                    url={project.submissionUrl}
                  />
                )}

                {project.submissionFiles.length > 0 && (
                  <div>
                    <p className="mb-1 font-medium">Files</p>
                    <div className="space-y-1">
                      {project.submissionFiles.map((f, i) => (
                        <a
                          key={i}
                          href={f.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
                        >
                          <Paperclip className="h-3 w-3 shrink-0" />
                          <span className="line-clamp-1">{f.name}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {project.submissionNotes && (
                  <div>
                    <p className="mb-1 font-medium">Notes</p>
                    <p className="whitespace-pre-wrap text-muted-foreground">
                      {project.submissionNotes}
                    </p>
                  </div>
                )}
              </div>
            </Section>
          )}
      </div>

      <div className="sticky bottom-0 border-t bg-background/95 px-5 py-3 backdrop-blur">
        {error && (
          <div className="mb-2 flex items-start gap-2 rounded-md border border-red-500/30 bg-red-500/5 px-3 py-2 text-xs text-red-600 dark:text-red-400">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {isLocked ? (
          <Button disabled className="w-full gap-2" size="lg">
            <Lock className="h-4 w-4" />
            Locked
          </Button>
        ) : isUnlocked ? (
          <Button
            onClick={handleStart}
            disabled={starting}
            className="w-full gap-2"
            size="lg"
          >
            {starting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <PlayCircle className="h-4 w-4" />
            )}
            Start project
          </Button>
        ) : isInProgress || isRejected ? (
          <Button onClick={onStartSubmit} className="w-full gap-2" size="lg">
            <Send className="h-4 w-4" />
            {isRejected ? "Resubmit project" : "Submit project"}
          </Button>
        ) : isSubmitted ? (
          <Button
            disabled
            variant="outline"
            className="w-full gap-2"
            size="lg"
          >
            <Clock className="h-4 w-4" />
            Under review
          </Button>
        ) : (
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full"
            size="lg"
          >
            Close
          </Button>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   SUBMIT VIEW
========================================================= */

function SubmitView({
  project,
  onCancel,
  onSuccess,
}: {
  project: ProjectListItem;
  onCancel: () => void;
  onSuccess: (updated: ProjectListItem) => void;
}) {
  const [githubUrl, setGithubUrl] = useState(project.githubUrl ?? "");
  const [liveUrl, setLiveUrl] = useState(project.liveUrl ?? "");
  const [submissionUrl, setSubmissionUrl] = useState(
    project.submissionUrl ?? ""
  );
  const [submissionNotes, setSubmissionNotes] = useState(
    project.submissionNotes ?? ""
  );
  const [submissionFiles, setSubmissionFiles] = useState<
    { name: string; url: string; type?: string; size?: number }[]
  >(project.submissionFiles ?? []);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function addFile(file: {
    name: string;
    url: string;
    type?: string;
    size?: number;
  }) {
    setSubmissionFiles((prev) => [...prev, file]);
  }

  function removeFile(index: number) {
    setSubmissionFiles((prev) => prev.filter((_, i) => i !== index));
  }

  /* ---------- URL input guards ---------- */
  function handleUrlPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData("text").trim();

    // block base64 / data URIs
    if (pasted.startsWith("data:")) {
      e.preventDefault();
      setError(
        "Raw file data detected. Please paste a URL, or upload the file in the Files section below."
      );
      return;
    }

    // block very long pastes (likely not URLs)
    if (pasted.length > 500) {
      e.preventDefault();
      setError("Pasted text is too long. Please paste a valid URL.");
      return;
    }

    // must look like http/https
    if (!/^https?:\/\//i.test(pasted)) {
      e.preventDefault();
      setError("URL must start with http:// or https://");
    }
  }

  function handleUrlDrop(e: React.DragEvent<HTMLInputElement>) {
    // only block file drops
    if (e.dataTransfer.types.includes("Files")) {
      e.preventDefault();
      setError(
        "Files can't be dropped here. Use the Files section below to upload."
      );
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    /* ---------- client-side guards (mirror server) ---------- */
    const urlFields = [
      { name: "GitHub URL", value: githubUrl.trim() },
      { name: "Live URL", value: liveUrl.trim() },
      { name: "Submission URL", value: submissionUrl.trim() },
    ];

    for (const f of urlFields) {
      if (!f.value) continue;
      if (f.value.startsWith("data:")) {
        setError(
          `${f.name} contains raw file data. Please use the Files section.`
        );
        return;
      }
      if (f.value.length > 2000) {
        setError(`${f.name} is too long.`);
        return;
      }
      if (!/^https?:\/\//i.test(f.value)) {
        setError(`${f.name} must start with http:// or https://`);
        return;
      }
    }

    const hasAny =
      githubUrl.trim() ||
      liveUrl.trim() ||
      submissionUrl.trim() ||
      submissionNotes.trim() ||
      submissionFiles.length > 0;

    if (!hasAny) {
      setError("Please provide a link, notes, or at least one file");
      return;
    }

    setSubmitting(true);
    startTransition(async () => {
      const res = await submitProject(project.id, {
        githubUrl: githubUrl.trim() || null,
        liveUrl: liveUrl.trim() || null,
        submissionUrl: submissionUrl.trim() || null,
        submissionNotes: submissionNotes.trim() || null,
        submissionFiles,
      });

      setSubmitting(false);

      if (res.success) {
        onSuccess({
          ...project,
          status: "submitted",
          submittedAt: new Date().toISOString(),
          githubUrl: githubUrl.trim() || null,
          liveUrl: liveUrl.trim() || null,
          submissionUrl: submissionUrl.trim() || null,
          submissionNotes: submissionNotes.trim() || null,
          submissionFiles,
          submissionId: project.submissionId ?? "temp",
        });
      } else {
        setError(res.error ?? "Failed to submit project");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col">
      <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-muted" />

      <SheetHeader className="px-5 pt-4 pb-3 text-left">
        <SheetTitle className="text-left text-lg">Submit project</SheetTitle>
        <SheetDescription className="text-left">
          {project.title}
        </SheetDescription>
      </SheetHeader>

      <Separator />

      <div className="space-y-4 px-5 py-4">
        {error && (
          <div className="flex items-start gap-2 rounded-md border border-red-500/30 bg-red-500/5 px-3 py-2 text-xs text-red-600 dark:text-red-400">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Links
          </h3>

          <Field label="GitHub repository">
            <div className="relative">
              <Github className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="url"
                placeholder="https://github.com/username/repo"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                onPaste={handleUrlPaste}
                onDrop={handleUrlDrop}
                className="pl-9"
              />
            </div>
          </Field>

          <Field label="Live demo / deployment">
            <div className="relative">
              <Globe className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="url"
                placeholder="https://your-project.vercel.app"
                value={liveUrl}
                onChange={(e) => setLiveUrl(e.target.value)}
                onPaste={handleUrlPaste}
                onDrop={handleUrlDrop}
                className="pl-9"
              />
            </div>
          </Field>

          <Field label="Other link (optional)">
            <div className="relative">
              <ExternalLink className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="url"
                placeholder="Drive, Figma, Loom, etc."
                value={submissionUrl}
                onChange={(e) => setSubmissionUrl(e.target.value)}
                onPaste={handleUrlPaste}
                onDrop={handleUrlDrop}
                className="pl-9"
              />
            </div>
          </Field>
        </div>

        <Separator />

        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Files
          </h3>

          <FileUploader
            onUpload={addFile}
            existing={submissionFiles}
            onRemove={removeFile}
          />
        </div>

        <Separator />

        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Notes
          </h3>

          <Field label="Additional notes (optional)">
            <Textarea
              rows={4}
              placeholder="Describe what you built, challenges, learnings..."
              value={submissionNotes}
              onChange={(e) => setSubmissionNotes(e.target.value)}
            />
          </Field>
        </div>
      </div>

      <div className="sticky bottom-0 flex gap-2 border-t bg-background/95 px-5 py-3 backdrop-blur">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={submitting}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={submitting}
          className="flex-1 gap-2"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              Submit project
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

/* =========================================================
   FILE UPLOADER — click, drag, paste all → R2
========================================================= */

function FileUploader({
  onUpload,
  existing,
  onRemove,
}: {
  onUpload: (f: {
    name: string;
    url: string;
    type?: string;
    size?: number;
  }) => void;
  existing: {
    name: string;
    url: string;
    type?: string;
    size?: number;
  }[];
  onRemove: (index: number) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  async function uploadSingle(file: File) {
    const urlRes = await getProjectUploadUrl(file.name, file.type);
    if (!urlRes.success || !urlRes.uploadUrl || !urlRes.publicUrl) {
      throw new Error(urlRes.error ?? "Upload failed");
    }

    const putRes = await fetch(urlRes.uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });

    if (!putRes.ok) {
      throw new Error("Upload failed. Please retry.");
    }

    onUpload({
      name: file.name,
      url: urlRes.publicUrl,
      type: file.type,
      size: file.size,
    });
  }

  async function handleFiles(files: FileList | File[] | null) {
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);

    try {
      for (const file of Array.from(files)) {
        await uploadSingle(file);
      }
    } catch (err) {
      setError((err as Error).message || "Upload error");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  /* ---------- drag & drop ---------- */
  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(true);
  }

  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }

  /* ---------- global paste inside drawer ---------- */
  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      const items = e.clipboardData?.items;
      if (!items) return;

      const files: File[] = [];
      for (const item of Array.from(items)) {
        if (item.kind === "file") {
          const f = item.getAsFile();
          if (f) files.push(f);
        }
      }

      if (files.length > 0) {
        e.preventDefault();
        handleFiles(files);
      }
    }

    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-2">
      {existing.length > 0 && (
        <div className="space-y-1.5">
          {existing.map((f, i) => (
            <div
              key={`${f.url}-${i}`}
              className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2 text-xs"
            >
              <FileText className="h-3.5 w-3.5 shrink-0 text-primary" />
              <span className="line-clamp-1 flex-1">{f.name}</span>
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={cn(
            "flex w-full flex-col items-center gap-1.5 rounded-md border border-dashed bg-muted/20 px-4 py-6 text-xs transition-colors",
            uploading
              ? "opacity-60"
              : dragging
              ? "border-primary bg-primary/5"
              : "hover:border-primary/40 hover:bg-muted/40"
          )}
        >
          {uploading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="font-medium">Uploading...</span>
            </>
          ) : (
            <>
              <UploadCloud className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">
                {dragging
                  ? "Drop files here"
                  : "Click, drag, or paste files"}
              </span>
              <span className="text-[10px] text-muted-foreground">
                PDF, ZIP, images up to 25MB
              </span>
            </>
          )}
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".pdf,.zip,.png,.jpg,.jpeg,.webp,.gif"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {error && (
        <p className="text-[11px] text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}

/* =========================================================
   HELPERS
========================================================= */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      {children}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

function SubmissionLink({
  icon: Icon,
  label,
  url,
}: {
  icon: typeof Github;
  label: string;
  url: string;
}) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="font-medium">{label}</span>
      <ArrowRight className="h-3 w-3 shrink-0" />
    </a>
  );
}