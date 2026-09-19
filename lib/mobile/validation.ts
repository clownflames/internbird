import { z } from "zod";

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const internshipFiltersSchema = z.object({
  search: z.string().optional(),
  mode: z.enum(["remote", "onsite", "hybrid", "all"]).optional(),
  location: z.string().optional(),
  pricing: z.enum(["free", "paid", "all"]).optional(),
  sort: z.enum(["latest", "name", "popular"]).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const registerInternshipSchema = z.object({
  university: z.string().min(1),
  collegeName: z.string().min(1),
  branch: z.string().min(1),
  degree: z.string().min(1),
  academicYear: z.string().optional(),
  semester: z.coerce.number().int().positive().optional(),
  passingYear: z.coerce.number().int().positive().optional(),
  address: z.string().optional(),
  aboutUser: z.string().optional(),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(150).optional(),
  headline: z.string().max(255).optional(),
  bio: z.string().optional(),
  location: z.string().max(255).optional(),
  website: z.string().url().optional().or(z.literal("")),
  dob: z.string().datetime().optional(),
  phone: z.string().max(20).optional(),
});

export const createPostSchema = z.object({
  caption: z.string().optional(),
  media: z.array(z.object({
    type: z.enum(["image", "video"]),
    url: z.string().url(),
    thumbnail: z.string().url().optional(),
    width: z.number().optional(),
    height: z.number().optional(),
    duration: z.number().optional(),
  })).optional(),
  mediaType: z.enum(["text", "image", "video", "mixed"]).default("text"),
  visibility: z.enum(["public", "connections", "private"]).default("public"),
  location: z.string().max(255).optional(),
  tags: z.array(z.string()).optional(),
});

export const createCommentSchema = z.object({
  content: z.string().min(1).max(5000),
  parentId: z.string().uuid().optional(),
});

export const examSubmitSchema = z.object({
  answers: z.array(z.object({
    questionId: z.string().uuid(),
    selectedOption: z.number().int().nonnegative(),
  })),
});

export const projectSubmitSchema = z.object({
  submissionUrl: z.string().url().optional().or(z.literal("")),
  githubUrl: z.string().url().optional().or(z.literal("")),
  liveUrl: z.string().url().optional().or(z.literal("")),
  submissionFiles: z.array(z.object({
    name: z.string(),
    url: z.string().url(),
    type: z.string().optional(),
    size: z.number().optional(),
  })).optional(),
  submissionNotes: z.string().optional(),
});

export const connectionRequestSchema = z.object({
  addresseeId: z.string(),
  message: z.string().max(500).optional(),
});

export const notificationSettingsSchema = z.object({
  postLike: z.boolean().optional(),
  postComment: z.boolean().optional(),
  commentReply: z.boolean().optional(),
  commentLike: z.boolean().optional(),
  follow: z.boolean().optional(),
  connectionRequest: z.boolean().optional(),
  connectionAccepted: z.boolean().optional(),
  internshipRegistered: z.boolean().optional(),
  examPublished: z.boolean().optional(),
  certificateIssued: z.boolean().optional(),
  offerLetterIssued: z.boolean().optional(),
  mention: z.boolean().optional(),
  system: z.boolean().optional(),
});

export const searchSchema = z.object({
  q: z.string().min(1),
  type: z.enum(["all", "users", "internships", "posts", "skills"]).default("all"),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

export function validateBody<T>(schema: z.ZodSchema<T>) {
  return async (request: Request): Promise<T> => {
    const body = await request.json();
    const result = schema.safeParse(body);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      const messages = Object.values(errors).flat().join(", ");
      throw new Error(`VALIDATION_ERROR: ${messages}`);
    }
    return result.data;
  };
}

export function validateQuery<T>(schema: z.ZodSchema<T>) {
  return (request: Request): T => {
    const url = new URL(request.url);
    const params: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
      params[key] = value;
    });
    const result = schema.safeParse(params);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      const messages = Object.values(errors).flat().join(", ");
      throw new Error(`VALIDATION_ERROR: ${messages}`);
    }
    return result.data;
  };
}