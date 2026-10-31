import { NextRequest, NextResponse } from "next/server";
import { getCase, deleteCase } from "@/lib/database";
import { caseAccess, mutationGuard } from "@/lib/security";
import { apiError, HttpError } from "@/lib/http";
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    caseAccess(req, id);
    const item = await getCase(id);
    if (!item) throw new HttpError(404, "Case not found");
    return NextResponse.json(
      { case: item },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return apiError(e);
  }
}
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await mutationGuard(req, "delete-case", 30, true);
    await deleteCase((await params).id);
    return NextResponse.json({ success: true });
  } catch (e) {
    return apiError(e);
  }
}
