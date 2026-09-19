import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { headers } from "next/headers";
import { successResponse, errorResponse, handleApiError, unauthorizedResponse, notFoundResponse } from "@/lib/mobile";
import { getOfferLetterPDFData } from "@/app/dashboard/documents/offer-letters/pdf-actions";
import { renderToBuffer } from "@react-pdf/renderer";
import InternshipOfferLetterPDF from "@/docs/InternshipOfferLetterPDF";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return unauthorizedResponse();

    const url = new URL(request.url);
    const pathParts = url.pathname.split("/");
    const id = pathParts[pathParts.length - 3];

    const res = await getOfferLetterPDFData(id);
    if (!res.success) return notFoundResponse(res.error);

    const buffer = await renderToBuffer(<InternshipOfferLetterPDF data={res.data} />);

    return new Response(buffer as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="offer-letter-${res.data.offerLetterId}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}