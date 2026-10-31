import {
  CONTAMINATIONS,
  SUBSTRATES,
  type Instructions,
  type Localized,
  type Rule,
} from "./domain";
import { findProduct } from "./products";
const ready: Localized<string> = {
  sl: "Nerazredčeno",
  hr: "Nerazrijeđeno",
  en: "Undiluted",
  nl: "Onverdund",
};
const safety: Localized<string> = {
  sl: "Najprej preizkus na majhni površini. Uporabi zaščito po veljavnem SDS. Ne mešaj izdelkov. Zajemi odpadno vodo. Povzetek ne nadomesti TDS/SDS.",
  hr: "Prvo probno čišćenje. Koristi zaštitu prema važećem SDS-u. Ne miješaj proizvode. Prikupi otpadnu vodu. Sažetak ne zamjenjuje TDS/SDS.",
  en: "Test a small area first. Use protection required by the current SDS. Never mix products. Collect runoff. This summary does not replace the TDS/SDS.",
  nl: "Test eerst een klein oppervlak. Gebruik bescherming volgens het actuele VIB. Meng geen producten. Vang afvalwater op. Deze samenvatting vervangt het productblad/VIB niet.",
};
const entries: {
  productId: string;
  surfaces: readonly string[];
  contaminations: readonly string[];
  dilution?: Localized<string>;
  steps: Localized<string[]>;
}[] = [
  {
    productId: "facadeclean-hc",
    surfaces: SUBSTRATES.slice(0, 7),
    contaminations: CONTAMINATIONS.slice(0, 2),
    dilution: {
      sl: "Blago 1:2; srednje 1:1; močno nerazredčeno (izdelek:voda).",
      hr: "Blago 1:2; srednje 1:1; jako nerazrijeđeno (proizvod:voda).",
      en: "Light 1:2; medium 1:1; heavy undiluted (product:water).",
      nl: "Licht 1:2; middel 1:1; zwaar onverdund (product:water).",
    },
    steps: {
      sl: [
        "Nanesi z nizkim tlakom; navpično od spodaj navzgor.",
        "Če izpiraš, počakaj 20–45 minut. Zaščiti kovine in rastline.",
      ],
      hr: [
        "Nanesi niskim tlakom; okomito odozdo prema gore.",
        "Pri ispiranju pričekaj 20–45 minuta. Zaštiti metale i biljke.",
      ],
      en: [
        "Apply at low pressure; work upwards on vertical surfaces.",
        "If rinsing, wait 20–45 minutes. Protect metals and plants.",
      ],
      nl: [
        "Breng met lage druk aan; werk op verticale vlakken omhoog.",
        "Wacht bij naspoelen 20–45 minuten. Bescherm metalen en planten.",
      ],
    },
  },
  {
    productId: "uniclean-lf",
    surfaces: SUBSTRATES.slice(0, 7),
    contaminations: ["General dirt / traffic film", "Oil / grease"],
    dilution: {
      sl: "Nerazredčeno do 1:30 (izdelek:voda), glede na umazanijo.",
      hr: "Nerazrijeđeno do 1:30 (proizvod:voda), prema zaprljanosti.",
      en: "Undiluted up to 1:30 (product:water), according to soiling.",
      nl: "Onverdund tot 1:30 (product:water), afhankelijk van vervuiling.",
    },
    steps: {
      sl: [
        "Nanesi in pusti delovati nekaj minut.",
        "Po potrebi skrtači; izperi ali obriši z vlažno krpo.",
      ],
      hr: [
        "Nanesi i ostavi nekoliko minuta.",
        "Po potrebi očetkaj; isperi ili obriši vlažnom krpom.",
      ],
      en: [
        "Apply and leave for a few minutes.",
        "Agitate if needed; rinse or wipe with a damp cloth.",
      ],
      nl: [
        "Aanbrengen en enkele minuten laten werken.",
        "Zo nodig borstelen; naspoelen of vochtig afnemen.",
      ],
    },
  },
  {
    productId: "alu-clean",
    surfaces: ["Aluminium"],
    contaminations: [
      "General dirt / traffic film",
      "Rust / oxide",
      "Oil / grease",
    ],
    steps: {
      sl: [
        "Preizkusi, nanesi in takoj izperi; oceni učinek.",
        "Ne uporabljaj na vroči ali galvanizirani površini.",
      ],
      hr: [
        "Testiraj, nanesi i odmah isperi; provjeri učinak.",
        "Ne koristi na vrućoj ili galvaniziranoj površini.",
      ],
      en: [
        "Test, apply and rinse immediately; assess the result.",
        "Do not use on hot or electroplated surfaces.",
      ],
      nl: [
        "Test, aanbrengen en direct naspoelen; beoordeel resultaat.",
        "Niet op hete of elektrolytisch verzinkte oppervlakken.",
      ],
    },
  },
  {
    productId: "strip-off-plus",
    surfaces: SUBSTRATES,
    contaminations: ["Paint"],
    steps: {
      sl: [
        "Nanesi debelo plast; pusti 30–60 minut.",
        "Občutljivo podlago očisti s plastičnim strgalom; izperi.",
      ],
      hr: [
        "Nanesi debeli sloj; ostavi 30–60 minuta.",
        "Osjetljivu podlogu očisti plastičnom strugalicom; isperi.",
      ],
      en: [
        "Apply a thick layer; leave for 30–60 minutes.",
        "Use a plastic scraper on sensitive substrates; rinse.",
      ],
      nl: [
        "Breng een dikke laag aan; laat 30–60 minuten werken.",
        "Gebruik op gevoelige ondergronden een kunststof krabber; spoel na.",
      ],
    },
  },
  {
    productId: "graffiti-remover-gel",
    surfaces: SUBSTRATES.slice(0, 7),
    contaminations: ["Graffiti"],
    steps: {
      sl: [
        "Nanesi gel; pusti 20–60 minut in krtači.",
        "Izperi s toplo vodo; tlak prilagodi podlagi.",
      ],
      hr: [
        "Nanesi gel; ostavi 20–60 minuta i četkaj.",
        "Isperi toplom vodom; tlak prilagodi podlozi.",
      ],
      en: [
        "Apply gel; leave for 20–60 minutes and agitate.",
        "Rinse with hot water; adjust pressure to the substrate.",
      ],
      nl: [
        "Gel aanbrengen; 20–60 minuten laten werken en borstelen.",
        "Spoel met warm water; pas de druk aan de ondergrond aan.",
      ],
    },
  },
  {
    productId: "cement-residue-remover",
    surfaces: ["Brick", "Roof tiles"],
    contaminations: ["Efflorescence / cement veil"],
    steps: {
      sl: [
        "Le potrjeno kislinsko odporna podlaga.",
        "Nanesi, ohrani vlažno 5–60 minut, nato temeljito izperi.",
      ],
      hr: [
        "Samo potvrđeno kiselootporna podloga.",
        "Nanesi, održavaj vlažnim 5–60 minuta, zatim dobro isperi.",
      ],
      en: [
        "Use only on confirmed acid resistant material.",
        "Apply, keep wet for 5–60 minutes, then rinse thoroughly.",
      ],
      nl: [
        "Alleen op bevestigd zuurbestendig materiaal.",
        "Aanbrengen, 5–60 minuten vochtig houden en grondig naspoelen.",
      ],
    },
  },
  {
    productId: "oil-remover",
    surfaces: SUBSTRATES.slice(0, 7),
    contaminations: ["Oil / grease"],
    dilution: {
      sl: "Nerazredčeno ali 1:1 (izdelek:voda).",
      hr: "Nerazrijeđeno ili 1:1 (proizvod:voda).",
      en: "Undiluted or 1:1 (product:water).",
      nl: "Onverdund of 1:1 (product:water).",
    },
    steps: {
      sl: [
        "Nanesi z nizkim tlakom; ohrani vlažno 5–30 minut.",
        "Izperi; temperaturo in tlak prilagodi podlagi.",
      ],
      hr: [
        "Nanesi niskim tlakom; održavaj vlažnim 5–30 minuta.",
        "Isperi; temperaturu i tlak prilagodi podlozi.",
      ],
      en: [
        "Apply at low pressure; keep wet for 5–30 minutes.",
        "Rinse; match temperature and pressure to the substrate.",
      ],
      nl: [
        "Met lage druk aanbrengen; 5–30 minuten vochtig houden.",
        "Naspoelen; pas temperatuur en druk aan de ondergrond aan.",
      ],
    },
  },
  {
    productId: "rust-remover",
    surfaces: ["Steel / iron"],
    contaminations: ["Rust / oxide"],
    dilution: {
      sl: "Nerazredčeno do 1:10 (izdelek:voda).",
      hr: "Nerazrijeđeno do 1:10 (proizvod:voda).",
      en: "Undiluted up to 1:10 (product:water).",
      nl: "Onverdund tot 1:10 (product:water).",
    },
    steps: {
      sl: [
        "Nanesi in počakaj, da se rja raztopi.",
        "Izperi; pred barvanjem upoštevaj posebno navodilo TDS.",
      ],
      hr: [
        "Nanesi i pričekaj otapanje hrđe.",
        "Isperi; prije bojanja slijedi posebno pravilo TDS-a.",
      ],
      en: [
        "Apply and wait until rust dissolves.",
        "Rinse; before repainting follow the special TDS instruction.",
      ],
      nl: [
        "Aanbrengen en wachten tot roest oplost.",
        "Naspoelen; volg voor overschilderen de specifieke productinstructie.",
      ],
    },
  },
  {
    productId: "wood-renovator",
    surfaces: ["Wood"],
    contaminations: ["Weathered wood"],
    steps: {
      sl: [
        "Nanesi nerazredčeno na posivel les za 10–15 minut.",
        "Po potrebi nežno skrtači in izperi; ne redči.",
      ],
      hr: [
        "Nanesi nerazrijeđeno na posivjelo drvo 10–15 minuta.",
        "Po potrebi nježno očetkaj i isperi; ne razrjeđuj.",
      ],
      en: [
        "Apply undiluted to grey wood for 10–15 minutes.",
        "Gently agitate if needed and rinse; do not dilute.",
      ],
      nl: [
        "Onverdund op vergrijsd hout aanbrengen voor 10–15 minuten.",
        "Zo nodig voorzichtig borstelen en naspoelen; niet verdunnen.",
      ],
    },
  },
];
export const SEED_RULES: Rule[] = entries.flatMap((entry) =>
  entry.surfaces.flatMap((substrate) =>
    entry.contaminations.map((contamination) => {
      const product = findProduct(entry.productId)!;
      const instructions = Object.fromEntries(
        (["sl", "hr", "en", "nl"] as const).map((lang) => [
          lang,
          {
            dilution: entry.dilution?.[lang] || ready[lang],
            steps: entry.steps[lang],
            safety: safety[lang],
          },
        ]),
      ) as Localized<Instructions>;
      return {
        id: `${entry.productId}:${SUBSTRATES.indexOf(substrate as (typeof SUBSTRATES)[number])}:${CONTAMINATIONS.indexOf(contamination as (typeof CONTAMINATIONS)[number])}`,
        substrate,
        contamination,
        productId: entry.productId,
        instructions,
        approved: true,
        priority:
          entry.productId === "uniclean-lf" && contamination === "Oil / grease"
            ? 20
            : 10,
        sourceUrl: product.tdsUrl || product.sourceUrl,
        checkedAt: product.checkedAt,
        updatedAt: product.checkedAt,
        alternatives: entry.productId === "oil-remover" ? ["uniclean-lf"] : [],
      };
    }),
  ),
);
