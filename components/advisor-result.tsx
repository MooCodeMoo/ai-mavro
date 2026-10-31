import Image from "next/image";
import type { CaseInput, Treatment } from "@/lib/domain";
import { findProduct, getProductUrl } from "@/lib/products";
import { advisorCopy } from "@/lib/advisor-copy";
import { copy } from "@/lib/ui-copy";
import { translations } from "@/lib/translations";
import s from "./advisor.module.css";
export function AdvisorResult({
  input,
  treatment,
  busy,
  refreshing,
  onEdit,
  onArea,
  onWater,
}: {
  input: CaseInput;
  treatment: Treatment | null;
  busy: boolean;
  refreshing: boolean;
  onEdit: () => void;
  onArea: (area: number | null) => void;
  onWater: (parts: number) => void;
}) {
  const language = input.language,
    t = advisorCopy[language],
    labels = translations[language];
  const product = treatment ? findProduct(treatment.productId) : null;
  const protection = treatment?.protectionId
    ? findProduct(treatment.protectionId)
    : null;
  return (
    <section
      className={`${s.card} ${s.output}`}
      aria-label={labels.step4.title}
    >
      <div className={s.outputSummary}>
        {input.photos[0] && (
          <Image
            src={input.photos[0].data}
            alt={t.photoAlt}
            width={62}
            height={62}
            unoptimized
          />
        )}
        <dl>
          <div>
            <dt>{t.selectedSurface}</dt>
            <dd>{labels.surfaces[input.substrate]}</dd>
          </div>
          <div>
            <dt>{t.selectedDirt}</dt>
            <dd>{labels.contaminations[input.contamination]}</dd>
          </div>
        </dl>
        <button disabled={busy} className={s.textButton} onClick={onEdit}>
          {t.edit}
        </button>
      </div>
      {treatment && product ? (
        <>
          <div className={s.outputHero}>
            <div>
              <span className={s.caption}>{t.product}</span>
              <h2>{treatment.product}</h2>
              <p>{product.description[language]}</p>
            </div>
            <a
              className={s.productLink}
              href={getProductUrl(product, "recommendation", language)}
              target="_blank"
              rel="noreferrer"
            >
              {t.productLink} <span aria-hidden="true">↗</span>
            </a>
          </div>
          <div className={s.facts}>
            <section>
              <h3>{t.dilution}</h3>
              <p className={s.dilution}>{treatment.dilution}</p>
              {product.allowedWaterParts.length > 1 && (
                <div className={s.waterControl}>
                  <label htmlFor="water-parts">{copy(language, "water")}</label>
                  <select
                    id="water-parts"
                    disabled={busy}
                    value={input.waterParts}
                    onChange={(e) => onWater(Number(e.target.value))}
                  >
                    {product.allowedWaterParts.map((parts) => (
                      <option value={parts} key={parts}>
                        1:{parts}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </section>
            <section>
              <h3>{t.consumption}</h3>
              {product.coverage ? (
                <>
                  <label htmlFor="result-area" className={s.hidden}>
                    {t.area}
                  </label>
                  <div className={s.resultArea}>
                    <input
                      id="result-area"
                      type="number"
                      min="0.01"
                      max="1000000"
                      step="any"
                      disabled={busy}
                      placeholder={t.areaPlaceholder}
                      value={input.area ?? ""}
                      onChange={(e) =>
                        onArea(e.target.value ? Number(e.target.value) : null)
                      }
                    />
                    <span>m²</span>
                    {treatment.estimate && (
                      <strong>
                        {new Intl.NumberFormat(language).format(
                          treatment.estimate.min,
                        )}
                        –
                        {new Intl.NumberFormat(language).format(
                          treatment.estimate.max,
                        )}{" "}
                        {treatment.estimate.unit}
                      </strong>
                    )}
                  </div>
                  <p className={s.quantityNote}>
                    {treatment.estimate
                      ? t.quantityNote
                      : refreshing
                        ? copy(language, "loading")
                        : input.waterParts !== 0
                          ? copy(language, "noEstimate")
                          : t.enterArea}
                  </p>
                </>
              ) : (
                <p className={s.quantityNote}>{t.noCoverage}</p>
              )}
            </section>
          </div>
          <div className={s.outputProcess}>
            <h3>{t.process}</h3>
            <p className={s.processNote}>{t.processNote}</p>
            <ol>
              {treatment.steps.map((text, i) => (
                <li key={`${i}-${text}`}>
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  <p>{text}</p>
                </li>
              ))}
            </ol>
          </div>
          <section className={s.outputSafety}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <path d="m12 3 9 4v5c0 5-9 9-9 9S3 17 3 12V7Z" />
              <path d="m8 12 3 3 5-6" />
            </svg>
            <div>
              <h3>{t.beforeUse}</h3>
              <p>{t.safetyIntro}</p>
              <p>{treatment.safety}</p>
              <p>{copy(language, "review")}</p>
            </div>
          </section>
          {(protection || treatment.alternatives.length > 0) && (
            <details className={s.related}>
              <summary>
                {labels.step4.alternatives} / {copy(language, "protection")}
              </summary>
              {treatment.alternatives.map((id) => {
                const p = findProduct(id);
                return p ? (
                  <p key={id}>
                    <a
                      href={getProductUrl(p, "alternative", language)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {p.name} ↗
                    </a>
                  </p>
                ) : null;
              })}
              {protection && (
                <p>
                  <a
                    href={getProductUrl(protection, "protection", language)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {protection.name} ↗
                  </a>
                  <br />
                  {protection.description[language]}
                </p>
              )}
            </details>
          )}
          <div className={s.outputSources}>
            <span>
              {t.checked}{" "}
              {new Intl.DateTimeFormat(language, {
                dateStyle: "medium",
                timeZone: "UTC",
              }).format(new Date(treatment.checkedAt))}
            </span>
            <div>
              <a href={treatment.sourceUrl} target="_blank" rel="noreferrer">
                {t.source} ↗
              </a>
              {product.tdsUrl && (
                <a href={product.tdsUrl} target="_blank" rel="noreferrer">
                  {t.technical} ↗
                </a>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className={s.review}>
          <h2>{t.reviewTitle}</h2>
          <p>{t.reviewText}</p>
        </div>
      )}
    </section>
  );
}
