"use server";

import { db } from "@/db";
import {
  internships,
  internshipRegistrations,
  payments,
} from "@/db/schema";
import { getSession } from "@/auth";
import {
  and,
  or,
  eq,
  ilike,
  desc,
  asc,
  sql,
  inArray,
} from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import crypto from "crypto";
import { razorpay } from "@/lib/razorpay";

/* =========================================================
   TYPES
========================================================= */

export type InternshipListItem = {
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
  createdAt: string;

  // pricing
  pricing: "free" | "paid";
  price: string | null;
  discountPrice: string | null;
  currency: string;
  paymentType: "one_time" | "monthly" | null;  // ✅ allow null
  pricingNote: string | null;

  // user-specific
  hasRegistered: boolean;
  registrationStatus:
    | "pending"
    | "active"
    | "completed"
    | "cancelled"
    | "rejected"
    | null;
  applicantCount: number;
};

export type InternshipFilters = {
  search?: string;
  mode?: "remote" | "onsite" | "hybrid" | "all";
  duration?: string;
  location?: string;
  sort?: "latest" | "popular" | "name";
};

export type ApplicationFormData = {
  university: string;
  collegeName: string;
  branch: string;
  degree: string;
  academicYear?: string;
  semester?: number;
  passingYear?: number;
  address?: string;
  aboutUser?: string;
};

/* =========================================================
   HELPER
========================================================= */

async function getCurrentUserId(): Promise<string | null> {
  const session = await getSession();
  return session?.user?.id ?? null;
}

/* =========================================================
   GET INTERNSHIPS LIST
========================================================= */

export async function getInternships(
  filters: InternshipFilters = {}
): Promise<InternshipListItem[]> {
  const currentUserId = await getCurrentUserId();

  const { search, mode = "all", location, sort = "latest" } = filters;

  /* ---------- build where conditions ---------- */
  const conditions = [eq(internships.isActive, true)];

  if (search && search.trim()) {
    const q = `%${search.trim()}%`;
    conditions.push(
      or(
        ilike(internships.name, q),
        ilike(internships.description, q),
        ilike(internships.location, q)
      )!
    );
  }

  if (mode !== "all") {
    conditions.push(eq(internships.mode, mode));
  }

  if (location && location.trim()) {
    conditions.push(ilike(internships.location, `%${location.trim()}%`));
  }

  /* ---------- order by ---------- */
  const orderBy =
    sort === "name" ? asc(internships.name) : desc(internships.createdAt);

  /* ---------- fetch ---------- */
  const rows = await db
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
      createdAt: internships.createdAt,

      // pricing
      pricing: internships.pricing,
      price: internships.price,
      discountPrice: internships.discountPrice,
      currency: internships.currency,
      paymentType: internships.paymentType,
      pricingNote: internships.pricingNote,

      applicantCount: sql<number>`(
        SELECT COUNT(*)::int FROM ${internshipRegistrations}
        WHERE ${internshipRegistrations.internshipId} = ${internships.id}
      )`,
    })
    .from(internships)
    .where(and(...conditions))
    .orderBy(orderBy);

  /* ---------- user registrations ---------- */
  let registrationsByInternship = new Map<
    string,
    "pending" | "active" | "completed" | "cancelled" | "rejected"
  >();

  if (currentUserId && rows.length > 0) {
    const regRows = await db
      .select({
        internshipId: internshipRegistrations.internshipId,
        status: internshipRegistrations.status,
      })
      .from(internshipRegistrations)
      .where(
        and(
          eq(internshipRegistrations.userId, currentUserId),
          inArray(
            internshipRegistrations.internshipId,
            rows.map((r) => r.id)
          )
        )
      );

    registrationsByInternship = new Map(
      regRows.map((r) => [r.internshipId, r.status])
    );
  }

  /* ---------- shape ---------- */
  return rows.map((r) => {
    const status = registrationsByInternship.get(r.id) ?? null;
    return {
      id: r.id,
      name: r.name,
      description: r.description,
      image: r.image,
      skills: r.skills ?? [],
      qualifications: r.qualifications ?? [],
      duration: r.duration,
      mode: r.mode,
      location: r.location,
      registrationOpen: r.registrationOpen,
      createdAt: r.createdAt.toISOString(),

      pricing: r.pricing,
      price: r.price,
      discountPrice: r.discountPrice,
      currency: r.currency,
      paymentType: r.paymentType,
      pricingNote: r.pricingNote,

      hasRegistered: !!status,
      registrationStatus: status,
      applicantCount: r.applicantCount ?? 0,
    };
  });
}

/* =========================================================
   GET SINGLE INTERNSHIP
========================================================= */

