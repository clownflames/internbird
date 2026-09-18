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
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

import {
  getSubmissions,
  getSubmissionCounts,
  getInternshipOptions,
  markUnderReview,
  approveSubmission,
  rejectSubmission,
  resetSubmission,
  type AdminSubmission,
  type FilterCounts,
} from "./actions";

import { SubmissionsTable } from "./_components/submissions-table";
import { ReviewDrawer } from "./_components/review-drawer";
import { RejectDialog } from "./_components/reject-dialog";

type FilterStatus = "all" | "pending_review" | "approved" | "rejected";

export default function ProjectSubmissionsPage() {
  const [submissions, setSubmissions] = useState<AdminSubmission[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [filterInternship, setFilterInternship] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  const [counts, setCounts] = useState<FilterCounts>({
    all: 0,
    pending_review: 0,
    approved: 0,
    rejected: 0,
  });

  const [internships, setInternships] = useState<
    { id: string; name: string }[]
  >([]);

  // drawer
  const [selected, setSelected] = useState<AdminSubmission | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // reject dialog
  const [rejectTarget, setRejectTarget] = useState<AdminSubmission | null>(
    null
  );

  const [, startTransition] = useTransition();

  /* ---------- debounce search ---------- */
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  /* ---------- load internship options ---------- */
  useEffect(() => {
    getInternshipOptions().then(setInternships);
  }, []);

  /* ---------- load counts ---------- */
  const loadCounts = async () => {
    const c = await getSubmissionCounts();
    setCounts(c);
  };

  /* ---------- load data ---------- */
  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getSubmissions({
        search: debouncedSearch,
        status: filterStatus,
        internshipId:
          filterInternship === "all" ? undefined : filterInternship,
        page,
        limit: 15,
      });
      setSubmissions(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch {
      toast.error("Failed to load submissions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    loadCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, page, filterStatus, filterInternship]);

  /* ---------- row actions ---------- */
  const handleMarkUnderReview = (sub: AdminSubmission) => {
    startTransition(async () => {
      const res = await markUnderReview(sub.id);
      if (res.success) {
        toast.success("Marked under review");
        setSubmissions((prev) =>
          prev.map((s) =>
            s.id === sub.id ? { ...s, status: "under_review" } : s
          )
        );
        loadCounts();
      } else {
        toast.error(res.error ?? "Failed");
      }
    });
  };

  const handleApprove = (
    sub: AdminSubmission,
    score: number,
    feedback: string
  ) => {
    startTransition(async () => {
      const res = await approveSubmission(sub.id, { score, feedback });
      if (res.success) {
        toast.success(
          res.passed ? "Project approved" : "Score below passing — rejected"
        );
        setDrawerOpen(false);
        loadData();
        loadCounts();
      } else {
        toast.error(res.error ?? "Failed");
      }
    });
  };

  const handleReject = (
    sub: AdminSubmission,
    feedback: string
  ) => {
    startTransition(async () => {
      const res = await rejectSubmission(sub.id, { feedback });
      if (res.success) {
        toast.success("Submission rejected");
        setRejectTarget(null);
        setDrawerOpen(false);
        loadData();
        loadCounts();
      } else {
        toast.error(res.error ?? "Failed");
      }
    });
  };

  const handleReset = (sub: AdminSubmission) => {
    startTransition(async () => {
      const res = await resetSubmission(sub.id);
      if (res.success) {
        toast.success("Submission reset to in-progress");
        setDrawerOpen(false);
        loadData();
        loadCounts();
      } else {
        toast.error(res.error ?? "Failed");
      }
    });
  };

  const openDrawer = (sub: AdminSubmission) => {
    setSelected(sub);
    setDrawerOpen(true);
  };

  const hasFilters =
    search.trim() !== "" ||
    filterStatus !== "all" ||
    filterInternship !== "all";

  const statusTabs: {
    key: FilterStatus;
    label: string;
    count: number;
  }[] = [
    { key: "all", label: "All", count: counts.all },
    {
      key: "pending_review",
      label: "Pending review",
      count: counts.pending_review,
    },
    { key: "approved", label: "Approved", count: counts.approved },
    { key: "rejected", label: "Rejected", count: counts.rejected },
  ];

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Project Submissions
          </h1>
          <p className="text-sm text-muted-foreground">
            Review, score, and approve student project submissions.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => {
            loadData();
            loadCounts();
          }}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 overflow-x-auto border-b scrollbar-thin">
        {statusTabs.map((tab) => {
          const active = filterStatus === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => {
                setFilterStatus(tab.key);
                setPage(1);
              }}
              className={`relative flex shrink-0 items-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors ${
                active
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
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

      {/* Filters row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by project, student, or internship..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select
          value={filterInternship}
          onValueChange={(v) => {
            setFilterInternship(v as any);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-64">
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

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("");
              setFilterStatus("all");
              setFilterInternship("all");
              setPage(1);
            }}
            className="gap-1.5"
          >
            <X className="h-3.5 w-3.5" />
            Clear
          </Button>
        )}
      </div>

      {/* Table */}
      <SubmissionsTable
        submissions={submissions}
        loading={loading}
        onView={openDrawer}
      />

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {submissions.length} of {total} submissions
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

      {/* Review drawer */}
      <ReviewDrawer
        submission={selected}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onMarkUnderReview={handleMarkUnderReview}
        onApprove={handleApprove}
        onReject={(sub) => setRejectTarget(sub)}
        onReset={handleReset}
      />

      {/* Reject dialog */}
      <RejectDialog
        target={rejectTarget}
        onClose={() => setRejectTarget(null)}
        onConfirm={handleReject}
      />
    </div>
  );
}