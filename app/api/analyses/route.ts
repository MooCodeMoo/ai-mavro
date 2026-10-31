import { NextRequest, NextResponse } from "next/server";
import { getDb, listCases } from "@/lib/database";
import { requireAdmin } from "@/lib/security";
import { apiError, HttpError } from "@/lib/http";
export async function GET(req: NextRequest) {
  try {
    requireAdmin(req);
    if (req.nextUrl.searchParams.get("legacy") === "1") {
      const db = await getDb();
      const tables = await db.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('analyses','rules')",
      );
      const legacy: Record<string, unknown> = {};
      for (const row of tables.rows) {
        const table = String(row.name);
        legacy[table] = (await db.execute(`SELECT * FROM ${table}`)).rows;
      }
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
    const db = await getDb();
    const pending = Number(
      (
        await db.execute(
          "SELECT count(*) AS total FROM treatment_cases WHERE review='pending'",
        )
      ).rows[0].total,
    );
    const legacy = await db.execute(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='analyses'",
    );
    return NextResponse.json(
      { ...page, pending, legacyAvailable: legacy.rows.length > 0 },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return apiError(e);
  }
}
