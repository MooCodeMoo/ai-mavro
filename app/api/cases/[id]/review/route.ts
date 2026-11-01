import { NextRequest, NextResponse } from "next/server";
import { getCase, reviewCase } from "@/lib/database";
import { mutationGuard } from "@/lib/security";
import { apiError, HttpError, readJSON, shortText } from "@/lib/http";
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await mutationGuard(req, "review", 100, true);
    const { id } = await params;
    const item = await getCase(id);
    if (!item) throw new HttpError(404, "Case not found");
    const data = await readJSON(req, 5000);
    if (!["pending", "approved", "rejected"].includes(String(data.status)))
      throw new HttpError(400, "Invalid status");
    if (data.status === "approved" && !item.treatment)
      throw new HttpError(
        400,
        "Cannot approve a case without a treatment. Add a verified rule and create a new treatment.",
      );
    await reviewCase(
      id,
      data.status as "pending" | "approved" | "rejected",
      shortText(data.note, 2000),
    );
    return NextResponse.json({ success: true });
  } catch (e) {
    return apiError(e);
  }
}
