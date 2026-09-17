"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  X,
  RefreshCw,
  BarChart3,
  Trophy,
  XCircle,
  Users,
  Percent,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  getExamResults,
  getExamResultStats,
  getInternshipOptions,
  getExamOptions,
  deleteExamResult,
  reEvaluateSubmission,
  type ExamResult,
} from "./actions";

import { ResultsTable } from "./_components/results-table";
import { ResultDetailDrawer } from "./_components/result-detail-drawer";

type StatusFilter = "all" | "started" | "submitted" | "evaluated";
type PassedFilter = "all" | "passed" | "failed";

export default function ExamResultsPage() {
  const [results, setResults] = useState<ExamResult[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [passed, setPassed] = useState<PassedFilter>("all");
  const [filterInternship, setFilterInternship] = useState("all");
  const [filterExam, setFilterExam] = useState("all");
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    all: 0,
    evaluated: 0,
    passed: 0,
    failed: 0,
    avgPercentage: 0,
  });

  const [internships, setInternships] = useState<
    { id: string; name: string }[]
  >([]);
  const [exams, setExams] = useState<
    { id: string; title: string; type: "pre" | "end" }[]
  >([]);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<ExamResult | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [, startTransition] = useTransition();

  /* ---------- debounce search ---------- */
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  /* ---------- load options ---------- */
  useEffect(() => {
    getInternshipOptions().then(setInternships);
  }, []);

  useEffect(() => {
    getExamOptions(
      filterInternship === "all" ? undefined : filterInternship
    ).then(setExams);
    // reset exam when internship changes
    if (filterInternship === "all") setFilterExam("all");
  }, [filterInternship]);

  /* ---------- load stats ---------- */
  const loadStats = async () => {
    const s = await getExamResultStats();
    setStats(s);
  };

  /* ---------- load data ---------- */
  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getExamResults({
        search: debouncedSearch,
        internshipId: filterInternship === "all" ? undefined : filterInternship,
        examId: filterExam === "all" ? undefined : filterExam,
        status,
        passed,
        page,
        limit: 15,
      });
      setResults(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch {
      toast.error("Failed to load exam results");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, status, passed, filterInternship, filterExam, page]);

  /* ---------- drawer ---------- */
  const openDetail = (id: string) => {
    setSelectedId(id);
    setDrawerOpen(true);
  };

  /* ---------- delete ---------- */
  const handleDelete = () => {
    if (!deleteTarget) return;
    setDeleting(true);
    startTransition(async () => {
      const res = await deleteExamResult(deleteTarget.id);
      setDeleting(false);
      if (res.success) {
        toast.success("Result deleted");
        setDeleteTarget(null);
        loadData();
        loadStats();
      } else {
        toast.error(res.error ?? "Failed to delete");
      }
    });
  };

  /* ---------- re-evaluate ---------- */
  const handleReEvaluate = (id: string) => {
    startTransition(async () => {
      const res = await reEvaluateSubmission(id);
      if (res.success) {
        toast.success("Re-evaluated successfully");
        loadData();
        loadStats();
      } else {
        toast.error(res.error ?? "Failed to evaluate");
      }
    });
  };

  const hasFilters =
    search.trim() !== "" ||
    status !== "all" ||
    passed !== "all" ||
    filterInternship !== "all" ||
    filterExam !== "all";

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Exam Results</h1>
          <p className="text-sm text-muted-foreground">
            View and manage all exam submissions across internships.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            loadData();
            loadStats();
          }}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          icon={<BarChart3 className="h-4 w-4" />}
          label="Total"
          value={stats.all}
          color="text-blue-600"
        />
        <StatCard
          icon={<Users className="h-4 w-4" />}
          label="Evaluated"
          value={stats.evaluated}
          color="text-purple-600"
        />
        <StatCard
          icon={<Trophy className="h-4 w-4" />}
          label="Passed"
          value={stats.passed}
          color="text-emerald-600"
        />
        <StatCard
          icon={<XCircle className="h-4 w-4" />}
          label="Failed"
          value={stats.failed}
          color="text-red-600"
        />
        <StatCard
          icon={<Percent className="h-4 w-4" />}
          label="Avg %"
          value={`${stats.avgPercentage.toFixed(1)}%`}
          color="text-amber-600"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by student, exam, or internship..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select
            value={filterInternship}
            onValueChange={(v) => {
              setFilterInternship( v as any);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-[220px]">
              <SlidersHorizontal className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
              <SelectValue placeholder="All internships" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All internships</SelectItem>
              {internships.map((i) => (
                <SelectItem key={i.id} value={i.id}>
                  {i.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filterExam}
            onValueChange={(v) => {
              setFilterExam(v as any);
              setPage(1);
            }}
            disabled={filterInternship === "all"}
          >
            <SelectTrigger className="w-full sm:w-[220px]">
              <SelectValue placeholder="All exams" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All exams</SelectItem>
              {exams.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.title}{" "}
                  <span className="text-xs text-muted-foreground">
                    ({e.type})
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* status chips */}
          <div className="flex flex-wrap gap-1">
            {(
              [
                { key: "all", label: "All" },
                { key: "started", label: "Started" },
                { key: "submitted", label: "Submitted" },
                { key: "evaluated", label: "Evaluated" },
              ] as const
            ).map((s) => (
              <button
                key={s.key}
                onClick={() => {
                  setStatus(s.key);
                  setPage(1);
                }}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  status === s.key
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background hover:bg-muted"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-border" />

          {/* passed chips */}
          <div className="flex flex-wrap gap-1">
            {(
              [
                { key: "all", label: "All results" },
                { key: "passed", label: "Passed" },
                { key: "failed", label: "Failed" },
              ] as const
            ).map((p) => (
              <button
                key={p.key}
                onClick={() => {
                  setPassed(p.key);
                  setPage(1);
                }}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  passed === p.key
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background hover:bg-muted"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch("");
                setStatus("all");
                setPassed("all");
                setFilterInternship("all");
                setFilterExam("all");
                setPage(1);
              }}
              className="gap-1.5 ml-auto"
            >
              <X className="h-3.5 w-3.5" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <ResultsTable
        results={results}
        loading={loading}
        onView={openDetail}
        onReEvaluate={handleReEvaluate}
        onDelete={setDeleteTarget}
      />

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {results.length} of {total} results
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Drawer */}
      <ResultDetailDrawer
        submissionId={selectedId}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onReEvaluate={(id) => {
          handleReEvaluate(id);
        }}
      />

      {/* Delete confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold">Delete result?</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Delete submission of{" "}
                <span className="font-medium">{deleteTarget.userName}</span>?
                This cannot be undone.
              </p>
              <div className="mt-4 flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: string;
}) {
  return (
    <Card className="py-0 gap-0">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-2">
          <div className={`${color}`}>{icon}</div>
        </div>
        <p className="mt-2 text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}