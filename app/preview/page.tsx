"use client";
import { useRef, useState, type DragEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { findProduct } from "@/lib/products";
import { SEED_RULES } from "@/lib/rule-seeds";
import { resolveTreatment } from "@/lib/recommendations";
import {
  SUBSTRATES,
  CONTAMINATIONS,
  LANGUAGES,
  type Language,
} from "@/lib/domain";
import { advisorCopy, advisorLanguageNames } from "@/lib/advisor-copy";
import { translations } from "@/lib/translations";
import s from "@/components/advisor.module.css";

export default function DesignPreview() {
  const [language, setLanguage] = useState<Language>("sl");
  const t = advisorCopy[language];
  const [step, setStep] = useState(0);
  const [photo, setPhoto] = useState("");
  const [surface, setSurface] = useState("");
  const [dirt, setDirt] = useState("");
  const [area, setArea] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<"file" | "read" | null>(null);
  const [dragging, setDragging] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  const labels = translations[language];
  const treatment = resolveTreatment(
    {
      substrate: surface,
      contamination: dirt,
      language,
      area: Number(area) > 0 && Number(area) <= 100000 ? Number(area) : null,
      waterParts: 0,
      acidResistant: false,
      uncoated: false,
      confirmed: true,
      consent: false,
      aiAnalysis: null,
      photos: [],
      customerName: "",
      location: "",
      contactInfo: "",
    },
    SEED_RULES,
  );
  const product = treatment ? findProduct(treatment.productId) : null;
  async function loadPhoto(selected?: File) {
    if (!selected) return;
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(selected.type) ||
      selected.size > 20_000_000
    ) {
      setError("file");
      return;
    }
    const data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(selected);
    }).catch(() => null);
    if (!data) {
      setError("read");
      return;
    }
    setPhoto(data);
    setConfirmed(false);
    setError(null);
    setStep(1);
  }
  function drop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    void loadPhoto(e.dataTransfer.files[0]);
  }
  function reset() {
    setStep(0);
    setPhoto("");
    setSurface("");
    setDirt("");
    setArea("");
    setConfirmed(false);
    setError(null);
  }
  return (
    <div className={s.app} lang={language}>
      <header className={s.header}>
        <Link
          href="/preview"
          aria-label={`Mavro AI · ${t.preview}`}
          className={s.brand}
        >
          <Image
            src="/mavro-logo.png"
            alt="Mavro"
            width={128}
            height={22}
            priority
          />
          <span>AI</span>
        </Link>
        <div className={s.headerTools}>
          <span className={s.preview}>{t.preview}</span>
          <label className={s.languagePicker}>
            <span className={s.hidden}>{t.language}</span>
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="9" />
              <ellipse cx="12" cy="12" rx="4" ry="9" />
              <path d="M3 12h18" />
            </svg>
            <select
              aria-label={t.language}
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
            >
              {LANGUAGES.map((code) => (
                <option key={code} value={code}>
                  {advisorLanguageNames[code]}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>
      <main className={`${s.main} ${step === 2 ? s.resultMain : ""}`}>
        <div className={s.heading}>
          <p className={s.progress}>
            {t.step} {step + 1} {t.of} 3
          </p>
          <h1>{t.titles[step]}</h1>
          <p>{t.subtitles[step]}</p>
        </div>
        {step === 0 && (
          <section className={s.card} aria-label={t.upload}>
            <div
              className={`${s.dropzone} ${dragging ? s.dragging : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={drop}
            >
              <svg
                width="36"
                height="36"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
                aria-hidden="true"
              >
                <rect x="3" y="5" width="18" height="16" rx="3" />
                <circle cx="8" cy="10" r="1.5" />
                <path d="m4 19 5-5 4 3 4-5 4 5M12 2v6m-3-3 3-3 3 3" />
              </svg>
              <h2>{t.upload}</h2>
              <p>{t.drop}</p>
              <button
                className={s.primary}
                onClick={() => file.current?.click()}
              >
                {t.choose} <span aria-hidden="true">＋</span>
              </button>
              <small>{t.formats}</small>
            </div>
            <div className={s.manual}>
              <button
                className={s.textButton}
                onClick={() => {
                  setStep(1);
                  setError(null);
                }}
              >
                {t.manual} <span aria-hidden="true">→</span>
              </button>
            </div>
          </section>
        )}
        {step === 1 && (
          <form
            className={`${s.card} ${s.form}`}
            onSubmit={(e) => {
              e.preventDefault();
              if (surface && dirt && confirmed) setStep(2);
            }}
          >
            {photo && (
              <div className={s.photoRow}>
                <Image
                  src={photo}
                  alt={t.photoAlt}
                  width={64}
                  height={64}
                  unoptimized
                />
                <div>
                  <strong>{t.photo}</strong>
                  <span>{t.privatePhoto}</span>
                </div>
                <button
                  type="button"
                  className={s.textButton}
                  onClick={() => file.current?.click()}
                >
                  {t.replace}
                </button>
              </div>
            )}
            <label htmlFor="preview-surface">{t.surface}</label>
            <select
              id="preview-surface"
              value={surface}
              required
              onChange={(e) => {
                setSurface(e.target.value);
                setConfirmed(false);
              }}
            >
              <option value="" disabled>
                {t.selectSurface}
              </option>
              {SUBSTRATES.map((v) => (
                <option key={v} value={v}>
                  {labels.surfaces[v]}
                </option>
              ))}
            </select>
            <label htmlFor="preview-dirt">{t.dirt}</label>
            <select
              id="preview-dirt"
              value={dirt}
              required
              onChange={(e) => {
                setDirt(e.target.value);
                setConfirmed(false);
              }}
            >
              <option value="" disabled>
                {t.selectDirt}
              </option>
              {CONTAMINATIONS.map((v) => (
                <option key={v} value={v}>
                  {labels.contaminations[v]}
                </option>
              ))}
            </select>
            <details className={s.optional}>
              <summary>
                {t.addArea} <span>{t.optional}</span>
              </summary>
              <label htmlFor="preview-area">{t.area}</label>
              <input
                id="preview-area"
                type="number"
                min="1"
                max="100000"
                placeholder={t.areaPlaceholder}
                value={area}
                onChange={(e) => setArea(e.target.value)}
              />
            </details>
            <label className={s.confirm}>
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                required
              />
              {t.confirm}
            </label>
            <button
              className={s.primary}
              disabled={!surface || !dirt || !confirmed}
            >
              {t.show} <span aria-hidden="true">→</span>
            </button>
            <p className={s.formNote}>{t.manualNote}</p>
          </form>
        )}
        {step === 2 && (
          <section className={`${s.card} ${s.output}`} aria-live="polite">
            <div className={s.outputSummary}>
              {photo && (
                <Image
                  src={photo}
                  alt={t.photoAlt}
                  width={62}
                  height={62}
                  unoptimized
                />
              )}
              <dl>
                <div>
                  <dt>{t.selectedSurface}</dt>
                  <dd>{labels.surfaces[surface]}</dd>
                </div>
                <div>
                  <dt>{t.selectedDirt}</dt>
                  <dd>{labels.contaminations[dirt]}</dd>
                </div>
              </dl>
              <button className={s.textButton} onClick={() => setStep(1)}>
                {t.edit}
              </button>
            </div>
            {treatment && product ? (
              <>
                <div className={s.outputHero}>
                  <div>
                    <span className={s.caption}>{t.product}</span>
                    <h2>{product.name}</h2>
                    <p>{product.description[language]}</p>
                  </div>
                  <a
                    className={s.productLink}
                    href={product.links?.[language] || product.sourceUrl}
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
                            min="1"
                            max="100000"
                            placeholder={t.areaPlaceholder}
                            value={area}
                            onChange={(e) => setArea(e.target.value)}
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
                          {treatment.estimate ? t.quantityNote : t.enterArea}
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
                      <li key={text}>
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
                  </div>
                </section>
                <div className={s.outputSources}>
                  <span>
                    {t.checked}{" "}
                    {new Intl.DateTimeFormat(language, {
                      dateStyle: "medium",
                      timeZone: "UTC",
                    }).format(new Date(treatment.checkedAt))}
                  </span>
                  <div>
                    <a
                      href={treatment.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
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
                <Link className={s.primary} href="/">
                  {t.openTool} <span aria-hidden="true">→</span>
                </Link>
              </div>
            )}
          </section>
        )}
        {error && (
          <p role="alert" className={s.error}>
            {error === "file" ? t.fileError : t.readError}
          </p>
        )}
        {step > 0 && (
          <div className={s.below}>
            <button className={s.textButton} onClick={() => setStep(step - 1)}>
              ← {t.back}
            </button>
            {step === 2 && (
              <button className={s.textButton} onClick={reset}>
                {t.newCase}
              </button>
            )}
          </div>
        )}
        <input
          ref={file}
          className={s.hidden}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          aria-label={t.photoAlt}
          onChange={(e) => {
            void loadPhoto(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <footer className={s.footer}>{t.footer}</footer>
      </main>
    </div>
  );
}
