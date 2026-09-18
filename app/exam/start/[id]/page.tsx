"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Loader2,
  Clock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Circle,
  Flag,
  Send,
  FileQuestion,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

import {
  startExam,
  getExamAttempt,
  submitExamAttempt,
  type ExamAttemptData,
  type SubmitAnswer,
} from "./actions";

/* =========================================================
   HELPERS
========================================================= */

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/* =========================================================
   MAIN PAGE
========================================================= */

export default function ExamStartPage() {
  const params = useParams();
  const router = useRouter();
  const examId = String(params?.id ?? "");

  const [attempt, setAttempt] = useState<ExamAttemptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});

  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const submittedRef = useRef(false);
  const startedAtRef = useRef<number>(Date.now());

  /* =========================================================
     BOOTSTRAP: start or resume attempt
  ========================================================= */
  useEffect(() => {
    if (!examId) return;

    (async () => {
      setLoading(true);
      try {
        const res = await startExam(examId);
        if (!res.success) {
          setError(res.error ?? "Unable to start exam");
          return;
        }

        const attemptRes = await getExamAttempt(res.submissionId!);
        if (!attemptRes.success || !attemptRes.data) {
          setError(attemptRes.error ?? "Unable to load exam");
          return;
        }

        setAttempt(attemptRes.data);
        startedAtRef.current = new Date(
          attemptRes.data.startedAt
        ).getTime();

        // compute remaining time from startedAt (server time)
        const elapsedSec = Math.floor(
          (Date.now() - new Date(attemptRes.data.startedAt).getTime()) / 1000
        );
        const totalSec = attemptRes.data.duration * 60;
        setTimeLeft(Math.max(0, totalSec - elapsedSec));
      } catch {
        setError("Something went wrong");
      } finally {
        setLoading(false);
      }
    })();
  }, [examId]);

  /* =========================================================
     TIMER
  ========================================================= */
  useEffect(() => {
    if (!attempt || error) return;
    if (timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval);
          // auto-submit
          if (!submittedRef.current) {
            handleSubmit(true);
          }
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt, error, timeLeft <= 0]);

  /* =========================================================
     NAVIGATION GUARD (unsaved exam)
  ========================================================= */
  useEffect(() => {
    if (!attempt || error) return;

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [attempt, error]);

  /* =========================================================
     ANSWER / NAVIGATION
  ========================================================= */
  const setAnswer = (questionId: string, optionIndex: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const toggleFlag = (questionId: string) => {
    setFlagged((prev) => ({ ...prev, [questionId]: !prev[questionId] }));
  };

  const goNext = () => {
    if (!attempt) return;
    setCurrentIndex((i) =>
      Math.min(i + 1, attempt.questions.length - 1)
    );
  };

  const goPrev = () => {
    setCurrentIndex((i) => Math.max(0, i - 1));
  };

  const goTo = (i: number) => setCurrentIndex(i);

  /* =========================================================
     SUBMIT
  ========================================================= */
  const handleSubmit = async (auto = false) => {
    if (!attempt || submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);

    try {
      const timeTaken = Math.floor(
        (Date.now() - startedAtRef.current) / 1000
      );

      const payload: SubmitAnswer[] = attempt.questions.map((q) => ({
        questionId: q.id,
        selectedOption:
          answers[q.id] === undefined ? null : answers[q.id],
      }));

      const res = await submitExamAttempt(
        attempt.submissionId,
        payload,
        timeTaken
      );

      if (res.success) {
        toast.success(
          auto
            ? "Time up! Exam submitted automatically."
            : "Exam submitted successfully!"
        );
        // small delay for toast
        setTimeout(() => {
          router.replace("/dashboard/results");
        }, 600);
      } else {
        submittedRef.current = false;
        toast.error(res.error ?? "Failed to submit");
      }
    } catch {
      submittedRef.current = false;
      toast.error("Failed to submit exam");
    } finally {
      setSubmitting(false);
      setConfirmOpen(false);
    }
  };

  /* =========================================================
     DERIVED
  ========================================================= */
  const answeredCount = useMemo(
    () => Object.keys(answers).length,
    [answers]
  );
  const totalQuestions = attempt?.questions.length ?? 0;
  const currentQ = attempt?.questions[currentIndex];

  const lowTime = timeLeft > 0 && timeLeft <= 60;

  /* =========================================================
     LOADING / ERROR
  ========================================================= */
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Starting exam...</p>
        </div>
      </div>
    );
  }

  if (error || !attempt) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <Card className="max-w-md">
          <CardHeader>
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/40">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle>Cannot start exam</CardTitle>
            <CardDescription>
              {error ?? "This exam is not available right now."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => router.replace("/dashboard/exams")}
              className="w-full"
            >
              Back to Exams
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  /* =========================================================
     MAIN RENDER
  ========================================================= */
  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      {/* =============================================
          TOP BAR
      ============================================= */}
      <header className="sticky top-0 z-20 border-b bg-background">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <FileQuestion className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-sm font-semibold sm:text-base">
                {attempt.examTitle}
              </h1>
              <p className="text-xs text-muted-foreground">
                <span className="capitalize">{attempt.examType}</span> Exam ·
                Attempt #{attempt.attemptNumber} · {attempt.totalScore} marks
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div
              className={`flex items-center gap-2 rounded-md border px-3 py-1.5 font-mono text-sm font-semibold ${
                lowTime
                  ? "animate-pulse border-red-500 bg-red-50 text-red-600 dark:bg-red-950/30"
                  : "border-border bg-muted/40"
              }`}
            >
              <Clock className="h-4 w-4" />
              {formatTime(timeLeft)}
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (confirm("Leave exam? Your answers will be lost.")) {
                  router.replace("/dashboard/exams");
                }
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* =============================================
          CONTENT
      ============================================= */}
      <div className="mx-auto grid w-full max-w-7xl flex-1 gap-6 px-4 py-6 lg:grid-cols-[1fr_280px]">
        {/* ---------- QUESTION AREA ---------- */}
        <div className="flex flex-col gap-4">
          {currentQ && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      Q{currentIndex + 1} / {totalQuestions}
                    </Badge>
                    <Badge variant="secondary">{currentQ.marks} marks</Badge>
                    {flagged[currentQ.id] && (
                      <Badge className="gap-1 bg-amber-500 text-white">
                        <Flag className="h-3 w-3" />
                        Flagged
                      </Badge>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleFlag(currentQ.id)}
                    className="gap-2"
                  >
                    <Flag
                      className={`h-4 w-4 ${
                        flagged[currentQ.id]
                          ? "fill-amber-500 text-amber-500"
                          : ""
                      }`}
                    />
                    {flagged[currentQ.id] ? "Unflag" : "Flag"}
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-base font-medium leading-relaxed">
                  {currentQ.question}
                </p>

                <Separator />

                <RadioGroup
                  value={
                    answers[currentQ.id] !== undefined
                      ? String(answers[currentQ.id])
                      : ""
                  }
                  onValueChange={(v) =>
                    setAnswer(currentQ.id, Number(v))
                  }
                  className="gap-2"
                >
                  {currentQ.options.map((opt, i) => {
                    const selected = answers[currentQ.id] === i;
                    return (
                      <Label
                        key={i}
                        htmlFor={`opt-${currentQ.id}-${i}`}
                        className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                          selected
                            ? "border-primary bg-primary/5"
                            : "hover:bg-accent/50"
                        }`}
                      >
                        <RadioGroupItem
                          value={String(i)}
                          id={`opt-${currentQ.id}-${i}`}
                        />
                        <span className="text-xs font-mono text-muted-foreground">
                          {String.fromCharCode(65 + i)}.
                        </span>
                        <span className="flex-1 text-sm">{opt}</span>
                      </Label>
                    );
                  })}
                </RadioGroup>
              </CardContent>
            </Card>
          )}

          {/* ---------- NAV BUTTONS ---------- */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={goPrev}
              disabled={currentIndex === 0}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            <span className="text-xs text-muted-foreground">
              {answeredCount} of {totalQuestions} answered
            </span>

            {currentIndex === totalQuestions - 1 ? (
              <Button
                onClick={() => setConfirmOpen(true)}
                className="gap-2"
              >
                <Send className="h-4 w-4" />
                Submit
              </Button>
            ) : (
              <Button onClick={goNext} className="gap-2">
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* ---------- SIDEBAR (question palette) ---------- */}
        <aside className="flex flex-col gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Questions</CardTitle>
              <CardDescription className="text-xs">
                Jump to any question
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <div className="grid grid-cols-5 gap-2">
                {attempt.questions.map((q, i) => {
                  const isAnswered = answers[q.id] !== undefined;
                  const isFlagged = flagged[q.id];
                  const isCurrent = i === currentIndex;

                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => goTo(i)}
                      className={[
                        "relative flex h-9 w-9 items-center justify-center rounded-md border text-xs font-medium transition-colors",
                        isCurrent
                          ? "border-primary bg-primary text-primary-foreground"
                          : isAnswered
                          ? "border-green-500 bg-green-500/10 text-green-700 hover:bg-green-500/20 dark:text-green-500"
                          : "border-border bg-background hover:bg-accent",
                      ].join(" ")}
                    >
                      {i + 1}
                      {isFlagged && (
                        <span className="absolute -right-1 -top-1 flex h-3 w-3 items-center justify-center rounded-full bg-amber-500">
                          <Flag className="h-2 w-2 fill-white text-white" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <Separator />

              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full border-2 border-primary bg-primary" />
                  <span className="text-muted-foreground">Current</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-green-500/20 ring-1 ring-green-500" />
                  <span className="text-muted-foreground">
                    Answered ({answeredCount})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full border bg-background" />
                  <span className="text-muted-foreground">
                    Not answered ({totalQuestions - answeredCount})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Flag className="h-3 w-3 fill-amber-500 text-amber-500" />
                  <span className="text-muted-foreground">Flagged</span>
                </div>
              </div>

              <Button
                onClick={() => setConfirmOpen(true)}
                className="w-full gap-2"
                disabled={submitting}
              >
                <Send className="h-4 w-4" />
                Submit Exam
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>

      {/* =============================================
          CONFIRM DIALOG
      ============================================= */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit exam?</AlertDialogTitle>
            <AlertDialogDescription>
              You have answered{" "}
              <span className="font-semibold">
                {answeredCount} of {totalQuestions}
              </span>{" "}
              questions.
              {answeredCount < totalQuestions && (
                <>
                  {" "}
                  <span className="text-red-600">
                    {totalQuestions - answeredCount} unanswered
                  </span>{" "}
                  will be marked as incorrect.
                </>
              )}
              <br />
              Once submitted, you cannot change your answers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleSubmit(false)}
              disabled={submitting}
            >
              {submitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Submit Now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}