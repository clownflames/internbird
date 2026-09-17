import { NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import InternshipOfferLetterPDF from "@/docs/InternshipOfferLetterPDF";
import { getOfferLetterPDFData } from "@/app/dashboard/documents/offer-letters/pdf-actions";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const res = await getOfferLetterPDFData(id);
  if (!res.success) {
    return new Response(res.error, { status: 404 });
  }

  const buffer = await renderToBuffer(
    <InternshipOfferLetterPDF data={res.data} />
  );

  return new Response(buffer as any, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="offer-letter-${res.data.offerLetterId}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}