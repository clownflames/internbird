import { NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import InternshipCertificatePDF from "@/docs/InternshipCertificatePDF";
import { getCertificatePDFData } from "@/app/dashboard/documents/certificates/pdf-actions";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const res = await getCertificatePDFData(id);
  if (!res.success) {
    return new Response(res.error, { status: 404 });
  }

  const buffer = await renderToBuffer(
    <InternshipCertificatePDF data={res.data} />
  );

  return new Response(buffer as any, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="certificate-${res.data.certificateId}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}