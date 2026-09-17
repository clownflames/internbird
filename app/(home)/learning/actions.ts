"use server";

import { db } from "@/db";
import {
  learningPages,
  internships,
  internshipRegistrations,
} from "@/db/schema";
import { auth } from "@/auth";
import {
  and,
  or,
  eq,
  ilike,
  desc,
  asc,
  sql,
  inArray,
} from "drizzle-orm";

/* =========================================================
   TYPES
========================================================= */

export type LearningPageItem = {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  image: string | null;
  whatYouLearn: string[];
  order: number;
  isPublished: boolean;
  createdAt: string;
  internship: {
    id: string;
    name: string;
    image: string | null;
    mode: "remote" | "onsite" | "hybrid";
    duration: string | null;
  };
  // user-specific
  isEnrolled: boolean;
  registrationStatus:
    | "pending"
    | "active"
    | "completed"
    | "cancelled"
    | "rejected"
    | null;
};

export type LearningFilters = {
  search?: string;
  internshipId?: string;
  onlyEnrolled?: boolean;
  sort?: "latest" | "order" | "title";
};

export type InternshipOption = {
  id: string;
  name: string;
};

/* =========================================================
   HELPER
========================================================= */

async function getCurrentUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

/* =========================================================
   GET LEARNING PAGES
========================================================= */

export async function getLearningPages(
  filters: LearningFilters = {}
): Promise<LearningPageItem[]> {
  const currentUserId = await getCurrentUserId();

  const {
    search,
    internshipId,
    onlyEnrolled = false,
    sort = "latest",
  } = filters;

  /* ---------- build conditions ---------- */
  const conditions = [
    eq(learningPages.isPublished, true),
    eq(internships.isActive, true),
  ];

  if (search && search.trim()) {
    const q = `%${search.trim()}%`;
    conditions.push(
      or(
        ilike(learningPages.title, q),
        ilike(learningPages.description, q),
        ilike(internships.name, q)
      )!
    );
  }

  if (internshipId) {
    conditions.push(eq(learningPages.internshipId, internshipId));
  }

  /* ---------- enrollment filter ---------- */
  // get user's registered internship ids if onlyEnrolled or for status
  let enrolledInternshipIds: string[] = [];
  let registrationStatusByInternship = new Map<
    string,
    "pending" | "active" | "completed" | "cancelled" | "rejected"
  >();

  if (currentUserId) {
    const regs = await db
      .select({
        internshipId: internshipRegistrations.internshipId,
        status: internshipRegistrations.status,
      })
      .from(internshipRegistrations)
      .where(eq(internshipRegistrations.userId, currentUserId));

    enrolledInternshipIds = regs.map((r) => r.internshipId);
    registrationStatusByInternship = new Map(
      regs.map((r) => [r.internshipId, r.status])
    );
  }

  if (onlyEnrolled) {
    if (enrolledInternshipIds.length === 0) {
      return [];
    }
    conditions.push(
      inArray(learningPages.internshipId, enrolledInternshipIds)
    );
  }

  /* ---------- order ---------- */
  const orderBy =
    sort === "title"
      ? asc(learningPages.title)
      : sort === "order"
      ? asc(learningPages.order)
      : desc(learningPages.createdAt);

  /* ---------- fetch ---------- */
  const rows = await db
    .select({
      id: learningPages.id,
      title: learningPages.title,
      description: learningPages.description,
      content: learningPages.content,
      image: learningPages.image,
      whatYouLearn: learningPages.whatYouLearn,
      order: learningPages.order,
      isPublished: learningPages.isPublished,
      createdAt: learningPages.createdAt,

      internshipId: internships.id,
      internshipName: internships.name,
      internshipImage: internships.image,
      internshipMode: internships.mode,
      internshipDuration: internships.duration,
    })
    .from(learningPages)
    .innerJoin(
      internships,
      eq(internships.id, learningPages.internshipId)
    )
    .where(and(...conditions))
    .orderBy(orderBy);

  /* ---------- shape ---------- */
  return rows.map((r) => {
    const status = registrationStatusByInternship.get(r.internshipId) ?? null;
    return {
      id: r.id,
      title: r.title,
      description: r.description,
      content: r.content,
      image: r.image,
      whatYouLearn: r.whatYouLearn ?? [],
      order: r.order,
      isPublished: r.isPublished,
      createdAt: r.createdAt.toISOString(),
      internship: {
        id: r.internshipId,
        name: r.internshipName,
        image: r.internshipImage,
        mode: r.internshipMode,
        duration: r.internshipDuration,
      },
      isEnrolled: !!status,
      registrationStatus: status,
    };
  });
}

/* =========================================================
   GET INTERNSHIPS LIST (for filter dropdown)
========================================================= */

export async function getInternshipOptions(): Promise<InternshipOption[]> {
  return db
    .select({
      id: internships.id,
      name: internships.name,
    })
    .from(internships)
    .where(eq(internships.isActive, true))
    .orderBy(asc(internships.name));
}