export async function getInternshipById(id: string) {
  const currentUserId = await getCurrentUserId();

  const [row] = await db
    .select()
    .from(internships)
    .where(and(eq(internships.id, id), eq(internships.isActive, true)))
    .limit(1);

  if (!row) return null;

  let registration = null;
  if (currentUserId) {
    const [reg] = await db
      .select()
      .from(internshipRegistrations)
      .where(
        and(
          eq(internshipRegistrations.userId, currentUserId),
          eq(internshipRegistrations.internshipId, id)
        )
      )
      .limit(1);
    registration = reg ?? null;
  }

  return { internship: row, registration };
}

/* =========================================================
   🔹 FREE FLOW — Apply to Internship
========================================================= */

export async function applyToInternship(
  internshipId: string,
  data: ApplicationFormData
): Promise<{ success: boolean; error?: string }> {
  const currentUserId = await getCurrentUserId();

  if (!currentUserId) {
    return { success: false, error: "Please sign in to apply" };
  }

  try {
    // check internship is open + get pricing
    const [internship] = await db
      .select({
        id: internships.id,
        isActive: internships.isActive,
        registrationOpen: internships.registrationOpen,
        pricing: internships.pricing,
      })
      .from(internships)
      .where(eq(internships.id, internshipId))
      .limit(1);

    if (!internship) {
      return { success: false, error: "Internship not found" };
    }

    if (!internship.isActive || !internship.registrationOpen) {
      return { success: false, error: "Registration is closed" };
    }

    // 🚫 Block paid here — must go through payment flow
    if (internship.pricing === "paid") {
      return {
        success: false,
        error: "This is a paid internship. Please complete payment first.",
      };
    }

    // check if already applied
    const [existing] = await db
      .select()
      .from(internshipRegistrations)
      .where(
        and(
          eq(internshipRegistrations.userId, currentUserId),
          eq(internshipRegistrations.internshipId, internshipId)
        )
      )
      .limit(1);

    if (existing) {
      return { success: false, error: "You have already applied" };
    }

    // insert
    await db.insert(internshipRegistrations).values({
      userId: currentUserId,
      internshipId,
      university: data.university,
      collegeName: data.collegeName,
      branch: data.branch,
      degree: data.degree,
      academicYear: data.academicYear ?? null,
      semester: data.semester ?? null,
      passingYear: data.passingYear ?? null,
      address: data.address ?? null,
      aboutUser: data.aboutUser ?? null,
      status: "pending",
    });

    revalidatePath("/");
    revalidatePath("/dashboard/internships");

    return { success: true };
  } catch (err) {
    console.error("applyToInternship", err);
    return { success: false, error: "Something went wrong" };
  }
}

/* =========================================================
   🔹 PAID FLOW — Step 1: Create Razorpay Order
========================================================= */

export async function createInternshipPaymentOrder(
  internshipId: string,
  data: ApplicationFormData
): Promise<{
  success: boolean;
  error?: string;
  order?: {
    id: string;
    amount: number;
    currency: string;
  };
}> {
  const currentUserId = await getCurrentUserId();

  if (!currentUserId) {
    return { success: false, error: "Please sign in to apply" };
  }

  try {
    const [internship] = await db
      .select({
        id: internships.id,
        name: internships.name,
        isActive: internships.isActive,
        registrationOpen: internships.registrationOpen,
        pricing: internships.pricing,
        price: internships.price,
        discountPrice: internships.discountPrice,
        currency: internships.currency,
      })
      .from(internships)
      .where(eq(internships.id, internshipId))
      .limit(1);

    if (!internship) {
      return { success: false, error: "Internship not found" };
    }

    if (!internship.isActive || !internship.registrationOpen) {
      return { success: false, error: "Registration is closed" };
    }

    if (internship.pricing !== "paid") {
      return { success: false, error: "This internship is free" };
    }

    if (!internship.price) {
      return { success: false, error: "Price not set for this internship" };
    }

    // already registered check
    const [existing] = await db
      .select()
      .from(internshipRegistrations)
      .where(
        and(
          eq(internshipRegistrations.userId, currentUserId),
          eq(internshipRegistrations.internshipId, internshipId)
        )
      )
      .limit(1);

    if (existing) {
      return { success: false, error: "You have already enrolled" };
    }

    // amount: discountPrice if exists else price
    const amountStr = internship.discountPrice ?? internship.price;
    const amountPaise = Math.round(Number(amountStr) * 100);

    // 1. create razorpay order
    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: internship.currency || "INR",
      receipt: `rcpt_${Date.now()}`,
      notes: {
        internshipId: internship.id,
        userId: currentUserId,
      },
    });

    // 2. store pending payment + form data in metadata
    await db.insert(payments).values({
      userId: currentUserId,
      internshipId: internship.id,
      provider: "razorpay",
      providerOrderId: order.id,
      amount: amountStr,
      currency: internship.currency || "INR",
      status: "pending",
      description: `Enrollment for ${internship.name}`,
      metadata: {
        formData: data,
      },
    });

    return {
      success: true,
      order: {
        id: order.id,
        amount: Number(order.amount),
        currency: order.currency,
      },
    };
  } catch (err) {
    console.error("createInternshipPaymentOrder", err);
    return { success: false, error: "Failed to create payment order" };
  }
}

