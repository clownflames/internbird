"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

import type { FeedItem } from "@/app/(home)/actions";
import { getHomeFeed } from "@/app/(home)/actions";
import { getUserRegisteredInternshipIds } from "@/actions/home/actions";

import PostCard from "./PostCard";
import InternshipCard from "./InternshipCard";

interface FeedProps {
  initialItems: FeedItem[];
  initialHasMore: boolean;
  pageSize?: number;
}

export default function Feed({
  initialItems,
  initialHasMore,
  pageSize = 20,
}: FeedProps) {
  const [items, setItems] = useState<FeedItem[]>(initialItems);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [offset, setOffset] = useState(initialItems.length);
  const [loading, setLoading] = useState(false);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [, startTransition] = useTransition();

  /* ---------- fetch applied internship ids once ---------- */
  useEffect(() => {
    let cancelled = false;
    getUserRegisteredInternshipIds().then((ids) => {
      if (!cancelled) setAppliedIds(ids);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  /* ---------- load more ---------- */
  function handleLoadMore() {
    if (loading || !hasMore) return;
    setLoading(true);

    startTransition(async () => {
      const { items: nextItems, hasMore: more } = await getHomeFeed(
        pageSize,
        offset
      );

      setItems((prev) => [...prev, ...nextItems]);
      setOffset((prev) => prev + nextItems.length);
      setHasMore(more);
      setLoading(false);
    });
  }

  return (
    <div className="space-y-3">
      {items.map((item) =>
        item.kind === "post" ? (
          <PostCard key={`post-${item.id}`} post={item as any} />
        ) : (
          <InternshipCard
            key={`intern-${item.id}`}
            internship={item}
            hasApplied={appliedIds.has(item.id)}
          />
        )
      )}

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
        items.length > 0 && (
          <p className="py-4 text-center text-xs text-muted-foreground">
            You've reached the end
          </p>
        )
      )}
    </div>
  );
}