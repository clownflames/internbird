import { Suspense } from "react";

import SavedClient from "@/components/home/saved/SavedClient";
import SavedSkeleton from "@/components/home/saved/SavedSkeleton";

import { getSavedPosts } from "./actions";

export default function SavedPage() {
  return (
    <Suspense fallback={<SavedSkeleton />}>
      <SavedSection />
    </Suspense>
  );
}

async function SavedSection() {
  const { items, hasMore } = await getSavedPosts(20, 0);
  return <SavedClient initialItems={items} initialHasMore={hasMore} />;
}