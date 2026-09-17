"use client";

import { useEffect, useState, useTransition, useRef } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Send, Loader2, Trash2, Reply, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import {
  getPostComments,
  addComment,
  deleteComment,
  type PostComment,
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

function timeAgo(iso: string) {
  const date = new Date(iso);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface Props {
  postId: string;
  postCaption: string | null;
  postAuthor: {
    id: string;
    name: string;
    image: string | null;
    headline: string | null;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCommentsCountChange?: (count: number) => void;
}

/* =========================================================
   MAIN DRAWER
========================================================= */

export default function PostCommentsDrawer({
  postId,
  postCaption,
  postAuthor,
  open,
  onOpenChange,
  onCommentsCountChange,
}: Props) {
  const { data: session } = useSession();
  const currentUser = session?.user;

  const [comments, setComments] = useState<PostComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<PostComment | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [, startTransition] = useTransition();

  const inputRef = useRef<HTMLTextAreaElement>(null);

  /* ---------- load on open ---------- */
  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      const data = await getPostComments(postId);
      if (!cancelled) {
        setComments(data);
        setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [open, postId]);

  /* ---------- count all ---------- */
  function countAll(list: PostComment[]): number {
    return list.reduce((acc, c) => acc + 1 + countAll(c.replies ?? []), 0);
  }

  /* ---------- submit ---------- */
  function handleSubmit() {
    const trimmed = text.trim();
    if (!trimmed) return;

    const parentId = replyTo?.id ?? null;
    const snapshot = text;
    setText("");
    setReplyTo(null);
    setSubmitting(true);

    startTransition(async () => {
      const res = await addComment(postId, snapshot, parentId);
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
          onCommentsCountChange?.(countAll(next));
          return next;
        });
      }
    });
  }

  /* ---------- delete ---------- */
  function handleDelete(commentId: string) {
    startTransition(async () => {
      const res = await deleteComment(commentId);
      if (res.success) {
        const remove = (list: PostComment[]): PostComment[] =>
          list
            .filter((c) => c.id !== commentId)
            .map((c) => ({ ...c, replies: remove(c.replies ?? []) }));
        const next = remove(comments);
        setComments(next);
        onCommentsCountChange?.(countAll(next));
      }
    });
  }

  function startReply(comment: PostComment) {
    setReplyTo(comment);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  const totalCount = countAll(comments);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="flex max-h-[92vh] flex-col gap-0 rounded-t-2xl p-0"
      >
        {/* ================= DRAG HANDLE ================= */}
        <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-muted" />

        <SheetTitle className="sr-only">Comments</SheetTitle>

        {/* ================= HEADER ================= */}
        <SheetHeader className="flex-row items-center justify-between gap-3 space-y-0 px-5 pt-3 pb-3 text-left">
          <div>
            <p className="text-base font-semibold">
              Comments
              {totalCount > 0 && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({totalCount})
                </span>
              )}
            </p>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onOpenChange(false)}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        </SheetHeader>

        <Separator />

        {/* ================= POST PREVIEW ================= */}
        <div className="border-b bg-muted/30 px-5 py-3">
          <div className="flex items-start gap-3">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage
                src={postAuthor.image ?? undefined}
                alt={postAuthor.name}
              />
              <AvatarFallback className="text-[10px]">
                {getInitials(postAuthor.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold">{postAuthor.name}</p>
              {postCaption && (
                <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                  {postCaption}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ================= LIST ================= */}
        <div className="flex-1 overflow-y-auto px-5 py-3">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <span className="ml-2 text-xs text-muted-foreground">
                Loading comments...
              </span>
            </div>
          ) : comments.length === 0 ? (
            <div className="py-12 text-center">
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
                  onDelete={handleDelete}
                  depth={0}
                />
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* ================= INPUT ================= */}
        <div className="bg-background p-3">
          {replyTo && (
            <div className="mb-2 flex items-center justify-between rounded-md border bg-muted/40 px-2.5 py-1.5 text-xs">
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
                  handleSubmit();
                }
              }}
              placeholder="Write a comment..."
              rows={1}
              className="min-h-[36px] max-h-32 resize-none py-2 text-sm"
            />

            <Button
              onClick={handleSubmit}
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
      </SheetContent>
    </Sheet>
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

      {/* nested replies */}
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