import { auth } from "@/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { exams, examQuestions, examSubmissions, examSubmissionAnswers, internshipRegistrations } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { successResponse, errorResponse, handleApiError, unauthorizedResponse, notFoundResponse, validateBody } from "@/lib/mobile";
import { examSubmitSchema } from "@/lib/mobile/validation";

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return unauthorizedResponse();

    const data = await validateBody(examSubmitSchema)(request);

    const url = new URL(request.url);
    const pathParts = url.pathname.split("/");
    const examId = pathParts[pathParts.length - 2];

    const exam = await db.select().from(exams).where(eq(exams.id, examId)).limit(1);
    if (!exam[0]) return notFoundResponse("Exam not found");

    const questions = await db.select().from(examQuestions).where(eq(examQuestions.examId, examId));

    const reg = await db.select().from(internshipRegistrations).where(and(eq(internshipRegistrations.userId, session.user.id), eq(internshipRegistrations.internshipId, exam[0].internshipId))).limit(1);
    if (!reg[0]) return errorResponse("Not registered for this internship", 400);

    const existingSubmissions = await db.select().from(examSubmissions).where(and(eq(examSubmissions.examId, examId), eq(examSubmissions.userId, session.user.id))).orderBy(desc(examSubmissions.attemptNumber)).limit(1);
    const attemptNumber = (existingSubmissions[0]?.attemptNumber || 0) + 1;
    if (attemptNumber > exam[0].maxAttempts) return errorResponse("Maximum attempts reached", 400);

    const questionMap = new Map(questions.map(q => [q.id, q]));
    let score = 0;
    let totalScore = 0;

    const answers = data.answers.map(a => {
      const q = questionMap.get(a.questionId);
      if (!q) return { ...a, isCorrect: false, marksObtained: 0 };
      const isCorrect = q.correctOption === a.selectedOption;
      const marksObtained = isCorrect ? q.marks : 0;
      score += marksObtained;
      totalScore += q.marks;
      return { ...a, isCorrect, marksObtained };
    });

    const percentage = totalScore > 0 ? (score / totalScore) * 100 : 0;
    const passed = percentage >= exam[0].passingScore;

    const [submission] = await db.insert(examSubmissions).values({
      examId,
      userId: session.user.id,
      attemptNumber,
      status: "submitted",
      submittedAt: new Date(),
      score,
      totalScore,
      percentage: percentage.toFixed(2),
      passed,
      timeTaken: 0, // Would need client to send this
    }).returning();

    await db.insert(examSubmissionAnswers).values(
      answers.map(a => ({
        submissionId: submission.id,
        questionId: a.questionId,
        selectedOption: a.selectedOption,
        isCorrect: a.isCorrect,
        marksObtained: a.marksObtained,
      }))
    );

    // If end exam passed, unlock projects
    if (exam[0].type === "end" && passed) {
      // Projects will be unlocked automatically based on exam submission status
    }

    return successResponse({
      submission: { ...submission, percentage: submission.percentage?.toString() || "0" },
      answers,
      passed,
      score,
      totalScore,
      percentage,
    });
  } catch (error) {
    return handleApiError(error);
  }
}