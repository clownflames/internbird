"use server";

import { db } from "@/db";
import {
  certificates,
  internshipRegistrations,
  internships,
  offerLetters,
  users,
} from "@/db/schema";
import { eq, desc, ilike, or, and, sql, ne, notInArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import crypto from "crypto";

/* =========================================================
   VALIDATION
========================================================= */

const certificateSchema = z.object({
  registrationId: z.string().uuid("Please select a student"),
  position: z.string().min(2, "Position is required"),
  department: z.string().optional().nullable(),
  documentType: z.enum(["paid", "unpaid"]).default("unpaid"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional().nullable(),
  grade: z.string().optional().nullable(),
  score: z
    .union([z.string(), z.number()])
    .optional()
    .nullable()
    .transform((v) =>
      v === "" || v === null || v === undefined ? null : String(v)
    ),
  skills: z.array(z.string()).default([]),
  description: z.string().optional().nullable(),
  status: z
    .enum(["draft", "issued", "revoked"])
    .default("issued"),
});

export type CertificateInput = z.infer<typeof certificateSchema>;

/* =========================================================
   GET CERTIFICATES (list)
========================================================= */

export async function getCertificates({
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
        ilike(certificates.certificateNumber, `%${search}%`),
        ilike(certificates.studentName, `%${search}%`),
        ilike(users.email, `%${search}%`),
        ilike(certificates.title, `%${search}%`)
      )
    );
  }
  if (status && status !== "all") {
    filters.push(
      eq(
        certificates.status,
        status as "draft" | "issued" | "revoked"
      )
    );
  }
  if (documentType && documentType !== "all") {
    filters.push(
      eq(certificates.documentType, documentType as "paid" | "unpaid")
    );
  }
  const whereClause = filters.length ? and(...filters) : undefined;

  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: certificates.id,
        userId: certificates.userId,
        internshipId: certificates.internshipId,
        registrationId: certificates.registrationId,
        certificateNumber: certificates.certificateNumber,
        title: certificates.title,
        studentName: certificates.studentName,
        internshipName: certificates.internshipName,
        position: certificates.position,
        documentType: certificates.documentType,
        startDate: certificates.startDate,
        endDate: certificates.endDate,
        issueDate: certificates.issueDate,
        skills: certificates.skills,
        grade: certificates.grade,
        score: certificates.score,
        description: certificates.description,
        verificationCode: certificates.verificationCode,
        status: certificates.status,
        createdAt: certificates.createdAt,
        updatedAt: certificates.updatedAt,
        userName: users.name,
        userEmail: users.email,
        internshipMode: internships.mode,
        internshipDuration: internships.duration,
      })
      .from(certificates)
      .leftJoin(users, eq(certificates.userId, users.id))
      .leftJoin(
        internships,
        eq(certificates.internshipId, internships.id)
      )
      .where(whereClause)
      .orderBy(desc(certificates.createdAt))
      .limit(limit)
      .offset(offset),

    db
      .select({ count: sql<number>`count(*)` })
      .from(certificates)
      .leftJoin(users, eq(certificates.userId, users.id))
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
   SEARCH REGISTRATIONS (only those without certificates)
========================================================= */

export async function searchRegistrations(query: string, limit = 20) {
  const q = `%${query.trim()}%`;

  const existing = await db
    .select({ registrationId: certificates.registrationId })
    .from(certificates);

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
   GET SINGLE
========================================================= */

export async function getCertificate(id: string) {
  const [row] = await db
    .select()
    .from(certificates)
    .where(eq(certificates.id, id))
    .limit(1);
  return row ?? null;
}

/* =========================================================
   CREATE
========================================================= */

export async function createCertificate(input: CertificateInput) {
  try {
    const parsed = certificateSchema.parse(input);

    const [reg] = await db
      .select()
      .from(internshipRegistrations)
      .where(eq(internshipRegistrations.id, parsed.registrationId))
      .limit(1);

    if (!reg) return { success: false, error: "Registration not found" };

    const [user] = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, reg.userId))
      .limit(1);

    const [internship] = await db
      .select({ name: internships.name })
      .from(internships)
      .where(eq(internships.id, reg.internshipId))
      .limit(1);

    // auto-generate certificate number
    const certificateNumber = await generateCertificateNumber();

    // auto-generate verification code
    const verificationCode = crypto
      .randomBytes(8)
      .toString("hex")
      .toUpperCase();

    const defaultDescription = parsed.description?.trim()
      ? parsed.description
      : `This is to certify that ${user?.name ?? "the intern"} has successfully completed an internship with the organization as a ${parsed.position}${parsed.department ? ` in the ${parsed.department} department` : ""}. During the internship, the intern demonstrated professionalism, dedication, and satisfactory performance in assigned responsibilities.`;

    const [created] = await db
      .insert(certificates)
      .values({
        userId: reg.userId,
        internshipId: reg.internshipId,
        registrationId: reg.id,

        certificateNumber,
        title: "Certificate of Internship Completion",
        studentName: user?.name ?? "Intern",
        internshipName: internship?.name ?? "Internship",
        position: parsed.position,
        documentType: parsed.documentType,

        startDate: new Date(parsed.startDate),
        endDate: parsed.endDate ? new Date(parsed.endDate) : null,
        issueDate: new Date(),

        skills: parsed.skills,
        grade: parsed.grade ?? null,
        score: parsed.score,
        description: defaultDescription,

        verificationCode,
        status: parsed.status,
      })
      .returning();

    revalidatePath("/admin/certificates");
    return { success: true, data: created };
  } catch (error) {
    console.error("createCertificate error:", error);
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
        error: "This student already has a certificate",
      };
    }
    return { success: false, error: "Failed to create certificate" };
  }
}

