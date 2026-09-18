"use server";

import { db } from "@/db";
import {
  certificates,
  internships,
  users,
  internshipRegistrations,
} from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getSession } from "@/auth";
import type { InternshipCertificateData } from "@/docs/InternshipCertificatePDF";

/* =========================================================
   GET CERTIFICATE DATA FOR PDF
========================================================= */

export async function getCertificatePDFData(
  certificateId: string
): Promise<
  | { success: true; data: InternshipCertificateData }
  | { success: false; error: string }
> {
  const session = await getSession();

  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  const userId = (session.user as { id?: string }).id;

  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

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

      userEmail: users.email,

      internshipMode: internships.mode,
      internshipDuration: internships.duration,

      university: internshipRegistrations.university,
      collegeName: internshipRegistrations.collegeName,
      degree: internshipRegistrations.degree,
      branch: internshipRegistrations.branch,
    })
    .from(certificates)
    .leftJoin(users, eq(certificates.userId, users.id))
    .leftJoin(internships, eq(certificates.internshipId, internships.id))
    .leftJoin(
      internshipRegistrations,
      eq(
        certificates.registrationId,
        internshipRegistrations.id
      )
    )
    .where(
      and(
        eq(certificates.id, certificateId),
        eq(certificates.userId, userId)
      )
    )
    .limit(1);

  if (!row) {
    return {
      success: false,
      error: "Certificate not found",
    };
  }

  if (row.status !== "issued") {
    return {
      success: false,
      error: "Not available",
    };
  }

  /* ---------- helpers ---------- */

  const fmtDate = (d: Date | null) =>
    d
      ? d.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })
      : "";

  /* ---------- SQROCK IT Solutions assets ---------- */

  const companyLogo =
    process.env.COMPANY_LOGO_URL || "/logo.png";

  const companyStamp =
    process.env.COMPANY_STAMP_URL || "/stamp.png";

  const authorizedSignature =
    process.env.COMPANY_SIGNATURE_URL || "/sign.png";

  /* ---------- SQROCK IT Solutions ---------- */

  const companyName = "SQROCK IT Solutions";

  const companyWebsite = "https://www.sqrock.cloud";

  const companyAddress = "Jaipur, Rajasthan, India";

  const companyEmail = "support@sqrock.cloud";

  /* ---------- build PDF data ---------- */

  const pdfData: InternshipCertificateData = {
    certificateId: row.certificateNumber,

    issueDate: fmtDate(row.issueDate),

    companyName,
    companyLogo,

    companyAddress,
    companyWebsite,
    companyEmail,

    companyPhone:
      process.env.COMPANY_PHONE ?? "",

    internName: row.studentName,

    internEmail:
      row.userEmail ?? undefined,

    designation:
      row.position ?? "Intern",

    internshipType: "Internship",

    mode:
      (row.internshipMode as
        | "remote"
        | "hybrid"
        | "onsite") ?? "remote",

    startDate: fmtDate(row.startDate),

    endDate: fmtDate(row.endDate),

    duration:
      row.internshipDuration ?? undefined,

    performanceGrade:
      row.grade ?? undefined,

    skills:
      row.skills ?? [],

    customDescription:
      row.description ?? undefined,

    verificationCode:
      row.verificationCode,

    verificationUrl:
      `${companyWebsite}/verify/${row.verificationCode}`,

    authorizedPersonName:
      "Authorized Signatory",

    authorizedPersonDesignation:
      "Director",

    authorizedSignature,

    companyStamp,

    hrName:
      "HR Team",

    hrDesignation:
      "Human Resources",
  };

  return {
    success: true,
    data: pdfData,
  };
}