import { auth } from "@/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { internshipRegistrations, certificates, offerLetters, lors, examSubmissions, projectSubmissions, connections, followers, posts, notifications } from "@/db/schema";
import { eq, and, or, count, sql, desc } from "drizzle-orm";
import { successResponse, errorResponse, handleApiError, unauthorizedResponse } from "@/lib/mobile";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return unauthorizedResponse();

    const userId = session.user.id;

    const [
      activeInternships,
      completedInternships,
      totalCertificates,
      totalOfferLetters,
      totalLORs,
      passedExams,
      submittedProjects,
      connectionsCount,
      followersCount,
      followingCount,
      postsCount,
      unreadNotifications,
    ] = await Promise.all([
      db.select({ count: count() }).from(internshipRegistrations).where(and(eq(internshipRegistrations.userId, userId), eq(internshipRegistrations.status, "active"))),
      db.select({ count: count() }).from(internshipRegistrations).where(and(eq(internshipRegistrations.userId, userId), eq(internshipRegistrations.status, "completed"))),
      db.select({ count: count() }).from(certificates).where(and(eq(certificates.userId, userId), eq(certificates.status, "issued"))),
      db.select({ count: count() }).from(offerLetters).where(and(eq(offerLetters.userId, userId), eq(offerLetters.status, "issued"))),
      db.select({ count: count() }).from(lors).where(and(eq(lors.userId, userId), eq(lors.status, "issued"))),
      db.select({ count: count() }).from(examSubmissions).where(and(eq(examSubmissions.userId, userId), eq(examSubmissions.passed, true))),
      db.select({ count: count() }).from(projectSubmissions).where(and(eq(projectSubmissions.userId, userId), eq(projectSubmissions.status, "submitted"))),
      db.select({ count: count() }).from(connections).where(and(or(eq(connections.requesterId, userId), eq(connections.addresseeId, userId)), eq(connections.status, "accepted"))),
      db.select({ count: count() }).from(followers).where(and(eq(followers.followingId, userId), eq(followers.status, "active"))),
      db.select({ count: count() }).from(followers).where(and(eq(followers.followerId, userId), eq(followers.status, "active"))),
      db.select({ count: count() }).from(posts).where(and(eq(posts.userId, userId), eq(posts.isDeleted, false))),
      db.select({ count: count() }).from(notifications).where(and(eq(notifications.userId, userId), eq(notifications.isRead, false))),
    ]);

    return successResponse({
      activeInternships: activeInternships[0]?.count || 0,
      completedInternships: completedInternships[0]?.count || 0,
      totalCertificates: totalCertificates[0]?.count || 0,
      totalOfferLetters: totalOfferLetters[0]?.count || 0,
      totalLORs: totalLORs[0]?.count || 0,
      passedExams: passedExams[0]?.count || 0,
      submittedProjects: submittedProjects[0]?.count || 0,
      connectionsCount: connectionsCount[0]?.count || 0,
      followersCount: followersCount[0]?.count || 0,
      followingCount: followingCount[0]?.count || 0,
      postsCount: postsCount[0]?.count || 0,
      unreadNotifications: unreadNotifications[0]?.count || 0,
    });
  } catch (error) {
    return handleApiError(error);
  }
}