"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { useEffect, useState } from "react";
import {
  Home,
  Users,
  Briefcase,
  FileText,
  GraduationCap,
  Award,
  BarChart3,
  Bookmark,
  Compass,
  Plus,
  FolderKanban,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import CreatePostDrawer from "@/components/home/CreatePostDrawer";

import {
  getCurrentUserProfile,
  getSidebarBadges,
  type CurrentUserProfile,
  type SidebarBadges,
} from "@/actions/home/actions";
import Image from "next/image";

/* =========================================================
   NAV ITEMS
========================================================= */

const navItems = [
  { label: "Home", href: "/", icon: Home, badgeKey: null },
  {
    label: "My Network",
    href: "/network",
    icon: Users,
    badgeKey: "network" as const,
  },
  {
    label: "Internships",
    href: "/internships",
    icon: Briefcase,
    badgeKey: null,
  },
  {
    label: "Learning Pages",
    href: "/learning",
    icon: GraduationCap,
    badgeKey: null,
  },
  {
    label: "Projects",
    href: "/projects",
    icon: FolderKanban,
    badgeKey: null,
  },
  {
    label: "Exams",
    href: "/dashboard/exams",
    icon: FileText,
    badgeKey: null,
  },
  {
    label: "Results",
    href: "/dashboard/results",
    icon: BarChart3,
    badgeKey: null,
  },
  {
    label: "Certificates",
    href: "/dashboard/documents/certificates",
    icon: Award,
    badgeKey: null,
  },
  {
    label: "Offer Letters",
    href: "/dashboard/documents/offer-letters",
    icon: FileText,
    badgeKey: null,
  },
  { label: "Saved", href: "/saved", icon: Bookmark, badgeKey: null },
];

const discoverItems = [{ label: "Explore", href: "/explore", icon: Compass }];

/* =========================================================
   HELPERS
========================================================= */

function getInitials(name?: string | null) {
  if (!name) return "U";
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
   LEFT SIDEBAR
========================================================= */

export default function LeftSidebar() {
  const pathname = usePathname();
  const { data: session, isPending } = useSession();

  const user = session?.user;
  const isAuthed = !!session?.user;
  const isAuthLoading = isPending;

  const [profile, setProfile] = useState<CurrentUserProfile | null>(null);
  const [badges, setBadges] = useState<SidebarBadges>({
    network: 0,
    notifications: 0,
  });
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  /* ================= FETCH ================= */
  useEffect(() => {
    let cancelled = false;

    async function load() {
      // auth still loading — wait
      if (isAuthLoading) return;

      // guest
      if (!isAuthed) {
        setProfile(null);
        setBadges({ network: 0, notifications: 0 });
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [p, b] = await Promise.all([
          getCurrentUserProfile(),
          getSidebarBadges(),
        ]);
        if (cancelled) return;
        setProfile(p);
        setBadges(b);
      } catch (err) {
        console.error("LeftSidebar load error", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [isAuthed, isAuthLoading, session?.user?.id]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  /* ================= RENDER ================= */

  return (
    <div className="space-y-2">
      {/* ================= PROFILE CARD ================= */}
      <Card className="overflow-hidden py-0 gap-0">
        {/* cover */}
        <div className="relative h-14 w-full overflow-hidden bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500">
          {profile?.coverImage && (
            <Image
              src={profile.coverImage}
              alt="Cover"
              fill
              className="object-cover"
              unoptimized
            />
          )}
        </div>

        <CardContent className="px-3 pb-3 pt-0">
          {/* avatar overlapping cover */}
          <div className="-mt-7 mb-2 flex justify-center">
            <Link href="/profile">
              <Avatar className="h-14 w-14 border-2 border-background ring-1 ring-border">
                <AvatarImage
                  src={profile?.image ?? user?.image ?? undefined}
                  alt={profile?.name ?? user?.name ?? "User"}
                />
                <AvatarFallback className="text-sm font-medium">
                  {getInitials(profile?.name ?? user?.name)}
                </AvatarFallback>
              </Avatar>
            </Link>
          </div>

          {/* name + email + headline */}
          <div className="text-center">
            <Link
              href="/profile"
              className="block truncate text-sm font-semibold hover:underline"
            >
              {profile?.name ?? user?.name ?? "Guest User"}
            </Link>

            {loading && isAuthed ? (
              <Skeleton className="mx-auto mt-1 h-3 w-24" />
            ) : (
              <p className="truncate text-xs text-muted-foreground">
                {profile?.headline ??
                  profile?.email ??
                  user?.email ??
                  "Sign in to continue"}
              </p>
            )}
          </div>

          <Separator className="my-3" />

          {/* stats */}
          {loading && isAuthed ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          ) : (
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Internships</span>
                <span className="font-medium">
                  {formatCount(profile?.internshipsCount ?? 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Connections</span>
                <span className="font-medium">
                  {formatCount(profile?.connectionsCount ?? 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Followers</span>
                <span className="font-medium">
                  {formatCount(profile?.followersCount ?? 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Posts</span>
                <span className="font-medium">
                  {formatCount(profile?.postsCount ?? 0)}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ================= NAVIGATION ================= */}
      <Card className="py-2 gap-0">
        <nav className="flex flex-col">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            const badgeValue = item.badgeKey
              ? badges[item.badgeKey]
              : undefined;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center justify-between gap-3 px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-accent text-foreground font-medium"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0",
                      active ? "text-foreground" : "text-muted-foreground"
                    )}
                  />
                  <span className="truncate">{item.label}</span>
                </div>

                {badgeValue ? (
                  <span className="shrink-0 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                    {badgeValue > 99 ? "99+" : badgeValue}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <Separator className="my-1" />

        {/* discover */}
        <div className="flex flex-col">
          {discoverItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </Card>

      {/* ================= CTA CARD ================= */}
      <Card className="py-3 gap-0">
        <CardContent className="px-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Grow your career
          </p>
          <Button
            size="sm"
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Create a post
          </Button>
        </CardContent>
      </Card>

      {/* ================= CREATE POST DRAWER ================= */}
      <CreatePostDrawer open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}