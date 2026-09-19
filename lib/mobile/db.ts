import { db } from "@/db";
import {
  users,
  internships,
  internshipRegistrations,
  learningPages,
  exams,
  examQuestions,
  examSubmissions,
  examSubmissionAnswers,
  projects,
  projectSubmissions,
  offerLetters,
  certificates,
  lors,
  payments,
  followers,
  connections,
  posts,
  postLikes,
  postComments,
  commentLikes,
  savedPosts,
  notifications,
} from "@/db/schema";
import { eq, and, or, desc, asc, ilike, inArray, count, sql, isNull, ne } from "drizzle-orm";

export { db };

export const getUserById = async (id: string) => {
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0] || null;
};

export const getInternshipById = async (id: string) => {
  const result = await db.select().from(internships).where(eq(internships.id, id)).limit(1);
  return result[0] || null;
};

export const getRegistrationByUserAndInternship = async (userId: string, internshipId: string) => {
  const result = await db
    .select()
    .from(internshipRegistrations)
    .where(and(eq(internshipRegistrations.userId, userId), eq(internshipRegistrations.internshipId, internshipId)))
    .limit(1);
  return result[0] || null;
};

export const getUserRegistrations = async (userId: string, status?: string) => {
  const conditions = [eq(internshipRegistrations.userId, userId)];
  if (status) conditions.push(eq(internshipRegistrations.status, status as any));
  return db.select().from(internshipRegistrations).where(and(...conditions)).orderBy(desc(internshipRegistrations.registeredAt));
};

export const getLearningPagesByInternship = async (internshipId: string) => {
  return db.select().from(learningPages).where(and(eq(learningPages.internshipId, internshipId), eq(learningPages.isPublished, true))).orderBy(asc(learningPages.order));
};

export const getExamsByInternship = async (internshipId: string) => {
  return db.select().from(exams).where(and(eq(exams.internshipId, internshipId), eq(exams.isPublished, true))).orderBy(asc(exams.createdAt));
};

export const getExamQuestions = async (examId: string) => {
  return db.select().from(examQuestions).where(eq(examQuestions.examId, examId)).orderBy(asc(examQuestions.order));
};

export const getProjectsByInternship = async (internshipId: string) => {
  return db.select().from(projects).where(and(eq(projects.internshipId, internshipId), eq(projects.isActive, true), eq(projects.isPublished, true))).orderBy(asc(projects.order));
};

export const getUserProjectSubmission = async (userId: string, projectId: string) => {
  const result = await db.select().from(projectSubmissions).where(and(eq(projectSubmissions.userId, userId), eq(projectSubmissions.projectId, projectId))).limit(1);
  return result[0] || null;
};

export const getOfferLetterByRegistration = async (registrationId: string) => {
  const result = await db.select().from(offerLetters).where(eq(offerLetters.registrationId, registrationId)).limit(1);
  return result[0] || null;
};

export const getCertificateByRegistration = async (registrationId: string) => {
  const result = await db.select().from(certificates).where(eq(certificates.registrationId, registrationId)).limit(1);
  return result[0] || null;
};

export const getLORByRegistration = async (registrationId: string) => {
  const result = await db.select().from(lors).where(eq(lors.registrationId, registrationId)).limit(1);
  return result[0] || null;
};

export const getUserPayments = async (userId: string) => {
  return db.select().from(payments).where(eq(payments.userId, userId)).orderBy(desc(payments.createdAt));
};

export const getUserFeedPosts = async (userId: string, limit = 20, offset = 0) => {
  const followingSubquery = db.select({ followingId: followers.followingId }).from(followers).where(and(eq(followers.followerId, userId), eq(followers.status, "active")));
  const connectionsSubquery = db.select({ addresseeId: connections.addresseeId }).from(connections).where(and(eq(connections.requesterId, userId), eq(connections.status, "accepted")));
  const connectionsSubquery2 = db.select({ requesterId: connections.requesterId }).from(connections).where(and(eq(connections.addresseeId, userId), eq(connections.status, "accepted")));

  return db.select().from(posts)
    .where(and(
      eq(posts.isDeleted, false),
      or(
        eq(posts.visibility, "public"),
        and(eq(posts.visibility, "connections"), or(
          inArray(posts.userId, followingSubquery),
          inArray(posts.userId, connectionsSubquery),
          inArray(posts.userId, connectionsSubquery2)
        )),
        eq(posts.userId, userId)
      )
    ))
    .orderBy(desc(posts.createdAt))
    .limit(limit)
    .offset(offset);
};

export const getUnreadNotificationCount = async (userId: string) => {
  const result = await db.select({ count: count() }).from(notifications).where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  return result[0]?.count || 0;
};