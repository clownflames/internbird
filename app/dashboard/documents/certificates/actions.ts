"use server";

import { db } from "@/db";
import { certificates, internships } from "@/db/schema";
import { eq, desc, and, ne } from "drizzle-orm";
import { auth } from "@/auth";

/* =========================================================
   TYPES
========================================================= */

export type MyCertificate = {
  id: string;
  certificateNumber: string;
  title: string;
  studentName: string;
  internshipName: string;
  position: string | null;
  documentType: "paid" | "unpaid";
  startDate: Date | null;
  endDate: Date | null;
  issueDate: Date | null;
  skills: string[];
  grade: string | null;
  score: string | null;
  description: string | null;
  verificationCode: string;
  status: "draft" | "issued" | "revoked";
  createdAt: Date;

  internshipId: string;
  internshipMode: "remote" | "onsite" | "hybrid" | null;
  internshipLocation: string | null;
  internshipDuration: string | null;
};

/* =========================================================
   GET MY CERTIFICATES
   — drafts are hidden from student
========================================================= */

export async function getMyCertificates() {
  const session = await auth();
  if (!session?.user)
    return {
      success: false,
      error: "Unauthorized",
      data: [] as MyCertificate[],
    };

  const userId = (session.user as { id?: string }).id;
  if (!userId)
    return {
      success: false,
      error: "Unauthorized",
      data: [] as MyCertificate[],
    };

  const rows = await db
    .select({
      id: certificates.id,
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

      internshipId: certificates.internshipId,
      internshipMode: internships.mode,
      internshipLocation: internships.location,
      internshipDuration: internships.duration,
    })
    .from(certificates)
    .leftJoin(internships, eq(certificates.internshipId, internships.id))
    .where(
      and(
        eq(certificates.userId, userId),
        // ✅ hide drafts
        ne(certificates.status, "draft")
      )
    )
    .orderBy(desc(certificates.createdAt));

  return { success: true, data: rows as MyCertificate[] };
}

/* =========================================================
   GET ONE CERTIFICATE (ownership enforced)
========================================================= */

export async function getMyCertificateDetail(id: string) {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  const userId = (session.user as { id?: string }).id;
  if (!userId) return { success: false, error: "Unauthorized" };

  const [row] = await db
    .select({
      id: certificates.id,
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

      internshipId: certificates.internshipId,
      internshipMode: internships.mode,
      internshipLocation: internships.location,
      internshipDuration: internships.duration,
    })
    .from(certificates)
    .leftJoin(internships, eq(certificates.internshipId, internships.id))
    .where(
      and(eq(certificates.id, id), eq(certificates.userId, userId))
    )
    .limit(1);

  if (!row) return { success: false, error: "Not found" };
  if (row.status === "draft")
    return { success: false, error: "Not available" };

  return { success: true, data: row as MyCertificate };
}