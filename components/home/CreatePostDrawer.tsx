"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ImagePlus,
  X,
  Loader2,
  Send,
  Globe,
  Lock,
  Users,
  MapPin,
  Hash,
  AlertCircle,
  ChevronDown,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

import { createPost, getUploadUrl } from "@/actions/home/actions";

/* =========================================================
   TYPES + CONFIG
========================================================= */

type Visibility = "public" | "connections" | "private";

interface UploadedImage {
  url: string;
  width?: number;
  height?: number;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

const visibilityConfig = {
  public: { label: "Public", icon: Globe },
  connections: { label: "Connections", icon: Users },
  private: { label: "Private", icon: Lock },
};

const MAX_IMAGES = 4;
const MAX_CHARS = 3000;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

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

function getImageDimensions(
  file: File
): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      resolve({ width: 0, height: 0 });
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
}

/* =========================================================
   MAIN DRAWER
========================================================= */

export default function CreatePostDrawer({
  open,
  onOpenChange,
  onCreated,
}: Props) {
  const { data: session } = useSession();
  const user = session?.user;
  const router = useRouter();

  const [caption, setCaption] = useState("");
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [visibility, setVisibility] = useState<Visibility>("public");
  const [location, setLocation] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [showMore, setShowMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ---------- reset on close ---------- */
  function handleOpenChange(next: boolean) {
    if (!next) {
      setTimeout(() => {
        setCaption("");
        setImages([]);
        setVisibility("public");
        setLocation("");
        setTagsInput("");
        setShowMore(false);
        setError(null);
      }, 250);
    }
    onOpenChange(next);
  }

  /* =========================================================
     IMAGE UPLOAD (Cloudflare R2)
  ========================================================= */
  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    if (images.length + files.length > MAX_IMAGES) {
      setError(`You can upload up to ${MAX_IMAGES} images`);
      return;
    }

    // validate types + size
    for (const f of files) {
      if (!f.type.startsWith("image/")) {
        setError("Only image files are allowed");
        return;
      }
      if (f.size > MAX_FILE_SIZE) {
        setError("Each image must be under 5MB");
        return;
      }
    }

    setError(null);
    setUploading(true);

    try {
      const uploaded: UploadedImage[] = [];

      for (const file of files) {
        // 1. get presigned URL from server
        const res = await getUploadUrl(file.name, file.type);

        if (!res.success || !res.uploadUrl || !res.publicUrl) {
          throw new Error(res.error ?? "Failed to get upload URL");
        }

        // 2. upload directly to R2
        const uploadRes = await fetch(res.uploadUrl, {
          method: "PUT",
          headers: {
            "Content-Type": file.type,
          },
          body: file,
        });

        if (!uploadRes.ok) {
          throw new Error("Upload to R2 failed");
        }

        // 3. get image dimensions for layout
        const dimensions = await getImageDimensions(file);

        uploaded.push({
          url: res.publicUrl,
          width: dimensions.width,
          height: dimensions.height,
        });
      }

      setImages((prev) => [...prev, ...uploaded]);
    } catch (err) {
      console.error("Upload error", err);
      setError(
        err instanceof Error ? err.message : "Failed to upload image"
      );
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function removeImage(idx: number) {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  }

  /* ---------- parse tags ---------- */
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
    setError(null);

    const trimmedCaption = caption.trim();
    if (!trimmedCaption && images.length === 0) {
      setError("Write something or add an image");
      return;
    }

    setSubmitting(true);
    startTransition(async () => {
      const res = await createPost({
        caption: trimmedCaption,
        media: images.map((i) => ({
          type: "image" as const,
          url: i.url,
          width: i.width,
          height: i.height,
        })),
        mediaType: images.length > 0 ? "image" : "text",
        visibility,
        location: location.trim() || undefined,
        tags: parseTags(tagsInput),
      });

      setSubmitting(false);

      if (res.success) {
        onCreated?.();
        handleOpenChange(false);
        router.refresh();
      } else {
        setError(res.error ?? "Failed to create post");
      }
    });
  }

  const canSubmit =
    (caption.trim().length > 0 || images.length > 0) &&
    !submitting &&
    !uploading;
  const remaining = MAX_CHARS - caption.length;
  const vis = visibilityConfig[visibility];

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[92vh] gap-0 overflow-y-auto rounded-t-2xl p-0"
      >
        <div className="mx-auto flex w-full max-w-2xl flex-col">
          {/* ================= DRAG HANDLE ================= */}
          <div className="mx-auto mt-2.5 h-1.5 w-12 rounded-full bg-muted" />

          <SheetTitle className="sr-only">Create a post</SheetTitle>

          {/* ================= HEADER ================= */}
          <header className="flex items-center justify-between gap-3 px-5 pt-4 pb-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-11 w-11 border">
                <AvatarImage
                  src={user?.image ?? undefined}
                  alt={user?.name ?? "User"}
                />
                <AvatarFallback className="text-xs">
                  {getInitials(user?.name)}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {user?.name ?? "Guest User"}
                </p>

                {/* visibility pill */}
                <DropdownMenu>
                  <DropdownMenuTrigger >
                    <button className="mt-0.5 inline-flex items-center gap-1 rounded-full border bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted">
                      <vis.icon className="h-3 w-3" />
                      {vis.label}
                      <ChevronDown className="h-2.5 w-2.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48">
                    {(Object.keys(visibilityConfig) as Visibility[]).map(
                      (key) => {
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
                      }
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* close button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => handleOpenChange(false)}
              disabled={submitting}
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </header>

          {/* ================= CAPTION ================= */}
          <div className="px-5">
            <Textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="What do you want to talk about?"
              rows={5}
              autoFocus
              maxLength={MAX_CHARS}
              className="min-h-[120px] resize-none border-0 bg-transparent px-0 text-[15px] leading-relaxed placeholder:text-muted-foreground/70 focus-visible:ring-0 focus-visible:ring-offset-0"
            />

            {/* char counter — only near limit */}
            {remaining < 200 && (
              <div className="flex justify-end pb-2">
                <span
                  className={cn(
                    "text-[11px] tabular-nums",
                    remaining < 0
                      ? "text-red-500"
                      : remaining < 100
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-muted-foreground"
                  )}
                >
                  {remaining}
                </span>
              </div>
            )}
          </div>

          {/* ================= IMAGE PREVIEWS ================= */}
          {images.length > 0 && (
            <div className="px-5 pb-3">
              <div
                className={cn(
                  "grid gap-1.5",
                  images.length === 1 && "grid-cols-1",
                  images.length === 2 && "grid-cols-2",
                  images.length >= 3 && "grid-cols-2"
                )}
              >
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "group relative overflow-hidden rounded-lg border bg-muted",
                      images.length === 1
                        ? "aspect-video"
                        : images.length === 3 && idx === 0
                        ? "col-span-2 aspect-[2/1]"
                        : "aspect-square"
                    )}
                  >
                    <Image
                      src={img.url}
                      alt={`Upload ${idx + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 400px"
                      unoptimized
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white shadow-md transition-colors hover:bg-black"
                      aria-label="Remove image"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= ADD IMAGE (dashed box) ================= */}
          {images.length === 0 && (
            <div className="px-5 pb-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-muted-foreground/25 bg-muted/20 py-6 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-foreground disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <ImagePlus className="h-4 w-4" />
                    Add a photo
                  </>
                )}
              </button>
            </div>
          )}

          {/* ================= ADD MORE IMAGES ================= */}
          {images.length > 0 && images.length < MAX_IMAGES && (
            <div className="px-5 pb-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 rounded-lg border border-dashed px-3 py-2 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-foreground disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <ImagePlus className="h-3.5 w-3.5" />
                    Add more ({images.length}/{MAX_IMAGES})
                  </>
                )}
              </button>
            </div>
          )}

          {/* ================= MORE OPTIONS TOGGLE ================= */}
          <div className="px-5 pb-2">
            <button
              type="button"
              onClick={() => setShowMore((s) => !s)}
              className="flex w-full items-center justify-between rounded-lg px-1 py-2 text-sm font-medium transition-colors hover:bg-accent/40"
            >
              <span className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                Add location & tags
              </span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform",
                  showMore && "rotate-180"
                )}
              />
            </button>

            {showMore && (
              <div className="mt-2 space-y-3 rounded-lg border bg-muted/30 p-3">
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    Location
                  </label>
                  <Input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Mumbai, India"
                    maxLength={150}
                    className="h-9 bg-background"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Hash className="h-3 w-3" />
                    Tags
                  </label>
                  <Input
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="webdev react internship"
                    className="h-9 bg-background"
                  />
                  {parseTags(tagsInput).length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {parseTags(tagsInput).map((t) => (
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
              </div>
            )}
          </div>

          {/* ================= ERROR ================= */}
          {error && (
            <div className="mx-5 mb-3 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2 text-xs text-red-600 dark:text-red-400">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />

          <Separator />

          {/* ================= FOOTER ================= */}
          <div className="flex items-center justify-end gap-2 px-5 py-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>

            <Button
              onClick={handleSubmit}
              disabled={!canSubmit}
              size="sm"
              className="gap-1.5 px-5"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Posting...
                </>
              ) : uploading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  Post
                </>
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}