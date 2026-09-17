"use server";

import { db } from "@/db";
import { internshipRegistrations, users, internships } from "@/db/schema";
import { eq, desc, ilike, or, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

/* =========================================================
   VALIDATION
========================================================= */

const registrationSchema = z.object({
  userId: z.string().uuid("Please select a user"),
  internshipId: z.string().uuid("Please select an internship"),
  university: z.string().min(2, "University is required"),
  collegeName: z.string().min(2, "College name is required"),
  branch: z.string().min(1, "Branch is required"),
  degree: z.string().min(1, "Degree is required"),
  academicYear: z.string().optional().nullable(),
  semester: z
    .union([z.string(), z.number()])
    .optional()
    .nullable()
    .transform((v) =>
      v === "" || v === null || v === undefined ? null : Number(v)
    ),
  passingYear: z
    .union([z.string(), z.number()])
    .optional()
    .nullable()
    .transform((v) =>
      v === "" || v === null || v === undefined ? null : Number(v)
    ),
  address: z.string().optional().nullable(),
  aboutUser: z.string().optional().nullable(),
  status: z
    .enum(["pending", "active", "completed", "cancelled", "rejected"])
    .default("pending"),
});

export type RegistrationInput = z.infer<typeof registrationSchema>;

/* =========================================================
   GET REGISTRATIONS
========================================================= */

export async function getRegistrations({
  search = "",
  status = "",
  internshipId = "",
  page = 1,
  limit = 10,
}: {
  search?: string;
  status?: string;
  internshipId?: string;
  page?: number;
  limit?: number;
} = {}) {
  const offset = (page - 1) * limit;

  const filters = [];
  if (search) {
    filters.push(
      or(
        ilike(users.name, `%${search}%`),
        ilike(users.email, `%${search}%`),
        ilike(internshipRegistrations.university, `%${search}%`),
        ilike(internshipRegistrations.collegeName, `%${search}%`),
        ilike(internshipRegistrations.branch, `%${search}%`),
        ilike(internshipRegistrations.degree, `%${search}%`)
      )
    );
  }
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
  if (internshipId && internshipId !== "all") {
    filters.push(eq(internshipRegistrations.internshipId, internshipId));
  }
  const whereClause = filters.length ? and(...filters) : undefined;

  const [rows, countResult] = await Promise.all([
    db
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
        userName: users.name,
        userEmail: users.email,
        userPhone: users.phone,
        internshipName: internships.name,
      })
      .from(internshipRegistrations)
      .leftJoin(users, eq(internshipRegistrations.userId, users.id))
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
      .leftJoin(users, eq(internshipRegistrations.userId, users.id))
      .where(whereClause),
  ]);

  const total = Number(countResult[0]?.count ?? 0);

  return {
    data: rows,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

/* =========================================================
   USER + INTERNSHIP OPTIONS
========================================================= */

export async function getUserOptions() {
  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
    })
    .from(users)
    .orderBy(desc(users.createdAt));
}

export async function getInternshipOptions() {
  return db
    .select({ id: internships.id, name: internships.name })
    .from(internships)
    .orderBy(desc(internships.createdAt));
}

/* =========================================================
   GET SINGLE
========================================================= */

export async function getRegistration(id: string) {
  const [row] = await db
    .select()
    .from(internshipRegistrations)
    .where(eq(internshipRegistrations.id, id))
    .limit(1);
  return row ?? null;
}

/* =========================================================
   CREATE
========================================================= */

export async function createRegistration(input: RegistrationInput) {
  try {
    const parsed = registrationSchema.parse(input);

    const [created] = await db
      .insert(internshipRegistrations)
      .values({
        userId: parsed.userId,
        internshipId: parsed.internshipId,
        university: parsed.university,
        collegeName: parsed.collegeName,
        branch: parsed.branch,
        degree: parsed.degree,
        academicYear: parsed.academicYear ?? null,
        semester: parsed.semester,
        passingYear: parsed.passingYear,
        address: parsed.address ?? null,
        aboutUser: parsed.aboutUser ?? null,
        status: parsed.status,
      })
      .returning();

    revalidatePath("/admin/registrations");
    return { success: true, data: created };
  } catch (error) {
    console.error("createRegistration error:", error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message ?? "Validation failed",
      };
    }
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "23505"
    ) {
      return {
        success: false,
        error: "This user is already registered for this internship",
      };
    }
    return { success: false, error: "Failed to create registration" };
  }
}

/* =========================================================
   UPDATE
========================================================= */

export async function updateRegistration(
  id: string,
  input: RegistrationInput
) {
  try {
    const parsed = registrationSchema.parse(input);

    const [updated] = await db
      .update(internshipRegistrations)
      .set({
        userId: parsed.userId,
        internshipId: parsed.internshipId,
        university: parsed.university,
        collegeName: parsed.collegeName,
        branch: parsed.branch,
        degree: parsed.degree,
        academicYear: parsed.academicYear ?? null,
        semester: parsed.semester,
        passingYear: parsed.passingYear,
        address: parsed.address ?? null,
        aboutUser: parsed.aboutUser ?? null,
        status: parsed.status,
        completedAt:
          parsed.status === "completed" ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(internshipRegistrations.id, id))
      .returning();

    revalidatePath("/admin/registrations");
    return { success: true, data: updated };
  } catch (error) {
    console.error("updateRegistration error:", error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message ?? "Validation failed",
      };
    }
    return { success: false, error: "Failed to update registration" };
  }
}

/* =========================================================
   DELETE
========================================================= */

export async function deleteRegistration(id: string) {
  try {
    await db
      .delete(internshipRegistrations)
      .where(eq(internshipRegistrations.id, id));
    revalidatePath("/admin/registrations");
    return { success: true };
  } catch (error) {
    console.error("deleteRegistration error:", error);
    return { success: false, error: "Failed to delete registration" };
  }
}

/* =========================================================
   UPDATE STATUS
========================================================= */

export async function updateRegistrationStatus(
  id: string,
  status: "pending" | "active" | "completed" | "cancelled" | "rejected"
) {
  try {
    await db
      .update(internshipRegistrations)
      .set({
        status,
        completedAt: status === "completed" ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(internshipRegistrations.id, id));
    revalidatePath("/admin/registrations");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to update status" };
  }
}