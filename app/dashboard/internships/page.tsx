"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  getMyRegistrations,
  getMyRegistrationDetail,
} from "./actions";

import type { Registration } from "./_components/types";
import { RegistrationCard } from "./_components/registration-card";
import { DetailSheet } from "./_components/detail-sheet";
import { EmptyState } from "./_components/empty-state";

/* =========================================================
   MAIN PAGE
========================================================= */

export default function MyInternshipsPage() {
  const [items, setItems] = useState<Registration[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState("all");

  const [loading, setLoading] = useState(true);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detail, setDetail] = useState<Registration | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  /* ---------- LOAD DATA ---------- */
  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      setLoading(true);
      try {
        const res = await getMyRegistrations({
          status: filterStatus,
          page,
          limit: 6,
        });

        if (cancelled) return;

        if (res.success) {
          const data = Array.isArray(res.data)
            ? (res.data as Registration[])
            : [];

          // dedupe safety
          const uniqueData = Array.from(
            new Map(data.map((item) => [item.id, item])).values()
          );

          setItems(uniqueData);
          setTotal(res.total ?? 0);
          setTotalPages(Math.max(1, res.totalPages ?? 1));
        } else {
          setItems([]);
          setTotal(0);
          setTotalPages(1);
          toast.error(res.error ?? "Failed to load internships");
        }
      } catch (error) {
        if (cancelled) return;
        console.error("Failed to load internships:", error);
        setItems([]);
        setTotal(0);
        setTotalPages(1);
        toast.error("Failed to load internships");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, [filterStatus, page]);

  /* ---------- OPEN DETAIL ---------- */
  const openDetail = async (id: string) => {
    setDrawerOpen(true);
    setLoadingDetail(true);
    setDetail(null);

    try {
      const res = await getMyRegistrationDetail(id);

      if (res.success && res.data) {
        setDetail(res.data as Registration);
      } else {
        toast.error(res.error ?? "Failed to load details");
        setDrawerOpen(false);
      }
    } catch (error) {
      console.error("Failed to load registration details:", error);
      toast.error("Failed to load details");
      setDrawerOpen(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  /* ---------- FILTER ---------- */
  const handleFilterChange = (value: string) => {
    setFilterStatus(value);
    setPage(1);
  };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="flex flex-col gap-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            My Internships
          </h1>
          <p className="text-sm text-muted-foreground">
            All internships you&apos;ve registered for, with their status and
            details.
          </p>
        </div>

        <Select value={filterStatus} onValueChange={handleFilterChange as any}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* CONTENT */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <RegistrationCard
              key={item.id}
              item={item}
              onView={openDetail}
            />
          ))}
        </div>
      )}

      {/* PAGINATION */}
      {!loading && items.length > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {Math.min((page - 1) * 6 + 1, total)}
            {"–"}
            {Math.min((page - 1) * 6 + items.length, total)} of {total}
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <span className="min-w-[90px] text-center text-sm">
              Page {page} of {totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* DETAIL DRAWER */}
      <DetailSheet
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        detail={detail}
        loadingDetail={loadingDetail}
      />
    </div>
  );
}