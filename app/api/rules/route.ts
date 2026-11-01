import { NextRequest, NextResponse } from "next/server";
import { getRules, putRule, disableRule } from "@/lib/database";
import { requireAdmin, mutationGuard } from "@/lib/security";
import { apiError, HttpError, readJSON } from "@/lib/http";
import { parseRule } from "@/lib/validation";
export async function GET(req: NextRequest) {
  try {
    requireAdmin(req);
    return NextResponse.json(
      { rules: await getRules() },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return apiError(e);
  }
}
export async function PUT(req: NextRequest) {
  try {
    await mutationGuard(req, "rules", 100, true);
    const rule = parseRule(await readJSON(req));
    return NextResponse.json({ rule: await putRule(rule) });
  } catch (e) {
    return apiError(e);
  }
}
export const POST = PUT;
export async function DELETE(req: NextRequest) {
  try {
    await mutationGuard(req, "rules", 100, true);
    const id = req.nextUrl.searchParams.get("id");
    if (!id || !(await disableRule(id)))
      throw new HttpError(404, "Rule not found");
    return NextResponse.json({ success: true });
  } catch (e) {
    return apiError(e);
  }
}
