"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useTransition } from "react";
import {
  Search,
  TrendingUp,
  Hash,
  Briefcase,
  Users,
  X,
  Loader2,
  UserPlus,
  Sparkles,
  Clock,
  Wifi,
  Building2,
  MapPin,
  IndianRupee,
  Gift,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import PostCard from "@/components/home/PostCard";
import { sendConnectionRequest } from "@/actions/home/actions";

import type {
  TrendingTag,
  PopularUser,
  ExplorePost,
  ExploreInternship,
} from "@/app/(home)/explore/actions";

/* =========================================================
   HELPERS
========================================================= */

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatCount(n: number) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

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
   MAIN
========================================================= */

interface Props {
  tags: TrendingTag[];
  popularUsers: PopularUser[];
  posts: ExplorePost[];
  internships: ExploreInternship[];
  activeTag?: string;
  initialQuery: string;
}

type TabKey = "all" | "posts" | "internships" | "people";

export default function ExploreClient({
  tags,
  popularUsers,
  posts,
  internships,
  activeTag,
  initialQuery,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const [, startTransition] = useTransition();

  /* ---------- sync search to URL (debounced) ---------- */
  useEffect(() => {
    const t = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      const trimmed = query.trim();
      const currentQ = searchParams.get("q") ?? "";

      if (trimmed === currentQ) return;

      if (trimmed) params.set("q", trimmed);
      else params.delete("q");

      router.replace(`/explore?${params.toString()}`, { scroll: false });
    }, 500);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  /* ---------- filter by tag ---------- */
  function handleTagClick(tag: string) {
    const cleanTag = tag.replace("#", "");
    const params = new URLSearchParams(searchParams.toString());
    if (activeTag === cleanTag) {
      params.delete("tag");
    } else {
      params.set("tag", cleanTag);
    }
    router.push(`/explore?${params.toString()}`);
  }

  function clearTag() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("tag");
    router.push(`/explore?${params.toString()}`);
  }

  /* ---------- connect from explore ---------- */
  function handleConnect(user: PopularUser) {
    setBusyIds((p) => new Set(p).add(user.id));
    startTransition(async () => {
      const res = await sendConnectionRequest(user.id);
      if (res.success) {
        router.refresh();
      }
      setBusyIds((p) => {
        const next = new Set(p);
        next.delete(user.id);
        return next;
      });
    });
  }

  const TABS: { key: TabKey; label: string; count: number }[] = [
    { key: "all", label: "All", count: posts.length + internships.length },
    { key: "posts", label: "Posts", count: posts.length },
    { key: "internships", label: "Internships", count: internships.length },
    { key: "people", label: "People", count: popularUsers.length },
  ];

  return (
    <div className="space-y-3">
      {/* ================= HERO ================= */}
      <Card className="overflow-hidden py-0 gap-0 border-primary/20">
        <div className="relative bg-gradient-to-br from-primary/10 via-purple-500/5 to-transparent p-5">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Explore</h1>
              <p className="text-xs text-muted-foreground">
                Discover trending content, internships, and people
              </p>
            </div>
          </div>

          <div className="relative mt-4">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search people, posts, or topics..."
              className="h-11 pl-9 bg-background"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 hover:bg-accent"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* ================= TRENDING TAGS ================= */}
      {tags.length > 0 && (
        <Card className="py-3 gap-0">
          <CardContent className="px-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                Trending topics
              </h2>
              {activeTag && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearTag}
                  className="h-7 gap-1 text-xs"
                >
                  <X className="h-3 w-3" />
                  Clear
                </Button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {tags.map((t) => {
                const cleanTag = t.tag.replace("#", "");
                const isActive = activeTag === cleanTag;
                return (
                  <button
                    key={t.tag}
                    onClick={() => handleTagClick(t.tag)}
                    className={cn(
                      "group inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                      isActive
                        ? "border-primary bg-primary text-primary-foreground"
                        : "bg-muted/40 hover:bg-muted hover:border-primary/30"
                    )}
                  >
                    <Hash
                      className={cn(
                        "h-3 w-3",
                        isActive
                          ? "text-primary-foreground"
                          : "text-muted-foreground"
                      )}
                    />
                    {cleanTag}
                    <span
                      className={cn(
                        "text-[10px] tabular-nums",
                        isActive
                          ? "text-primary-foreground/80"
                          : "text-muted-foreground"
                      )}
                    >
                      {formatCount(t.count)}
                    </span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ================= TABS ================= */}
      <div className="flex gap-1 overflow-x-auto border-b scrollbar-thin">
        {TABS.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "relative flex shrink-0 items-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors",
                active
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
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

      {/* ================= CONTENT ================= */}
      <div className="space-y-3">
        {/* -------- POSTS -------- */}
        {(activeTab === "all" || activeTab === "posts") && (
          <>
            {posts.length === 0 ? (
              <EmptyCard
                icon={Hash}
                title={
                  activeTag
                    ? `No posts with #${activeTag}`
                    : "No posts to explore"
                }
                description={
                  activeTag
                    ? "Try a different tag or explore all content"
                    : "Check back later for new content"
                }
              />
            ) : (
              posts.map((p) => <PostCard key={p.id} post={p} />)
            )}
          </>
        )}

        {/* -------- INTERNSHIPS -------- */}
        {(activeTab === "all" || activeTab === "internships") && (
          <div className="space-y-3 pt-2">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              Open internships
              {internships.length > 0 && (
                <span className="text-xs font-normal text-muted-foreground">
                  ({internships.length})
                </span>
              )}
            </h2>

            {internships.length === 0 ? (
              <EmptyCard
                icon={Briefcase}
                title="No internships available"
                description="Check back later"
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {internships.map((i) => (
                  <InternshipMiniCard key={i.id} internship={i} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* -------- PEOPLE -------- */}
        {activeTab === "people" && (
          <div className="space-y-3">
            {popularUsers.length === 0 ? (
              <EmptyCard
                icon={Users}
                title="No people to suggest"
                description="You've connected with everyone!"
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {popularUsers.map((u) => (
                  <PersonCard
                    key={u.id}
                    user={u}
                    busy={busyIds.has(u.id)}
                    onConnect={() => handleConnect(u)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   SUB-COMPONENTS
========================================================= */

function EmptyCard({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Hash;
  title: string;
  description: string;
}) {
  return (
    <Card className="py-0 gap-0">
      <CardContent className="flex flex-col items-center gap-2 p-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function InternshipMiniCard({
  internship,
}: {
  internship: ExploreInternship;
}) {
  const mode = modeConfig[internship.mode];
  const ModeIcon = mode.icon;
  const visibleSkills = internship.skills.slice(0, 3);
  const extra = internship.skills.length - visibleSkills.length;

  const isFree = internship.pricing === "free";
  const isPaid = internship.pricing === "paid";

  return (
    <Card className="py-0 gap-0 transition-colors hover:border-primary/30">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
            {internship.image ? (
              <img
                src={internship.image}
                alt={internship.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <Briefcase className="h-5 w-5 text-muted-foreground" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-1.5">
              <Link
                href={`/internships/${internship.id}`}
                className="line-clamp-1 text-sm font-semibold hover:underline"
              >
                {internship.name}
              </Link>

              {/* pricing badge */}
              {isFree ? (
                <Badge
                  variant="outline"
                  className="shrink-0 gap-0.5 rounded-full border-emerald-500/40 bg-emerald-500/10 px-1.5 py-0 text-[9px] font-medium text-emerald-600 dark:text-emerald-400"
                >
                  <Gift className="h-2.5 w-2.5" />
                  Free
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="shrink-0 gap-0.5 rounded-full border-amber-500/40 bg-amber-500/10 px-1.5 py-0 text-[9px] font-medium text-amber-600 dark:text-amber-400"
                >
                  <IndianRupee className="h-2.5 w-2.5" />
                  {internship.discountPrice ?? internship.price}
                  {internship.paymentType === "monthly" && (
                    <span className="opacity-70">/mo</span>
                  )}
                </Badge>
              )}
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-medium",
                  mode.color
                )}
              >
                <ModeIcon className="h-2.5 w-2.5" />
                {mode.label}
              </span>
              {internship.duration && (
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-2.5 w-2.5" />
                  {internship.duration}
                </span>
              )}
              {internship.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-2.5 w-2.5" />
                  {internship.location}
                </span>
              )}
            </div>
          </div>
        </div>

        {internship.description && (
          <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {internship.description}
          </p>
        )}

        {visibleSkills.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {visibleSkills.map((s) => (
              <Badge
                key={s}
                variant="secondary"
                className="rounded-md px-1.5 py-0 text-[10px] font-normal"
              >
                {s}
              </Badge>
            ))}
            {extra > 0 && (
              <Badge
                variant="outline"
                className="rounded-md px-1.5 py-0 text-[10px] font-normal"
              >
                +{extra}
              </Badge>
            )}
          </div>
        )}

        {/* <Button size="sm" className="mt-3 h-7 w-full text-[11px]" asChild>
          <Link href={`/internships/${internship.id}`}>
            {isFree ? "Apply now" : "Enroll now"}
          </Link>
        </Button> */}
      </CardContent>
    </Card>
  );
}

function PersonCard({
  user,
  busy,
  onConnect,
}: {
  user: PopularUser;
  busy: boolean;
  onConnect: () => void;
}) {
  return (
    <Card className="py-0 gap-0 transition-colors hover:border-primary/30">
      <CardContent className="flex flex-col items-center p-5 text-center">
        <Link href={`/profile/${user.id}`}>
          <Avatar className="h-16 w-16 border-2">
            <AvatarImage src={user.image ?? undefined} alt={user.name} />
            <AvatarFallback className="text-lg">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
        </Link>

        <Link
          href={`/profile/${user.id}`}
          className="mt-2 line-clamp-1 text-sm font-semibold hover:underline"
        >
          {user.name}
        </Link>

        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
          {user.headline ?? "Member"}
        </p>

        <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
          <span>{formatCount(user.followersCount)} followers</span>
          <span>·</span>
          <span>{formatCount(user.connectionsCount)} connections</span>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={onConnect}
          disabled={busy}
          className="mt-3 w-full gap-1.5 rounded-full"
        >
          {busy ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <UserPlus className="h-3.5 w-3.5" />
          )}
          Connect
        </Button>
      </CardContent>
    </Card>
  );
}