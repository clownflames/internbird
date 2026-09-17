"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Link as LinkIcon,
  Calendar,
  Briefcase,
  Award,
  Users,
  Pencil,
  UserPlus,
  UserCheck,
  Check,
  Clock,
  Building2,
  Mail,
  Globe,
  Camera,
  Loader2,
  UserMinus,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import PostCard from "@/components/home/PostCard";
import EditProfileDrawer from "./EditProfileDrawer";

import { updateProfileImage } from "@/app/(home)/profile/actions";

import type {
  ProfileUser,
  ProfilePost,
  ProfileRelation,
} from "@/app/(home)/profile/actions";

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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

/* =========================================================
   MAIN
========================================================= */

interface ProfileClientProps {
  user: ProfileUser | null;
  posts: ProfilePost[];
  relation: ProfileRelation;
}

export default function ProfileClient({
  user,
  posts,
  relation: initialRelation,
}: ProfileClientProps) {
  const router = useRouter();

  /* ---------- relation state ---------- */
  const [relation, setRelation] = useState<ProfileRelation>(initialRelation);
  const [isFollowing, setIsFollowing] = useState(
    initialRelation === "following" ||
      initialRelation === "connected" ||
      false
  );
  const [isConnected, setIsConnected] = useState(
    initialRelation === "connected"
  );
  const [isPendingSent, setIsPendingSent] = useState(
    initialRelation === "pending_sent"
  );

  const [followBusy, startFollowTransition] = useTransition();
  const [connectBusy, startConnectTransition] = useTransition();

  /* ---------- editing ---------- */
  const [editOpen, setEditOpen] = useState(false);

  /* ---------- image upload ---------- */
  const [avatarUrl, setAvatarUrl] = useState(user?.image ?? null);
  const [coverUrl, setCoverUrl] = useState(user?.coverImage ?? null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  if (!user) {
    return (
      <Card className="py-0 gap-0">
        <CardContent className="flex flex-col items-center gap-2 p-12 text-center">
          <p className="text-sm font-medium">User not found</p>
          <Button size="sm" 
          >
            <Link href="/">Back to home</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const isSelf = relation === "self";

  /* =========================================================
     FOLLOW toggle
  ========================================================= */
  function handleFollow() {
    if (!user) return;

    if (isFollowing) {
      // unfollow
      startFollowTransition(async () => {
        const { unfollowUser } = await import("@/actions/home/actions");
        const res = await unfollowUser(user.id);
        if (res.success) {
          setIsFollowing(false);
        }
      });
      return;
    }

    // follow
    startFollowTransition(async () => {
      const { followUser } = await import("@/actions/home/actions");
      const res = await followUser(user.id);
      if (res.success) {
        setIsFollowing(true);
      }
    });
  }

  /* =========================================================
     CONNECT toggle
  ========================================================= */
  function handleConnect() {
    if (!user) return;

    // if pending received → accept
    if (relation === "pending_received") {
      startConnectTransition(async () => {
        const { acceptConnectionRequest } = await import(
          "@/actions/home/actions"
        );
        const res = await acceptConnectionRequest(user.id);
        if (res.success) {
          setIsConnected(true);
          setIsPendingSent(false);
          setRelation("connected");
          router.refresh();
        }
      });
      return;
    }

    // if connected → open menu is handled in DropdownMenu
    if (isConnected) return;

    // if pending sent → do nothing (or withdraw)
    if (isPendingSent) return;

    // send request
    startConnectTransition(async () => {
      const { sendConnectionRequest } = await import(
        "@/actions/home/actions"
      );
      const res = await sendConnectionRequest(user.id);
      if (res.success) {
        setIsPendingSent(true);
        setRelation("pending_sent");
      }
    });
  }

  /* =========================================================
     REMOVE connection
  ========================================================= */
  function handleRemoveConnection() {
    if (!user) return;
    startConnectTransition(async () => {
      const { removeConnection } = await import("@/actions/home/actions");
      const res = await removeConnection(user.id);
      if (res.success) {
        setIsConnected(false);
        setRelation(isFollowing ? "following" : "none");
        router.refresh();
      }
    });
  }

  /* =========================================================
     IMAGE UPLOAD
  ========================================================= */
  async function handleImageUpload(
    file: File,
    kind: "avatar" | "cover"
  ) {
    if (!file.type.startsWith("image/")) {
      alert("Only image files are allowed");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      alert("Image must be under 5MB");
      return;
    }

    const setUploading =
      kind === "avatar" ? setUploadingAvatar : setUploadingCover;
    setUploading(true);

    try {
      const { getUploadUrl } = await import("@/actions/home/actions");
      const res = await getUploadUrl(file.name, file.type);
      if (!res.success || !res.uploadUrl || !res.publicUrl) {
        throw new Error(res.error ?? "Failed to get upload URL");
      }

      const uploadRes = await fetch(res.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!uploadRes.ok) throw new Error("Upload to R2 failed");

      const saveRes = await updateProfileImage(kind, res.publicUrl);
      if (!saveRes.success) throw new Error(saveRes.error ?? "Save failed");

      if (kind === "avatar") setAvatarUrl(res.publicUrl);
      else setCoverUrl(res.publicUrl);

      router.refresh();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (kind === "avatar" && avatarInputRef.current)
        avatarInputRef.current.value = "";
      if (kind === "cover" && coverInputRef.current)
        coverInputRef.current.value = "";
    }
  }

  /* =========================================================
     BUTTON LABELS
  ========================================================= */

  const followLabel = isFollowing ? "Following" : "Follow";
  const FollowIcon = isFollowing ? UserCheck : UserPlus;

  const connectLabel = isConnected
    ? "Connected"
    : isPendingSent
    ? "Pending"
    : relation === "pending_received"
    ? "Accept"
    : "Connect";

  const ConnectIcon = isConnected
    ? Check
    : isPendingSent
    ? Clock
    : relation === "pending_received"
    ? Check
    : UserPlus;

  return (
    <div className="space-y-3">
      {/* ================= PROFILE HEADER ================= */}
      <Card className="overflow-hidden py-0 gap-0">
        {/* cover */}
        <div className="group relative h-40 w-full overflow-hidden bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 sm:h-52">
          {coverUrl ? (
            <Image
              src={coverUrl}
              alt="Cover"
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.25),transparent_50%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(255,255,255,0.2),transparent_50%)]" />
            </>
          )}

          {isSelf && (
            <>
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                disabled={uploadingCover}
                className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-opacity hover:bg-black/70 disabled:opacity-50"
                aria-label="Change cover photo"
              >
                {uploadingCover ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </button>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file, "cover");
                }}
              />
            </>
          )}
        </div>

        <CardContent className="relative p-4 pt-0 sm:p-6 sm:pt-0">
          {/* avatar + actions */}
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="group relative -mt-16 sm:-mt-20">
              <Avatar className="h-28 w-28 border-4 border-background shadow-lg sm:h-36 sm:w-36">
                <AvatarImage src={avatarUrl ?? undefined} alt={user.name} />
                <AvatarFallback className="text-3xl font-semibold">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>

              {isSelf && (
                <>
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="absolute bottom-1 right-1 flex h-9 w-9 items-center justify-center rounded-full border-2 border-background bg-foreground text-background shadow-md transition-transform hover:scale-105 disabled:opacity-50"
                    aria-label="Change profile photo"
                  >
                    {uploadingAvatar ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </button>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file, "avatar");
                    }}
                  />
                </>
              )}
            </div>

            {/* action buttons */}
            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
              {isSelf ? (
                <Button onClick={() => setEditOpen(true)} className="gap-1.5">
                  <Pencil className="h-3.5 w-3.5" />
                  Edit profile
                </Button>
              ) : (
                <>
                  {/* -------- FOLLOW -------- */}
                  <Button
                    variant={isFollowing ? "outline" : "default"}
                    onClick={handleFollow}
                    disabled={followBusy}
                    className="gap-1.5"
                  >
                    {followBusy ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <FollowIcon className="h-3.5 w-3.5" />
                    )}
                    {followLabel}
                  </Button>

                  {/* -------- CONNECT -------- */}
                  {isConnected ? (
                    // connected → dropdown for remove
                    <DropdownMenu>
                      <DropdownMenuTrigger >
                        <Button
                          variant="outline"
                          disabled={connectBusy}
                          className="gap-1.5"
                        >
                          {connectBusy ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Check className="h-3.5 w-3.5" />
                          )}
                          Connected
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem
                          onClick={handleRemoveConnection}
                          className="text-destructive focus:text-destructive"
                        >
                          <UserMinus className="mr-2 h-3.5 w-3.5" />
                          Remove connection
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={handleConnect}
                      disabled={
                        connectBusy || isPendingSent || relation === "connected"
                      }
                      className="gap-1.5"
                    >
                      {connectBusy ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <ConnectIcon className="h-3.5 w-3.5" />
                      )}
                      {connectLabel}
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* name + info */}
          <div className="mt-4 space-y-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {user.name}
              </h1>
              {user.headline && (
                <p className="mt-1 text-sm text-muted-foreground sm:text-base">
                  {user.headline}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
              {user.location && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  {user.location}
                </span>
              )}
              {user.website && (
                <a
                  href={
                    user.website.startsWith("http")
                      ? user.website
                      : `https://${user.website}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-primary hover:underline"
                >
                  <LinkIcon className="h-3.5 w-3.5" />
                  {user.website.replace(/^https?:\/\//, "")}
                </a>
              )}
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Joined {formatDate(user.createdAt)}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1 text-sm">
              <Stat label="Posts" value={user.postsCount} />
              <Stat label="Connections" value={user.connectionsCount} />
              <Stat label="Followers" value={user.followersCount} />
              <Stat label="Following" value={user.followingCount} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ================= TABS ================= */}
      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="w-full justify-start rounded-lg bg-muted/50 p-1">
          <TabsTrigger value="posts" className="gap-1.5">
            <Building2 className="h-3.5 w-3.5" />
            Posts
          </TabsTrigger>
          <TabsTrigger value="about" className="gap-1.5">
            <Users className="h-3.5 w-3.5" />
            About
          </TabsTrigger>
          <TabsTrigger value="achievements" className="gap-1.5">
            <Award className="h-3.5 w-3.5" />
            Achievements
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="mt-3 space-y-3">
          {posts.length === 0 ? (
            <Card className="py-0 gap-0">
              <CardContent className="flex flex-col items-center gap-2 p-12 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                  <Building2 className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium">No posts yet</p>
                <p className="text-xs text-muted-foreground">
                  {isSelf
                    ? "Share your first post to get started"
                    : "This user hasn't posted anything yet"}
                </p>
              </CardContent>
            </Card>
          ) : (
            posts.map((post) => <PostCard key={post.id} post={post} />)
          )}
        </TabsContent>

        <TabsContent value="about" className="mt-3 space-y-3">
          <Card className="py-0 gap-0">
            <CardContent className="p-5">
              <h3 className="mb-3 text-sm font-semibold">About</h3>
              {user.bio ? (
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                  {user.bio}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {isSelf
                    ? "Add an about section to tell people about yourself"
                    : "No bio added yet"}
                </p>
              )}

              <Separator className="my-4" />

              <div className="grid gap-4 sm:grid-cols-2">
                <InfoRow
                  icon={Mail}
                  label="Email"
                  value={user.email}
                  isLink={false}
                />
                {user.location && (
                  <InfoRow
                    icon={MapPin}
                    label="Location"
                    value={user.location}
                    isLink={false}
                  />
                )}
                {user.website && (
                  <InfoRow
                    icon={Globe}
                    label="Website"
                    value={user.website.replace(/^https?:\/\//, "")}
                    href={
                      user.website.startsWith("http")
                        ? user.website
                        : `https://${user.website}`
                    }
                    isLink
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="achievements" className="mt-3">
          <Card className="py-0 gap-0">
            <CardContent className="p-5">
              <h3 className="mb-4 text-sm font-semibold">Achievements</h3>

              <div className="grid gap-3 sm:grid-cols-2">
                <AchievementCard
                  icon={Briefcase}
                  value={user.internshipsCount}
                  label="Internships"
                  color="bg-purple-500/10 text-purple-600 dark:text-purple-400"
                />
                <AchievementCard
                  icon={Award}
                  value={user.certificatesCount}
                  label="Certificates"
                  color="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
                />
                <AchievementCard
                  icon={Users}
                  value={user.connectionsCount}
                  label="Connections"
                  color="bg-blue-500/10 text-blue-600 dark:text-blue-400"
                />
                <AchievementCard
                  icon={UserPlus}
                  value={user.followersCount}
                  label="Followers"
                  color="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <EditProfileDrawer
        user={user}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </div>
  );
}

/* =========================================================
   SUB COMPONENTS
========================================================= */

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="font-semibold text-foreground">
        {formatCount(value)}
      </span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  href,
  isLink,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
  href?: string;
  isLink: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        {isLink && href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="truncate text-sm font-medium text-primary hover:underline"
          >
            {value}
          </a>
        ) : (
          <p className="truncate text-sm font-medium">{value}</p>
        )}
      </div>
    </div>
  );
}

function AchievementCard({
  icon: Icon,
  value,
  label,
  color,
}: {
  icon: typeof Award;
  value: number;
  label: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
          color
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xl font-bold leading-none">{formatCount(value)}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}