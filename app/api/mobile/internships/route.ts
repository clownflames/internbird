import { auth } from "@/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { internships, internshipRegistrations } from "@/db/schema";
import { eq, and, or, ilike, desc, asc, count, inArray } from "drizzle-orm";
import { successResponse, errorResponse, handleApiError, unauthorizedResponse } from "@/lib/mobile";
import { internshipFiltersSchema } from "@/lib/mobile/validation";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const userId = session?.user?.id;

    const url = new URL(request.url);
    const params = Object.fromEntries(url.searchParams.entries());
    const validated = internshipFiltersSchema.parse(params);

    const { search, mode, location, pricing, sort, page, limit } = validated;
    const offset = (page - 1) * limit;

    const conditions = [eq(internships.isActive, true)];

    if (search) {
      const searchCondition = or(ilike(internships.name, `%${search}%`), ilike(internships.description, `%${search}%`));
      if (searchCondition) conditions.push(searchCondition);
    }
    if (mode && mode !== "all") conditions.push(eq(internships.mode, mode));
    if (location) conditions.push(ilike(internships.location, `%${location}%`));
    if (pricing && pricing !== "all") conditions.push(eq(internships.pricing, pricing));

    let orderBy = desc(internships.createdAt);
    if (sort === "name") orderBy = asc(internships.name);
    else if (sort === "popular") orderBy = desc(internships.createdAt); // fallback since applicantCount doesn't exist

    const [results, totalResult] = await Promise.all([
      db.select({
        id: internships.id,
        name: internships.name,
        description: internships.description,
        image: internships.image,
        skills: internships.skills,
        qualifications: internships.qualifications,
        duration: internships.duration,
        mode: internships.mode,
        location: internships.location,
        pricing: internships.pricing,
        price: internships.price,
        currency: internships.currency,
        paymentType: internships.paymentType,
        discountPrice: internships.discountPrice,
        pricingNote: internships.pricingNote,
        registrationOpen: internships.registrationOpen,
        createdAt: internships.createdAt,
      })
      .from(internships)
      .where(and(...conditions))
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset),
      db.select({ count: count() }).from(internships).where(and(...conditions)),
    ]);

    let hasRegistered = new Set();
    if (userId && results.length > 0) {
      const regs = await db.select({ internshipId: internshipRegistrations.internshipId, status: internshipRegistrations.status })
        .from(internshipRegistrations)
        .where(and(eq(internshipRegistrations.userId, userId), inArray(internshipRegistrations.internshipId, results.map(r => r.id))));
      regs.forEach(r => hasRegistered.add(r.internshipId));
    }

    const items = results.map(item => ({
      ...item,
      price: item.price?.toString() || null,
      discountPrice: item.discountPrice?.toString() || null,
      hasRegistered: hasRegistered.has(item.id),
    }));

    return successResponse(items, undefined, { page, limit, total: totalResult[0]?.count || 0, totalPages: Math.ceil((totalResult[0]?.count || 0) / limit) });
  } catch (error) {
    return handleApiError(error);
  }
}