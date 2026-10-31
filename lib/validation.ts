import {
  LANGUAGES,
  SUBSTRATES,
  CONTAMINATIONS,
  type CaseInput,
  type AIAnalysis,
  type Rule,
} from "./domain";
import { HttpError, shortText } from "./http";
import { findProduct } from "./products";
function choice(value: unknown, allowed: readonly string[]) {
  if (typeof value !== "string" || !allowed.includes(value))
    throw new HttpError(400, "Invalid selection");
  return value;
}
export function parseAI(value: unknown): AIAnalysis | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "object" || Array.isArray(value))
    throw new HttpError(400, "Invalid AI result");
  const d = value as Record<string, unknown>;
  return {
    surfaceSuggestion:
      d.surfaceSuggestion === null
        ? null
        : choice(d.surfaceSuggestion, SUBSTRATES),
    detectedContamination:
      d.detectedContamination === null
        ? null
        : choice(d.detectedContamination, CONTAMINATIONS),
    confidence:
      typeof d.confidence === "number" &&
      Number.isFinite(d.confidence) &&
      d.confidence >= 0 &&
      d.confidence <= 1
        ? d.confidence
        : 0,
    notes: shortText(d.notes, 1500),
  };
}
export function parseCase(d: Record<string, unknown>): CaseInput {
  const area =
    d.area === null || d.area === undefined || d.area === ""
      ? null
      : Number(d.area);
  if (
    area !== null &&
    (!Number.isFinite(area) || area <= 0 || area > 1_000_000)
  )
    throw new HttpError(400, "Invalid area");
  const waterParts = Number(d.waterParts ?? 0);
  if (!Number.isInteger(waterParts) || waterParts < 0 || waterParts > 30)
    throw new HttpError(400, "Invalid dilution");
  const photos = d.photos ?? [];
  if (!Array.isArray(photos) || photos.length > 5)
    throw new HttpError(400, "Up to five photos allowed");
  const pictures = photos.map((p) => {
    if (!p || typeof p !== "object") throw new HttpError(400, "Invalid photo");
    const data = shortText(p.data, 850_000);
    if (
      !/^data:image\/jpeg;base64,[A-Za-z0-9+/]+=*$/.test(data) ||
      !Buffer.from(data.split(",")[1], "base64")
        .subarray(0, 3)
        .equals(Buffer.from([0xff, 0xd8, 0xff]))
    )
      throw new HttpError(400, "Expected a JPEG photo");
    return { name: shortText(p.name, 120) || "photo.jpg", data };
  });
  return {
    substrate: choice(d.substrate, SUBSTRATES),
    contamination: choice(d.contamination, CONTAMINATIONS),
    language: choice(d.language || "sl", LANGUAGES) as CaseInput["language"],
    customerName: shortText(d.customerName),
    location: shortText(d.location, 300),
    contactInfo: shortText(d.contactInfo, 300),
    area,
    waterParts,
    acidResistant: d.acidResistant === true,
    uncoated: d.uncoated === true,
    confirmed: d.confirmed === true,
    consent: d.consent === true,
    aiAnalysis: parseAI(d.aiAnalysis),
    photos: pictures,
  };
}
export function parseRule(d: Record<string, unknown>): Rule {
  const id = shortText(d.id, 160);
  if (!id) throw new HttpError(400, "Missing rule ID");
  const product = findProduct(shortText(d.productId));
  if (!product) throw new HttpError(400, "Unknown Mavro product");
  const sourceUrl = shortText(d.sourceUrl, 1000);
  let url: URL;
  try {
    url = new URL(sourceUrl);
  } catch {
    throw new HttpError(400, "Invalid Mavro source");
  }
  if (
    url.protocol !== "https:" ||
    ![
      "mavro-int.com",
      "www.mavro-int.com",
      "mavro-int.shop",
      "www.mavro-int.shop",
    ].includes(url.hostname)
  )
    throw new HttpError(400, "Use an official Mavro source");
  const instructions = d.instructions as Rule["instructions"];
  for (const language of LANGUAGES) {
    const item = instructions?.[language];
    if (
      !item ||
      !Array.isArray(item.steps) ||
      item.steps.length < 1 ||
      item.steps.length > 15
    )
      throw new HttpError(400, "Supply instructions in all four languages");
    item.dilution = shortText(item.dilution, 800);
    item.safety = shortText(item.safety, 2500);
    item.steps = item.steps.map((s) => shortText(s, 1500));
    if (!item.dilution || !item.safety || item.steps.some((s) => !s))
      throw new HttpError(400, "Empty instruction");
  }
  const alternatives = d.alternatives ?? [];
  if (
    !Array.isArray(alternatives) ||
    alternatives.some((id) => typeof id !== "string" || !findProduct(id))
  )
    throw new HttpError(400, "Invalid alternatives");
  const checkedAt = shortText(d.checkedAt, 10);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(checkedAt) ||
    !Number.isFinite(Date.parse(checkedAt))
  )
    throw new HttpError(400, "Invalid source check date");
  const priority = Number(d.priority ?? 10);
  if (!Number.isInteger(priority) || priority < 1 || priority > 1000)
    throw new HttpError(400, "Invalid priority");
  return {
    id,
    priority,
    productId: product.id,
    substrate: choice(d.substrate, SUBSTRATES),
    contamination: choice(d.contamination, CONTAMINATIONS),
    sourceUrl,
    checkedAt,
    updatedAt: new Date().toISOString(),
    instructions,
    approved: d.approved === true,
    alternatives,
  };
}