/* =========================================================
   🔹 PAID FLOW — Step 2: Verify Payment & Create Registration
========================================================= */

const verifySchema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
});

export async function verifyInternshipPayment(
  internshipId: string,
  payload: z.infer<typeof verifySchema>
): Promise<{ success: boolean; error?: string }> {
  const currentUserId = await getCurrentUserId();

  if (!currentUserId) {
    return { success: false, error: "Please sign in" };
  }

  const parsed = verifySchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, error: "Invalid payment payload" };
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    parsed.data;

  // 1. verify signature
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    await db
      .update(payments)
      .set({ status: "failed" })
      .where(eq(payments.providerOrderId, razorpay_order_id));

    return { success: false, error: "Payment verification failed" };
  }

  // 2. fetch payment row
  const [paymentRow] = await db
    .select()
    .from(payments)
    .where(eq(payments.providerOrderId, razorpay_order_id))
    .limit(1);

  if (!paymentRow) {
    return { success: false, error: "Payment record not found" };
  }

  // prevent double processing
  if (paymentRow.status === "success") {
    return { success: true };
  }

  const formData = (paymentRow.metadata as any)?.formData as
    | ApplicationFormData
    | undefined;

  if (!formData) {
    return { success: false, error: "Form data missing" };
  }

  // 3. transaction: create registration + update payment
  try {
    await db.transaction(async (tx) => {
      // double-check registration doesn't exist (in case of retry)
      const [existing] = await tx
        .select()
        .from(internshipRegistrations)
        .where(
          and(
            eq(internshipRegistrations.userId, currentUserId),
            eq(internshipRegistrations.internshipId, internshipId)
          )
        )
        .limit(1);

      if (existing) {
        // registration already exists → just mark payment success
        await tx
          .update(payments)
          .set({
            status: "success",
            providerPaymentId: razorpay_payment_id,
            providerSignature: razorpay_signature,
            registrationId: existing.id,
            paidAt: new Date(),
          })
          .where(eq(payments.id, paymentRow.id));

        return;
      }

      const [registration] = await tx
        .insert(internshipRegistrations)
        .values({
          userId: currentUserId,
          internshipId,
          university: formData.university,
          collegeName: formData.collegeName,
          branch: formData.branch,
          degree: formData.degree,
          academicYear: formData.academicYear ?? null,
          semester: formData.semester ?? null,
          passingYear: formData.passingYear ?? null,
          address: formData.address ?? null,
          aboutUser: formData.aboutUser ?? null,
          status: "pending",
        })
        .returning();

      await tx
        .update(payments)
        .set({
          status: "success",
          providerPaymentId: razorpay_payment_id,
          providerSignature: razorpay_signature,
          registrationId: registration.id,
          paidAt: new Date(),
        })
        .where(eq(payments.id, paymentRow.id));
    });

    revalidatePath("/");
    revalidatePath("/dashboard/internships");

    return { success: true };
  } catch (err) {
    console.error("verifyInternshipPayment", err);
    return { success: false, error: "Failed to complete enrollment" };
  }
}

/* =========================================================
   GET USER PROFILE FOR PRE-FILL
========================================================= */

export async function getApplicantDefaults(): Promise<{
  university: string;
  collegeName: string;
  branch: string;
  degree: string;
  academicYear: string;
  semester: string;
  passingYear: string;
  address: string;
  aboutUser: string;
}> {
  const currentUserId = await getCurrentUserId();

  const empty = {
    university: "",
    collegeName: "",
    branch: "",
    degree: "",
    academicYear: "",
    semester: "",
    passingYear: "",
    address: "",
    aboutUser: "",
  };

  if (!currentUserId) return empty;

  const [prev] = await db
    .select()
    .from(internshipRegistrations)
    .where(eq(internshipRegistrations.userId, currentUserId))
    .orderBy(desc(internshipRegistrations.createdAt))
    .limit(1);

  if (!prev) return empty;

  return {
    university: prev.university ?? "",
    collegeName: prev.collegeName ?? "",
    branch: prev.branch ?? "",
    degree: prev.degree ?? "",
    academicYear: prev.academicYear ?? "",
    semester: prev.semester?.toString() ?? "",
    passingYear: prev.passingYear?.toString() ?? "",
    address: prev.address ?? "",
    aboutUser: prev.aboutUser ?? "",
  };
}