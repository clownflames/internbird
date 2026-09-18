"use server";

import { db } from "@/db";
import {
  offerLetters,
  internshipRegistrations,
  internships,
  users,
} from "@/db/schema";
import { eq, desc, ilike, or, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

/* =========================================================
   VALIDATION — minimal form
========================================================= */

const offerLetterSchema = z.object({
  registrationId: z.string().uuid("Please select a student"),
  position: z.string().min(2, "Position is required"),
  department: z.string().optional().nullable(),
  documentType: z.enum(["paid", "unpaid"]).default("unpaid"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional().nullable(),
  stipend: z
    .union([z.string(), z.number()])
    .optional()
    .nullable()
    .transform((v) =>
      v === "" || v === null || v === undefined ? null : String(v)
    ),
  stipendCurrency: z.string().default("INR"),
  terms: z.string().optional().nullable(),
});

export type OfferLetterInput = z.infer<typeof offerLetterSchema>;

/* =========================================================
   GET OFFER LETTERS (list)
========================================================= */

export async function getOfferLetters({
  search = "",
  status = "",
  documentType = "",
  page = 1,
  limit = 10,
}: {
  search?: string;
  status?: string;
  documentType?: string;
  page?: number;
  limit?: number;
} = {}) {
  const offset = (page - 1) * limit;

  const filters = [];
  if (search) {
    filters.push(
      or(
        ilike(offerLetters.offerNumber, `%${search}%`),
        ilike(offerLetters.position, `%${search}%`),
        ilike(users.name, `%${search}%`),
        ilike(users.email, `%${search}%`)
      )
    );
  }
  if (status && status !== "all") {
    filters.push(
      eq(
        offerLetters.status,
        status as "draft" | "issued" | "accepted" | "rejected" | "revoked"
      )
    );
  }
  if (documentType && documentType !== "all") {
    filters.push(
      eq(offerLetters.documentType, documentType as "paid" | "unpaid")
    );
  }
  const whereClause = filters.length ? and(...filters) : undefined;

  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: offerLetters.id,
        userId: offerLetters.userId,
        internshipId: offerLetters.internshipId,
        registrationId: offerLetters.registrationId,
        offerNumber: offerLetters.offerNumber,
        position: offerLetters.position,
        department: offerLetters.department,
        documentType: offerLetters.documentType,
        startDate: offerLetters.startDate,
        endDate: offerLetters.endDate,
        issueDate: offerLetters.issueDate,
        stipend: offerLetters.stipend,
        stipendCurrency: offerLetters.stipendCurrency,
        terms: offerLetters.terms,
        status: offerLetters.status,
        createdAt: offerLetters.createdAt,
        updatedAt: offerLetters.updatedAt,
        userName: users.name,
        userEmail: users.email,
        internshipName: internships.name,
      })
      .from(offerLetters)
      .leftJoin(users, eq(offerLetters.userId, users.id))
      .leftJoin(internships, eq(offerLetters.internshipId, internships.id))
      .where(whereClause)
      .orderBy(desc(offerLetters.createdAt))
      .limit(limit)
      .offset(offset),

    db
      .select({ count: sql<number>`count(*)` })
      .from(offerLetters)
      .leftJoin(users, eq(offerLetters.userId, users.id))
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
   🔍 SEARCH REGISTRATIONS (for student search box)
   — only those without an offer letter yet
========================================================= */

export async function searchRegistrations(query: string, limit = 20) {
  const q = `%${query.trim()}%`;

  // which registrations already have offer letters
  const existing = await db
    .select({ registrationId: offerLetters.registrationId })
    .from(offerLetters);

  const takenSet = new Set(existing.map((e) => e.registrationId));

  const rows = await db
    .select({
      id: internshipRegistrations.id,
      userId: internshipRegistrations.userId,
      internshipId: internshipRegistrations.internshipId,
      userName: users.name,
      userEmail: users.email,
      userImage: users.image,
      internshipName: internships.name,
      internshipMode: internships.mode,
      internshipLocation: internships.location,
      internshipDuration: internships.duration,
      university: internshipRegistrations.university,
      collegeName: internshipRegistrations.collegeName,
      degree: internshipRegistrations.degree,
      branch: internshipRegistrations.branch,
      academicYear: internshipRegistrations.academicYear,
      status: internshipRegistrations.status,
    })
    .from(internshipRegistrations)
    .leftJoin(users, eq(internshipRegistrations.userId, users.id))
    .leftJoin(
      internships,
      eq(internshipRegistrations.internshipId, internships.id)
    )
    .where(
      query.trim()
        ? or(
            ilike(users.name, q),
            ilike(users.email, q),
            ilike(internships.name, q)
          )
        : undefined
    )
    .orderBy(desc(internshipRegistrations.createdAt))
    .limit(limit * 2);

  return rows.filter((r) => !takenSet.has(r.id)).slice(0, limit);
}

/* =========================================================
   GET SINGLE REGISTRATION DETAILS
========================================================= */

export async function getRegistrationById(registrationId: string) {
  const [row] = await db
    .select({
      id: internshipRegistrations.id,
      userId: internshipRegistrations.userId,
      internshipId: internshipRegistrations.internshipId,
      userName: users.name,
      userEmail: users.email,
      userImage: users.image,
      internshipName: internships.name,
      internshipMode: internships.mode,
      internshipLocation: internships.location,
      internshipDuration: internships.duration,
      university: internshipRegistrations.university,
      collegeName: internshipRegistrations.collegeName,
      degree: internshipRegistrations.degree,
      branch: internshipRegistrations.branch,
      academicYear: internshipRegistrations.academicYear,
    })
    .from(internshipRegistrations)
    .leftJoin(users, eq(internshipRegistrations.userId, users.id))
    .leftJoin(
      internships,
      eq(internshipRegistrations.internshipId, internships.id)
    )
    .where(eq(internshipRegistrations.id, registrationId))
    .limit(1);

  return row ?? null;
}

/* =========================================================
   GET FULL DETAILS (for PDF)
========================================================= */

export async function getOfferLetterDetails(id: string) {
  const [row] = await db
    .select({
      id: offerLetters.id,
      offerNumber: offerLetters.offerNumber,
      position: offerLetters.position,
      department: offerLetters.department,
      documentType: offerLetters.documentType,
      startDate: offerLetters.startDate,
      endDate: offerLetters.endDate,
      issueDate: offerLetters.issueDate,
      stipend: offerLetters.stipend,
      stipendCurrency: offerLetters.stipendCurrency,
      terms: offerLetters.terms,
      status: offerLetters.status,

      userName: users.name,
      userEmail: users.email,
      userImage: users.image,

      internshipName: internships.name,
      internshipMode: internships.mode,
      internshipLocation: internships.location,
      internshipDuration: internships.duration,

      university: internshipRegistrations.university,
      collegeName: internshipRegistrations.collegeName,
      degree: internshipRegistrations.degree,
      branch: internshipRegistrations.branch,
    })
    .from(offerLetters)
    .leftJoin(users, eq(offerLetters.userId, users.id))
    .leftJoin(internships, eq(offerLetters.internshipId, internships.id))
    .leftJoin(
      internshipRegistrations,
      eq(offerLetters.registrationId, internshipRegistrations.id)
    )
    .where(eq(offerLetters.id, id))
    .limit(1);

  return row ?? null;
}

/* =========================================================
   CREATE — minimal input, everything else auto
========================================================= */

export async function createOfferLetter(input: OfferLetterInput) {
  try {
    const parsed = offerLetterSchema.parse(input);

    // 1. fetch registration
    const [reg] = await db
      .select()
      .from(internshipRegistrations)
      .where(eq(internshipRegistrations.id, parsed.registrationId))
      .limit(1);

    if (!reg) return { success: false, error: "Registration not found" };

    // 2. auto-generate offer number
    const offerNumber = await generateOfferNumber();

    // 3. auto default terms
    const defaultTerms =
      parsed.terms?.trim() ||
      `This offer is subject to the following terms:
1. The intern must maintain professional conduct throughout the internship.
2. Regular attendance and timely submission of assigned tasks is expected.
3. The intern agrees to follow all company policies and confidentiality guidelines.
4. Either party may terminate this offer with prior written notice.
5. Upon successful completion, a certificate will be issued.`;

    // 4. insert
    const [created] = await db
      .insert(offerLetters)
      .values({
        userId: reg.userId,
        internshipId: reg.internshipId,
        registrationId: reg.id,
        offerNumber,
        position: parsed.position,
        department: parsed.department ?? null,
        documentType: parsed.documentType,
        startDate: new Date(parsed.startDate),
        endDate: parsed.endDate ? new Date(parsed.endDate) : null,
        issueDate: new Date(),
        stipend: parsed.documentType === "paid" ? parsed.stipend : null,
        stipendCurrency: parsed.stipendCurrency || "INR",
        terms: defaultTerms,
        status: "issued",
      })
      .returning();

    revalidatePath("/admin/offer-letters");
    return { success: true, data: created };
  } catch (error) {
    console.error("createOfferLetter error:", error);
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
        error: "This student already has an offer letter",
      };
    }
    return { success: false, error: "Failed to create offer letter" };
  }
}

