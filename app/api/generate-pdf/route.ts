import { NextRequest, NextResponse } from "next/server";
import { apiError, HttpError, readJSON, shortText } from "@/lib/http";
import { caseAccess, mutationGuard } from "@/lib/security";
import { getCase } from "@/lib/database";
import { generatePDF } from "@/lib/pdf";
export async function POST(req: NextRequest) {
  try {
    await mutationGuard(req, "pdf", 30);
    const data = await readJSON(req, 2000),
      id = shortText(data.caseId, 100);
    caseAccess(req, id);
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
