"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Loader2,
  FileQuestion,
  Clock,
  Play,
  CheckCircle2,
  XCircle,
  Hourglass,
  RotateCcw,
  Trophy,
  AlertCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { getMyExams, type UserExamItem } from "./actions";

/* =========================================================
   HELPERS
========================================================= */

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function statusBadge(status: UserExamItem["status"], passed: boolean | null) {
  switch (status) {
    case "not_started":
      return (
        <Badge variant="outline" className="gap-1">
          <Hourglass className="h-3 w-3" />
          Not Started
        </Badge>
      );
    case "started":
      return (
        <Badge className="gap-1 bg-yellow-500 hover:bg-yellow-600 text-white">
          <Hourglass className="h-3 w-3" />
          In Progress
        </Badge>
      );
    case "submitted":
      return (
        <Badge className="gap-1 bg-blue-600 hover:bg-blue-700 text-white">
          <Clock className="h-3 w-3" />
          Submitted
        </Badge>
      );
    case "evaluated":
      return passed ? (
        <Badge className="gap-1 bg-green-600 hover:bg-green-700 text-white">
          <CheckCircle2 className="h-3 w-3" />
          Passed
        </Badge>
      ) : (
        <Badge className="gap-1 bg-red-600 hover:bg-red-700 text-white">
          <XCircle className="h-3 w-3" />
          Failed
        </Badge>
      );
  }
}

/* =========================================================
   EXAM CARD
========================================================= */

function ExamCard({
  exam,
  onStart,
}: {
  exam: UserExamItem;
  onStart: (exam: UserExamItem) => void;
}) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="line-clamp-1 text-base">
              {exam.examTitle}
            </CardTitle>
            <CardDescription className="line-clamp-2 text-xs">
              {exam.examDescription || "No description"}
            </CardDescription>
          </div>
          {statusBadge(exam.status, exam.passed)}
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4 pt-0">
        {/* Meta */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <FileQuestion className="h-3.5 w-3.5" />
            <span className="capitalize">{exam.examType} Exam</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {exam.duration} min
          </span>
          <span className="inline-flex items-center gap-1">
            <Trophy className="h-3.5 w-3.5" />
            {exam.passingScore}/{exam.totalScore} to pass
          </span>
        </div>

        <Separator />

        {/* Attempts / score info */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="text-muted-foreground">Attempts</p>
            <p className="font-medium">
              {exam.attemptsUsed} / {exam.maxAttempts}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">
              {exam.status === "evaluated" ? "Score" : "Last Attempt"}
            </p>
            <p className="font-medium">
              {exam.status === "evaluated" && exam.score != null
                ? `${exam.score} / ${exam.totalScore}`
                : exam.submittedAt
                ? formatDate(exam.submittedAt)
                : "—"}
            </p>
          </div>
        </div>

        {/* Reason / hint */}
        {exam.reason && (
          <div className="flex items-start gap-2 rounded-md border border-dashed bg-muted/30 p-2 text-xs text-muted-foreground">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{exam.reason}</span>
          </div>
        )}

        {/* Action */}
        <div className="mt-auto">
          {exam.canStart ? (
            <Button
              onClick={() => onStart(exam)}
              className="w-full gap-2"
              variant={exam.status === "submitted" ? "outline" : "default"}
            >
              {exam.status === "submitted" ? (
                <>
                  <RotateCcw className="h-4 w-4" />
                  Retake Exam
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Start Exam
                </>
              )}
            </Button>
          ) : (
            <Button disabled className="w-full gap-2" variant="outline">
              {exam.status === "started" ? (
                <>
                  <Hourglass className="h-4 w-4" />
                  In Progress
                </>
              ) : exam.passed ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Completed
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4" />
                  Not Available
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* =========================================================
   MAIN PAGE
========================================================= */

export default function MyExamsPage() {
  const router = useRouter();
  const [exams, setExams] = useState<UserExamItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await getMyExams();
        if (res.success) {
          setExams(res.data);
        } else {
          toast.error(res.error ?? "Failed to load exams");
        }
      } catch {
        toast.error("Failed to load exams");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* Grouping */
  const { pending, completed } = useMemo(() => {
    const pending: UserExamItem[] = [];
    const completed: UserExamItem[] = [];

    for (const e of exams) {
      if (
        e.status === "evaluated" ||
        (e.attemptsUsed >= e.maxAttempts && e.status !== "not_started")
      ) {
        completed.push(e);
      } else {
        pending.push(e);
      }
    }
    return { pending, completed };
  }, [exams]);

  const handleStart = (exam: UserExamItem) => {
    router.push(`/exam/start/${exam.examId}`);
  };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Exams</h1>
        <p className="text-sm text-muted-foreground">
          View your pending and completed exams for the internships you&apos;re
          enrolled in.
        </p>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : exams.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <FileQuestion className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">No exams available</p>
              <p className="text-sm text-muted-foreground">
                You don&apos;t have any exams assigned yet.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="pending" className="gap-2">
              Pending
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {pending.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="completed" className="gap-2">
              Completed
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {completed.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          {/* PENDING */}
          <TabsContent value="pending" className="mt-6">
            {pending.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                    <CheckCircle2 className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">All caught up</p>
                    <p className="text-sm text-muted-foreground">
                      You have no pending exams.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {pending.map((exam) => (
                  <ExamCard
                    key={exam.examId}
                    exam={exam}
                    onStart={handleStart}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* COMPLETED */}
          <TabsContent value="completed" className="mt-6">
            {completed.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                    <FileQuestion className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">No completed exams</p>
                    <p className="text-sm text-muted-foreground">
                      Once you finish an exam, it&apos;ll appear here.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {completed.map((exam) => (
                  <ExamCard
                    key={exam.examId}
                    exam={exam}
                    onStart={handleStart}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}