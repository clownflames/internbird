"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import {
  Home,
  Users,
  Briefcase,
  Bell,
  Search,
  ChevronDown,
  LogOut,
  User,
  Settings,
  Bookmark,
  LayoutDashboard,
  Compass,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

import { getUnreadNotificationCount } from "@/app/(home)/notifications/actions";
import { getSidebarBadges } from "@/actions/home/actions";

/* =========================================================
   NAV ITEMS (LinkedIn style)
========================================================= */

type NavItem = {
  label: string;
  href: string;
  icon: typeof Home;
  badgeKey?: "network" | "notifications";
};

const navItems: NavItem[] = [
  {
    label: "Home",
    href: "/",
    icon: Home,
  },
  {
    label: "My Network",
    href: "/network",
    icon: Users,
    badgeKey: "network",
  },
  {
    label: "Internships",
    href: "/internships",
    icon: Briefcase,
  },
  {
    label: "Explore",
    href: "/explore",
    icon: Compass,
  },
  {
    label: "Notifications",
    href: "/notifications",
    icon: Bell,
    badgeKey: "notifications",
  },
];

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

/* =========================================================
   NAVBAR
========================================================= */

export default function Navbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const user = session?.user;
  const isLoading = status === "loading";
  const isAuthed = status === "authenticated";

  /* ---------- dynamic badges ---------- */
  const [networkBadge, setNetworkBadge] = useState(0);
  const [notifBadge, setNotifBadge] = useState(0);

  useEffect(() => {
    if (!isAuthed) {
      setNetworkBadge(0);
      setNotifBadge(0);
      return;
    }

    let cancelled = false;

    async function load() {
      const [badges, notifCount] = await Promise.all([
        getSidebarBadges(),
        getUnreadNotificationCount(),
      ]);
      if (cancelled) return;
      setNetworkBadge(badges.network);
      setNotifBadge(notifCount);
    }

    load();

    // refresh every 60s
    const interval = setInterval(load, 60_000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthed, session?.user?.id, pathname]);

  /* ---------- badge value resolver ---------- */
  function getBadgeValue(key?: "network" | "notifications") {
    if (!key) return 0;
    if (key === "network") return networkBadge;
    if (key === "notifications") return notifBadge;
    return 0;
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-2 px-4">
        {/* ================= LEFT : LOGO + SEARCH ================= */}
        <div className="flex items-center gap-2">
          {/* Logo */}
          <Link
            href="/"
            className="flex shrink-0 items-center gap-1.5"
            aria-label="Home"
          >
            <img src={'/internbird.png'} className="w-50" alt="INTERNBIRD LOGO" />
          </Link>

          {/* Search */}
          <div className="relative ml-2 hidden md:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search"
              className="h-9 w-[220px] rounded-md bg-muted pl-9 focus-visible:bg-background lg:w-[280px]"
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.currentTarget.value.trim()) {
                  window.location.href = `/explore?q=${encodeURIComponent(
                    e.currentTarget.value.trim()
                  )}`;
                }
              }}
            />
          </div>
        </div>

        {/* ================= CENTER : NAV ICONS ================= */}
        <nav className="hidden h-full items-center md:flex">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            const badgeValue = getBadgeValue(item.badgeKey);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex h-full min-w-[70px] flex-col items-center justify-center gap-0.5 px-2 text-xs transition-colors",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div className="relative">
                  <Icon className="h-5 w-5" />
                  {badgeValue > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -right-2 -top-1.5 h-4 min-w-4 justify-center rounded-full px-1 text-[10px] leading-none"
                    >
                      {badgeValue > 99 ? "99+" : badgeValue}
                    </Badge>
                  )}
                </div>
                <span className="hidden lg:block">{item.label}</span>

                {isActive && (
                  <span className="absolute bottom-0 h-0.5 w-full rounded-t bg-foreground" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* ================= RIGHT : USER MENU ================= */}
        <div className="flex items-center gap-2">
          {isLoading ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger >
                <button
                  className="flex items-center gap-1 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Account menu"
                >
                  <Avatar className="h-8 w-8 border">
                    <AvatarImage
                      src={user.image ?? undefined}
                      alt={user.name ?? "User"}
                    />
                    <AvatarFallback className="text-xs">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <ChevronDown className="hidden h-3.5 w-3.5 text-muted-foreground sm:block" />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="flex items-center gap-3 py-2">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={user.image ?? undefined}
                        alt={user.name ?? "User"}
                      />
                      <AvatarFallback>
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {user.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem >
                    <Link href="/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      View profile
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem >
                    <Link href="/dashboard" className="cursor-pointer">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem >
                    <Link href="/saved" className="cursor-pointer">
                      <Bookmark className="mr-2 h-4 w-4" />
                      Saved posts
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem >
                    <Link href="/settings" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button  variant="ghost" size="sm">
                <Link href="/register">Join now</Link>
              </Button>
              <Button  size="sm">
                <Link href="/login">Sign in</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}