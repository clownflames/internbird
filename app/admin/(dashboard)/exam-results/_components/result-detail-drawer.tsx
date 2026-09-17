"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Trophy,
  User,
  Calendar,
  Timer,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { getExamResultDetail } from "../actions";

type Detail = Awaited<ReturnType<typeof getExamResultDetail>>;

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(d: Date | string | null) {
  if (!d) return "—";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(seconds: number | null) {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

export function ResultDetailDrawer({
  submissionId,
  open,
  onOpenChange,
  onReEvaluate,
}: {
  submissionId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReEvaluate: (id: string) => void;
}) {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!submissionId || !open) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const d = await getExamResultDetail(submissionId);
        if (!cancelled) setDetail(d);
      } catch {
        if (!cancelled) toast.error("Failed to load details");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [submissionId, open]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[92vh] overflow-y-auto rounded-t-2xl p-0 gap-0"
      >
        <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-muted" />

        <SheetHeader className="px-5 pt-4 pb-3 text-left">
          <SheetTitle className="text-left text-lg">
            Exam Result Details
          </SheetTitle>
          <SheetDescription className="text-left">
            {detail
              ? `${detail.submission.examTitle} · ${detail.submission.userName}`
              : "Loading..."}
          </SheetDescription>
        </SheetHeader>

        <Separator />

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !detail ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            No data
          </div>
        ) : (
          <div className="space-y-5 px-5 py-5">
            {/* student */}
            <div className="flex items-center gap-3 rounded-lg border bg-muted/20 p-3">
              <Avatar className="h-12 w-12">
                <AvatarImage
                  src={detail.submission.userImage ?? undefined}
                />
                <AvatarFallback>
                  {getInitials(detail.submission.userName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">
                  {detail.submission.userName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {detail.submission.userEmail}
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {detail.submission.internshipName}
                </p>
              </div>
            </div>

            {/* summary */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatBlock
                label="Score"
                value={
                  detail.submission.score !== null
                    ? `${detail.submission.score}/${detail.submission.totalScore}`
                    : "—"
                }
              />
              <StatBlock
                label="Percentage"
                value={
                  detail.submission.percentage
                    ? `${Number(detail.submission.percentage).toFixed(1)}%`
                    : "—"
                }
              />
              <StatBlock
                label="Attempt"
                value={`#${detail.submission.attemptNumber}`}
              />
              <StatBlock
                label="Time"
                value={formatDuration(detail.submission.timeTaken)}
              />
            </div>

            {/* pass/fail banner */}
            {detail.submission.passed === true && (
              <div className="flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-xs">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                  Passed
                </span>
                <span className="text-muted-foreground">
                  (passing score: {detail.submission.examPassingScore})
                </span>
              </div>
            )}
            {detail.submission.passed === false && (
              <div className="flex items-center gap-2 rounded-md border border-red-500/30 bg-red-500/5 px-3 py-2 text-xs">
                <XCircle className="h-4 w-4 text-red-600" />
                <span className="font-medium text-red-600 dark:text-red-400">
                  Failed
                </span>
                <span className="text-muted-foreground">
                  (passing score: {detail.submission.examPassingScore})
                </span>
              </div>
            )}

            {/* meta */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-md border bg-muted/20 p-3">
                <p className="text-muted-foreground">Started</p>
                <p className="mt-0.5 font-medium">
                  {formatDate(detail.submission.startedAt)}
                </p>
              </div>
              <div className="rounded-md border bg-muted/20 p-3">
                <p className="text-muted-foreground">Submitted</p>
                <p className="mt-0.5 font-medium">
                  {formatDate(detail.submission.submittedAt)}
                </p>
              </div>
            </div>

            {/* re-evaluate */}
            {detail.submission.status === "submitted" && (
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => onReEvaluate(detail.submission.id)}
              >
                <Clock className="h-4 w-4" />
                Re-evaluate this submission
              </Button>
            )}

            <Separator />

            {/* answers */}
            <div>
              <h3 className="mb-3 text-sm font-semibold">
                Answers ({detail.answers.length})
              </h3>
              <div className="space-y-3">
                {detail.answers.map((a, idx) => (
                  <AnswerCard key={a.id} answer={a} index={idx} />
                ))}
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

/* =========================================================
   SMALL COMPONENTS
========================================================= */

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-muted/20 p-3">
      <p className="text-[10px] uppercase text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-base font-semibold">{value}</p>
    </div>
  );
}

function AnswerCard({
  answer,
  index,
}: {
  answer: any;
  index: number;
}) {
  const [open, setOpen] = useState(false);

  const correct = answer.selectedOption === answer.correctOption;
  const skipped = answer.selectedOption === null;

  return (
    <div className="rounded-md border bg-background">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-start gap-3 p-3 text-left"
      >
        <div
          className={cn(
            "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
            correct
              ? "bg-emerald-500/15 text-emerald-600"
              : skipped
              ? "bg-amber-500/15 text-amber-600"
              : "bg-red-500/15 text-red-600"
          )}
        >
          {correct ? "✓" : skipped ? "–" : "✕"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium">
            Q{index + 1}. {answer.question}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Marks: {answer.marksObtained}/{answer.marks}
          </p>
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
      </button>

      {open && (
        <div className="space-y-1.5 border-t bg-muted/20 p-3">
          {answer.options.map((opt: string, i: number) => {
            const isCorrect = i === answer.correctOption;
            const isSelected = i === answer.selectedOption;
            return (
              <div
                key={i}
                className={cn(
                  "flex items-start gap-2 rounded-md border px-2.5 py-1.5 text-xs",
                  isCorrect &&
                    "border-emerald-500/40 bg-emerald-500/10",
                  isSelected &&
                    !isCorrect &&
                    "border-red-500/40 bg-red-500/10"
                )}
              >
                <span className="font-mono text-[10px] text-muted-foreground">
                  {String.fromCharCode(65 + i)}.
                </span>
                <span className="flex-1">{opt}</span>
                {isSelected && (
                  <Badge className="h-4 rounded-full text-[9px]">
                    Selected
                  </Badge>
                )}
                {isCorrect && (
                  <Badge className="h-4 rounded-full bg-emerald-600 text-[9px]">
                    Correct
                  </Badge>
                )}
              </div>
            );
          })}

          {answer.explanation && (
            <div className="mt-2 flex items-start gap-2 rounded-md border border-blue-500/30 bg-blue-500/5 p-2 text-[11px] text-blue-700 dark:text-blue-400">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{answer.explanation}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}