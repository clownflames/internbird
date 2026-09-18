"use client";

import Image from "next/image";
import { useState, useTransition, useEffect, useMemo } from "react";
import {
  Search,
  GraduationCap,
  BookOpen,
  X,
  Loader2,
  ArrowRight,
  CheckCircle2,
  Lock,
  Wifi,
  Building2,
  Briefcase,
  Sparkles,
  PlayCircle,
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

import {
  getLearningPages,
  type LearningPageItem,
  type InternshipOption,
  type LearningFilters,
} from "@/app/(home)/learning/actions";

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
   MAIN CLIENT
========================================================= */

export default function LearningClient({
  initialItems,
  internshipOptions,
}: {
  initialItems: LearningPageItem[];
  internshipOptions: InternshipOption[];
}) {
  const [items, setItems] = useState(initialItems);
  const [loading, setLoading] = useState(false);
  const [, startTransition] = useTransition();

  const [search, setSearch] = useState("");
  const [internshipId, setInternshipId] = useState<string>("all");
  const [onlyEnrolled, setOnlyEnrolled] = useState(false);
  const [sort, setSort] = useState<"latest" | "order" | "title">("latest");
  const [showFilters, setShowFilters] = useState(false);

  const [selected, setSelected] = useState<LearningPageItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      const filters: LearningFilters = {
        search: search.trim() || undefined,
        internshipId: internshipId !== "all" ? internshipId : undefined,
        onlyEnrolled,
        sort,
      };

      setLoading(true);
      startTransition(async () => {
        const fresh = await getLearningPages(filters);
        setItems(fresh);
        setLoading(false);
      });
    }, 400);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, internshipId, onlyEnrolled, sort]);

  const enrolledCount = useMemo(
    () => items.filter((i) => i.isEnrolled).length,
    [items]
  );

  const hasActiveFilters =
    search.trim() !== "" || internshipId !== "all" || onlyEnrolled;

  function clearFilters() {
    setSearch("");
    setInternshipId("all");
    setOnlyEnrolled(false);
    setSort("latest");
  }

  function openPage(item: LearningPageItem) {
    setSelected(item);
    setDrawerOpen(true);
  }

  return (
    <div className="w-full space-y-3">
      {/* ================= HEADER CARD ================= */}
      <Card className="py-0 gap-0">
        <CardContent className="p-4">
          <div className="mb-3 flex items-start justify-between gap-2">
            <div>
              <h1 className="flex items-center gap-2 text-lg font-semibold">
                <GraduationCap className="h-5 w-5" />
                Learning Pages
              </h1>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {items.length} {items.length === 1 ? "page" : "pages"}
                {enrolledCount > 0 && ` · ${enrolledCount} unlocked`}
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters((s) => !s)}
              className="gap-1.5 lg:hidden"
            >
              Filters
            </Button>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search learning pages..."
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
                <SelectItem value="order">Order</SelectItem>
                <SelectItem value="title">Title (A-Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div
            className={cn(
              "mt-2 gap-2 sm:grid sm:grid-cols-2 lg:grid-cols-3",
              showFilters ? "grid" : "hidden sm:grid"
            )}
          >
            <Select
              value={internshipId}
              onValueChange={(v) => setInternshipId(v as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All internships" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All internships</SelectItem>
                {internshipOptions.map((opt) => (
                  <SelectItem key={opt.id} value={opt.id}>
                    {opt.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant={onlyEnrolled ? "default" : "outline"}
              size="sm"
              onClick={() => setOnlyEnrolled((v) => !v)}
              className="justify-start gap-2"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              {onlyEnrolled ? "Showing enrolled" : "Only my enrolled"}
            </Button>

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
          <span className="ml-2 text-xs text-muted-foreground">
            Loading...
          </span>
        </div>
      )}

      {/* ================= GRID (FULL WIDTH) ================= */}
      {!loading && items.length === 0 ? (
        <EmptyState onClear={clearFilters} hasFilters={hasActiveFilters} />
      ) : (
        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => (
            <LearningCard
              key={item.id}
              item={item}
              onOpen={() => openPage(item)}
            />
          ))}
        </div>
      )}

      {/* ================= DRAWER ================= */}
      <LearningDrawer
        item={selected}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </div>
  );
}

/* =========================================================
   LEARNING CARD — clean, cover-heavy, full-width grid
========================================================= */

function LearningCard({
  item,
  onOpen,
}: {
  item: LearningPageItem;
  onOpen: () => void;
}) {
  const locked =
    !item.isEnrolled ||
    item.registrationStatus === "cancelled" ||
    item.registrationStatus === "rejected";

  return (
    <Card
      className={cn(
        "group overflow-hidden py-0 gap-0 cursor-pointer transition-all hover:border-primary/40 hover:shadow-md flex flex-col h-full",
        locked && "opacity-90"
      )}
      onClick={onOpen}
    >
      <CardContent className="p-0 flex flex-col h-full">
        {/* ================= COVER (big, immersive) ================= */}
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-gradient-to-br from-primary/20 via-primary/10 to-transparent">
          {item.image ? (
            <Image
              src={item.image}
              alt={item.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <BookOpen className="h-12 w-12 text-primary/40" />
            </div>
          )}

          {/* dark gradient for readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

          {/* lock overlay */}
          {locked && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-[2px]">
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-background/95 shadow-md">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                </div>
                <span className="rounded-full bg-background/90 px-2.5 py-0.5 text-[10px] font-medium">
                  Enroll to unlock
                </span>
              </div>
            </div>
          )}

          {/* top-left: lesson number */}
          <div className="absolute left-2.5 top-2.5">
            <span className="rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
              Lesson #{item.order + 1}
            </span>
          </div>

          {/* top-right: status */}
          <div className="absolute right-2.5 top-2.5">
            {item.isEnrolled ? (
              <span className="flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-medium text-white">
                <Sparkles className="h-2.5 w-2.5" />
                {item.registrationStatus === "completed"
                  ? "Completed"
                  : "Unlocked"}
              </span>
            ) : (
              <span className="flex items-center gap-1 rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-medium backdrop-blur-sm">
                <Lock className="h-2.5 w-2.5" />
                Locked
              </span>
            )}
          </div>

          {/* play button center (only when unlocked) */}
          {!locked && (
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/95 shadow-lg">
                <PlayCircle className="h-6 w-6 text-primary" />
              </div>
            </div>
          )}

          {/* bottom: internship name on cover */}
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <div className="flex items-center gap-1.5">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded bg-white/90">
                {item.internship.image ? (
                  <Image
                    src={item.internship.image}
                    alt={item.internship.name}
                    width={20}
                    height={20}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Briefcase className="h-2.5 w-2.5 text-gray-700" />
                )}
              </div>
              <span className="truncate text-[11px] font-medium text-white">
                {item.internship.name}
              </span>
            </div>
          </div>
        </div>

        {/* ================= CONTENT (minimal) ================= */}
        <div className="flex flex-1 flex-col p-3.5">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug">
            {item.title}
          </h3>

          {item.description && (
            <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
              {item.description}
            </p>
          )}

          {/* footer pinned to bottom */}
          <div className="mt-auto flex items-center justify-between pt-3">
            <span className="text-[11px] text-muted-foreground">
              {item.whatYouLearn.length} outcomes
            </span>
            <Button
              size="sm"
              variant={locked ? "outline" : "default"}
              className="h-7 gap-1 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onOpen();
              }}
            >
              {locked ? "Preview" : "Start"}
              <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* =========================================================
   LEARNING DRAWER (unchanged)
========================================================= */

function LearningDrawer({
  item,
  open,
  onOpenChange,
}: {
  item: LearningPageItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!item) return null;

  const mode = modeConfig[item.internship.mode];
  const ModeIcon = mode.icon;

  const locked =
    !item.isEnrolled ||
    item.registrationStatus === "cancelled" ||
    item.registrationStatus === "rejected";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[92vh] overflow-y-auto rounded-t-2xl p-0 gap-0"
      >
        <div className="flex flex-col">
          <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-muted" />

          <div className="relative mt-3 h-44 w-full overflow-hidden bg-gradient-to-br from-primary/20 via-primary/10 to-transparent">
            {item.image ? (
              <Image
                src={item.image}
                alt={item.title}
                fill
                className="object-cover"
                sizes="100vw"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <BookOpen className="h-14 w-14 text-primary/40" />
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />

            <div className="absolute bottom-3 left-5 right-5">
              <Badge
                variant="outline"
                className="mb-2 bg-background/90 text-[10px]"
              >
                Lesson #{item.order + 1}
              </Badge>
            </div>
          </div>

          <SheetHeader className="px-5 pt-3 pb-0 text-left">
            <SheetTitle className="text-left text-xl leading-tight">
              {item.title}
            </SheetTitle>
            <SheetDescription className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
              <span className="inline-flex items-center gap-1">
                <Briefcase className="h-3 w-3" />
                {item.internship.name}
              </span>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium",
                  mode.color
                )}
              >
                <ModeIcon className="h-3 w-3" />
                {mode.label}
              </span>
              {item.isEnrolled && (
                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-3 w-3" />
                  Enrolled
                </span>
              )}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-5 px-5 py-5">
            {locked ? (
              <LockedNotice internshipName={item.internship.name} />
            ) : (
              <>
                {item.description && (
                  <Section title="Overview">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                      {item.description}
                    </p>
                  </Section>
                )}

                {item.whatYouLearn.length > 0 && (
                  <Section title="What you'll learn">
                    <ul className="space-y-2">
                      {item.whatYouLearn.map((w, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-sm text-muted-foreground"
                        >
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                          <span>{w}</span>
                        </li>
                      ))}
                    </ul>
                  </Section>
                )}

                {item.content && (
                  <Section title="Content">
                    <div className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                      {item.content}
                    </div>
                  </Section>
                )}
              </>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* =========================================================
   LOCKED NOTICE
========================================================= */

function LockedNotice({ internshipName }: { internshipName: string }) {
  return (
    <div className="rounded-lg border border-dashed bg-muted/30 p-6 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-background shadow-sm">
        <Lock className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="mt-3 text-sm font-medium">This lesson is locked</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Enroll in <strong>{internshipName}</strong> to unlock this learning
        page and all related content.
      </p>
      <Button className="mt-4 gap-1" size="sm" >
        <a href="/internships">
          Browse internships
          <ArrowRight className="h-3.5 w-3.5" />
        </a>
      </Button>
    </div>
  );
}

/* =========================================================
   SECTION HELPER
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
          <GraduationCap className="h-6 w-6 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium">
            {hasFilters
              ? "No learning pages match your filters"
              : "No learning pages yet"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {hasFilters
              ? "Try adjusting your search or filters"
              : "Enroll in an internship to unlock learning content"}
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