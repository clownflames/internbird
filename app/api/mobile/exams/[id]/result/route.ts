import { auth } from "@/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { examSubmissions, examSubmissionAnswers, examQuestions } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { successResponse, errorResponse, handleApiError, unauthorizedResponse, notFoundResponse } from "@/lib/mobile";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return unauthorizedResponse();

    const url = new URL(request.url);
    const pathParts = url.pathname.split("/");
    const examId = pathParts[pathParts.length - 2];

    const submissions = await db.select().from(examSubmissions).where(and(eq(examSubmissions.examId, examId), eq(examSubmissions.userId, session.user.id))).orderBy(desc(examSubmissions.attemptNumber));

    const results = await Promise.all(submissions.map(async (sub) => {
      const answers = await db.select({
        questionId: examSubmissionAnswers.questionId,
        selectedOption: examSubmissionAnswers.selectedOption,
        isCorrect: examSubmissionAnswers.isCorrect,
        marksObtained: examSubmissionAnswers.marksObtained,
        question: examQuestions.question,
        options: examQuestions.options,
        correctOption: examQuestions.correctOption,
        explanation: examQuestions.explanation,
        marks: examQuestions.marks,
      })
      .from(examSubmissionAnswers)
      .innerJoin(examQuestions, eq(examSubmissionAnswers.questionId, examQuestions.id))
      .where(eq(examSubmissionAnswers.submissionId, sub.id));

      return {
        ...sub,
        percentage: sub.percentage?.toString(),
        answers,
      };
    }));

    return successResponse(results);
  } catch (error) {
    return handleApiError(error);
  }
}