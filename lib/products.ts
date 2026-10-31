import type { Localized, Language } from "./domain";
export type Product = {
  id: string;
  name: string;
  sku: string;
  sourceUrl: string;
  tdsUrl?: string;
  checkedAt: string;
  description: Localized<string>;
  coverage?: { min: number; max: number; unit: "L" | "kg"; basis: "product" };
  packs: number[];
  allowedWaterParts: number[];
  links?: Partial<Record<Language, string>>;
};
const text = (
  sl: string,
  hr: string,
  en: string,
  nl: string,
): Localized<string> => ({ sl, hr, en, nl });
const checkedAt = "2026-10-31",
  shop = "https://mavro-int.shop/en/";
export const PRODUCT_CATALOG: Product[] = [
  {
    id: "facadeclean-hc",
    name: "FacadeClean HC",
    sku: "57652",
    sourceUrl: shop + "facadeclean-hc",
    checkedAt,
    description: text(
      "Organske obloge na mineralnih podlagah.",
      "Organske naslage na mineralnim podlogama.",
      "Organic deposits on mineral substrates.",
      "Organische aanslag op minerale ondergronden.",
    ),
    coverage: { min: 5, max: 15, unit: "L", basis: "product" },
    packs: [10],
    allowedWaterParts: [0, 1, 2],
    links: {
      sl: "https://mavro-int.shop/sl/cistilo-za-fasado-koncentrat",
      hr: "https://mavro-int.shop/hr/sredstvo-za-ciscenje-fasade-koncentrat",
    },
  },
  {
    id: "uniclean-lf",
    name: "Uniclean Low Foaming",
    sku: "54110",
    sourceUrl: shop + "uniclean-low-foaming",
    checkedAt,
    description: text(
      "Nizkopeneče univerzalno čistilo.",
      "Univerzalno sredstvo s malo pjene.",
      "Low foaming general cleaner.",
      "Laagschuimende allesreiniger.",
    ),
    packs: [1, 5, 10],
    allowedWaterParts: [0, 1, 5, 10, 20, 30],
  },
  {
    id: "alu-clean",
    name: "Alu Clean",
    sku: "57927",
    sourceUrl: shop + "alu-clean",
    checkedAt,
    tdsUrl:
      "https://mavro-int.shop/pub/media/wysiwyg/Documentation_en/Alu_Clean_TDS_20230608_EN_1.pdf",
    description: text(
      "Kislo čistilo za aluminij in oksidacijo.",
      "Kiselo sredstvo za aluminij i oksidaciju.",
      "Acidic aluminium and oxide cleaner.",
      "Zure aluminium- en oxidereiniger.",
    ),
    coverage: { min: 5, max: 10, unit: "L", basis: "product" },
    packs: [1, 5, 10],
    allowedWaterParts: [0],
  },
  {
    id: "strip-off-plus",
    name: "Strip-Off Plus",
    sku: "57633",
    sourceUrl: shop + "strip-off-plus",
    checkedAt,
    description: text(
      "Odstranjevanje več plasti barve.",
      "Uklanjanje više slojeva boje.",
      "Removal of multiple paint layers.",
      "Verwijderen van meerdere verflagen.",
    ),
    coverage: { min: 1, max: 4, unit: "kg", basis: "product" },
    packs: [],
    allowedWaterParts: [0],
  },
  {
    id: "graffiti-remover-gel",
    name: "Graffiti Remover Gel",
    sku: "57608",
    sourceUrl: shop + "graffiti-remover-gel",
    checkedAt,
    description: text(
      "Gel za odstranjevanje grafitov.",
      "Gel za uklanjanje grafita.",
      "Gel for graffiti removal.",
      "Gel voor graffitiverwijdering.",
    ),
    coverage: { min: 5, max: 10, unit: "L", basis: "product" },
    packs: [],
    allowedWaterParts: [0],
  },
  {
    id: "cement-residue-remover",
    name: "Cement Residue Remover",
    sku: "57655",
    sourceUrl: shop + "cement-residue-remover",
    checkedAt,
    tdsUrl:
      "https://mavro-int.shop/pub/media/wysiwyg/Documentation_en/Cement_Residue_Remover_TDS_20200915_EN_2.pdf",
    description: text(
      "Kisli odstranjevalec cementa; le kislinsko odporne podlage.",
      "Kiselo sredstvo za cement; samo podloge otporne na kiseline.",
      "Acidic cement remover; acid resistant substrates only.",
      "Zure cementverwijderaar; alleen zuurbestendige ondergronden.",
    ),
    coverage: { min: 5, max: 15, unit: "L", basis: "product" },
    packs: [0.5, 1, 5, 10],
    allowedWaterParts: [0],
    links: {
      sl: "https://mavro-int.shop/sl/odstranjevalec-cementa",
      hr: "https://mavro-int.shop/hr/sredstvo-za-ciscenje-cementa",
    },
  },
  {
    id: "oil-remover",
    name: "Oil Remover",
    sku: "57643",
    sourceUrl:
      "https://mavro-int.shop/sl/sredstvo-odstranjevanje-oljnih-madezev",
    checkedAt,
    description: text(
      "Oljni madeži na mineralnih podlagah.",
      "Uljne mrlje na mineralnim podlogama.",
      "Oil deposits on mineral substrates.",
      "Olievlekken op minerale ondergronden.",
    ),
    coverage: { min: 3, max: 5, unit: "L", basis: "product" },
    packs: [1, 5, 10],
    allowedWaterParts: [0, 1],
    links: {
      hr: "https://mavro-int.shop/hr/oil-remover-sredstvo-za-uklanjanje-uljnih-mrlja",
    },
  },
  {
    id: "rust-remover",
    name: "Rust Remover",
    sku: "57850",
    sourceUrl: shop + "rust-remover",
    checkedAt,
    description: text(
      "Rja na jeklu in železu.",
      "Hrđa na čeliku i željezu.",
      "Rust on steel and iron.",
      "Roest op staal en ijzer.",
    ),
    coverage: { min: 3, max: 5, unit: "L", basis: "product" },
    packs: [5, 10],
    allowedWaterParts: [0, 1, 5, 10],
  },
  {
    id: "wood-renovator",
    name: "Wood Renovator",
    sku: "57330",
    sourceUrl: shop + "wood-renovator",
    checkedAt,
    tdsUrl:
      "https://mavro-int.shop/pub/media/wysiwyg/Documentation_en/Wood_Renovator_TDS_20240122_EN.pdf",
    description: text(
      "Obnova posivelega lesa.",
      "Obnova posivjelog drva.",
      "Restoring weathered grey wood.",
      "Herstellen van vergrijsd hout.",
    ),
    coverage: { min: 5, max: 10, unit: "L", basis: "product" },
    packs: [1],
    allowedWaterParts: [0],
  },
  {
    id: "mavroseal-wb-extra-strong",
    name: "MavroSeal WB Extra Strong",
    sku: "54080",
    sourceUrl: shop + "mavroseal-wb-extra-strong",
    checkedAt,
    description: text(
      "Impregnacija suhih vpojnih mineralnih površin; primernost potrdi Mavro.",
      "Impregnacija suhih upojnih mineralnih površina; prikladnost potvrđuje Mavro.",
      "Impregnation of dry absorbent mineral surfaces; confirm suitability with Mavro.",
      "Impregneren van droge zuigende minerale ondergronden; bevestig geschiktheid met Mavro.",
    ),
    coverage: { min: 1, max: 2, unit: "L", basis: "product" },
    packs: [10, 25, 210, 1000],
    allowedWaterParts: [0],
  },
  {
    id: "graffitiguard-permanent",
    name: "Graffitiguard Permanent",
    sku: "57605",
    sourceUrl: shop + "graffitiguard-permanent",
    checkedAt,
    description: text(
      "Zaščita poroznih površin pred grafiti po čiščenju in sušenju.",
      "Zaštita poroznih površina od grafita nakon čišćenja i sušenja.",
      "Anti-graffiti protection on porous surfaces after cleaning and drying.",
      "Antigraffitibescherming op poreuze oppervlakken na reinigen en drogen.",
    ),
    packs: [1, 5, 10, 25, 210, 1000],
    allowedWaterParts: [0],
  },
];
export function findProduct(id: string): Product | null {
  return PRODUCT_CATALOG.find((p) => p.id === id || p.name === id) ?? null;
}
export function getProductUrl(
  product: Product,
  medium = "recommendation",
  language: Language = "en",
): string {
  const url = new URL(product.links?.[language] || product.sourceUrl);
  url.searchParams.set("utm_source", "mavro-ai");
  url.searchParams.set("utm_medium", medium);
  return url.toString();
}