/* =========================================================
   UPDATE — for editing after creation
========================================================= */

export async function updateOfferLetter(id: string, input: OfferLetterInput) {
  try {
    const parsed = offerLetterSchema.parse(input);

    const [updated] = await db
      .update(offerLetters)
      .set({
        position: parsed.position,
        department: parsed.department ?? null,
        documentType: parsed.documentType,
        startDate: new Date(parsed.startDate),
        endDate: parsed.endDate ? new Date(parsed.endDate) : null,
        stipend: parsed.documentType === "paid" ? parsed.stipend : null,
        stipendCurrency: parsed.stipendCurrency || "INR",
        terms: parsed.terms ?? null,
        updatedAt: new Date(),
      })
      .where(eq(offerLetters.id, id))
      .returning();

    revalidatePath("/admin/offer-letters");
    return { success: true, data: updated };
  } catch (error) {
    console.error("updateOfferLetter error:", error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message ?? "Validation failed",
      };
    }
    return { success: false, error: "Failed to update offer letter" };
  }
}

/* =========================================================
   DELETE
========================================================= */

export async function deleteOfferLetter(id: string) {
  try {
    await db.delete(offerLetters).where(eq(offerLetters.id, id));
    revalidatePath("/admin/offer-letters");
    return { success: true };
  } catch (error) {
    console.error("deleteOfferLetter error:", error);
    return { success: false, error: "Failed to delete offer letter" };
  }
}

/* =========================================================
   STATUS CHANGE
========================================================= */

export async function updateOfferLetterStatus(
  id: string,
  status: "draft" | "issued" | "accepted" | "rejected" | "revoked"
) {
  try {
    await db
      .update(offerLetters)
      .set({ status, updatedAt: new Date() })
      .where(eq(offerLetters.id, id));
    revalidatePath("/admin/offer-letters");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to update status" };
  }
}

/* =========================================================
   AUTO OFFER NUMBER
========================================================= */

export async function generateOfferNumber() {
  const year = new Date().getFullYear();
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(offerLetters)
    .where(sql`${offerLetters.offerNumber} like ${`OL-${year}-%`}`);

  const next = Number(row?.count ?? 0) + 1;
  return `OL-${year}-${String(next).padStart(4, "0")}`;
}