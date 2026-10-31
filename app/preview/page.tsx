"use client";
import { useRef, useState, type DragEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { findProduct } from "@/lib/products";
import { SEED_RULES } from "@/lib/rule-seeds";
import { resolveTreatment } from "@/lib/recommendations";
import { SUBSTRATES, CONTAMINATIONS } from "@/lib/domain";
import { translations } from "@/lib/translations";
import s from "./preview.module.css";

export default function DesignPreview() {
  const [step, setStep] = useState(0);
  const [photo, setPhoto] = useState("");
  const [surface, setSurface] = useState("");
  const [dirt, setDirt] = useState("");
  const [area, setArea] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  const labels = translations.sl;
  const treatment = resolveTreatment(
    {
      substrate: surface,
      contamination: dirt,
      language: "sl",
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
      setError("Izberi JPG, PNG ali WebP fotografijo do 20 MB.");
      return;
    }
    const data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(selected);
    }).catch(() => null);
    if (!data) {
      setError("Fotografije ni bilo mogoče odpreti.");
      return;
    }
    setPhoto(data);
    setConfirmed(false);
    setError("");
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
    setError("");
  }
  return (
    <div className={s.app}>
      <header className={s.header}>
        <Link
          href="/preview"
          aria-label="Mavro AI predogled"
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
        <span className={s.preview}>Predogled</span>
      </header>
      <main className={s.main}>
        <div className={s.heading}>
          <p className={s.progress}>KORAK {step + 1} OD 3</p>
          <h1>
            {step === 0
              ? "Kaj želiš očistiti?"
              : step === 1
                ? "Potrdi površino."
                : "Tvoja rešitev."}
          </h1>
          <p>
            {step === 0
              ? "Dodaj fotografijo in poišči ustrezen Mavro izdelek."
              : step === 1
                ? "Izberi podlago in vrsto umazanije."
                : "Priporočen izdelek in postopek na enem mestu."}
          </p>
        </div>
        {step === 0 && (
          <section className={s.card} aria-label="Dodajanje fotografije">
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
              <h2>Dodaj fotografijo površine</h2>
              <p>Povleci jo sem ali jo izberi iz naprave.</p>
              <button
                className={s.primary}
                onClick={() => file.current?.click()}
              >
                Izberi fotografijo <span aria-hidden="true">＋</span>
              </button>
              <small>JPG, PNG ali WebP · do 20 MB</small>
            </div>
            <div className={s.manual}>
              <button
                className={s.textButton}
                onClick={() => {
                  setStep(1);
                  setError("");
                }}
              >
                Nadaljuj brez fotografije <span aria-hidden="true">→</span>
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
                  alt="Tvoja naložena površina"
                  width={64}
                  height={64}
                  unoptimized
                />
                <div>
                  <strong>Fotografija je dodana</strong>
                  <span>Ostane samo v tvojem brskalniku.</span>
                </div>
                <button
                  type="button"
                  className={s.textButton}
                  onClick={() => file.current?.click()}
                >
                  Zamenjaj
                </button>
              </div>
            )}
            <label htmlFor="preview-surface">Kakšna je površina?</label>
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
                Izberi površino
              </option>
              {SUBSTRATES.map((v) => (
                <option key={v} value={v}>
                  {labels.surfaces[v]}
                </option>
              ))}
            </select>
            <label htmlFor="preview-dirt">Kaj želiš odstraniti?</label>
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
                Izberi umazanijo
              </option>
              {CONTAMINATIONS.map((v) => (
                <option key={v} value={v}>
                  {labels.contaminations[v]}
                </option>
              ))}
            </select>
            <details className={s.optional}>
              <summary>
                Dodaj velikost površine <span>neobvezno</span>
              </summary>
              <label htmlFor="preview-area">Površina v m²</label>
              <input
                id="preview-area"
                type="number"
                min="1"
                max="100000"
                placeholder="npr. 100"
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
              Potrjujem izbrano površino in umazanijo.
            </label>
            <button
              className={s.primary}
              disabled={!surface || !dirt || !confirmed}
            >
              Pokaži priporočilo <span aria-hidden="true">→</span>
            </button>
            <p className={s.formNote}>
              V tem oblikovnem predogledu izbira poteka ročno, brez AI analize.
            </p>
          </form>
        )}
        {step === 2 && (
          <section className={`${s.card} ${s.result}`} aria-live="polite">
            <div className={s.selection}>
              {labels.surfaces[surface]}
              <span>·</span>
              {labels.contaminations[dirt]}
            </div>
            {treatment && product ? (
              <>
                <span className={s.caption}>PRIPOROČEN IZDELEK</span>
                <h2>{product.name}</h2>
                <p className={s.description}>{product.description.sl}</p>
                {treatment.estimate && (
                  <p className={s.estimate}>
                    Za {area} m² okvirno{" "}
                    <strong>
                      {treatment.estimate.min}–{treatment.estimate.max}{" "}
                      {treatment.estimate.unit}
                    </strong>{" "}
                    nerazredčenega izdelka. Dejanska poraba je odvisna od
                    podlage.
                  </p>
                )}
                <div className={s.instructions}>
                  <h3>Postopek čiščenja</h3>
                  <ol>
                    {treatment.steps.map((text, i) => (
                      <li key={text}>
                        <span>{i + 1}</span>
                        <p>{text}</p>
                      </li>
                    ))}
                  </ol>
                </div>
                <details className={s.safety}>
                  <summary>Redčenje in varnostna navodila</summary>
                  <p>
                    <strong>Redčenje: </strong>
                    {treatment.dilution}
                  </p>
                  <p>{treatment.safety}</p>
                  <a
                    href={treatment.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Vir priporočila · {treatment.checkedAt} ↗
                  </a>
                </details>
                <a
                  className={s.primary}
                  href={product.links?.sl || product.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Poglej izdelek <span aria-hidden="true">↗</span>
                </a>
                <p className={s.formNote}>
                  Najprej izvedi preizkus na majhnem delu. Pred uporabo preberi
                  tehnični in varnostni list.
                </p>
              </>
            ) : (
              <>
                <h2>Potreben je strokovni pregled.</h2>
                <p className={s.description}>
                  Za ta izbor še ni potrjenega varnega postopka. Primer lahko
                  oddaš Mavro strokovnjaku v obstoječem orodju.
                </p>
                <Link className={s.primary} href="/">
                  Odpri orodje <span aria-hidden="true">→</span>
                </Link>
              </>
            )}
          </section>
        )}
        {error && (
          <p role="alert" className={s.error}>
            {error}
          </p>
        )}
        {step > 0 && (
          <div className={s.below}>
            <button className={s.textButton} onClick={() => setStep(step - 1)}>
              ← Nazaj
            </button>
            {step === 2 && (
              <button className={s.textButton} onClick={reset}>
                Nov primer
              </button>
            )}
          </div>
        )}
        <input
          ref={file}
          className={s.hidden}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          aria-label="Fotografija površine"
          onChange={(e) => {
            void loadPhoto(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <footer className={s.footer}>
          Oblikovni predogled · brez shranjevanja podatkov
        </footer>
      </main>
    </div>
  );
}
