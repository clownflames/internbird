import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { headers } from "next/headers";
import {
  successResponse,
  errorResponse,
  handleApiError,
  unauthorizedResponse,
} from "@/lib/mobile";
import { R2 } from "@/lib/r2";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";

// ✅ Ye zaroori hai — Next.js ko batao ye API route hai, Server Action nahi
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // ✅ Server Action headers ko ignore karo
    const nextAction = request.headers.get("Next-Action");
    if (nextAction) {
      console.log("⚠️ Next-Action header detected:", nextAction);
    }

    // ✅ Session check
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      console.log("❌ Unauthorized — no session");
      return unauthorizedResponse();
    }

    console.log("=== UPLOAD DEBUG START ===");
    console.log("UserId:", session.user.id);
    console.log("Content-Type:", request.headers.get("content-type"));

    // ✅ FormData parse
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (err: any) {
      console.error("FormData parse error:", err.message);
      return errorResponse(
        "Failed to parse form data. Make sure request is multipart/form-data.",
        400
      );
    }

    console.log("FormData keys:", [...formData.keys()]);

    const file = formData.get("file") as File | null;
    const type = ((formData.get("type") as string) || "image").trim();

    console.log(
      "File:",
      file?.name,
      "| MIME:",
      file?.type,
      "| Size:",
      file?.size,
      "| Category:",
      type
    );

    // ---------- 1. File check ----------
    if (!file || !(file instanceof File)) {
      return errorResponse(
        "No file provided. Field name must be 'file'.",
        400
      );
    }

    // ---------- 2. MIME fallback ----------
    let detectedType = file.type;
    if (!detectedType || detectedType === "application/octet-stream") {
      const ext = file.name.split(".").pop()?.toLowerCase() || "";
      const extMap: Record<string, string> = {
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        png: "image/png",
        webp: "image/webp",
        gif: "image/gif",
        mp4: "video/mp4",
        webm: "video/webm",
        mov: "video/quicktime",
        pdf: "application/pdf",
        doc: "application/msword",
        docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      };
      detectedType = extMap[ext] || detectedType;
      console.log("Fallback MIME detected:", detectedType);
    }

    // ---------- 3. Allowed types ----------
    const allowedTypes: Record<string, string[]> = {
      image: ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"],
      video: ["video/mp4", "video/webm", "video/quicktime"],
      document: [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ],
    };

    const allowed = allowedTypes[type];
    if (!allowed) {
      return errorResponse(
        `Unknown upload type '${type}'. Use: image | video | document`,
        400
      );
    }

    if (!allowed.includes(detectedType)) {
      console.error(
        `MIME mismatch → Got: ${detectedType} | Allowed: ${allowed.join(", ")}`
      );
      return errorResponse(
        `Invalid file type '${detectedType}' for '${type}'. Allowed: ${allowed.join(
          ", "
        )}`,
        400
      );
    }

    // ---------- 4. Size check ----------
    const maxSize = type === "video" ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return errorResponse(
        `File too large. Max ${(maxSize / 1024 / 1024).toFixed(
          0
        )}MB, got ${(file.size / 1024 / 1024).toFixed(2)}MB`,
        400
      );
    }

    // ---------- 5. Env check ----------
    if (!process.env.R2_BUCKET_NAME) {
      console.error("R2_BUCKET_NAME missing");
      return errorResponse("Server config error: R2_BUCKET_NAME", 500);
    }
    if (!process.env.R2_PUBLIC_URL) {
      console.error("R2_PUBLIC_URL missing");
      return errorResponse("Server config error: R2_PUBLIC_URL", 500);
    }

    // ---------- 6. Upload to R2 ----------
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const key = `mobile/${session.user.id}/${type}/${randomUUID()}-${safeName}`;

    const buffer = await file.arrayBuffer();

    await R2.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: key,
        Body: Buffer.from(buffer),
        ContentType: detectedType,
      })
    );

    const url = `${process.env.R2_PUBLIC_URL}/${key}`;

    console.log("=== UPLOAD SUCCESS ===");
    console.log("Key:", key);
    console.log("URL:", url);

    return successResponse({ url, key }, "File uploaded successfully");
  } catch (error: any) {
    console.error("=== UPLOAD ERROR ===");
    console.error("Message:", error?.message);
    console.error("Stack:", error?.stack);
    console.error("Name:", error?.name);
    console.error("Code:", error?.Code);
    console.error("Cause:", error?.cause);
    return handleApiError(error);
  }
}

// ✅ OPTIONS handler — CORS ke liye
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, Cookie",
    },
  });
}