"use client";
import { validContact } from "@/lib/contact-validation";
import Image from "next/image";
import Link from "next/link";
import { useState, useRef } from "react";
import {
  LANGUAGES,
  SUBSTRATES,
  CONTAMINATIONS,
  type Language,
} from "@/lib/domain";
import { advisorCopy, advisorLanguageNames } from "@/lib/advisor-copy";
import { copy } from "@/lib/ui-copy";
import { useAdvisor } from "@/components/use-advisor";
import { AdvisorResult } from "@/components/advisor-result";
import s from "@/components/advisor.module.css";
export default function Home() {
  const a = useAdvisor();
  const chooser = useRef<HTMLInputElement>(null),
    camera = useRef<HTMLInputElement>(null);
  const { input, lang, t, step, busy, update } = a;
  const c = advisorCopy[lang],
    locked = !!busy;
  const [contactOpen, setContactOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  return (
    <div className={s.app} lang={lang}>
      <header className={s.header}>
        <Link href="/" className={s.brand} aria-label="Mavro AI">
          <Image
            src="/mavro-logo.png"
            alt="Mavro"
            width={128}
            height={22}
            priority
          />
          <span>AI</span>
        </Link>
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
            id="language"
            aria-label={t.language}
            disabled={locked}
            value={lang}
            onChange={(e) => update("language", e.target.value as Language)}
          >
            {LANGUAGES.map((code) => (
              <option key={code} value={code}>
                {advisorLanguageNames[code]}
              </option>
            ))}
          </select>
        </label>
      </header>
      <main className={`${s.main} ${step === 2 ? s.resultMain : ""}`}>
        <div className={s.heading}>
          <p className={s.progress}>
            {c.step} {step + 1} {c.of} 3
          </p>
          <h1>{c.titles[step]}</h1>
          <p>{c.subtitles[step]}</p>
        </div>
        {step === 0 && (
          <section className={s.card} aria-label={c.upload}>
            <div
              className={`${s.dropzone} ${dragging ? s.dragging : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                if (!locked) setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                if (!locked) void a.addPhotos(e.dataTransfer.files);
              }}
            >
              {input.photos.length === 0 ? (
                <>
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
                  <h2>{c.upload}</h2>
                  <p>{c.drop}</p>
                </>
              ) : (
                <div className={s.photos}>
                  {input.photos.map((photo, i) => (
                    <div className={s.photoItem} key={`${photo.name}-${i}`}>
                      <Image
                        src={photo.data}
                        alt={photo.name}
                        width={240}
                        height={160}
                        unoptimized
                      />
                      <button
                        className={s.removePhoto}
                        disabled={locked}
                        aria-label={`${t.step1.removeImage} ${i + 1}`}
                        onClick={() => a.removePhoto(i)}
                      >
                        ×
                      </button>
                      {a.analyses[i] && (
                        <div className={s.aiResult}>
                          <strong>
                            {Math.round(a.analyses[i]!.confidence * 100)}% ·{" "}
                            {t.surfaces[
                              a.analyses[i]!.surfaceSuggestion || ""
                            ] || "—"}
                          </strong>
                          <p>
                            {t.contaminations[
                              a.analyses[i]!.detectedContamination || ""
                            ] || "—"}
                          </p>
                          <p lang={a.analysisLanguage}>
                            {a.analyses[i]!.notes}
                          </p>
                          {a.analysisLanguage !== lang && (
                            <small>
                              {copy(lang, "aiNotes")} ·{" "}
                              {advisorLanguageNames[a.analysisLanguage]}
                            </small>
                          )}
                          <button
                            className={s.textButton}
                            disabled={locked}
                            onClick={() => {
                              a.chooseAnalysis(a.analyses[i]!);
                              a.setStep(1);
                            }}
                          >
                            {copy(lang, "choose")} →
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <button
                className={s.primary}
                disabled={locked || input.photos.length >= 5}
                onClick={() => chooser.current?.click()}
              >
                {busy === "photos"
                  ? copy(lang, "loading")
                  : input.photos.length
                    ? t.step1.addMore(input.photos.length)
                    : c.choose}
                <span aria-hidden="true">＋</span>
              </button>
              <button
                className={s.textButton}
                disabled={locked || input.photos.length >= 5}
                onClick={() => camera.current?.click()}
              >
                {t.step1.takePhoto}
              </button>
              <small>
                {c.formats} · {copy(lang, "limitPhotos")}
              </small>
            </div>
            {input.photos.length > 0 && (
              <div className={s.aiActions}>
                <p>{copy(lang, "privacy")}</p>
                <button
                  className={s.primary}
                  disabled={locked}
                  onClick={() => void a.analyze()}
                >
                  {busy === "ai" ? t.step1.analyzing : t.step1.analyzeAI}{" "}
                  <span aria-hidden="true">✧</span>
                </button>
                <p>{copy(lang, "uncertainty")}</p>
              </div>
            )}
            <div className={s.manual}>
              <button
                className={s.textButton}
                disabled={locked}
                onClick={() => a.setStep(1)}
              >
                {input.photos.length ? copy(lang, "continue") : c.manual} →
              </button>
            </div>
          </section>
        )}
        {step === 1 && (
          <form
            className={`${s.card} ${s.form}`}
            onSubmit={(e) => {
              e.preventDefault();
              if (input.substrate && input.contamination && input.confirmed)
                a.setStep(2);
            }}
          >
            <fieldset disabled={locked} className={s.fieldset}>
              {input.photos.length > 0 && (
                <div className={s.photoRow}>
                  <Image
                    src={input.photos[0].data}
                    alt={c.photoAlt}
                    width={64}
                    height={64}
                    unoptimized
                  />
                  <div>
                    <strong>
                      {t.step1.imagesSelected(input.photos.length)}
                    </strong>
                  </div>
                  <button
                    type="button"
                    className={s.textButton}
                    onClick={() => a.setStep(0)}
                  >
                    {c.replace}
                  </button>
                </div>
              )}
              <label htmlFor="substrate">{c.surface}</label>
              <select
                id="substrate"
                value={input.substrate}
                required
                onChange={(e) => update("substrate", e.target.value)}
              >
                <option value="" disabled>
                  {c.selectSurface}
                </option>
                {SUBSTRATES.map((value) => (
                  <option value={value} key={value}>
                    {t.surfaces[value]}
                  </option>
                ))}
              </select>
              <label htmlFor="contamination">{c.dirt}</label>
              <select
                id="contamination"
                value={input.contamination}
                required
                onChange={(e) => update("contamination", e.target.value)}
              >
                <option value="" disabled>
                  {c.selectDirt}
                </option>
                {CONTAMINATIONS.map((value) => (
                  <option value={value} key={value}>
                    {t.contaminations[value]}
                  </option>
                ))}
              </select>
              <details className={s.optional}>
                <summary>
                  {c.addArea} <span>{c.optional}</span>
                </summary>
                <label htmlFor="area">{copy(lang, "area")}</label>
                <input
                  id="area"
                  type="number"
                  min="0.01"
                  max="1000000"
                  step="any"
                  placeholder={c.areaPlaceholder}
                  value={input.area ?? ""}
                  onChange={(e) =>
                    update(
                      "area",
                      e.target.value ? Number(e.target.value) : null,
                    )
                  }
                />
              </details>
              {input.contamination === "Efflorescence / cement veil" && (
                <label className={s.confirm}>
                  <input
                    type="checkbox"
                    checked={input.acidResistant}
                    onChange={(e) => update("acidResistant", e.target.checked)}
                  />
                  {copy(lang, "acid")}
                </label>
              )}
              {["Aluminium", "Steel / iron"].includes(input.substrate) &&
                input.contamination !== "Paint" && (
                  <label className={s.confirm}>
                    <input
                      type="checkbox"
                      checked={input.uncoated}
                      onChange={(e) => update("uncoated", e.target.checked)}
                    />
                    {copy(lang, "uncoated")}
                  </label>
                )}
              <label className={s.confirm}>
                <input
                  type="checkbox"
                  required
                  checked={input.confirmed}
                  onChange={(e) => update("confirmed", e.target.checked)}
                />
                {copy(lang, "confirm")}
              </label>
              <button
                className={s.primary}
                disabled={
                  !input.substrate || !input.contamination || !input.confirmed
                }
              >
                {c.show} <span aria-hidden="true">→</span>
              </button>
            </fieldset>
          </form>
        )}
        {step === 2 && (
          <>
            {a.loading && !a.displayedTreatment && !a.savedCurrent ? (
              <div className={`${s.card} ${s.loading}`} role="status">
                {copy(lang, "loading")}
              </div>
            ) : !a.savedCurrent &&
              a.result?.key === a.selection &&
              a.result.error ? (
              <div className={`${s.card} ${s.loading}`} role="alert">
                {a.result.error}
              </div>
            ) : (
              <AdvisorResult
                input={input}
                treatment={a.displayedTreatment}
                refreshing={a.loading && !a.savedCurrent}
                busy={locked}
                onEdit={() => a.setStep(1)}
                onArea={(value) => update("area", value)}
                onWater={(value) => update("waterParts", value)}
              />
            )}
            <section
              className={`${s.card} ${s.saveCard} ${s.reportActions}`}
              aria-label={copy(lang, "details")}
            >
              <p className={s.saveHint}>{copy(lang, "reportHint")}</p>
              <div className={s.reportButtons}>
                <button
                  className={s.primary}
                  disabled={locked || a.loading || !input.confirmed}
                  onClick={() => void a.report()}
                >
                  {busy === "report"
                    ? copy(lang, "loading")
                    : t.step4.downloadPDF}{" "}
                  <span aria-hidden="true">↓</span>
                </button>
                <button
                  className={s.productLink}
                  disabled={locked || a.loading || !input.confirmed}
                  onClick={() => window.print()}
                >
                  {copy(lang, "print")} <span aria-hidden="true">↗</span>
                </button>
              </div>
              <div className={s.contactSection}>
                <button
                  className={s.contactToggle}
                  disabled={locked}
                  aria-expanded={contactOpen}
                  aria-controls="contact-request"
                  onClick={() => setContactOpen(!contactOpen)}
                >
                  {copy(lang, "contactSeller")}{" "}
                  <span aria-hidden="true">{contactOpen ? "−" : "＋"}</span>
                </button>
                {contactOpen && (
                  <form
                    id="contact-request"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (
                        input.customerName.trim().length >= 2 &&
                        validContact(input.contactInfo) &&
                        input.consent
                      )
                        void a.save(true);
                    }}
                  >
                    <fieldset className={s.fieldset} disabled={locked}>
                      <div className={s.contactFields}>
                        <label htmlFor="contact-name">
                          {copy(lang, "fullName")}
                          <input
                            id="contact-name"
                            required
                            minLength={2}
                            maxLength={200}
                            autoComplete="name"
                            value={input.customerName}
                            onChange={(e) =>
                              update("customerName", e.target.value)
                            }
                          />
                        </label>
                        <label htmlFor="contact-channel">
                          {copy(lang, "emailOrPhone")}
                          <input
                            id="contact-channel"
                            required
                            maxLength={254}
                            value={input.contactInfo}
                            onChange={(e) =>
                              update("contactInfo", e.target.value)
                            }
                          />
                        </label>
                      </div>
                      <label className={s.confirm}>
                        <input
                          type="checkbox"
                          required
                          checked={input.consent}
                          onChange={(e) => update("consent", e.target.checked)}
                        />
                        {copy(lang, "contactConsent")}
                      </label>
                      <a
                        className={s.privacyLink}
                        href="https://mavro-int.shop/files/Privacy_statement_Mavro_International.pdf"
                        target="_blank"
                        rel="noreferrer"
                      >
                        {copy(lang, "privacyLink")} ↗
                      </a>
                      <button
                        className={s.primary}
                        disabled={
                          locked ||
                          a.loading ||
                          !input.confirmed ||
                          !input.consent ||
                          input.customerName.trim().length < 2 ||
                          !validContact(input.contactInfo) ||
                          (a.savedCurrent &&
                            a.saved?.item.input.contactRequested === true)
                        }
                      >
                        {busy === "save"
                          ? t.step4.saving
                          : copy(lang, "submitContact")}{" "}
                        <span aria-hidden="true">→</span>
                      </button>
                    </fieldset>
                  </form>
                )}
                {a.savedCurrent && a.saved?.item.input.contactRequested && (
                  <p role="status" className={s.contactSuccess}>
                    {copy(lang, "contactSaved")}
                  </p>
                )}
              </div>
            </section>
          </>
        )}
        {a.message && (
          <p className={s.message} role="status">
            {a.message}
          </p>
        )}
        {step > 0 && (
          <div className={s.below}>
            <button
              className={s.textButton}
              disabled={locked}
              onClick={() => a.setStep(step - 1)}
            >
              ← {c.back}
            </button>
            <button
              className={s.textButton}
              disabled={locked}
              onClick={a.reset}
            >
              {copy(lang, "newCase")}
            </button>
          </div>
        )}
        {a.history.length > 0 && (
          <details className={s.history}>
            <summary>{copy(lang, "history")}</summary>
            {a.history.map((id) => (
              <button
                className={s.textButton}
                disabled={locked}
                key={id}
                title={id}
                onClick={() => void a.restore(id)}
              >
                {copy(lang, "restored")} · {id.slice(0, 8)} →
              </button>
            ))}
          </details>
        )}
        <input
          ref={chooser}
          className={s.hidden}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          aria-label={copy(lang, "photos")}
          onChange={(e) => {
            void a.addPhotos(e.target.files);
            e.target.value = "";
          }}
        />
        <input
          ref={camera}
          className={s.hidden}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          aria-label={t.step1.takePhoto}
          onChange={(e) => {
            void a.addPhotos(e.target.files);
            e.target.value = "";
          }}
        />
        <footer className={`${s.footer} ${s.liveFooter}`}>
          <span>Mavro International</span>
          <a href="mailto:info@mavro-int.si">info@mavro-int.si</a>
          <Link href="/admin">{copy(lang, "admin")}</Link>
        </footer>
      </main>
    </div>
  );
}
