import test from "node:test";
import assert from "node:assert/strict";
import { LANGUAGES, type CaseInput } from "../lib/domain";
import { PRODUCT_CATALOG, findProduct } from "../lib/products";
import { SEED_RULES } from "../lib/rule-seeds";
import { estimateUsage, resolveTreatment } from "../lib/recommendations";
import { parseCase, parseRule } from "../lib/validation";
const input = (overrides: Partial<CaseInput> = {}): CaseInput => ({
  substrate: "Concrete",
  contamination: "Green deposits (algae/moss/lichen)",
  language: "sl",
  customerName: "",
  location: "",
  contactInfo: "",
  area: 100,
  waterParts: 0,
  acidResistant: false,
  uncoated: false,
  confirmed: true,
  consent: true,
  aiAnalysis: null,
  photos: [],
  ...overrides,
});
test("wood paint is a paint-removal workflow, never Wood Renovator", () => {
  assert.equal(
    resolveTreatment(
      input({ substrate: "Wood", contamination: "Paint" }),
      SEED_RULES,
    )?.productId,
    "strip-off-plus",
  );
  assert.equal(
    resolveTreatment(
      input({ substrate: "Wood", contamination: "Graffiti" }),
      SEED_RULES,
    ),
    null,
  );
});
test("aluminium graffiti does not fall through to acidic aluminium cleaning", () =>
  assert.equal(
    resolveTreatment(
      input({
        substrate: "Aluminium",
        contamination: "Graffiti",
        uncoated: true,
      }),
      SEED_RULES,
    ),
    null,
  ));
test("acidic cement treatment is blocked on soft stone and unknown acid resistance", () => {
  assert.equal(
    resolveTreatment(
      input({
        substrate: "Natural stone (soft)",
        contamination: "Efflorescence / cement veil",
        acidResistant: true,
      }),
      SEED_RULES,
    ),
    null,
  );
  assert.equal(
    resolveTreatment(
      input({
        substrate: "Brick",
        contamination: "Efflorescence / cement veil",
      }),
      SEED_RULES,
    ),
    null,
  );
  assert.equal(
    resolveTreatment(
      input({
        substrate: "Brick",
        contamination: "Efflorescence / cement veil",
        acidResistant: true,
      }),
      SEED_RULES,
    )?.productId,
    "cement-residue-remover",
  );
});
test("bare metal confirmation is required for acid cleaners; paint removal remains available", () => {
  assert.equal(
    resolveTreatment(
      input({ substrate: "Aluminium", contamination: "Rust / oxide" }),
      SEED_RULES,
    ),
    null,
  );
  assert.equal(
    resolveTreatment(
      input({
        substrate: "Aluminium",
        contamination: "Rust / oxide",
        uncoated: true,
      }),
      SEED_RULES,
    )?.productId,
    "alu-clean",
  );
  assert.equal(
    resolveTreatment(
      input({ substrate: "Aluminium", contamination: "Paint" }),
      SEED_RULES,
    )?.productId,
    "strip-off-plus",
  );
});
test("rust on unspecified stone needs technical review", () =>
  assert.equal(
    resolveTreatment(input({ contamination: "Rust / oxide" }), SEED_RULES),
    null,
  ));
test("calculator preserves kg and does not infer dilution coverage", () => {
  const strip = findProduct("strip-off-plus")!;
  assert.deepEqual(estimateUsage(strip, 100, 0), {
    min: 25,
    max: 100,
    unit: "kg",
    packs: [],
  });
  assert.equal(estimateUsage(findProduct("facadeclean-hc")!, 100, 2), null);
  assert.equal(estimateUsage(findProduct("uniclean-lf")!, 100, 0), null);
  const estimate = estimateUsage(findProduct("facadeclean-hc")!, 100, 0)!;
  assert.equal(estimate.min, 6.67);
  assert.equal(estimate.max, 20);
  assert.deepEqual(estimate.packs, [{ size: 10, count: 2 }]);
});
test("only published matching alternatives are returned", () => {
  const rules = structuredClone(SEED_RULES),
    index = rules.findIndex(
      (r) => r.productId === "facadeclean-hc" && r.substrate === "Concrete",
    );
  rules[index].alternatives = ["cement-residue-remover", "uniclean-lf"];
  assert.deepEqual(resolveTreatment(input(), rules)?.alternatives, []);
  rules[index].approved = false;
  assert.equal(resolveTreatment(input(), rules), null);
});
test("all rules reference real catalog items, official sources and all four languages", () => {
  const pairs = new Set<string>();
  for (const rule of SEED_RULES) {
    assert.ok(findProduct(rule.productId));
    const pair = rule.substrate + rule.contamination + rule.productId;
    assert.ok(!pairs.has(pair));
    pairs.add(pair);
    for (const language of LANGUAGES) {
      assert.ok(rule.instructions[language].steps.length > 0);
      assert.ok(rule.instructions[language].safety);
    }
    const parsed = parseRule(rule);
    assert.equal(parsed.productId, rule.productId);
    assert.ok(Number.isFinite(Date.parse(parsed.updatedAt)));
  }
  for (const product of PRODUCT_CATALOG) {
    assert.match(product.sourceUrl, /^https:\/\/mavro-int\.shop\//);
    assert.equal(product.checkedAt, "2026-10-31");
  }
});
test("input validation rejects malformed selections, negative area and arbitrary file content", () => {
  assert.throws(() => parseCase({ ...input(), substrate: "unknown" }));
  assert.throws(() => parseCase({ ...input(), area: -1 }));
  assert.throws(() =>
    parseCase({
      ...input(),
      photos: [{ name: "fake.jpg", data: "data:image/jpeg;base64,SGVsbG8=" }],
    }),
  );
  assert.throws(() =>
    parseRule({ ...SEED_RULES[0], sourceUrl: "https://attacker.example/fake" }),
  );
});

test("oil cleaning offers only the source-matched LF alternative", () => {
  const treatment = resolveTreatment(
    input({ contamination: "Oil / grease" }),
    SEED_RULES,
  )!;
  assert.equal(treatment.productId, "oil-remover");
  assert.deepEqual(treatment.alternatives, ["uniclean-lf"]);
});
