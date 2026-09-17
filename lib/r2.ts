import "server-only";

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/* =========================================================
   R2 CLIENT
========================================================= */

const R2 = new S3Client({
  region: "auto", // R2 ke liye required, but ignored
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

/* =========================================================
   GENERATE PRESIGNED UPLOAD URL
   ---------------------------------------------
   Returns: { uploadUrl, publicUrl, key }
========================================================= */

export async function getPresignedUploadUrl(
  fileKey: string,
  contentType: string,
  expiresIn = 300 // 5 minutes
) {
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: fileKey,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(R2, command, { expiresIn });

  const publicUrl = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${fileKey}`;

  return { uploadUrl, publicUrl, key: fileKey };
}

/* =========================================================
   GENERATE FILE KEY
========================================================= */

export function generateFileKey(
  userId: string,
  originalName: string
): string {
  const ext = originalName.split(".").pop()?.toLowerCase() || "jpg";
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  return `posts/${userId}/${timestamp}-${random}.${ext}`;
}

/* =========================================================
   DELETE OBJECT (optional — baad me kaam aayega)
========================================================= */

import { DeleteObjectCommand } from "@aws-sdk/client-s3";

export async function deleteObject(key: string) {
  const command = new DeleteObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
  });
  await R2.send(command);
}