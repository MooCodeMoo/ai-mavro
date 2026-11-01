import { validContact } from "@/lib/contact-validation";
import { NextRequest, NextResponse } from "next/server";
import { normalizePhotos } from "@/lib/photo-validation";
import { getRules, saveCase } from "@/lib/database";
import { resolveTreatment } from "@/lib/recommendations";
import { parseCase } from "@/lib/validation";
import { apiError, HttpError, readJSON } from "@/lib/http";
import { caseToken, mutationGuard } from "@/lib/security";
export async function POST(req: NextRequest) {
  try {
    await mutationGuard(req, "save-case", 30);
    caseToken("configuration-check");
    const input = parseCase(await readJSON(req, 4_300_000));
    if (!input.confirmed)
      throw new HttpError(
        400,
        "Confirm the selected surface and contamination",
      );
    if (!input.consent)
      throw new HttpError(
        400,
        "Confirm permission to store these details and photos",
      );
    if (
      input.contactRequested &&
      (input.customerName.trim().length < 2 || !validContact(input.contactInfo))
    )
      throw new HttpError(
        400,
        "Enter your full name and a valid email address or phone number",
      );
    input.photos = await normalizePhotos(input.photos);
    const treatment = resolveTreatment(input, await getRules(true));
    const saved = await saveCase(input, treatment);
    const res = NextResponse.json({ case: saved });
    res.cookies.set({
      name: `mavro-case-${saved.id}`,
      value: caseToken(saved.id),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });
    return res;
  } catch (e) {
    return apiError(e);
  }
}
