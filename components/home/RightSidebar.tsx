"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useSession } from "@/lib/auth-client"; 
import {
  TrendingUp,
  UserPlus,
  ArrowRight,
  Briefcase,
  Award,
  CalendarClock,
  Users,
  Loader2,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import {
  getSuggestedUsers,
  getTrendingTopics,
  getUpcomingItems,
  getSidebarUserStats,
  followUser,
  sendConnectionRequest,
  type SuggestedUser,
  type TrendingTopic,
  type SidebarUserStats,
} from "@/actions/home/actions";

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
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

/* =========================================================
   RIGHT SIDEBAR
========================================================= */

export default function RightSidebar() {
  const { data: session } = useSession();
  const sessionUser = session?.user;

  const [suggestions, setSuggestions] = useState<SuggestedUser[]>([]);
  const [trending, setTrending] = useState<TrendingTopic[]>([]);
  const [stats, setStats] = useState<SidebarUserStats | null>(null);
  const [loading, setLoading] = useState(true);

  const [pendingFollow, setPendingFollow] = useState<Set<string>>(new Set());
  const [, startTransition] = useTransition();

  /* ================= FETCH ================= */
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const [s, t, st] = await Promise.all([
        getSuggestedUsers(3),
        getTrendingTopics(4),
        getSidebarUserStats(),
      ]);

      if (cancelled) return;
      setSuggestions(s);
      setTrending(t);
      setStats(st);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);

  /* ================= HANDLERS ================= */

  async function handleFollow(targetId: string) {
    setPendingFollow((prev) => new Set(prev).add(targetId));

    const { followUser } = await import("@/actions/home/actions");
    const res = await followUser(targetId);

    if (res.success) {
      setSuggestions((prev) => prev.filter((u) => u.id !== targetId));
    }

    setPendingFollow((prev) => {
      const next = new Set(prev);
      next.delete(targetId);
      return next;
    });
  }

  async function handleConnect(targetId: string) {
    setPendingFollow((prev) => new Set(prev).add(targetId));

    const { sendConnectionRequest } = await import("@/actions/home/actions");
    const res = await sendConnectionRequest(targetId);

    if (res.success) {
      setSuggestions((prev) => prev.filter((u) => u.id !== targetId));
    }

    setPendingFollow((prev) => {
      const next = new Set(prev);
      next.delete(targetId);
      return next;
    });
  }

  /* ================= RESOLVED USER INFO ================= */
  // prefer stats (fresh DB), fallback to session
  const displayName = stats?.name ?? sessionUser?.name ?? "Guest User";
  const displayEmail = stats?.email ?? sessionUser?.email ?? "Sign in to continue";
  const displayImage = stats?.image ?? sessionUser?.image ?? null;
  const displayHeadline = stats?.headline ?? null;

  /* ================= RENDER ================= */

  return (
    <div className="space-y-2">
      {/* ================= USER SUMMARY ================= */}
      <Card className="py-3 gap-0">
        <CardContent className="px-3">
          <div className="flex items-center gap-3">
            <Link href="/profile">
              <Avatar className="h-10 w-10 border">
                <AvatarImage
                  src={displayImage ?? undefined}
                  alt={displayName}
                />
                <AvatarFallback className="text-xs">
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>
            </Link>

            <div className="min-w-0 flex-1">
              <Link
                href="/profile"
                className="block truncate text-sm font-semibold hover:underline"
              >
                {displayName}
              </Link>
              <p className="truncate text-xs text-muted-foreground">
                {displayHeadline ?? displayEmail}
              </p>
            </div>
          </div>

          <Separator className="my-3" />

          {/* stats */}
          {loading ? (
            <div className="grid grid-cols-2 gap-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-y-2 gap-x-3 text-xs">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Briefcase className="h-3.5 w-3.5" />
                <span>{stats?.internships ?? 0} Internships</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Award className="h-3.5 w-3.5" />
                <span>{stats?.certificates ?? 0} Certificates</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                <span>
                  {formatCount(stats?.connections ?? 0)} Connections
                </span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <UserPlus className="h-3.5 w-3.5" />
                <span>{formatCount(stats?.followers ?? 0)} Followers</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ================= PEOPLE SUGGESTIONS ================= */}
      <Card className="py-3 gap-0">
        <CardHeader className="px-3 pb-2 pt-0">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <UserPlus className="h-4 w-4 text-muted-foreground" />
            People you may know
          </CardTitle>
        </CardHeader>

        <CardContent className="px-3 pt-0">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-7 w-16 rounded-full" />
                </div>
              ))}
            </div>
          ) : suggestions.length === 0 ? (
            <p className="py-2 text-center text-xs text-muted-foreground">
              No suggestions right now
            </p>
          ) : (
            <div className="space-y-3">
              {suggestions.map((person, idx) => {
                const isPending = pendingFollow.has(person.id);
                return (
                  <div key={person.id}>
                    <div className="flex items-center gap-3">
                      <Link href={`/profile/${person.id}`}>
                        <Avatar className="h-9 w-9 shrink-0">
                          <AvatarImage
                            src={person.image ?? undefined}
                            alt={person.name}
                          />
                          <AvatarFallback className="text-xs">
                            {getInitials(person.name)}
                          </AvatarFallback>
                        </Avatar>
                      </Link>

                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/profile/${person.id}`}
                          className="block truncate text-sm font-medium hover:underline"
                        >
                          {person.name}
                        </Link>
                        <p className="truncate text-xs text-muted-foreground">
                          {person.headline ?? "Member"}
                        </p>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isPending}
                        onClick={() => handleConnect(person.id)}
                        className="h-7 shrink-0 rounded-full px-3 text-xs"
                      >
                        {isPending ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          "Connect"
                        )}
                      </Button>
                    </div>

                    {idx !== suggestions.length - 1 && (
                      <Separator className="mt-3" />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <Link
            href="/network"
            className="mt-3 flex items-center justify-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            View all
            <ArrowRight className="h-3 w-3" />
          </Link>
        </CardContent>
      </Card>

      {/* ================= TRENDING ================= */}
      <Card className="py-3 gap-0">
        <CardHeader className="px-3 pb-2 pt-0">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            Trending
          </CardTitle>
        </CardHeader>

        <CardContent className="px-3 pt-0">
          {loading ? (
            <div className="space-y-2.5">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-1">
                  <Skeleton className="h-3 w-2/3" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              ))}
            </div>
          ) : trending.length === 0 ? (
            <p className="py-2 text-center text-xs text-muted-foreground">
              No trending topics yet
            </p>
          ) : (
            <div className="space-y-2.5">
              {trending.map((topic) => (
                <Link
                  key={topic.tag}
                  href={`/explore?tag=${topic.tag.replace("#", "")}`}
                  className="block group"
                >
                  <p className="text-sm font-medium group-hover:underline">
                    {topic.tag}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatCount(topic.count)} posts
                  </p>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ================= UPCOMING ================= */}
      <Card className="py-3 gap-0">
        <CardHeader className="px-3 pb-2 pt-0">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <CalendarClock className="h-4 w-4 text-muted-foreground" />
            Upcoming
          </CardTitle>
        </CardHeader>

        <CardContent className="px-3 pt-0">
          <div className="rounded-md border border-dashed border-border p-3 text-center">
            <p className="text-xs text-muted-foreground">
              No upcoming exams or events
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ================= FOOTER ================= */}
      <div className="px-2 pb-4">
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          <Link href="/about" className="hover:underline">
            About
          </Link>
          <Link href="/privacy" className="hover:underline">
            Privacy
          </Link>
          <Link href="/terms" className="hover:underline">
            Terms
          </Link>
          <Link href="/help" className="hover:underline">
            Help
          </Link>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          © {new Date().getFullYear()} SQRock Alpha Challenger
        </p>
      </div>
    </div>
  );
}