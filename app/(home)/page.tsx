import { Suspense } from "react";

import Feed from "@/components/home/Feed";
import FeedSkeleton from "@/components/home/FeedSkeleton";

import { getHomeFeed } from "./actions";

export default function HomePage() {
  return (
    <Suspense fallback={<FeedSkeleton />}>
      <FeedSection />
    </Suspense>
  );
}

async function FeedSection() {
  const { items, hasMore } = await getHomeFeed(20, 0);

  if (items.length === 0) {
    return (
      <div className="rounded-lg border bg-background p-8 text-center">
        <p className="text-sm font-medium">No posts yet</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Follow people or create your first post to see content here.
        </p>
      </div>
    );
  }

  return (
    <Feed
      initialItems={items}
      initialHasMore={hasMore}
      pageSize={20}
    />
  );
}