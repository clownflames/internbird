"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Loader2,
  BarChart3,
  Trophy,
  Clock,
  Eye,
  CheckCircle2,
  XCircle,
  FileQuestion,
  Target,
  Timer,
  Award,
  AlertCircle,
  Percent,
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import {
  getMyResults,
  getMyResultDetail,
  type ResultListItem,
  type ResultDetail,
} from "./actions";

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

function formatTime(seconds: number | null) {
  if (!seconds && seconds !== 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function scoreBadge(passed: boolean | null) {
  if (passed === true)
    return (
      <Badge className="gap-1 bg-green-600 hover:bg-green-700 text-white">
        <CheckCircle2 className="h-3 w-3" />
        Passed
      </Badge>
    );
  if (passed === false)
    return (
      <Badge className="gap-1 bg-red-600 hover:bg-red-700 text-white">
        <XCircle className="h-3 w-3" />
        Failed
      </Badge>
    );
  return (
    <Badge variant="outline" className="gap-1">
      <Clock className="h-3 w-3" />
      Pending
    </Badge>
  );
}

/* =========================================================
   RESULT CARD
========================================================= */

function ResultCard({
  item,
  onView,
}: {
  item: ResultListItem;
  onView: (id: string) => void;
}) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="line-clamp-1 text-base">
              {item.examTitle}
            </CardTitle>
            <CardDescription className="line-clamp-1 text-xs">
              {item.internshipName ?? "—"} · Attempt #{item.attemptNumber}
            </CardDescription>
          </div>
          {scoreBadge(item.passed)}
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4 pt-0">
        {/* Meta */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 capitalize">
            <FileQuestion className="h-3.5 w-3.5" />
            {item.examType} Exam
          </span>
          {item.timeTaken != null && (
            <span className="inline-flex items-center gap-1">
              <Timer className="h-3.5 w-3.5" />
              {formatTime(item.timeTaken)}
            </span>
          )}
          {item.submittedAt && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {formatDate(item.submittedAt)}
            </span>
          )}
        </div>

        <Separator />

        {/* Score block */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Score</p>
            <p className="font-semibold">
              {item.score ?? 0}
              <span className="text-muted-foreground">
                {" "}
                / {item.totalScore ?? 0}
              </span>
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Percentage</p>
            <p className="font-semibold">
              {item.percentage ? `${item.percentage}%` : "—"}
            </p>
          </div>
        </div>

        <div className="mt-auto">
          <Button
            onClick={() => onView(item.submissionId)}
            variant="outline"
            className="w-full gap-2"
          >
            <Eye className="h-4 w-4" />
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* =========================================================
   MAIN PAGE
========================================================= */

export default function MyResultsPage() {
  const [items, setItems] = useState<ResultListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detail, setDetail] = useState<ResultDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  /* ---------- body scroll lock when drawer open ---------- */
  useEffect(() => {
    if (drawerOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [drawerOpen]);

  /* ---------- load list ---------- */
  useEffect(() => {
    (async () => {
      try {
        const res = await getMyResults();
        if (res.success) setItems(res.data);
        else toast.error(res.error ?? "Failed to load results");
      } catch {
        toast.error("Failed to load results");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ---------- open drawer ---------- */
  const openDetail = async (submissionId: string) => {
    setDrawerOpen(true);
    setLoadingDetail(true);
    setDetail(null);
    try {
      const res = await getMyResultDetail(submissionId);
      if (res.success && res.data) {
        setDetail(res.data);
      } else {
        toast.error(res.error ?? "Failed to load details");
        setDrawerOpen(false);
      }
    } catch {
      toast.error("Failed to load details");
      setDrawerOpen(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  /* ---------- grouping ---------- */
  const { passed, failed } = useMemo(() => {
    const passed: ResultListItem[] = [];
    const failed: ResultListItem[] = [];
    for (const it of items) {
      if (it.passed) passed.push(it);
      else failed.push(it);
    }
    return { passed, failed };
  }, [items]);

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Results</h1>
        <p className="text-sm text-muted-foreground">
          All your exam results with detailed breakdown per question.
        </p>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <BarChart3 className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">No results yet</p>
              <p className="text-sm text-muted-foreground">
                Once you submit an exam, your result will appear here.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="all" className="gap-2">
              All
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {items.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="passed" className="gap-2">
              Passed
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {passed.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="failed" className="gap-2">
              Failed
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {failed.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {items.map((it) => (
                <ResultCard
                  key={it.submissionId}
                  item={it}
                  onView={openDetail}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="passed" className="mt-6">
            {passed.length === 0 ? (
              <EmptyBlock
                icon={<CheckCircle2 className="h-6 w-6 text-muted-foreground" />}
                title="No passed exams"
                desc="Keep trying — your passed attempts will appear here."
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {passed.map((it) => (
                  <ResultCard
                    key={it.submissionId}
                    item={it}
                    onView={openDetail}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="failed" className="mt-6">
            {failed.length === 0 ? (
              <EmptyBlock
                icon={<XCircle className="h-6 w-6 text-muted-foreground" />}
                title="No failed exams"
                desc="Great job! You haven't failed any exam."
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {failed.map((it) => (
                  <ResultCard
                    key={it.submissionId}
                    item={it}
                    onView={openDetail}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* =========================================================
          DETAIL DRAWER
      ========================================================= */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen} modal>
        <SheetContent
          side="bottom"
          className="flex h-[92vh] flex-col overflow-hidden rounded-t-2xl p-0 sm:max-w-full"
        >
          <SheetHeader className="shrink-0 border-b bg-background px-6 py-4">
            <SheetTitle className="line-clamp-1">
              {detail?.examTitle ?? "Exam Result"}
            </SheetTitle>
            <SheetDescription>
              Detailed breakdown of your answers
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto overscroll-contain">
            {loadingDetail ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : detail ? (
              <div className="grid gap-6 px-6 py-6 md:grid-cols-[320px_1fr]">
                {/* ---------- LEFT: summary ---------- */}
                <div className="flex flex-col gap-5">
                  {/* Hero score */}
                  <Card
                    className={
                      detail.passed
                        ? "border-green-500/40"
                        : "border-red-500/40"
                    }
                  >
                    <CardContent className="flex flex-col items-center gap-2 py-6">
                      <div
                        className={`flex h-16 w-16 items-center justify-center rounded-full ${
                          detail.passed
                            ? "bg-green-600 text-white"
                            : "bg-red-600 text-white"
                        }`}
                      >
                        {detail.passed ? (
                          <Trophy className="h-8 w-8" />
                        ) : (
                          <XCircle className="h-8 w-8" />
                        )}
                      </div>
                      <p className="text-2xl font-bold">
                        {detail.score ?? 0}
                        <span className="text-sm font-normal text-muted-foreground">
                          {" "}
                          / {detail.totalScore ?? 0}
                        </span>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {detail.percentage ? `${detail.percentage}%` : "—"}
                      </p>
                      {scoreBadge(detail.passed)}
                    </CardContent>
                  </Card>

                  {/* Meta */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Exam Info</CardTitle>
                    </CardHeader>
                    <CardContent className="divide-y pt-0 text-sm">
                      <InfoRow
                        icon={<BarChart3 className="h-4 w-4" />}
                        label="Internship"
                        value={detail.internshipName ?? "—"}
                      />
                      <InfoRow
                        icon={<FileQuestion className="h-4 w-4" />}
                        label="Type"
                        value={
                          <span className="capitalize">
                            {detail.examType} Exam
                          </span>
                        }
                      />
                      <InfoRow
                        icon={<Target className="h-4 w-4" />}
                        label="Passing Score"
                        value={`${detail.passingScore} / ${detail.totalScore ?? 0}`}
                      />
                      <InfoRow
                        icon={<Percent className="h-4 w-4" />}
                        label="Attempt"
                        value={`#${detail.attemptNumber}`}
                      />
                      <InfoRow
                        icon={<Timer className="h-4 w-4" />}
                        label="Time Taken"
                        value={formatTime(detail.timeTaken)}
                      />
                      <InfoRow
                        icon={<Clock className="h-4 w-4" />}
                        label="Submitted"
                        value={formatDate(detail.submittedAt)}
                      />
                    </CardContent>
                  </Card>

                  {/* Progress bar of correct answers */}
                  <CorrectStats questions={detail.questions} />
                </div>

                {/* ---------- RIGHT: per-question review ---------- */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">
                      Question Review
                    </h3>
                    <Badge variant="secondary">
                      {detail.questions.length} questions
                    </Badge>
                  </div>

                  {detail.questions.length === 0 ? (
                    <Card>
                      <CardContent className="py-8 text-center text-sm text-muted-foreground">
                        No questions found for this exam.
                      </CardContent>
                    </Card>
                  ) : (
                    detail.questions.map((q, idx) => (
                      <QuestionReview key={q.id} q={q} index={idx} />
                    ))
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

/* =========================================================
   SMALL COMPONENTS
========================================================= */

function EmptyBlock({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          {icon}
        </div>
        <div>
          <p className="font-medium">{title}</p>
          <p className="text-sm text-muted-foreground">{desc}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-2">
      <div className="mt-0.5 text-muted-foreground">{icon}</div>
      <div className="flex-1">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="text-sm">{value || "—"}</p>
      </div>
    </div>
  );
}

function CorrectStats({
  questions,
}: {
  questions: ResultDetail["questions"];
}) {
  const correct = questions.filter((q) => q.isCorrect).length;
  const incorrect = questions.filter((q) => q.isCorrect === false).length;
  const unattempted = questions.filter(
    (q) => q.selectedOption === null || q.selectedOption === undefined
  ).length;
  const total = questions.length || 1;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0 text-sm">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            Correct
          </span>
          <span className="font-medium">{correct}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-600" />
            Incorrect
          </span>
          <span className="font-medium">{incorrect}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
            Unattempted
          </span>
          <span className="font-medium">{unattempted}</span>
        </div>

        <Separator />

        {/* bar */}
        <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="bg-green-500"
            style={{ width: `${(correct / total) * 100}%` }}
          />
          <div
            className="bg-red-500"
            style={{ width: `${(incorrect / total) * 100}%` }}
          />
          <div
            className="bg-muted-foreground/40"
            style={{ width: `${(unattempted / total) * 100}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function QuestionReview({
  q,
  index,
}: {
  q: ResultDetail["questions"][number];
  index: number;
}) {
  const isUnattempted =
    q.selectedOption === null || q.selectedOption === undefined;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline">Q{index + 1}</Badge>
            <Badge variant="secondary">{q.marks} marks</Badge>
            {isUnattempted ? (
              <Badge variant="outline" className="gap-1">
                <AlertCircle className="h-3 w-3" />
                Unattempted
              </Badge>
            ) : q.isCorrect ? (
              <Badge className="gap-1 bg-green-600 text-white">
                <CheckCircle2 className="h-3 w-3" />
                Correct
              </Badge>
            ) : (
              <Badge className="gap-1 bg-red-600 text-white">
                <XCircle className="h-3 w-3" />
                Incorrect
              </Badge>
            )}
          </div>
          <span className="text-xs font-medium text-muted-foreground">
            +{q.marksObtained} / {q.marks}
          </span>
        </div>

        <p className="mb-3 text-sm font-medium">{q.question}</p>

        <div className="grid gap-2">
          {q.options.map((opt, i) => {
            const isCorrect = i === q.correctOption;
            const isSelected = i === q.selectedOption;

            return (
              <div
                key={i}
                className={[
                  "flex items-center gap-2 rounded-md border px-3 py-2 text-sm",
                  isCorrect
                    ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                    : isSelected
                    ? "border-red-500 bg-red-50 dark:bg-red-950/20"
                    : "",
                ].join(" ")}
              >
                <span className="text-xs font-mono text-muted-foreground">
                  {String.fromCharCode(65 + i)}.
                </span>
                <span className="flex-1">{opt}</span>

                {isCorrect && (
                  <Badge className="bg-green-600 text-xs">Correct</Badge>
                )}
                {isSelected && !isCorrect && (
                  <Badge className="bg-red-600 text-xs">Your Answer</Badge>
                )}
                {isSelected && isCorrect && (
                  <Badge className="bg-green-700 text-xs">Your Answer</Badge>
                )}
              </div>
            );
          })}
        </div>

        {q.explanation && (
          <div className="mt-3 rounded-md border border-dashed bg-muted/30 p-3 text-xs text-muted-foreground">
            <span className="font-medium">Explanation: </span>
            {q.explanation}
          </div>
        )}
      </CardContent>
    </Card>
  );
}