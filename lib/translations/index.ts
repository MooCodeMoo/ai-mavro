import { en } from "./en";
import { nl } from "./nl";
import { sl } from "./sl";

export type { TranslationType } from "./en";
export type LanguageCode = "en" | "nl" | "sl";

export const translations = { en, nl, sl };

export const languageNames: Record<LanguageCode, string> = {
  en: "🇬🇧 English",
  nl: "🇳🇱 Nederlands",
  sl: "🇸🇮 Slovenščina",
};
