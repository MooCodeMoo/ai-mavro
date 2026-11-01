import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { mutationGuard } from "@/lib/security";
import { apiError, HttpError, readJSON } from "@/lib/http";
import { parseCase } from "@/lib/validation";
import { normalizePhotos } from "@/lib/photo-validation";
import { getRules } from "@/lib/database";
import { resolveTreatment } from "@/lib/recommendations";
import { generatePDF } from "@/lib/pdf";
export async function POST(req: NextRequest) {
  try {
    await mutationGuard(req, "report", 30);
    const data = await readJSON(req, 4_300_000);
    const input = parseCase({
      ...data,
      customerName: "",
      contactInfo: "",
      location: "",
      consent: false,
      contactRequested: false,
    });
    if (!input.confirmed)
      throw new HttpError(
        400,
        "Confirm the selected surface and contamination",
      );
    const treatment = resolveTreatment(input, await getRules(true));
    const photos = await normalizePhotos(input.photos);
    const { photos: omitted, ...details } = input;
    void omitted;
    const records = photos.map((p) => ({ ...p, id: randomUUID() }));
    const pdf = await generatePDF(
      {
        id: randomUUID(),
        createdAt: new Date().toISOString(),
        input: details,
        treatment,
        review: "pending",
        reviewNote: "",
        photos: records.map(({ id, name }) => ({ id, name })),
      },
      Object.fromEntries(records.map((p) => [p.id, p.data])),
      true,
    );
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=Mavro-report.pdf",
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
