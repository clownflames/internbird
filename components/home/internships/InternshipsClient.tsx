"use client";

import Image from "next/image";
import { useState, useTransition, useMemo, useEffect } from "react";
import {
  Search,
  SlidersHorizontal,
  Briefcase,
  MapPin,
  Clock,
  Wifi,
  Building2,
  X,
  Loader2,
  Users,
  CheckCircle2,
  IndianRupee,
  Gift,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import InternshipDrawer from "./InternshipDrawer";

import {
  getInternships,
  type InternshipListItem,
  type InternshipFilters,
} from "@/app/(home)/internships/actions";

/* =========================================================
   MODE CONFIG
========================================================= */

const modeConfig = {
  remote: {
    label: "Remote",
    icon: Wifi,
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  onsite: {
    label: "On-site",
    icon: Building2,
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  hybrid: {
    label: "Hybrid",
    icon: Briefcase,
    color: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  },
};

/* =========================================================
   HELPERS
========================================================= */

function formatCount(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

const STATUS_LABEL: Record<string, string> = {
  pending: "Applied",
  active: "Ongoing",
  completed: "Completed",
  cancelled: "Cancelled",
  rejected: "Rejected",
};

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  active: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  completed: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  cancelled: "bg-muted text-muted-foreground",
  rejected: "bg-red-500/10 text-red-600 dark:text-red-400",
};

/* =========================================================
   MAIN CLIENT
========================================================= */

export default function InternshipsClient({
  initialItems,
}: {
  initialItems: InternshipListItem[];
}) {
  const [items, setItems] = useState(initialItems);
  const [loading, setLoading] = useState(false);
  const [, startTransition] = useTransition();

  // filters
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<"all" | "remote" | "onsite" | "hybrid">(
    "all"
  );
  const [location, setLocation] = useState("");
  const [sort, setSort] = useState<"latest" | "name">("latest");
  const [showFilters, setShowFilters] = useState(false);

  // drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"details" | "apply">("details");
  const [selected, setSelected] = useState<InternshipListItem | null>(null);

  /* ---------- debounced refetch ---------- */
  useEffect(() => {
    const t = setTimeout(() => {
      const filters: InternshipFilters = {
        search: search.trim() || undefined,
        mode,
        location: location.trim() || undefined,
        sort,
      };

      setLoading(true);
      startTransition(async () => {
        const fresh = await getInternships(filters);
        setItems(fresh);
        setLoading(false);
      });
    }, 400);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, mode, location, sort]);

  /* ---------- derived ---------- */
  const openCount = useMemo(
    () => items.filter((i) => i.registrationOpen).length,
    [items]
  );

  const hasActiveFilters =
    search.trim() !== "" || mode !== "all" || location.trim() !== "";

  function clearFilters() {
    setSearch("");
    setMode("all");
    setLocation("");
    setSort("latest");
  }

  /* ---------- drawer handlers ---------- */
  function openDetails(item: InternshipListItem) {
    setSelected(item);
    setDrawerMode("details");
    setDrawerOpen(true);
  }

  function openApply(item: InternshipListItem) {
    setSelected(item);
    setDrawerMode("apply");
    setDrawerOpen(true);
  }

  /* ---------- after apply success ---------- */
  function handleApplied(id: string) {
    setItems((prev) =>
      prev.map((i) =>
        i.id === id
          ? {
              ...i,
              hasRegistered: true,
              registrationStatus: "pending" as const,
              applicantCount: i.applicantCount + 1,
            }
          : i
      )
    );

    setTimeout(() => {
      setItems((current) => {
        const updated = current.find((i) => i.id === id);
        if (updated) {
          setSelected(updated);
          setDrawerMode("details");
          setDrawerOpen(true);
        }
        return current;
      });
    }, 250);
  }

  return (
    <div className="space-y-3">
      {/* ================= HEADER CARD ================= */}
      <Card className="py-0 gap-0">
        <CardContent className="p-4">
          <div className="mb-3 flex items-start justify-between gap-2">
            <div>
              <h1 className="text-lg font-semibold">Internships</h1>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {items.length} opportunities
                {openCount > 0 && ` · ${openCount} open`}
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters((s) => !s)}
              className="gap-1.5 lg:hidden"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filters
            </Button>
          </div>

          {/* ---------- search row ---------- */}
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by title, skill, location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 hover:bg-accent"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <Select value={sort} onValueChange={(v) => setSort(v as any)}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="latest">Latest</SelectItem>
                <SelectItem value="name">Name (A-Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* ---------- filters ---------- */}
          <div
            className={cn(
              "mt-2 gap-2 sm:grid sm:grid-cols-2 lg:grid-cols-3",
              showFilters ? "grid" : "hidden sm:grid"
            )}
          >
            <Select value={mode} onValueChange={(v) => setMode(v as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All modes</SelectItem>
                <SelectItem value="remote">Remote</SelectItem>
                <SelectItem value="onsite">On-site</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative">
              <MapPin className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="pl-9"
              />
            </div>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="gap-1.5"
              >
                <X className="h-3.5 w-3.5" />
                Clear filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ================= LOADING ================= */}
      {loading && (
        <div className="flex items-center justify-center py-2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="ml-2 text-xs text-muted-foreground">Loading...</span>
        </div>
      )}

      {/* ================= LIST ================= */}
      {!loading && items.length === 0 ? (
        <EmptyState onClear={clearFilters} hasFilters={hasActiveFilters} />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <InternshipRow
              key={item.id}
              item={item}
              onViewDetails={() => openDetails(item)}
              onApply={() => openApply(item)}
            />
          ))}
        </div>
      )}

      {/* ================= DRAWER ================= */}
      <InternshipDrawer
        internship={selected}
        open={drawerOpen}
        mode={drawerMode}
        onOpenChange={setDrawerOpen}
        onApplied={handleApplied}
      />
    </div>
  );
}

