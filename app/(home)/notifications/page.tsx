import { Suspense } from "react";

import NotificationsClient from "@/components/home/notifications/NotificationsClient";
import NotificationsSkeleton from "@/components/home/notifications/NotificationsSkeleton";

import { getNotifications } from "./actions";

export default function NotificationsPage() {
  return (
    <Suspense fallback={<NotificationsSkeleton />}>
      <NotificationsSection />
    </Suspense>
  );
}

async function NotificationsSection() {
  const items = await getNotifications(50);
  return <NotificationsClient items={items} />;
}