import type { CaseInput, Estimate, Rule, Treatment } from "./domain";
import { findProduct, type Product } from "./products";
export function estimateUsage(
  product: Product,
  area: number | null,
  waterParts: number,
): Estimate | null {
  if (
    !area ||
    !product.coverage ||
    !product.allowedWaterParts.includes(waterParts)
  )
    return null;
  // Published coverage has no dilution basis. Never multiply it by the dilution factor.
  // Only offer numeric estimates for undiluted use until a concentration-specific test is recorded.
  if (waterParts !== 0) return null;
  const { min, max, unit } = product.coverage;
  const amount = {
    min: Math.ceil((area / max) * 100) / 100,
    max: Math.ceil((area / min) * 100) / 100,
  };
  return {
    ...amount,
    unit,
    packs: product.packs.map((size) => ({
      size,
      count: Math.ceil(amount.max / size),
    })),
  };
}
export function resolveTreatment(
  input: CaseInput,
  rules: Rule[],
): Treatment | null {
  const rule = [...rules]
    .sort(
      (a, b) =>
        (a.priority ?? 10) - (b.priority ?? 10) || a.id.localeCompare(b.id),
    )
    .find(
      (r) =>
        r.approved &&
        r.substrate === input.substrate &&
        r.contamination === input.contamination,
    );
  if (!rule) return null;
  const product = findProduct(rule.productId);
  if (!product || !product.allowedWaterParts.includes(input.waterParts))
    return null;
  if (
    rule.productId === "cement-residue-remover" &&
    (!input.acidResistant || input.substrate === "Natural stone (soft)")
  )
    return null;
  if (["alu-clean", "rust-remover"].includes(rule.productId) && !input.uncoated)
    return null;
  const mineral = !["Aluminium", "Steel / iron", "Wood"].includes(
    input.substrate,
  );
  const protectionId =
    mineral && input.contamination === "Graffiti"
      ? "graffitiguard-permanent"
      : [
            "Brick",
            "Render / mineral plaster",
            "Concrete",
            "Natural stone (hard)",
            "Natural stone (soft)",
          ].includes(input.substrate)
        ? "mavroseal-wb-extra-strong"
        : null;
  return {
    ...rule.instructions[input.language],
    ruleId: rule.id,
    productId: product.id,
    product: product.name,
    sourceUrl: rule.sourceUrl,
    checkedAt: rule.checkedAt,
    updatedAt: rule.updatedAt,
    alternatives: rule.alternatives.filter((id) =>
      rules.some(
        (r) =>
          r.approved &&
          r.productId === id &&
          r.substrate === input.substrate &&
          r.contamination === input.contamination,
      ),
    ),
    protectionId,
    estimate: estimateUsage(product, input.area, input.waterParts),
  };
}
