export const LANGUAGES = ["sl", "hr", "en", "nl"] as const;
export type Language = (typeof LANGUAGES)[number];
export const SUBSTRATES = [
  "Concrete",
  "Brick",
  "Render / mineral plaster",
  "Natural stone (soft)",
  "Natural stone (hard)",
  "Roof tiles",
  "Paving stones",
  "Aluminium",
  "Wood",
  "Steel / iron",
] as const;
export const CONTAMINATIONS = [
  "Green deposits (algae/moss/lichen)",
  "Black mould",
  "General dirt / traffic film",
  "Efflorescence / cement veil",
  "Rust / oxide",
  "Oil / grease",
  "Graffiti",
  "Paint",
  "Weathered wood",
] as const;
export type Localized<T> = Record<Language, T>;
export type Instructions = {
  dilution: string;
  steps: string[];
  safety: string;
};
export type Rule = {
  id: string;
  substrate: string;
  contamination: string;
  productId: string;
  instructions: Localized<Instructions>;
  approved: boolean;
  priority: number;
  sourceUrl: string;
  checkedAt: string;
  updatedAt: string;
  alternatives: string[];
};
export type AIAnalysis = {
  surfaceSuggestion: string | null;
  detectedContamination: string | null;
  confidence: number;
  notes: string;
};
export type CaseInput = {
  contactRequested?: boolean;
  substrate: string;
  contamination: string;
  language: Language;
  customerName: string;
  location: string;
  contactInfo: string;
  area: number | null;
  waterParts: number;
  acidResistant: boolean;
  uncoated: boolean;
  confirmed: boolean;
  consent: boolean;
  aiAnalysis: AIAnalysis | null;
  photos: { name: string; data: string }[];
};
export type Estimate = {
  min: number;
  max: number;
  unit: "L" | "kg";
  packs: { size: number; count: number }[];
};
export type Treatment = Instructions & {
  ruleId: string;
  productId: string;
  product: string;
  sourceUrl: string;
  checkedAt: string;
  updatedAt: string;
  alternatives: string[];
  protectionId: string | null;
  estimate: Estimate | null;
};
export type SavedCase = {
  id: string;
  createdAt: string;
  input: Omit<CaseInput, "photos">;
  treatment: Treatment | null;
  review: "pending" | "approved" | "rejected";
  reviewNote: string;
  photos: { id: string; name: string }[];
};
