"use server";

import { db } from "@/db";
import { internships } from "@/db/schema";
import { eq, desc, ilike, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

/* =========================================================
   VALIDATION SCHEMA
========================================================= */

const internshipSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    description: z.string().optional().nullable(),
    image: z
      .string()
      .url("Must be a valid URL")
      .optional()
      .nullable()
      .or(z.literal("")),
    skills: z.array(z.string()).default([]),
    qualifications: z.array(z.string()).default([]),
    duration: z.string().optional().nullable(),
    mode: z.enum(["remote", "onsite", "hybrid"]).default("remote"),
    location: z.string().optional().nullable(),

    // pricing
    pricing: z.enum(["free", "paid"]).default("free"),
    price: z.string().optional().nullable(),
    discountPrice: z.string().optional().nullable(),
    currency: z.string().default("INR"),
    paymentType: z.enum(["one_time", "monthly"]).default("one_time"),
    pricingNote: z.string().optional().nullable(),

    registrationOpen: z.boolean().default(true),
    isActive: z.boolean().default(true),
  })
  .refine(
    (data) =>
      data.pricing === "free" ||
      (data.price && data.price.trim() !== "" && Number(data.price) > 0),
    {
      message: "Price is required for paid internships",
      path: ["price"],
    }
  );

export type InternshipInput = z.infer<typeof internshipSchema>;

/* =========================================================
   GET ALL
========================================================= */

export async function getInternships({
  search = "",
  page = 1,
  limit = 10,
}: {
  search?: string;
  page?: number;
  limit?: number;
} = {}) {
  const offset = (page - 1) * limit;

  const whereClause = search
    ? or(
        ilike(internships.name, `%${search}%`),
        ilike(internships.description, `%${search}%`),
        ilike(internships.location, `%${search}%`)
      )
    : undefined;

  const [rows, countResult] = await Promise.all([
    db
      .select()
      .from(internships)
      .where(whereClause)
      .orderBy(desc(internships.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(internships)
      .where(whereClause),
  ]);

  const total = Number(countResult[0]?.count ?? 0);

  return {
    data: rows,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/* =========================================================
   GET SINGLE
========================================================= */

export async function getInternship(id: string) {
  const [row] = await db
    .select()
    .from(internships)
    .where(eq(internships.id, id))
    .limit(1);

  return row ?? null;
}

/* =========================================================
   CREATE
========================================================= */

export async function createInternship(input: InternshipInput) {
  try {
    const parsed = internshipSchema.parse(input);

    const isPaid = parsed.pricing === "paid";

    // 🔍 DEBUG — ise hata sakte ho baad me
    console.log("CREATE parsed:", {
      pricing: parsed.pricing,
      price: parsed.price,
      discountPrice: parsed.discountPrice,
      paymentType: parsed.paymentType,
    });

    const [created] = await db
      .insert(internships)
      .values({
        name: parsed.name,
        description: parsed.description ?? null,
        image: parsed.image || null,
        skills: parsed.skills,
        qualifications: parsed.qualifications,
        duration: parsed.duration ?? null,
        mode: parsed.mode,
        location: parsed.location ?? null,

        // pricing
        pricing: parsed.pricing,
        price: isPaid && parsed.price ? String(parsed.price) : null,
        discountPrice:
          isPaid && parsed.discountPrice
            ? String(parsed.discountPrice)
            : null,
        currency: parsed.currency,
        paymentType: parsed.paymentType,
        pricingNote: isPaid ? parsed.pricingNote ?? null : null,

        registrationOpen: parsed.registrationOpen,
        isActive: parsed.isActive,
      })
      .returning();

    console.log("CREATED row:", created);

    revalidatePath("/admin/internships");
    return { success: true, data: created };
  } catch (error) {
    console.error("createInternship error:", error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message ?? "Validation failed",
      };
    }
    return { success: false, error: "Failed to create internship" };
  }
}

/* =========================================================
   UPDATE
========================================================= */

export async function updateInternship(id: string, input: InternshipInput) {
  try {
    const parsed = internshipSchema.parse(input);

    const isPaid = parsed.pricing === "paid";

    // 🔍 DEBUG
    console.log("UPDATE parsed:", {
      id,
      pricing: parsed.pricing,
      price: parsed.price,
      discountPrice: parsed.discountPrice,
      paymentType: parsed.paymentType,
    });

    const [updated] = await db
      .update(internships)
      .set({
        name: parsed.name,
        description: parsed.description ?? null,
        image: parsed.image || null,
        skills: parsed.skills,
        qualifications: parsed.qualifications,
        duration: parsed.duration ?? null,
        mode: parsed.mode,
        location: parsed.location ?? null,

        // pricing
        pricing: parsed.pricing,
        price: isPaid && parsed.price ? String(parsed.price) : null,
        discountPrice:
          isPaid && parsed.discountPrice
            ? String(parsed.discountPrice)
            : null,
        currency: parsed.currency,
        paymentType: parsed.paymentType,
        pricingNote: isPaid ? parsed.pricingNote ?? null : null,

        registrationOpen: parsed.registrationOpen,
        isActive: parsed.isActive,
        updatedAt: new Date(),
      })
      .where(eq(internships.id, id))
      .returning();

    console.log("UPDATED row:", updated);

    revalidatePath("/admin/internships");
    return { success: true, data: updated };
  } catch (error) {
    console.error("updateInternship error:", error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message ?? "Validation failed",
      };
    }
    return { success: false, error: "Failed to update internship" };
  }
}

/* =========================================================
   DELETE
========================================================= */

export async function deleteInternship(id: string) {
  try {
    await db.delete(internships).where(eq(internships.id, id));
    revalidatePath("/admin/internships");
    return { success: true };
  } catch (error) {
    console.error("deleteInternship error:", error);
    return { success: false, error: "Failed to delete internship" };
  }
}

/* =========================================================
   TOGGLES
========================================================= */

export async function toggleInternshipActive(id: string, isActive: boolean) {
  try {
    await db
      .update(internships)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(internships.id, id));
    revalidatePath("/admin/internships");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to update status" };
  }
}

export async function toggleRegistrationOpen(
  id: string,
  registrationOpen: boolean
) {
  try {
    await db
      .update(internships)
      .set({ registrationOpen, updatedAt: new Date() })
      .where(eq(internships.id, id));
    revalidatePath("/admin/internships");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to update registration status" };
  }
}