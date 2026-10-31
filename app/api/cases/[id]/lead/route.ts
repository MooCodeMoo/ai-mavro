import { NextRequest, NextResponse } from "next/server";
import { getCase } from "@/lib/database";
import { requireAdmin } from "@/lib/security";
import { apiError, HttpError } from "@/lib/http";
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    requireAdmin(req);
    const item = await getCase((await params).id);
    if (!item) throw new HttpError(404, "Case not found");
    const text = [
      `ASANA LEAD DRAFT — review before creating`,
      `Project: Leads Mavro Slovenia`,
      `Case: ${item.id}`,
      `Customer: ${item.input.customerName}`,
      `Contact: ${item.input.contactInfo}`,
      `Location: ${item.input.location}`,
      `Surface: ${item.input.substrate}`,
      `Contamination: ${item.input.contamination}`,
      `Area: ${item.input.area ?? "Unknown"} m²`,
      `Product: ${item.treatment?.product ?? "Technical review required"}`,
      `Review: ${item.review}`,
      `Note: ${item.reviewNote}`,
      `Next action: Review with Rok; agree contact and follow-up date.`,
      `No task has been created or sent.`,
    ].join("\n");
    return new NextResponse(text, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="mavro-lead-${item.id}.txt"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    return apiError(e);
  }
}
