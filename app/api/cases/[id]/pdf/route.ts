import { NextRequest, NextResponse } from "next/server";
import { apiError, HttpError } from "@/lib/http";
import { caseAccess, rateLimit } from "@/lib/security";
import { getCase } from "@/lib/database";
import { generatePDF } from "@/lib/pdf";
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    caseAccess(req, id);
    await rateLimit(req, "pdf", 30);
    const item = await getCase(id);
    if (!item) throw new HttpError(404, "Case not found");
    const pdf = await generatePDF(item);
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Mavro-${id}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (e) {
    return apiError(e);
  }
}
