"use server";

import { db } from "@/db";
import {
  internships,
  internshipRegistrations,
} from "@/db/schema";
import { getSession } from "@/auth";
import { and, eq, sql } from "drizzle-orm";

/* =========================================================
   TYPES
========================================================= */

export type InternshipDetail = {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  skills: string[];
  qualifications: string[];
  duration: string | null;
  mode: "remote" | "onsite" | "hybrid";
  location: string | null;
  registrationOpen: boolean;
  isActive: boolean;
  createdAt: string;
  applicantCount: number;
  hasRegistered: boolean;
  registrationStatus:
    | "pending"
    | "active"
    | "completed"
    | "cancelled"
    | "rejected"
    | null;
};

/* =========================================================
   HELPER
========================================================= */

async function getCurrentUserId(): Promise<string | null> {
  const session = await getSession();
  return session?.user?.id ?? null;
}

/* =========================================================
   GET INTERNSHIP DETAIL
========================================================= */

export async function getInternshipDetail(
  id: string
): Promise<InternshipDetail | null> {
  const currentUserId = await getCurrentUserId();

  /* ---------- fetch internship + applicant count ---------- */
  const [row] = await db
    .select({
      id: internships.id,
      name: internships.name,
      description: internships.description,
      image: internships.image,
      skills: internships.skills,
      qualifications: internships.qualifications,
      duration: internships.duration,
      mode: internships.mode,
      location: internships.location,
      registrationOpen: internships.registrationOpen,
      isActive: internships.isActive,
      createdAt: internships.createdAt,
      applicantCount: sql<number>`(
        SELECT COUNT(*)::int FROM ${internshipRegistrations}
        WHERE ${internshipRegistrations.internshipId} = ${internships.id}
      )`,
    })
    .from(internships)
    .where(eq(internships.id, id))
    .limit(1);

  if (!row) return null;

  /* ---------- check user registration ---------- */
  let hasRegistered = false;
  let registrationStatus:
    | "pending"
    | "active"
    | "completed"
    | "cancelled"
    | "rejected"
    | null = null;

  if (currentUserId) {
    const [reg] = await db
      .select({ status: internshipRegistrations.status })
      .from(internshipRegistrations)
      .where(
        and(
          eq(internshipRegistrations.userId, currentUserId),
          eq(internshipRegistrations.internshipId, id)
        )
      )
      .limit(1);

    if (reg) {
      hasRegistered = true;
      registrationStatus = reg.status;
    }
  }

  return {
    id: row.id,
    name: row.name,
    description: row.description,
    image: row.image,
    skills: row.skills ?? [],
    qualifications: row.qualifications ?? [],
    duration: row.duration,
    mode: row.mode,
    location: row.location,
    registrationOpen: row.registrationOpen,
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
    applicantCount: row.applicantCount ?? 0,
    hasRegistered,
    registrationStatus,
  };
}