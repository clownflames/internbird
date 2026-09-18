import { Suspense } from "react";
import { notFound } from "next/navigation";

import ProfileClient from "@/components/home/profile/ProfileClient";
import ProfileSkeleton from "@/components/home/profile/ProfileSkeleton";

import { getProfileData } from "../actions";

/* =========================================================
   DYNAMIC PROFILE PAGE
   /profile/[id]
========================================================= */

interface Props {
  params: Promise<{ id: string }>;
}

export default async function UserProfilePage({ params }: Props) {
  const { id } = await params;

  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <ProfileSection userId={id} />
    </Suspense>
  );
}

async function ProfileSection({ userId }: { userId: string }) {
  const { user, posts, relation } = await getProfileData(userId);

  if (!user) {
    notFound();
  }

  return <ProfileClient user={user} posts={posts} relation={relation} />;
}