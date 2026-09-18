"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  Heart,
  MessageCircle,
  UserPlus,
  UserCheck,
  Award,
  FileText,
  Bell,
  CheckCheck,
  Loader2,
  Briefcase,
  AtSign,
  Reply,
  Info,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import {
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationItem,
} from "@/app/(home)/notifications/actions";

/* =========================================================
   TYPE CONFIG
========================================================= */

const typeConfig: Record<
  NotificationItem["type"],
  { icon: typeof Heart; color: string }
> = {
  post_like: {
    icon: Heart,
    color: "bg-red-500/10 text-red-500",
  },
  post_comment: {
    icon: MessageCircle,
    color: "bg-blue-500/10 text-blue-500",
  },
  comment_reply: {
    icon: Reply,
    color: "bg-blue-500/10 text-blue-500",
  },
  comment_like: {
    icon: Heart,
    color: "bg-pink-500/10 text-pink-500",
  },
  follow: {
    icon: UserPlus,
    color: "bg-emerald-500/10 text-emerald-500",
  },
  connection_request: {
    icon: UserPlus,
    color: "bg-indigo-500/10 text-indigo-500",
  },
  connection_accepted: {
    icon: UserCheck,
    color: "bg-emerald-500/10 text-emerald-500",
  },
  internship_registered: {
    icon: Briefcase,
    color: "bg-purple-500/10 text-purple-500",
  },
  exam_published: {
    icon: FileText,
    color: "bg-amber-500/10 text-amber-500",
  },
  certificate_issued: {
    icon: Award,
    color: "bg-yellow-500/10 text-yellow-500",
  },
  offer_letter_issued: {
    icon: FileText,
    color: "bg-green-500/10 text-green-500",
  },
  mention: {
    icon: AtSign,
    color: "bg-cyan-500/10 text-cyan-500",
  },
  system: {
    icon: Info,
    color: "bg-muted text-muted-foreground",
  },
};

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

function timeAgo(iso: string) {
  const date = new Date(iso);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 604800)}w ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function groupItems(items: NotificationItem[]) {
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfToday.getDate() - 7);

  const today: NotificationItem[] = [];
  const week: NotificationItem[] = [];
  const earlier: NotificationItem[] = [];

  for (const item of items) {
    const d = new Date(item.createdAt);
    if (d >= startOfToday) today.push(item);
    else if (d >= startOfWeek) week.push(item);
    else earlier.push(item);
  }

  return [
    { label: "Today" as const, items: today },
    { label: "This Week" as const, items: week },
    { label: "Earlier" as const, items: earlier },
  ].filter((g) => g.items.length > 0);
}

/* =========================================================
   MAIN CLIENT
========================================================= */

export default function NotificationsClient({
  items,
}: {
  items: NotificationItem[];
}) {
  const [list, setList] = useState(items);
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const [, startTransition] = useTransition();

  const unreadCount = list.filter((n) => !n.isRead).length;
  const groups = groupItems(list);

  /* ---------- mark one read ---------- */
  function handleMarkRead(id: string) {
    const item = list.find((n) => n.id === id);
    if (!item || item.isRead) return;

    // optimistic
    setList((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );

    setBusyIds((prev) => new Set(prev).add(id));
    startTransition(async () => {
      await markNotificationRead(id);
      setBusyIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    });
  }

  /* ---------- mark all read ---------- */
  function handleMarkAll() {
    setList((prev) => prev.map((n) => ({ ...n, isRead: true })));
    startTransition(async () => {
      await markAllNotificationsRead();
    });
  }

  return (
    <Card className="py-0 gap-0">
      <CardContent className="p-0">
        {/* ================= HEADER ================= */}
        <div className="flex items-start justify-between gap-3 p-4 pb-3">
          <div>
            <h1 className="flex items-center gap-2 text-lg font-semibold">
              <Bell className="h-4 w-4" />
              Notifications
              {unreadCount > 0 && (
                <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground">
                  {unreadCount} new
                </span>
              )}
            </h1>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Stay up to date with your network and activity
            </p>
          </div>

          {unreadCount > 0 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleMarkAll}
              className="h-8 shrink-0 gap-1.5 text-xs"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </Button>
          )}
        </div>

        <Separator />

        {/* ================= LIST ================= */}
        {list.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="p-2">
            {groups.map((group) => (
              <div key={group.label} className="mb-3">
                <p className="mb-1.5 px-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {group.label}
                </p>

                <div className="space-y-0.5">
                  {group.items.map((n) => (
                    <NotificationRow
                      key={n.id}
                      item={n}
                      busy={busyIds.has(n.id)}
                      onRead={() => handleMarkRead(n.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* =========================================================
   ROW
========================================================= */

function NotificationRow({
  item,
  busy,
  onRead,
}: {
  item: NotificationItem;
  busy: boolean;
  onRead: () => void;
}) {
  const config = typeConfig[item.type];
  const Icon = config.icon;

  const Wrapper = item.link ? Link : "div";
  const wrapperProps = item.link
    ? { href: item.link, onClick: onRead }
    : { onClick: onRead };

  return (
    <Wrapper
      {...(wrapperProps as any)}
      className={cn(
        "flex items-start gap-3 rounded-md p-2.5 transition-colors cursor-pointer",
        item.isRead
          ? "hover:bg-accent/40"
          : "bg-primary/5 hover:bg-primary/10"
      )}
    >
      {/* ---------- AVATAR / ICON ---------- */}
      <div className="relative shrink-0">
        {item.actor ? (
          <Avatar className="h-10 w-10">
            <AvatarImage
              src={item.actor.image ?? undefined}
              alt={item.actor.name}
            />
            <AvatarFallback className="text-xs">
              {getInitials(item.actor.name)}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full",
              config.color
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
        )}

        {item.actor && (
          <span
            className={cn(
              "absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-background",
              config.color
            )}
          >
            <Icon className="h-2.5 w-2.5" />
          </span>
        )}
      </div>

      {/* ---------- CONTENT ---------- */}
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-snug">
          {item.actor && (
            <span className="font-semibold">{item.actor.name} </span>
          )}
          <span
            className={cn(
              !item.isRead ? "font-medium text-foreground" : "text-foreground/90"
            )}
          >
            {item.title}
          </span>
        </p>

        {item.message && (
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
            {item.message}
          </p>
        )}

        <div className="mt-1 flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground">
            {timeAgo(item.createdAt)}
          </span>
          {busy && (
            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
          )}
        </div>
      </div>

      {/* ---------- UNREAD DOT ---------- */}
      {!item.isRead && (
        <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
      )}
    </Wrapper>
  );
}

/* =========================================================
   EMPTY STATE
========================================================= */

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 p-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        <Bell className="h-6 w-6 text-muted-foreground" />
      </div>
      <div>
        <p className="text-sm font-medium">No notifications yet</p>
        <p className="mt-1 text-xs text-muted-foreground">
          When someone likes your post or follows you, you'll see it here.
        </p>
      </div>
    </div>
  );
}