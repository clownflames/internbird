"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Bookmark, Loader2, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import PostCard from "@/components/home/PostCard";

import { getSavedPosts, type SavedPostItem } from "@/app/(home)/saved/actions";

interface SavedClientProps {
  initialItems: SavedPostItem[];
  initialHasMore: boolean;
  pageSize?: number;
}

export default function SavedClient({
  initialItems,
  initialHasMore,
  pageSize = 20,
}: SavedClientProps) {
  const [items, setItems] = useState<SavedPostItem[]>(initialItems);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [offset, setOffset] = useState(initialItems.length);
  const [loading, setLoading] = useState(false);
  const [, startTransition] = useTransition();

  function handleLoadMore() {
    if (loading || !hasMore) return;
    setLoading(true);

    startTransition(async () => {
      const { items: nextItems, hasMore: more } = await getSavedPosts(
        pageSize,
        offset
      );

      // dedupe (just in case)
      setItems((prev) => {
        const existing = new Set(prev.map((p) => p.id));
        const fresh = nextItems.filter((p) => !existing.has(p.id));
        return [...prev, ...fresh];
      });

      setOffset((prev) => prev + nextItems.length);
      setHasMore(more);
      setLoading(false);
    });
  }

  if (items.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-3">
      {/* ================= HEADER ================= */}
      <Card className="py-0 gap-0">
        <CardContent className="flex items-center justify-between gap-3 p-4">
          <div>
            <h1 className="flex items-center gap-2 text-lg font-semibold">
              <Bookmark className="h-5 w-5 fill-current" />
              Saved Posts
            </h1>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {items.length} {items.length === 1 ? "post" : "posts"} saved for
              later
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ================= LIST ================= */}
      {items.map((item) => (
        <PostCard key={`saved-${item.id}`} post={item} />
      ))}

      {/* ================= LOAD MORE ================= */}
      {hasMore ? (
        <div className="flex justify-center py-4">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={loading}
            className="gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              "Load more"
            )}
          </Button>
        </div>
      ) : (
        <p className="py-4 text-center text-xs text-muted-foreground">
          You've reached the end
        </p>
      )}
    </div>
  );
}

/* =========================================================
   EMPTY STATE
========================================================= */

function EmptyState() {
  return (
    <Card className="py-0 gap-0">
      <CardContent className="flex flex-col items-center justify-center gap-3 p-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <Bookmark className="h-6 w-6 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium">No saved posts yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Tap the bookmark icon on any post to save it for later
          </p>
        </div>
        <Button size="sm" className="mt-2 gap-1.5" >
          <Link href="/">
            Browse feed
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}