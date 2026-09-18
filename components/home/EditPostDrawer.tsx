"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Save,
  Globe,
  Users,
  Lock,
  MapPin,
  Hash,
  X,
  AlertCircle,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { updatePost } from "@/actions/home/actions";
import type { FeedPost } from "@/actions/home/actions";

/* =========================================================
   CONFIG
========================================================= */

const visibilityConfig = {
  public: { label: "Public", icon: Globe },
  connections: { label: "Connections", icon: Users },
  private: { label: "Private", icon: Lock },
} as const;

type Visibility = keyof typeof visibilityConfig;

/** Safe getter — agar invalid value aaye to "public" default */
function getVisibilityConfig(v: string | undefined) {
  return visibilityConfig[v as Visibility] ?? visibilityConfig.public;
}

/** Safe visibility value — invalid hone pe "public" */
function safeVisibility(v: string | undefined): Visibility {
  return v && v in visibilityConfig ? (v as Visibility) : "public";
}

interface Props {
  post: FeedPost;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/* =========================================================
   MAIN
========================================================= */

export default function EditPostDrawer({ post, open, onOpenChange }: Props) {
  const router = useRouter();

  const [caption, setCaption] = useState(post.caption ?? "");
  const [location, setLocation] = useState(post.location ?? "");
  const [tagsInput, setTagsInput] = useState((post.tags ?? []).join(" "));
  const [visibility, setVisibility] = useState<Visibility>(() =>
    safeVisibility(post.visibility)
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [, startTransition] = useTransition();

  /* ---------- sync on open ---------- */
  useEffect(() => {
    if (open) {
      setCaption(post.caption ?? "");
      setLocation(post.location ?? "");
      setTagsInput((post.tags ?? []).join(" "));
      setVisibility(safeVisibility(post.visibility));
      setError(null);
    }
  }, [open, post]);

  /* ---------- tags parser ---------- */
  function parseTags(input: string): string[] {
    return Array.from(
      new Set(
        input
          .split(/[\s,]+/)
          .map((t) => t.trim())
          .filter(Boolean)
          .map((t) => (t.startsWith("#") ? t : `#${t}`))
      )
    ).slice(0, 10);
  }

  /* ---------- submit ---------- */
  function handleSubmit() {
    if (!caption.trim() && post.media.length === 0) {
      setError("Post must have a caption or media");
      return;
    }

    setSubmitting(true);
    setError(null);

    startTransition(async () => {
      const res = await updatePost(post.id, {
        caption: caption.trim(),
        location: location.trim() || undefined,
        tags: parseTags(tagsInput),
        visibility,
      });

      setSubmitting(false);

      if (res.success) {
        onOpenChange(false);
        router.refresh();
      } else {
        setError(res.error ?? "Failed to update post");
      }
    });
  }

  const vis = getVisibilityConfig(visibility);
  const VisIcon = vis.icon;
  const tags = parseTags(tagsInput);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[92vh] gap-0 overflow-y-auto rounded-t-2xl p-0"
      >
        <div className="mx-auto flex w-full max-w-2xl flex-col">
          {/* drag handle */}
          <div className="mx-auto mt-2.5 h-1.5 w-12 rounded-full bg-muted" />
          <SheetTitle className="sr-only">Edit post</SheetTitle>

          {/* ================= HEADER ================= */}
          <header className="flex items-center justify-between gap-3 px-5 pt-4 pb-3">
            <div>
              <p className="text-base font-semibold">Edit post</p>
              <p className="text-xs text-muted-foreground">
                Update your caption, tags, or visibility
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </header>

          <Separator />

          {/* ================= VISIBILITY ================= */}
          <div className="px-5 pt-4">
            <DropdownMenu>
              <DropdownMenuTrigger >
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-full border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted"
                >
                  <VisIcon className="h-3 w-3" />
                  {vis.label}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                {(Object.keys(visibilityConfig) as Visibility[]).map((key) => {
                  const cfg = visibilityConfig[key];
                  const Icon = cfg.icon;
                  const active = visibility === key;
                  return (
                    <DropdownMenuItem
                      key={key}
                      onClick={() => setVisibility(key)}
                      className={cn(
                        "flex items-center gap-2 text-sm",
                        active && "bg-accent"
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {cfg.label}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* ================= CAPTION ================= */}
          <div className="px-5 pt-3">
            <Textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="What do you want to talk about?"
              rows={5}
              maxLength={3000}
              className="min-h-[120px] resize-none border-0 bg-transparent px-0 text-[15px] leading-relaxed focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>

          {/* ================= LOCATION ================= */}
          <div className="space-y-1.5 px-5 pt-2">
            <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <MapPin className="h-3 w-3" />
              Location
            </label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Mumbai, India"
              maxLength={150}
            />
          </div>

          {/* ================= TAGS ================= */}
          <div className="space-y-1.5 px-5 pt-3">
            <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Hash className="h-3 w-3" />
              Tags
            </label>
            <Input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="webdev react"
            />
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {tags.map((t) => (
                  <Badge
                    key={t}
                    variant="secondary"
                    className="rounded-md px-2 py-0.5 text-[11px] font-normal"
                  >
                    {t}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* ================= ERROR ================= */}
          {error && (
            <div className="mx-5 mt-3 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2 text-xs text-red-600 dark:text-red-400">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Separator className="mt-4" />

          {/* ================= FOOTER ================= */}
          <div className="flex items-center justify-end gap-2 px-5 py-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={submitting}
              className="gap-1.5 px-5"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  Save changes
                </>
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}