import { auth } from "@/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { users, internships, posts } from "@/db/schema";
import { eq, and, or, ilike, desc, count, inArray, sql, ne } from "drizzle-orm";
import { successResponse, errorResponse, handleApiError, unauthorizedResponse } from "@/lib/mobile";
import { searchSchema } from "@/lib/mobile/validation";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const userId = session?.user?.id;

    const url = new URL(request.url);
    const params = Object.fromEntries(url.searchParams.entries());
    const validated = searchSchema.parse(params);

    const { q, type, page, limit } = validated;
    const offset = (page - 1) * limit;

    const results: any = {};

    if (type === "all" || type === "users") {
      const userResults = await db.select({
        id: users.id,
        name: users.name,
        image: users.image,
        headline: users.headline,
        location: users.location,
        followersCount: users.followersCount,
      }).from(users).where(and(
        ne(users.id, userId || ""),
        or(ilike(users.name, `%${q}%`), ilike(users.headline, `%${q}%`), ilike(users.bio, `%${q}%`))
      )).limit(limit).offset(offset);
      results.users = userResults;
    }

    if (type === "all" || type === "internships") {
      const internshipResults = await db.select({
        id: internships.id,
        name: internships.name,
        image: internships.image,
        mode: internships.mode,
        location: internships.location,
        pricing: internships.pricing,
        skills: internships.skills,
      }).from(internships).where(and(
        eq(internships.isActive, true),
        or(ilike(internships.name, `%${q}%`), ilike(internships.description, `%${q}%`))
      )).limit(limit).offset(offset);
      results.internships = internshipResults;
    }

    if (type === "all" || type === "posts") {
      const postResults = await db.select({
        id: posts.id,
        caption: posts.caption,
        media: posts.media,
        mediaType: posts.mediaType,
        createdAt: posts.createdAt,
        user: {
          id: users.id,
          name: users.name,
          image: users.image,
        },
      }).from(posts).innerJoin(users, eq(posts.userId, users.id)).where(and(
        eq(posts.isDeleted, false),
        eq(posts.visibility, "public"),
        ilike(posts.caption, `%${q}%`)
      )).limit(limit).offset(offset);
      results.posts = postResults;
    }

    if (type === "all" || type === "skills") {
      // Aggregate skills from internships
      const skillResults = await db.select({ skills: internships.skills }).from(internships).where(eq(internships.isActive, true));
      const allSkills = skillResults.flatMap(r => r.skills || []);
      const skillCounts = allSkills.reduce((acc, skill) => {
        if (skill.toLowerCase().includes(q.toLowerCase())) {
          acc[skill] = (acc[skill] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);
      results.skills = Object.entries(skillCounts).sort((a, b) => b[1] - a[1]).slice(0, 20).map(([skill, count]) => ({ skill, count }));
    }

    return successResponse(results);
  } catch (error) {
    return handleApiError(error);
  }
}