/* =========================================================
   INTERNSHIP ROW
========================================================= */

function InternshipRow({
  item,
  onViewDetails,
  onApply,
}: {
  item: InternshipListItem;
  onViewDetails: () => void;
  onApply: () => void;
}) {
  const mode = modeConfig[item.mode];
  const ModeIcon = mode.icon;

  const visibleSkills = item.skills.slice(0, 4);
  const extraSkills = item.skills.length - visibleSkills.length;

  const regStatus = item.registrationStatus;
  const showStatusBadge =
    regStatus && regStatus !== "cancelled" && regStatus !== "rejected";

  const isFree = item.pricing === "free";
  const isPaid = item.pricing === "paid";

  return (
    <Card className="py-0 gap-0 transition-colors hover:border-primary/30">
      <CardContent className="p-4">
        {/* ================= HEADER ================= */}
        <div className="flex items-start gap-3">
          {/* logo */}
          <button
            onClick={onViewDetails}
            className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted transition-opacity hover:opacity-80"
          >
            {item.image ? (
              <Image
                src={item.image}
                alt={item.name}
                width={56}
                height={56}
                className="h-full w-full object-cover"
              />
            ) : (
              <Briefcase className="h-6 w-6 text-muted-foreground" />
            )}
          </button>

          {/* title + meta */}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <button
                onClick={onViewDetails}
                className="block text-left text-base font-semibold leading-tight hover:underline"
              >
                {item.name}
              </button>

              <div className="flex shrink-0 items-center gap-1.5">
                {/* Pricing badge */}
                {isFree ? (
                  <Badge
                    variant="outline"
                    className="gap-1 rounded-full border-emerald-500/40 bg-emerald-500/10 text-[10px] font-medium text-emerald-600 dark:text-emerald-400"
                  >
                    <Gift className="h-2.5 w-2.5" />
                    Free
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="gap-1 rounded-full border-amber-500/40 bg-amber-500/10 text-[10px] font-medium text-amber-600 dark:text-amber-400"
                  >
                    <IndianRupee className="h-2.5 w-2.5" />
                    {item.discountPrice ? (
                      <>
                        <span className="line-through opacity-60">
                          {item.price}
                        </span>
                        <span className="font-semibold">
                          {item.discountPrice}
                        </span>
                      </>
                    ) : (
                      <span>{item.price}</span>
                    )}
                    {item.paymentType === "monthly" && (
                      <span className="font-normal opacity-70">/mo</span>
                    )}
                  </Badge>
                )}

                {showStatusBadge && (
                  <Badge
                    className={cn(
                      "rounded-full border-0 text-[10px] font-medium",
                      STATUS_COLOR[regStatus!]
                    )}
                  >
                    {STATUS_LABEL[regStatus!]}
                  </Badge>
                )}
              </div>
            </div>

            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium",
                  mode.color
                )}
              >
                <ModeIcon className="h-3 w-3" />
                {mode.label}
              </span>

              {item.duration && (
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {item.duration}
                </span>
              )}

              {item.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {item.location}
                </span>
              )}

              <span className="inline-flex items-center gap-1">
                <Users className="h-3 w-3" />
                {formatCount(item.applicantCount)} applied
              </span>
            </div>
          </div>
        </div>

        {/* ================= DESCRIPTION ================= */}
        {item.description && (
          <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {item.description}
          </p>
        )}

        {/* ================= SKILLS ================= */}
        {visibleSkills.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {visibleSkills.map((skill) => (
              <Badge
                key={skill}
                variant="secondary"
                className="rounded-md px-2 py-0.5 text-[11px] font-normal"
              >
                {skill}
              </Badge>
            ))}
            {extraSkills > 0 && (
              <Badge
                variant="outline"
                className="rounded-md px-2 py-0.5 text-[11px] font-normal"
              >
                +{extraSkills}
              </Badge>
            )}
          </div>
        )}

        {/* ================= QUALIFICATIONS ================= */}
        {item.qualifications.length > 0 && (
          <div className="mt-3 space-y-1">
            {item.qualifications.slice(0, 2).map((q, i) => (
              <div
                key={i}
                className="flex items-start gap-2 text-xs text-muted-foreground"
              >
                <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-500" />
                <span className="line-clamp-1">{q}</span>
              </div>
            ))}
          </div>
        )}

        <Separator className="mt-3" />

        {/* ================= FOOTER ================= */}
        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="min-w-0">
            {item.registrationOpen ? (
              <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                ● Registration open
              </p>
            ) : (
              <p className="text-xs font-medium text-muted-foreground">
                ● Registration closed
              </p>
            )}
            {isPaid && (
              <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                {item.pricingNote || "Secure payment via Razorpay"}
              </p>
            )}
          </div>

          <div className="flex shrink-0 gap-2">
            {item.hasRegistered ? (
              <Button
                size="sm"
                variant="outline"
                className="h-8"
                onClick={onViewDetails}
              >
                View details
              </Button>
            ) : (
              <Button size="sm" className="h-8" onClick={onApply}>
                {isFree ? "Apply now" : "Enroll now"}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* =========================================================
   EMPTY STATE
========================================================= */

function EmptyState({
  onClear,
  hasFilters,
}: {
  onClear: () => void;
  hasFilters: boolean;
}) {
  return (
    <Card className="py-0 gap-0">
      <CardContent className="flex flex-col items-center justify-center gap-3 p-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <Briefcase className="h-6 w-6 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium">
            {hasFilters
              ? "No internships match your filters"
              : "No internships yet"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {hasFilters
              ? "Try adjusting your search or filters"
              : "Check back later for new opportunities"}
          </p>
        </div>
        {hasFilters && (
          <Button variant="outline" size="sm" onClick={onClear}>
            Clear filters
          </Button>
        )}
      </CardContent>
    </Card>
  );
}