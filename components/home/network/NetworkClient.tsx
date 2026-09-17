"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  Users,
  UserPlus,
  UserCheck,
  Clock,
  Loader2,
  UserMinus,
  Check,
  X,
  User as UserIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

import {
  acceptConnection,
  rejectConnection,
  withdrawConnection,
  toggleFollow,
  type NetworkData,
  type NetworkUser,
} from "@/app/(home)/network/actions";

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
   TABS
========================================================= */

type TabKey =
  | "connections"
  | "requests"
  | "suggestions"
  | "followers"
  | "following";

const TABS: { key: TabKey; label: string; icon: typeof Users }[] = [
  { key: "connections", label: "Connections", icon: Users },
  { key: "requests", label: "Requests", icon: UserPlus },
  { key: "suggestions", label: "Suggestions", icon: UserCheck },
  { key: "followers", label: "Followers", icon: Users },
  { key: "following", label: "Following", icon: Users },
];

/* =========================================================
   MAIN CLIENT
========================================================= */

export default function NetworkClient({ data }: { data: NetworkData }) {
  const [activeTab, setActiveTab] = useState<TabKey>("connections");

  // local mutable copies
  const [connections, setConnections] = useState(data.connections);
  const [pendingReceived, setPendingReceived] = useState(data.pendingReceived);
  const [pendingSent, setPendingSent] = useState(data.pendingSent);
  const [suggestions, setSuggestions] = useState(data.suggestions);
  const [followers, setFollowers] = useState(data.followers);
  const [following, setFollowing] = useState(data.following);

  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const [, startTransition] = useTransition();

  /* ---------- busy tracker ---------- */
  const markBusy = (id: string, busy: boolean) =>
    setBusyIds((prev) => {
      const next = new Set(prev);
      if (busy) next.add(id);
      else next.delete(id);
      return next;
    });

  /* ---------- ACCEPT ---------- */
  function handleAccept(req: NetworkUser) {
    if (!req.connectionId) return;
    markBusy(req.id, true);
    startTransition(async () => {
      const res = await acceptConnection(req.connectionId!);
      if (res.success) {
        setPendingReceived((p) => p.filter((u) => u.id !== req.id));
        setConnections((p) => [req, ...p]);
      }
      markBusy(req.id, false);
    });
  }

  /* ---------- REJECT ---------- */
  function handleReject(req: NetworkUser) {
    if (!req.connectionId) return;
    markBusy(req.id, true);
    startTransition(async () => {
      const res = await rejectConnection(req.connectionId!);
      if (res.success) {
        setPendingReceived((p) => p.filter((u) => u.id !== req.id));
      }
      markBusy(req.id, false);
    });
  }

  /* ---------- WITHDRAW ---------- */
  function handleWithdraw(req: NetworkUser) {
    if (!req.connectionId) return;
    markBusy(req.id, true);
    startTransition(async () => {
      const res = await withdrawConnection(req.connectionId!);
      if (res.success) {
        setPendingSent((p) => p.filter((u) => u.id !== req.id));
      }
      markBusy(req.id, false);
    });
  }

  /* ---------- SEND REQUEST from suggestions ---------- */
  function handleConnectFromSuggestion(user: NetworkUser) {
    markBusy(user.id, true);
    startTransition(async () => {
      const { sendConnectionRequest } = await import(
        "@/actions/home/actions"
      );
      const res = await sendConnectionRequest(user.id);
      if (res.success) {
        setSuggestions((p) => p.filter((u) => u.id !== user.id));
        setPendingSent((p) => [{ ...user }, ...p]);
      }
      markBusy(user.id, false);
    });
  }

  /* ---------- FOLLOW toggle ---------- */
  function handleFollow(user: NetworkUser, currentlyFollowing: boolean) {
    markBusy(user.id, true);
    startTransition(async () => {
      const res = await toggleFollow(user.id);
      if (res.success) {
        if (res.following) {
          setFollowing((p) => [user, ...p]);
        } else {
          setFollowing((p) => p.filter((u) => u.id !== user.id));
        }
      }
      markBusy(user.id, false);
    });
  }

  return (
    <Card className="py-0 gap-0">
      <CardContent className="p-0">
        {/* ================= HEADER ================= */}
        <div className="p-4 pb-3">
          <h1 className="text-lg font-semibold">My Network</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Manage your connections, requests and followers
          </p>
        </div>

        {/* ================= TABS ================= */}
        <div className="flex gap-1 overflow-x-auto border-b px-2 scrollbar-thin">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;

            const countMap: Record<TabKey, number> = {
              connections: connections.length,
              requests: pendingReceived.length,
              suggestions: suggestions.length,
              followers: followers.length,
              following: following.length,
            };

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
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
                {countMap[tab.key] > 0 && (
                  <Badge
                    variant={active ? "default" : "secondary"}
                    className="h-4 min-w-4 justify-center rounded-full px-1 text-[10px] leading-none"
                  >
                    {countMap[tab.key]}
                  </Badge>
                )}
                {active && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
                )}
              </button>
            );
          })}
        </div>

        {/* ================= TAB CONTENT ================= */}
        <div className="p-3">
          {activeTab === "connections" && (
            <UserList
              users={connections}
              emptyText="No connections yet"
              busyIds={busyIds}
              renderAction={(u) => (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 rounded-full gap-1.5"
                >
                  <Link href={`/profile/${u.id}`} className="flex gap-2 px-2">
                    <UserIcon className="h-3.5 w-3.5" />
                    View Profile
                  </Link>
                </Button>
              )}
            />
          )}

          {activeTab === "requests" && (
            <div className="space-y-6">
              {/* received */}
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Received ({pendingReceived.length})
                </h3>
                <UserList
                  users={pendingReceived}
                  emptyText="No pending requests"
                  busyIds={busyIds}
                  renderAction={(u) => (
                    <div className="flex gap-1.5">
                      <Button
                        size="sm"
                        className="h-8 rounded-full"
                        disabled={busyIds.has(u.id)}
                        onClick={() => handleAccept(u)}
                      >
                        {busyIds.has(u.id) ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Check className="h-3.5 w-3.5" />
                        )}
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 rounded-full"
                        disabled={busyIds.has(u.id)}
                        onClick={() => handleReject(u)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                />
              </div>

              <Separator />

              {/* sent */}
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Sent ({pendingSent.length})
                </h3>
                <UserList
                  users={pendingSent}
                  emptyText="No sent requests"
                  busyIds={busyIds}
                  renderAction={(u) => (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 rounded-full"
                      disabled={busyIds.has(u.id)}
                      onClick={() => handleWithdraw(u)}
                    >
                      {busyIds.has(u.id) ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Clock className="h-3.5 w-3.5" />
                      )}
                      Pending
                    </Button>
                  )}
                />
              </div>
            </div>
          )}

          {activeTab === "suggestions" && (
            <UserList
              users={suggestions}
              emptyText="No suggestions right now"
              busyIds={busyIds}
              renderAction={(u) => (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 rounded-full gap-1.5"
                  disabled={busyIds.has(u.id)}
                  onClick={() => handleConnectFromSuggestion(u)}
                >
                  {busyIds.has(u.id) ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <UserPlus className="h-3.5 w-3.5" />
                  )}
                  Connect
                </Button>
              )}
            />
          )}

          {activeTab === "followers" && (
            <UserList
              users={followers}
              emptyText="No followers yet"
              busyIds={busyIds}
              renderAction={(u) => {
                const isFollowing = following.some((x) => x.id === u.id);
                return (
                  <Button
                    size="sm"
                    variant={isFollowing ? "outline" : "default"}
                    className="h-8 rounded-full gap-1.5"
                    disabled={busyIds.has(u.id)}
                    onClick={() => handleFollow(u, isFollowing)}
                  >
                    {busyIds.has(u.id) ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : isFollowing ? (
                      <UserMinus className="h-3.5 w-3.5" />
                    ) : (
                      <UserPlus className="h-3.5 w-3.5" />
                    )}
                    {isFollowing ? "Unfollow" : "Follow back"}
                  </Button>
                );
              }}
            />
          )}

          {activeTab === "following" && (
            <UserList
              users={following}
              emptyText="You're not following anyone yet"
              busyIds={busyIds}
              renderAction={(u) => (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 rounded-full gap-1.5"
                  disabled={busyIds.has(u.id)}
                  onClick={() => handleFollow(u, true)}
                >
                  {busyIds.has(u.id) ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <UserMinus className="h-3.5 w-3.5" />
                  )}
                  Unfollow
                </Button>
              )}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* =========================================================
   USER LIST (shared)
========================================================= */

interface UserListProps {
  users: NetworkUser[];
  emptyText: string;
  busyIds: Set<string>;
  renderAction: (user: NetworkUser) => React.ReactNode;
}

function UserList({ users, emptyText, renderAction }: UserListProps) {
  if (users.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-8 text-center">
        <p className="text-xs text-muted-foreground">{emptyText}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {users.map((u) => (
        <div
          key={u.id}
          className="flex items-center gap-3 rounded-md p-2 transition-colors hover:bg-accent/40"
        >
          {/* avatar + info → clickable to profile */}
          <Link
            href={`/profile/${u.id}`}
            className="flex min-w-0 flex-1 items-center gap-3"
          >
            <Avatar className="h-12 w-12 shrink-0">
              <AvatarImage src={u.image ?? undefined} alt={u.name} />
              <AvatarFallback className="text-sm">
                {getInitials(u.name)}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold hover:underline">
                {u.name}
              </p>
              {u.headline && (
                <p className="truncate text-xs text-muted-foreground">
                  {u.headline}
                </p>
              )}
              <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                {formatCount(u.followersCount)} followers ·{" "}
                {formatCount(u.connectionsCount)} connections
              </p>
            </div>
          </Link>

          {/* action button */}
          <div className="shrink-0">{renderAction(u)}</div>
        </div>
      ))}
    </div>
  );
}