/* =========================================================
   UPDATE
========================================================= */

export async function updateCertificate(
  id: string,
  input: CertificateInput
) {
  try {
    const parsed = certificateSchema.parse(input);

    const [updated] = await db
      .update(certificates)
      .set({
        position: parsed.position,
        documentType: parsed.documentType,
        startDate: new Date(parsed.startDate),
        endDate: parsed.endDate ? new Date(parsed.endDate) : null,
        skills: parsed.skills,
        grade: parsed.grade ?? null,
        score: parsed.score,
        description: parsed.description ?? null,
        status: parsed.status,
        updatedAt: new Date(),
      })
      .where(eq(certificates.id, id))
      .returning();

    revalidatePath("/admin/certificates");
    return { success: true, data: updated };
  } catch (error) {
    console.error("updateCertificate error:", error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message ?? "Validation failed",
      };
    }
    return { success: false, error: "Failed to update certificate" };
  }
}

/* =========================================================
   DELETE
========================================================= */

export async function deleteCertificate(id: string) {
  try {
    await db.delete(certificates).where(eq(certificates.id, id));
    revalidatePath("/admin/certificates");
    return { success: true };
  } catch (error) {
    console.error("deleteCertificate error:", error);
    return { success: false, error: "Failed to delete certificate" };
  }
}

/* =========================================================
   STATUS CHANGE
========================================================= */

export async function updateCertificateStatus(
  id: string,
  status: "draft" | "issued" | "revoked"
) {
  try {
    await db
      .update(certificates)
      .set({ status, updatedAt: new Date() })
      .where(eq(certificates.id, id));
    revalidatePath("/admin/certificates");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to update status" };
  }
}

/* =========================================================
   AUTO CERTIFICATE NUMBER
========================================================= */

export async function generateCertificateNumber() {
  const year = new Date().getFullYear();
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(certificates)
    .where(
      sql`${certificates.certificateNumber} like ${`CERT-${year}-%`}`
    );

  const next = Number(row?.count ?? 0) + 1;
  return `CERT-${year}-${String(next).padStart(4, "0")}`;
}


/* =========================================================
   SEARCH OFFER LETTERS (only those without a certificate)
   — Certificate sirf un students ko milega jinke paas offer letter hai
========================================================= */

export async function searchOfferLetters(query: string, limit = 20) {
  const q = `%${query.trim()}%`;

  // which registrations already have certificates
  const existing = await db
    .select({ registrationId: certificates.registrationId })
    .from(certificates);

  const takenSet = new Set(existing.map((e) => e.registrationId));

  const rows = await db
    .select({
      // offer letter info
      offerLetterId: offerLetters.id,
      offerNumber: offerLetters.offerNumber,
      offerStatus: offerLetters.status,
      offerPosition: offerLetters.position,
      offerDepartment: offerLetters.department,
      offerDocumentType: offerLetters.documentType,
      offerStartDate: offerLetters.startDate,
      offerEndDate: offerLetters.endDate,

      // registration info
      registrationId: offerLetters.registrationId,
      userId: offerLetters.userId,
      internshipId: offerLetters.internshipId,

      // student
      userName: users.name,
      userEmail: users.email,
      userImage: users.image,

      // internship
      internshipName: internships.name,
      internshipMode: internships.mode,
      internshipLocation: internships.location,
      internshipDuration: internships.duration,

      // registration extras
      university: internshipRegistrations.university,
      collegeName: internshipRegistrations.collegeName,
      degree: internshipRegistrations.degree,
      branch: internshipRegistrations.branch,
      academicYear: internshipRegistrations.academicYear,
    })
    .from(offerLetters)
    .leftJoin(users, eq(offerLetters.userId, users.id))
    .leftJoin(internships, eq(offerLetters.internshipId, internships.id))
    .leftJoin(
      internshipRegistrations,
      eq(offerLetters.registrationId, internshipRegistrations.id)
    )
    .where(
      and(
        // ✅ only issued/accepted offers
        notInArray(offerLetters.status, ["draft", "revoked"]),
        query.trim()
          ? or(
              ilike(users.name, q),
              ilike(users.email, q),
              ilike(internships.name, q),
              ilike(offerLetters.offerNumber, q)
            )
          : undefined
      )
    )
    .orderBy(desc(offerLetters.issueDate))
    .limit(limit * 2);

  // hide ones that already have certificates
  return rows.filter((r) => !takenSet.has(r.registrationId)).slice(0, limit);
}