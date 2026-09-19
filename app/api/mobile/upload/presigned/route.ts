import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { headers } from "next/headers";
import { successResponse, errorResponse, handleApiError, unauthorizedResponse } from "@/lib/mobile";
import { R2, getPresignedUploadUrl, generateFileKey } from "@/lib/r2";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return unauthorizedResponse();

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string || "image";

    if (!file) return errorResponse("No file provided", 400);

    const allowedTypes = {
      image: ["image/jpeg", "image/png", "image/webp", "image/gif"],
      video: ["video/mp4", "video/webm", "video/quicktime"],
      document: ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
    };

    if (!allowedTypes[type as keyof typeof allowedTypes]?.includes(file.type)) {
      return errorResponse(`Invalid file type for ${type}`, 400);
    }

    const maxSize = type === "video" ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) return errorResponse("File too large", 400);

    const key = generateFileKey(session.user.id, file.name).replace("posts/", `mobile/${type}/`);

    const uploadUrl = await getPresignedUploadUrl(key, file.type, 3600);

    return successResponse({
      uploadUrl: uploadUrl.uploadUrl,
      key,
      publicUrl: uploadUrl.publicUrl,
    });
  } catch (error) {
    return handleApiError(error);
  }
}