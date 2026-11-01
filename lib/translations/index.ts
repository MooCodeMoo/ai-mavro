import { en } from "./en";
import { nl } from "./nl";
import { sl } from "./sl";
import { hr } from "./hr";

export type { TranslationType } from "./en";
export type LanguageCode = "en" | "nl" | "sl" | "hr";

export const translations = { en, nl, sl, hr };

export const languageNames: Record<LanguageCode, string> = {
  hr: "🇭🇷 Hrvatski",
  en: "🇬🇧 English",
  nl: "🇳🇱 Nederlands",
  sl: "🇸🇮 Slovenščina",
};
