"use server";

import { db } from "@/db";
import { notifications, users } from "@/db/schema";
import { auth } from "@/auth";
import { and, eq, desc, sql, isNull, or } from "drizzle-orm";

/* =========================================================
   TYPES
========================================================= */

export type NotificationItem = {
  id: string;
  type:
    | "post_like"
    | "post_comment"
    | "comment_reply"
    | "comment_like"
    | "follow"
    | "connection_request"
    | "connection_accepted"
    | "internship_registered"
    | "exam_published"
    | "certificate_issued"
    | "offer_letter_issued"
    | "mention"
    | "system";
  title: string;
  message: string | null;
  link: string | null;
  entityId: string | null;
  entityType: string | null;
  isRead: boolean;
  createdAt: string;
  actor: {
    id: string;
    name: string;
    image: string | null;
    headline: string | null;
  } | null;
};

export type NotificationGroup = {
  label: "Today" | "This Week" | "Earlier";
  items: NotificationItem[];
};

/* =========================================================
   HELPER
========================================================= */

async function getCurrentUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

/* =========================================================
   GET NOTIFICATIONS
========================================================= */

export async function getNotifications(
  limit = 50
): Promise<NotificationItem[]> {
  const currentUserId = await getCurrentUserId();
  if (!currentUserId) return [];

  const rows = await db
    .select({
      id: notifications.id,
      type: notifications.type,
      title: notifications.title,
      message: notifications.message,
      link: notifications.link,
      entityId: notifications.entityId,
      entityType: notifications.entityType,
      isRead: notifications.isRead,
      createdAt: notifications.createdAt,

      actorId: users.id,
      actorName: users.name,
      actorImage: users.image,
      actorHeadline: users.headline,
    })
    .from(notifications)
    .leftJoin(users, eq(users.id, notifications.actorId))
    .where(eq(notifications.userId, currentUserId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);

  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    title: r.title,
    message: r.message,
    link: r.link,
    entityId: r.entityId,
    entityType: r.entityType,
    isRead: r.isRead,
    createdAt: r.createdAt.toISOString(),
    actor: r.actorId
      ? {
          id: r.actorId,
          name: r.actorName ?? "Unknown",
          image: r.actorImage,
          headline: r.actorHeadline,
        }
      : null,
  }));
}

/* =========================================================
   UNREAD COUNT (for navbar badge)
========================================================= */

export async function getUnreadNotificationCount(): Promise<number> {
  const currentUserId = await getCurrentUserId();
  if (!currentUserId) return 0;

  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, currentUserId),
        eq(notifications.isRead, false)
      )
    );

  return row?.count ?? 0;
}

/* =========================================================
   MARK ONE AS READ
========================================================= */

export async function markNotificationRead(
  id: string
): Promise<{ success: boolean }> {
  const currentUserId = await getCurrentUserId();
  if (!currentUserId) return { success: false };

  await db
    .update(notifications)
    .set({ isRead: true, readAt: new Date() })
    .where(
      and(
        eq(notifications.id, id),
        eq(notifications.userId, currentUserId)
      )
    );

  return { success: true };
}

/* =========================================================
   MARK ALL AS READ
========================================================= */

export async function markAllNotificationsRead(): Promise<{
  success: boolean;
}> {
  const currentUserId = await getCurrentUserId();
  if (!currentUserId) return { success: false };

  await db
    .update(notifications)
    .set({ isRead: true, readAt: new Date() })
    .where(
      and(
        eq(notifications.userId, currentUserId),
        eq(notifications.isRead, false)
      )
    );

  return { success: true };
}

/* =========================================================
   CREATE NOTIFICATION (internal helper)
   ---------------------------------------------
   Ye function dusre server actions se call hoga
   (jab follow ho, connection accept ho, like aaye, etc.)
========================================================= */

export async function createNotification(input: {
  userId: string;
  actorId?: string | null;
  type: NotificationItem["type"];
  title: string;
  message?: string | null;
  link?: string | null;
  entityId?: string | null;
  entityType?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  // don't notify yourself
  if (input.actorId && input.actorId === input.userId) return;

  await db.insert(notifications).values({
    userId: input.userId,
    actorId: input.actorId ?? null,
    type: input.type,
    title: input.title,
    message: input.message ?? null,
    link: input.link ?? null,
    entityId: input.entityId ?? null,
    entityType: input.entityType ?? null,
    metadata: input.metadata ?? {},
  });
}