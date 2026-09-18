import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";

import PostDetailClient from "@/components/home/post/PostDetailClient";
import PostDetailSkeleton from "@/components/home/post/PostDetailSkeleton";

import { getPostById } from "./actions";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PostPage({ params }: Props) {
  const { id } = await params;

  return (
    <div className="space-y-3">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        className="gap-1.5 text-muted-foreground"
      >
        <Link href="/" className="flex gap-2">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to feed
        </Link>
      </Button>

      <Suspense fallback={<PostDetailSkeleton />}>
        <PostSection postId={id} />
      </Suspense>
    </div>
  );
}

async function PostSection({ postId }: { postId: string }) {
  const post = await getPostById(postId);

  if (!post) {
    notFound();
  }

  return <PostDetailClient post={post as any} />;
}