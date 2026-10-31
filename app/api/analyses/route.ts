import { NextRequest, NextResponse } from "next/server";
import { overview, legacyExport, listCases } from "@/lib/database";
import { requireAdmin } from "@/lib/security";
import { apiError, HttpError } from "@/lib/http";
export async function GET(req: NextRequest) {
  try {
    requireAdmin(req);
    if (req.nextUrl.searchParams.get("legacy") === "1") {
      const legacy = await legacyExport();
      return NextResponse.json(legacy, {
        headers: {
          "Cache-Control": "no-store",
          "Content-Disposition": 'attachment; filename="mavro-legacy.json"',
        },
      });
    }
    const limit = Number(req.nextUrl.searchParams.get("limit") || 25),
      offset = Number(req.nextUrl.searchParams.get("offset") || 0);
    if (
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 100 ||
      !Number.isInteger(offset) ||
      offset < 0
    )
      throw new HttpError(400, "Invalid page");
    const page = await listCases(limit, offset);
    const summary = await overview();
    return NextResponse.json(
      { ...page, ...summary },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return apiError(e);
  }
}
