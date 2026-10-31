import type { Language, Treatment } from "@/lib/domain";
import { findProduct, getProductUrl } from "@/lib/products";
import { copy } from "@/lib/ui-copy";
import { translations } from "@/lib/translations";
export function TreatmentResult({
  treatment,
  language,
}: {
  treatment: Treatment;
  language: Language;
}) {
  const product = findProduct(treatment.productId)!,
    t = translations[language];
  const protection = treatment.protectionId
    ? findProduct(treatment.protectionId)
    : null;
  return (
    <article className="treatment-result">
      <div className="result-heading">
        <span className="eyebrow">{t.step4.recommendedProduct}</span>
        <h3>{treatment.product}</h3>
        <p>{product.description[language]}</p>
      </div>
      <div className="result-body">
        <p className="notice">{copy(language, "review")}</p>
        <h4>{t.step4.dilution}</h4>
        <p>{treatment.dilution}</p>
        <h4>{t.step4.applicationSteps}</h4>
        <ol>
          {treatment.steps.map((step, index) => (
            <li key={index}>{step}</li>
          ))}
        </ol>
        <h4>{t.step4.safety}</h4>
        <p>{treatment.safety}</p>
        <div className="panel">
          <h4>{copy(language, "estimate")}</h4>
          {treatment.estimate ? (
            <>
              <strong className="quantity">
                {treatment.estimate.min}–{treatment.estimate.max}{" "}
                {treatment.estimate.unit}
              </strong>
              <p className="small">{copy(language, "packs")}</p>
              <div className="pack-options">
                {treatment.estimate.packs.map((pack) => (
                  <span key={pack.size}>
                    {pack.count} × {pack.size} {treatment.estimate!.unit}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <p>{copy(language, "noEstimate")}</p>
          )}
        </div>
        <a
          className="button primary"
          href={getProductUrl(product, "recommendation", language)}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t.step4.orderButton(product.name)} ↗
        </a>
        <p className="small muted">{copy(language, "price")}</p>
        <div className="source">
          <a
            href={treatment.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {copy(language, "source")} ↗
          </a>
          <span>
            {copy(language, "checked")}: {treatment.checkedAt}
          </span>
        </div>
        {protection && (
          <div className="panel">
            <h4>{copy(language, "protection")}</h4>
            <strong>{protection.name}</strong>
            <p>{protection.description[language]}</p>
            <a
              href={getProductUrl(protection, "protection", language)}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t.step4.viewAlt} ↗
            </a>
          </div>
        )}
        {treatment.alternatives.length > 0 && (
          <div>
            <h4>{t.step4.alternatives}</h4>
            {treatment.alternatives.map((id) => {
              const alt = findProduct(id);
              return alt ? (
                <p key={id}>
                  <a
                    href={getProductUrl(alt, "alternative", language)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {alt.name} ↗
                  </a>
                </p>
              ) : null;
            })}
          </div>
        )}
      </div>
    </article>
  );
}
