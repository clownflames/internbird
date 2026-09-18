"use server";

import { db } from "@/db";
import { internshipRegistrations, internships } from "@/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { getSession } from "@/auth";

/* =========================================================
   GET MY REGISTRATIONS
========================================================= */

export async function getMyRegistrations({
  status = "all",
  page = 1,
  limit = 10,
}: {
  status?: string;
  page?: number;
  limit?: number;
} = {}) {
  const session = await getSession();
  if (!session?.user) {
    return { success: false, error: "Unauthorized", data: [], total: 0, totalPages: 1 };
  }

  const userId = (session.user as { id?: string }).id;
  if (!userId) {
    return { success: false, error: "Unauthorized", data: [], total: 0, totalPages: 1 };
  }

  const offset = (page - 1) * limit;

  const filters = [eq(internshipRegistrations.userId, userId)];
  if (status && status !== "all") {
    filters.push(
      eq(
        internshipRegistrations.status,
        status as
          | "pending"
          | "active"
          | "completed"
          | "cancelled"
          | "rejected"
      )
    );
  }

  const whereClause = and(...filters);

  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: internshipRegistrations.id,
        internshipId: internshipRegistrations.internshipId,
        university: internshipRegistrations.university,
        collegeName: internshipRegistrations.collegeName,
        branch: internshipRegistrations.branch,
        degree: internshipRegistrations.degree,
        academicYear: internshipRegistrations.academicYear,
        semester: internshipRegistrations.semester,
        passingYear: internshipRegistrations.passingYear,
        address: internshipRegistrations.address,
        aboutUser: internshipRegistrations.aboutUser,
        status: internshipRegistrations.status,
        registeredAt: internshipRegistrations.registeredAt,
        completedAt: internshipRegistrations.completedAt,
        createdAt: internshipRegistrations.createdAt,
        updatedAt: internshipRegistrations.updatedAt,

        internshipName: internships.name,
        internshipDescription: internships.description,
        internshipImage: internships.image,
        internshipSkills: internships.skills,
        internshipQualifications: internships.qualifications,
        internshipDuration: internships.duration,
        internshipMode: internships.mode,
        internshipLocation: internships.location,
      })
      .from(internshipRegistrations)
      .leftJoin(
        internships,
        eq(internshipRegistrations.internshipId, internships.id)
      )
      .where(whereClause)
      .orderBy(desc(internshipRegistrations.createdAt))
      .limit(limit)
      .offset(offset),

    db
      .select({ count: sql<number>`count(*)` })
      .from(internshipRegistrations)
      .where(whereClause),
  ]);

  const total = Number(countResult[0]?.count ?? 0);

  return {
    success: true,
    data: rows,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

/* =========================================================
   GET ONE REGISTRATION (with full details)
========================================================= */

export async function getMyRegistrationDetail(id: string) {
  const session = await getSession();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  const userId = (session.user as { id?: string }).id;
  if (!userId) return { success: false, error: "Unauthorized" };

  const [row] = await db
    .select({
      id: internshipRegistrations.id,
      userId: internshipRegistrations.userId,
      internshipId: internshipRegistrations.internshipId,
      university: internshipRegistrations.university,
      collegeName: internshipRegistrations.collegeName,
      branch: internshipRegistrations.branch,
      degree: internshipRegistrations.degree,
      academicYear: internshipRegistrations.academicYear,
      semester: internshipRegistrations.semester,
      passingYear: internshipRegistrations.passingYear,
      address: internshipRegistrations.address,
      aboutUser: internshipRegistrations.aboutUser,
      status: internshipRegistrations.status,
      registeredAt: internshipRegistrations.registeredAt,
      completedAt: internshipRegistrations.completedAt,
      createdAt: internshipRegistrations.createdAt,
      updatedAt: internshipRegistrations.updatedAt,

      internshipName: internships.name,
      internshipDescription: internships.description,
      internshipImage: internships.image,
      internshipSkills: internships.skills,
      internshipQualifications: internships.qualifications,
      internshipDuration: internships.duration,
      internshipMode: internships.mode,
      internshipLocation: internships.location,
    })
    .from(internshipRegistrations)
    .leftJoin(
      internships,
      eq(internshipRegistrations.internshipId, internships.id)
    )
    .where(
      and(
        eq(internshipRegistrations.id, id),
        eq(internshipRegistrations.userId, userId)
      )
    )
    .limit(1);

  if (!row) return { success: false, error: "Not found" };
  return { success: true, data: row };
}