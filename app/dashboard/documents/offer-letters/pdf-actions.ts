"use server";

import { db } from "@/db";
import {
  offerLetters,
  internships,
  users,
  internshipRegistrations,
} from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getSession } from "@/auth";
import type { InternshipOfferLetterData } from "@/docs/InternshipOfferLetterPDF";

/* =========================================================
   GET OFFER LETTER DATA FOR PDF
   (ownership enforced — user ko sirf apna mil sakta hai)
========================================================= */

export async function getOfferLetterPDFData(
  offerLetterId: string
): Promise<
  | { success: true; data: InternshipOfferLetterData }
  | { success: false; error: string }
> {
  const session = await getSession();
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

      userName: users.name,
      userEmail: users.email,
      userPhone: users.phone,

      internshipName: internships.name,
      internshipMode: internships.mode,
      internshipLocation: internships.location,
      internshipDuration: internships.duration,

      university: internshipRegistrations.university,
      collegeName: internshipRegistrations.collegeName,
      degree: internshipRegistrations.degree,
      branch: internshipRegistrations.branch,
      semester: internshipRegistrations.semester,
      academicYear: internshipRegistrations.academicYear,
      address: internshipRegistrations.address,
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
        eq(offerLetters.id, offerLetterId),
        eq(offerLetters.userId, userId)
      )
    )
    .limit(1);

  if (!row) return { success: false, error: "Offer letter not found" };
  if (row.status === "draft")
    return { success: false, error: "Not available" };

  /* ---------- helpers ---------- */
  const fmtDate = (d: Date | null) =>
    d
      ? d.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })
      : "";

  const stipendNumber = row.stipend ? Number(row.stipend) : undefined;
  const isPaid = row.documentType === "paid";

  const termsList = row.terms
    ? row.terms
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .map((l) => l.replace(/^\d+\.\s*/, "").trim())
    : [];

  /* ---------- build PDF data ---------- */
 const pdfData: InternshipOfferLetterData = {
  offerLetterId: row.offerNumber,
  issueDate: fmtDate(row.issueDate),

  companyName: "SQROCK IT Solutions",
  companyLegalName: "SQROCK IT Solutions",
  companyWebsite: "https://www.sqrock.cloud",
  companyLogo:"/logo.png",
  companyEmail: "support@sqrock.cloud",
  companyAddress: "Jaipur",
  companyCity: "Jaipur",
  companyState: "Rajasthan",
  companyCountry: "India",
  companyPostalCode: "302001",

  name: row.userName ?? "",
  employeeEmail: row.userEmail ?? "",
  phone: row.userPhone ?? undefined,

  collegeName: row.collegeName ?? undefined,
  universityName: row.university ?? undefined,
  course: row.degree ?? undefined,
  branch: row.branch ?? undefined,
  semester: row.semester ? String(row.semester) : undefined,

  designation: row.position,
  department: row.department ?? undefined,
  mode: (row.internshipMode as "remote" | "hybrid" | "onsite") ?? "remote",
  internshipLocation: row.internshipLocation ?? undefined,
  startDate: fmtDate(row.startDate),
  endDate: fmtDate(row.endDate),
  duration: row.internshipDuration ?? undefined,

  isPaid,
  stipend: isPaid ? stipendNumber : undefined,
  currency: row.stipendCurrency ?? "INR",
  paymentFrequency: "monthly",

  workingHours: "9:00 AM - 6:00 PM",
  workingDays: {
    sunday: false,
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: false,
  },

  responsibilities: [
    "Complete assigned tasks and projects within the specified deadlines.",
    "Collaborate with team members and actively participate in meetings and discussions.",
    "Maintain regular communication with the reporting manager and provide progress updates.",
    "Follow SQROCK IT Solutions policies, procedures, and professional code of conduct.",
  ],

  confidentialityRequired: true,
  codeOfConduct:
    "Maintain professional behavior, protect confidential company information, and comply with the policies and guidelines of SQROCK IT Solutions.",

  noticePeriod: "15 days",
  terminationPolicy:
    "SQROCK IT Solutions reserves the right to terminate the internship in cases of misconduct, violation of company policies, or unsatisfactory performance.",

  termsAndConditions: termsList,

  completionCriteria:
    "Successful completion of assigned internship tasks, projects, and the final performance evaluation.",

  certificateEligibility:
    "An internship completion certificate will be issued by SQROCK IT Solutions upon successful completion of the internship and fulfillment of the required criteria.",

  authorizedPersonName: "Authorized Signatory",
  authorizedPersonDesignation: "Director",
  hrName: "HR Team",
  hrDesignation: "Human Resources",
  hrEmail: "support@sqrock.cloud",

  acceptanceRequired: true,
};

  return { success: true, data: pdfData };
}