import { NextResponse } from "next/server";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    unreadCount?: number;
    [key: string]: unknown;
  };
}

export function successResponse<T>(data: T, message?: string, meta?: ApiResponse<T>["meta"]): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ success: true, data, message, meta });
}

export function errorResponse(error: string, status = 400, message?: string): NextResponse<ApiResponse<never>> {
  return NextResponse.json({ success: false, error, message }, { status });
}

export function unauthorizedResponse(message = "Unauthorized"): NextResponse<ApiResponse<never>> {
  return errorResponse("UNAUTHORIZED", 401, message);
}

export function forbiddenResponse(message = "Forbidden"): NextResponse<ApiResponse<never>> {
  return errorResponse("FORBIDDEN", 403, message);
}

export function notFoundResponse(message = "Not found"): NextResponse<ApiResponse<never>> {
  return errorResponse("NOT_FOUND", 404, message);
}

export function serverErrorResponse(message = "Internal server error"): NextResponse<ApiResponse<never>> {
  return errorResponse("INTERNAL_ERROR", 500, message);
}

export function validationErrorResponse(message: string): NextResponse<ApiResponse<never>> {
  return errorResponse("VALIDATION_ERROR", 400, message);
}

export async function handleApiError(error: unknown): Promise<NextResponse<ApiResponse<never>>> {
  console.error("API Error:", error);
  
  if (error instanceof Error) {
    if (error.message === "UNAUTHORIZED") return unauthorizedResponse();
    if (error.message === "FORBIDDEN") return forbiddenResponse();
    if (error.message === "NOT_FOUND") return notFoundResponse();
    if (error.message.startsWith("VALIDATION_ERROR:")) return validationErrorResponse(error.message.replace("VALIDATION_ERROR: ", ""));
  }
  
  return serverErrorResponse();
}