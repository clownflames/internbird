"use server";

import { db } from "@/db";
import { offerLetters, internships } from "@/db/schema";
import { eq, desc, and, ne } from "drizzle-orm";
import { auth } from "@/auth";

/* =========================================================
   TYPES
========================================================= */

export type MyOfferLetter = {
  id: string;
  offerNumber: string;
  position: string;
  department: string | null;
  documentType: "paid" | "unpaid";
  startDate: Date | null;
  endDate: Date | null;
  issueDate: Date | null;
  stipend: string | null;
  stipendCurrency: string | null;
  terms: string | null;
  status: "draft" | "issued" | "accepted" | "rejected" | "revoked";
  createdAt: Date;

  internshipId: string;
  internshipName: string | null;
  internshipMode: "remote" | "onsite" | "hybrid" | null;
  internshipLocation: string | null;
  internshipDuration: string | null;
};

/* =========================================================
   GET MY OFFER LETTERS
   — drafts are hidden from student
========================================================= */

export async function getMyOfferLetters() {
  const session = await auth();
  if (!session?.user)
    return {
      success: false,
      error: "Unauthorized",
      data: [] as MyOfferLetter[],
    };

  const userId = (session.user as { id?: string }).id;
  if (!userId)
    return {
      success: false,
      error: "Unauthorized",
      data: [] as MyOfferLetter[],
    };

  const rows = await db
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
      createdAt: offerLetters.createdAt,

      internshipId: offerLetters.internshipId,
      internshipName: internships.name,
      internshipMode: internships.mode,
      internshipLocation: internships.location,
      internshipDuration: internships.duration,
    })
    .from(offerLetters)
    .leftJoin(internships, eq(offerLetters.internshipId, internships.id))
    .where(
      and(
        eq(offerLetters.userId, userId),
        // ✅ hide drafts from students
        ne(offerLetters.status, "draft")
      )
    )
    .orderBy(desc(offerLetters.createdAt));

  return { success: true, data: rows as MyOfferLetter[] };
}

/* =========================================================
   GET ONE OFFER LETTER (ownership enforced)
========================================================= */

export async function getMyOfferLetterDetail(id: string) {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  const userId = (session.user as { id?: string }).id;
  if (!userId) return { success: false, error: "Unauthorized" };

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
      createdAt: offerLetters.createdAt,

      internshipId: offerLetters.internshipId,
      internshipName: internships.name,
      internshipMode: internships.mode,
      internshipLocation: internships.location,
      internshipDuration: internships.duration,
    })
    .from(offerLetters)
    .leftJoin(internships, eq(offerLetters.internshipId, internships.id))
    .where(
      and(eq(offerLetters.id, id), eq(offerLetters.userId, userId))
    )
    .limit(1);

  if (!row) return { success: false, error: "Not found" };
  if (row.status === "draft")
    return { success: false, error: "Not available" };

  return { success: true, data: row as MyOfferLetter };
}