import { Suspense } from "react";

import ProfileClient from "@/components/home/profile/ProfileClient";
import ProfileSkeleton from "@/components/home/profile/ProfileSkeleton";

import { getProfileData } from "./actions";

export default function ProfilePage() {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <ProfileSection />
    </Suspense>
  );
}

async function ProfileSection() {
  const { user, posts, relation } = await getProfileData();

  return <ProfileClient user={user} posts={posts} relation={relation} />;
}