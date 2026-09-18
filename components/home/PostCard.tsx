"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  Heart,
  MessageCircle,
  MoreHorizontal,
  Globe,
  MapPin,
  Bookmark,
  Loader2,
  Pencil,
  Trash2,
  Copy,
  Lock,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import PostCommentsDrawer from "./PostCommentsDrawer";
import EditPostDrawer from "./EditPostDrawer";

import {
  toggleLikePost,
  toggleSavePost,
  deletePost,
} from "@/actions/home/actions";
import type { FeedPost } from "@/actions/home/actions";

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

function timeAgo(iso: string) {
  const date = new Date(iso);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
  if (seconds < 2592000) return `${Math.floor(seconds / 604800)}w`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const visibilityIcon = {
  public: Globe,
  connections: Users,
  private: Lock,
} as const;

/* =========================================================
   EXPANDABLE CAPTION
   ---------------------------------------------
   - Clamps to 3 lines
   - Shows "Read more" only if content actually overflows
========================================================= */

function ExpandableCaption({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const check = () => {
      // Temporarily remove clamp to measure full height? No — scrollHeight
      // on a clamped element gives full content height in most browsers.
      setIsOverflowing(el.scrollHeight > el.clientHeight + 2);
    };

    // initial check (after paint)
    const raf = requestAnimationFrame(check);

    // re-check on resize
    const ro = new ResizeObserver(check);
    ro.observe(el);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [text, expanded]);

  return (
    <div className="px-3 pb-2">
      <p
        ref={ref}
        className={cn(
          "whitespace-pre-wrap text-sm leading-relaxed",
          !expanded && "line-clamp-3"
        )}
      >
        {text}
      </p>

      {(isOverflowing || expanded) && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:underline"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}

/* =========================================================
   POST CARD
========================================================= */

interface PostCardProps {
  post: FeedPost;
}

export default function PostCard({ post }: PostCardProps) {
  const [liked, setLiked] = useState(post.isLikedByMe);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [saved, setSaved] = useState(post.isSavedByMe);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount);
  const [deleted, setDeleted] = useState(false);

  const [isPendingLike, startLikeTransition] = useTransition();
  const [isPendingSave, startSaveTransition] = useTransition();

  const [commentsOpen, setCommentsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (deleted) return null;

  /* ---------- LIKE ---------- */
  function handleLike() {
    const next = !liked;
    setLiked(next);
    setLikesCount((c) => Math.max(0, c + (next ? 1 : -1)));

    startLikeTransition(async () => {
      const res = await toggleLikePost(post.id);
      if (res.success) {
        setLiked(res.liked);
        setLikesCount(res.likesCount);
      } else {
        setLiked(!next);
        setLikesCount((c) => Math.max(0, c + (next ? -1 : 1)));
      }
    });
  }

  /* ---------- SAVE ---------- */
  function handleSave() {
    const next = !saved;
    setSaved(next);

    startSaveTransition(async () => {
      const res = await toggleSavePost(post.id);
      if (res.success) setSaved(res.saved);
      else setSaved(!next);
    });
  }

  /* ---------- COPY LINK ---------- */
  function handleCopyLink() {
    const url = `${window.location.origin}/post/${post.id}`;
    navigator.clipboard.writeText(url);
  }

  /* ---------- DELETE ---------- */
  function handleDelete() {
    setDeleteOpen(false);
    setDeleted(true);
    deletePost(post.id).then((res) => {
      if (!res.success) setDeleted(false);
    });
  }

  const hasMedia = post.media.length > 0;
  const VisIcon = visibilityIcon[post.visibility] ?? Globe;

  return (
    <>
      <Card className="overflow-hidden py-0 gap-0">
        <CardContent className="p-0">
          {/* ================= HEADER ================= */}
          <div className="flex items-start gap-3 p-3 pb-2">
            <Link href={`/profile/${post.author.id}`}>
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarImage
                  src={post.author.image ?? undefined}
                  alt={post.author.name}
                />
                <AvatarFallback className="text-xs">
                  {getInitials(post.author.name)}
                </AvatarFallback>
              </Avatar>
            </Link>

            <div className="min-w-0 flex-1">
              <Link
                href={`/profile/${post.author.id}`}
                className="block truncate text-sm font-semibold hover:underline"
              >
                {post.author.name}
              </Link>
              <p className="truncate text-xs text-muted-foreground">
                {post.author.headline ?? "Member"}
              </p>
              <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                <span>{timeAgo(post.createdAt)}</span>
                <span>·</span>
                <VisIcon className="h-3 w-3" />
                {post.isEdited && (
                  <>
                    <span>·</span>
                    <span>edited</span>
                  </>
                )}
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger >
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {post.isOwnPost ? (
                  <>
                    <DropdownMenuItem onClick={() => setEditOpen(true)}>
                      <Pencil className="mr-2 h-3.5 w-3.5" />
                      Edit post
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleCopyLink}>
                      <Copy className="mr-2 h-3.5 w-3.5" />
                      Copy link
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSave}>
                      <Bookmark className="mr-2 h-3.5 w-3.5" />
                      {saved ? "Unsave" : "Save post"}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setDeleteOpen(true)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-3.5 w-3.5" />
                      Delete post
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem onClick={handleSave}>
                      <Bookmark className="mr-2 h-3.5 w-3.5" />
                      {saved ? "Unsave" : "Save post"}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleCopyLink}>
                      <Copy className="mr-2 h-3.5 w-3.5" />
                      Copy link
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive focus:text-destructive">
                      Report
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* ================= CAPTION ================= */}
          {post.caption && <ExpandableCaption text={post.caption} />}

          {/* ================= TAGS ================= */}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 px-3 pb-2">
              {post.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/explore?tag=${tag.replace("#", "")}`}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  {tag.startsWith("#") ? tag : `#${tag}`}
                </Link>
              ))}
            </div>
          )}

          {/* ================= LOCATION ================= */}
          {post.location && (
            <div className="flex items-center gap-1 px-3 pb-2 text-[11px] text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span>{post.location}</span>
            </div>
          )}

          {/* ================= MEDIA ================= */}
          {hasMedia && (
            <div
              className={cn(
                "mt-1 grid gap-0.5 bg-muted",
                post.media.length === 1 && "grid-cols-1",
                post.media.length === 2 && "grid-cols-2",
                post.media.length >= 3 && "grid-cols-2"
              )}
            >
              {post.media.slice(0, 4).map((m, idx) => {
                const isLast = idx === 3 && post.media.length > 4;
                return (
                  <div
                    key={idx}
                    className={cn(
                      "relative aspect-video overflow-hidden bg-muted",
                      post.media.length === 3 &&
                        idx === 0 &&
                        "col-span-2 aspect-[2/1]"
                    )}
                  >
                    {m.type === "image" ? (
                      <Image
                        src={m.url}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 600px"
                        unoptimized
                      />
                    ) : (
                      <video
                        src={m.url}
                        poster={m.thumbnail}
                        controls
                        className="h-full w-full object-cover"
                      />
                    )}

                    {isLast && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-lg font-semibold text-white">
                        +{post.media.length - 4}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ================= COUNTS ROW ================= */}
          {(likesCount > 0 || commentsCount > 0) && (
            <div className="flex items-center justify-between px-3 py-2 text-xs text-muted-foreground">
              {likesCount > 0 ? (
                <div className="flex items-center gap-1">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] text-white">
                    ❤
                  </span>
                  <span>{formatCount(likesCount)}</span>
                </div>
              ) : (
                <span />
              )}
              {commentsCount > 0 && (
                <button
                  onClick={() => setCommentsOpen(true)}
                  className="hover:underline"
                >
                  {formatCount(commentsCount)} comments
                </button>
              )}
            </div>
          )}

          <Separator />

          {/* ================= ACTIONS ================= */}
          <div className="grid grid-cols-3 py-1">
            {/* ----- LIKE ----- */}
            <Button
              variant="ghost"
              onClick={handleLike}
              disabled={isPendingLike}
              className={cn(
                "h-9 justify-center gap-2 rounded-md text-xs font-medium",
                liked
                  ? "text-red-500 hover:text-red-600"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {isPendingLike ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Heart className={cn("h-4 w-4", liked && "fill-current")} />
              )}
              <span>{liked ? "Liked" : "Like"}</span>
            </Button>

            {/* ----- COMMENT ----- */}
            <Button
              variant="ghost"
              onClick={() => setCommentsOpen(true)}
              className="h-9 justify-center gap-2 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Comment</span>
            </Button>

            {/* ----- SAVE ----- */}
            <Button
              variant="ghost"
              onClick={handleSave}
              disabled={isPendingSave}
              className={cn(
                "h-9 justify-center gap-2 rounded-md text-xs font-medium",
                saved
                  ? "text-primary hover:text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {isPendingSave ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Bookmark className={cn("h-4 w-4", saved && "fill-current")} />
              )}
              <span>{saved ? "Saved" : "Save"}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ================= COMMENTS DRAWER ================= */}
      <PostCommentsDrawer
        postId={post.id}
        postCaption={post.caption}
        postAuthor={post.author}
        open={commentsOpen}
        onOpenChange={setCommentsOpen}
        onCommentsCountChange={setCommentsCount}
      />

      {/* ================= EDIT DRAWER ================= */}
      <EditPostDrawer post={post} open={editOpen} onOpenChange={setEditOpen} />

      {/* ================= DELETE CONFIRM ================= */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this post?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The post will be permanently
              removed from your profile and feed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}