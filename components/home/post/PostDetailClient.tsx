"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useTransition } from "react";
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
  Send,
  X,
  Reply,
  ArrowLeft,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
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

import EditPostDrawer from "@/components/home/EditPostDrawer";

import {
  toggleLikePost,
  toggleSavePost,
  deletePost,
  getPostComments,
  addComment,
  deleteComment,
  type PostComment,
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
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

const visibilityIcon = {
  public: Globe,
  connections: Users,
  private: Lock,
} as const;

/* =========================================================
   EXPANDABLE CAPTION
========================================================= */

function ExpandableCaption({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const check = () => {
      setIsOverflowing(el.scrollHeight > el.clientHeight + 2);
    };

    const raf = requestAnimationFrame(check);
    const ro = new ResizeObserver(check);
    ro.observe(el);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [text, expanded]);

  return (
    <div className="px-4 pb-3">
      <p
        ref={ref}
        className={cn(
          "whitespace-pre-wrap text-[15px] leading-relaxed",
          !expanded && "line-clamp-4"
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
   MAIN
========================================================= */

interface Props {
  post: FeedPost;
}

export default function PostDetailClient({ post }: Props) {
  const router = useRouter();
  const { data: session } = useSession();
  const currentUser = session?.user;

  const [liked, setLiked] = useState(post.isLikedByMe);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [saved, setSaved] = useState(post.isSavedByMe);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount);
  const [deleted, setDeleted] = useState(false);

  const [isPendingLike, startLikeTransition] = useTransition();
  const [isPendingSave, startSaveTransition] = useTransition();

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // comments
  const [comments, setComments] = useState<PostComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<PostComment | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [, startCommentTransition] = useTransition();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setCommentsLoading(true);
      const data = await getPostComments(post.id);
      if (!cancelled) {
        setComments(data);
        setCommentsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [post.id]);

  if (deleted) {
    return (
      <Card className="py-0 gap-0">
        <CardContent className="flex flex-col items-center gap-2 p-12 text-center">
          <p className="text-sm font-medium">Post deleted</p>
          <Button size="sm" >
            <Link href="/">Back to feed</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

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
      if (res.success) {
        router.push("/");
      } else {
        setDeleted(false);
      }
    });
  }

  /* ---------- COMMENTS ---------- */
  function countAll(list: PostComment[]): number {
    return list.reduce((acc, c) => acc + 1 + countAll(c.replies ?? []), 0);
  }

  function handleSubmitComment() {
    const trimmed = text.trim();
    if (!trimmed) return;

    const parentId = replyTo?.id ?? null;
    const snapshot = text;
    setText("");
    setReplyTo(null);
    setSubmitting(true);

    startCommentTransition(async () => {
      const res = await addComment(post.id, snapshot, parentId);
      setSubmitting(false);

      if (res.success && res.comment) {
        setComments((prev) => {
          let next: PostComment[];
          if (!parentId) {
            next = [...prev, res.comment!];
          } else {
            const update = (list: PostComment[]): PostComment[] =>
              list.map((c) =>
                c.id === parentId
                  ? { ...c, replies: [...(c.replies ?? []), res.comment!] }
                  : { ...c, replies: update(c.replies ?? []) }
              );
            next = update(prev);
          }
          setCommentsCount(countAll(next));
          return next;
        });
      }
    });
  }

  function handleDeleteComment(commentId: string) {
    startCommentTransition(async () => {
      const res = await deleteComment(commentId);
      if (res.success) {
        const remove = (list: PostComment[]): PostComment[] =>
          list
            .filter((c) => c.id !== commentId)
            .map((c) => ({ ...c, replies: remove(c.replies ?? []) }));
        const next = remove(comments);
        setComments(next);
        setCommentsCount(countAll(next));
      }
    });
  }

  function startReply(comment: PostComment) {
    setReplyTo(comment);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  const hasMedia = post.media.length > 0;
  const VisIcon = visibilityIcon[post.visibility] ?? Globe;

  return (
    <>
      <Card className="overflow-hidden py-0 gap-0">
        <CardContent className="p-0">
          {/* ================= HEADER ================= */}
          <div className="flex items-start gap-3 p-4 pb-3">
            <Link href={`/profile/${post.author.id}`}>
              <Avatar className="h-11 w-11 shrink-0">
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
                  className="h-8 w-8 shrink-0"
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
            <div className="flex flex-wrap gap-1.5 px-4 pb-3">
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
            <div className="flex items-center gap-1 px-4 pb-3 text-[11px] text-muted-foreground">
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
                        sizes="(max-width: 768px) 100vw, 800px"
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

          {/* ================= COUNTS ================= */}
          {(likesCount > 0 || commentsCount > 0) && (
            <div className="flex items-center justify-between px-4 py-3 text-xs text-muted-foreground">
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
                <span>{formatCount(commentsCount)} comments</span>
              )}
            </div>
          )}

          <Separator />

          {/* ================= ACTIONS ================= */}
          <div className="grid grid-cols-3 py-1">
            <Button
              variant="ghost"
              onClick={handleLike}
              disabled={isPendingLike}
              className={cn(
                "h-10 justify-center gap-2 rounded-md text-xs font-medium",
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

            <Button
              variant="ghost"
              onClick={() => inputRef.current?.focus()}
              className="h-10 justify-center gap-2 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Comment</span>
            </Button>

            <Button
              variant="ghost"
              onClick={handleSave}
              disabled={isPendingSave}
              className={cn(
                "h-10 justify-center gap-2 rounded-md text-xs font-medium",
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

      {/* ================= COMMENTS ================= */}
      <Card className="py-0 gap-0">
        <CardContent className="p-0">
          {/* header */}
          <div className="flex items-center justify-between px-4 py-3">
            <h2 className="text-sm font-semibold">
              Comments
              {comments.length > 0 && (
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  ({countAll(comments)})
                </span>
              )}
            </h2>
          </div>

          <Separator />

          {/* input */}
          <div className="border-b bg-muted/20 p-3">
            {replyTo && (
              <div className="mb-2 flex items-center justify-between rounded-md border bg-background px-2.5 py-1.5 text-xs">
                <span className="truncate text-muted-foreground">
                  Replying to{" "}
                  <span className="font-medium text-foreground">
                    {replyTo.author.name}
                  </span>
                </span>
                <button
                  onClick={() => setReplyTo(null)}
                  className="rounded-full p-0.5 hover:bg-accent"
                  aria-label="Cancel reply"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}

            <div className="flex items-end gap-2">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage
                  src={currentUser?.image ?? undefined}
                  alt={currentUser?.name ?? "You"}
                />
                <AvatarFallback className="text-[10px]">
                  {getInitials(currentUser?.name ?? "U")}
                </AvatarFallback>
              </Avatar>

              <Textarea
                ref={inputRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmitComment();
                  }
                }}
                placeholder="Write a comment..."
                rows={1}
                className="min-h-[36px] max-h-32 resize-none py-2 text-sm"
              />

              <Button
                onClick={handleSubmitComment}
                disabled={!text.trim() || submitting}
                size="icon"
                className="h-9 w-9 shrink-0"
                aria-label="Post comment"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* list */}
          <div className="p-4">
            {commentsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="ml-2 text-xs text-muted-foreground">
                  Loading comments...
                </span>
              </div>
            ) : comments.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm font-medium">No comments yet</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Be the first to share what you think
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {comments.map((c) => (
                  <CommentRow
                    key={c.id}
                    comment={c}
                    currentUserId={currentUser?.id}
                    onReply={startReply}
                    onDelete={handleDeleteComment}
                    depth={0}
                  />
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

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

/* =========================================================
   COMMENT ROW
========================================================= */

function CommentRow({
  comment,
  currentUserId,
  onReply,
  onDelete,
  depth,
}: {
  comment: PostComment;
  currentUserId?: string;
  onReply: (c: PostComment) => void;
  onDelete: (id: string) => void;
  depth: number;
}) {
  const isOwn = currentUserId === comment.author.id;
  const maxDepth = 2;
  const canReply = depth < maxDepth;

  return (
    <div className={cn(depth > 0 && "ml-6 border-l pl-3")}>
      <div className="flex items-start gap-2.5">
        <Link href={`/profile/${comment.author.id}`}>
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage
              src={comment.author.image ?? undefined}
              alt={comment.author.name}
            />
            <AvatarFallback className="text-[10px]">
              {getInitials(comment.author.name)}
            </AvatarFallback>
          </Avatar>
        </Link>

        <div className="min-w-0 flex-1">
          <div className="rounded-lg bg-muted px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <Link
                href={`/profile/${comment.author.id}`}
                className="truncate text-xs font-semibold hover:underline"
              >
                {comment.author.name}
              </Link>
              {isOwn && (
                <button
                  onClick={() => onDelete(comment.id)}
                  className="rounded p-0.5 text-muted-foreground transition-colors hover:text-destructive"
                  aria-label="Delete comment"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
            <p className="mt-0.5 whitespace-pre-wrap text-sm leading-relaxed">
              {comment.content}
            </p>
          </div>

          <div className="mt-1 flex items-center gap-3 pl-2 text-[11px] text-muted-foreground">
            <span>{timeAgo(comment.createdAt)}</span>
            {canReply && (
              <button
                onClick={() => onReply(comment)}
                className="flex items-center gap-1 font-medium transition-colors hover:text-foreground"
              >
                <Reply className="h-3 w-3" />
                Reply
              </button>
            )}
          </div>
        </div>
      </div>

      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-3 space-y-3">
          {comment.replies.map((r) => (
            <CommentRow
              key={r.id}
              comment={r}
              currentUserId={currentUserId}
              onReply={onReply}
              onDelete={onDelete}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}