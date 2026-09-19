import { auth } from "@/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { internships, payments, internshipRegistrations } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { successResponse, errorResponse, handleApiError, unauthorizedResponse, notFoundResponse } from "@/lib/mobile";
import { razorpay } from "@/lib/razorpay";

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return unauthorizedResponse();

    const url = new URL(request.url);
    const pathParts = url.pathname.split("/");
    const internshipId = pathParts[pathParts.length - 3];

    const internship = await db.select().from(internships).where(eq(internships.id, internshipId)).limit(1);
    if (!internship[0]) return notFoundResponse("Internship not found");
    if (internship[0].pricing === "free") return errorResponse("Internship is free", 400);

    const existingReg = await db.select().from(internshipRegistrations).where(and(eq(internshipRegistrations.userId, session.user.id), eq(internshipRegistrations.internshipId, internshipId))).limit(1);
    if (existingReg[0] && existingReg[0].status !== "cancelled") return errorResponse("Already registered", 400);

    const amount = internship[0].discountPrice || internship[0].price;
    if (!amount) return errorResponse("Price not set", 400);

    const order = await razorpay.orders.create({
      amount: Math.round(Number(amount) * 100), // Razorpay expects paise
      currency: internship[0].currency || "INR",
      receipt: `internship_${internshipId}_${session.user.id}_${Date.now()}`,
      notes: { internshipId, userId: session.user.id },
    });

    await db.insert(payments).values({
      userId: session.user.id,
      internshipId,
      provider: "razorpay",
      providerOrderId: order.id,
      amount,
      currency: internship[0].currency || "INR",
      status: "pending",
      description: `Payment for ${internship[0].name}`,
    });

    return successResponse({ orderId: order.id, amount: order.amount, currency: order.currency, keyId: process.env.RAZORPAY_KEY_ID });
  } catch (error) {
    return handleApiError(error);
  }
}