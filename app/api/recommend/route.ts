import { NextRequest, NextResponse } from "next/server";
import { getRules } from "@/lib/database";
import { parseCase } from "@/lib/validation";
import { resolveTreatment } from "@/lib/recommendations";
import { apiError, readJSON } from "@/lib/http";
import { mutationGuard } from "@/lib/security";
export async function POST(req: NextRequest) {
  try {
    await mutationGuard(req, "recommend", 300);
    const input = parseCase(await readJSON(req));
    const treatment = resolveTreatment(input, await getRules(true));
    return NextResponse.json(
      { treatment },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return apiError(e);
  }
}
