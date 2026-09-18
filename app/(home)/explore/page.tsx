import { Suspense } from "react";

import ExploreClient from "@/components/home/explore/ExploreClient";
import ExploreSkeleton from "@/components/home/explore/ExploreSkeleton";

import {
  getTrendingTags,
  getPopularUsers,
  getExplorePosts,
  getExploreInternships,
} from "./actions";

interface Props {
  searchParams: Promise<{ tag?: string; q?: string }>;
}

export default async function ExplorePage({ searchParams }: Props) {
  const { tag, q } = await searchParams;

  return (
    <Suspense fallback={<ExploreSkeleton />}>
      <ExploreSection tag={tag} query={q} />
    </Suspense>
  );
}

async function ExploreSection({
  tag,
  query,
}: {
  tag?: string;
  query?: string;
}) {
  const [tags, popularUsers, posts, internships] = await Promise.all([
    getTrendingTags(12),
    getPopularUsers(12, query), // ← query pass kiya
    getExplorePosts({ tag, query, limit: 30 }), // ← query pass kiya
    getExploreInternships(12, query), // ← query pass kiya
  ]);

  return (
    <ExploreClient
      tags={tags}
      popularUsers={popularUsers}
      posts={posts}
      internships={internships}
      activeTag={tag}
      initialQuery={query ?? ""}
    />
  );
}