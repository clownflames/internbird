import { auth } from "@/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { exams, examQuestions, examSubmissions, examSubmissionAnswers, internshipRegistrations } from "@/db/schema";
import { eq, and, asc, desc } from "drizzle-orm";
import { successResponse, errorResponse, handleApiError, unauthorizedResponse, notFoundResponse, validateBody } from "@/lib/mobile";
import { examSubmitSchema } from "@/lib/mobile/validation";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return unauthorizedResponse();

    const url = new URL(request.url);
    const pathParts = url.pathname.split("/");
    const id = pathParts[pathParts.length - 2];

    const exam = await db.select().from(exams).where(eq(exams.id, id)).limit(1);
    if (!exam[0]) return notFoundResponse("Exam not found");

    const questions = await db.select({
      id: examQuestions.id,
      question: examQuestions.question,
      options: examQuestions.options,
      marks: examQuestions.marks,
      order: examQuestions.order,
    }).from(examQuestions).where(eq(examQuestions.examId, id)).orderBy(asc(examQuestions.order));

    let attemptNumber = 1;
    let existingSubmission = null;
    const reg = await db.select().from(internshipRegistrations).where(and(eq(internshipRegistrations.userId, session.user.id), eq(internshipRegistrations.internshipId, exam[0].internshipId))).limit(1);
    if (reg[0]) {
      const submissions = await db.select().from(examSubmissions).where(and(eq(examSubmissions.examId, id), eq(examSubmissions.userId, session.user.id))).orderBy(desc(examSubmissions.attemptNumber)).limit(1);
      if (submissions[0]) {
        attemptNumber = submissions[0].attemptNumber + 1;
        if (attemptNumber > exam[0].maxAttempts) {
          return errorResponse("Maximum attempts reached", 400);
        }
        existingSubmission = submissions[0];
      }
    }

    return successResponse({
      ...exam[0],
      questions: questions.map(q => ({ ...q, correctOption: undefined })), // hide correct answer
      attemptNumber,
      maxAttempts: exam[0].maxAttempts,
      existingSubmission,
    });
  } catch (error) {
    return handleApiError(error);
  }
}