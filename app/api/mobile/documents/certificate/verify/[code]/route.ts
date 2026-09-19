import { auth } from "@/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { certificates } from "@/db/schema";
import { eq } from "drizzle-orm";
import { successResponse, errorResponse, handleApiError, notFoundResponse } from "@/lib/mobile";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split("/");
    const code = pathParts[pathParts.length - 2];

    const cert = await db.select().from(certificates).where(eq(certificates.verificationCode, code)).limit(1);
    if (!cert[0]) return notFoundResponse("Invalid verification code");

    return successResponse({
      valid: true,
      certificateNumber: cert[0].certificateNumber,
      studentName: cert[0].studentName,
      internshipName: cert[0].internshipName,
      position: cert[0].position,
      startDate: cert[0].startDate,
      endDate: cert[0].endDate,
      issueDate: cert[0].issueDate,
      skills: cert[0].skills,
      grade: cert[0].grade,
    });
  } catch (error) {
    return handleApiError(error);
  }
}