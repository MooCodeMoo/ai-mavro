"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  SUBSTRATES,
  CONTAMINATIONS,
  LANGUAGES,
  type AIAnalysis,
  type CaseInput,
  type Language,
  type SavedCase,
  type Treatment,
} from "@/lib/domain";
import { translations, languageNames } from "@/lib/translations";
import { copy } from "@/lib/ui-copy";
import { compressPhoto, downloadResponse, jsonRequest } from "@/lib/client";
import { findProduct } from "@/lib/products";
import { TreatmentResult } from "@/components/treatment-result";
const initial: CaseInput = {
  substrate: "",
  contamination: "",
  language: "sl",
  customerName: "",
  location: "",
  contactInfo: "",
  area: null,
  waterParts: 0,
  acidResistant: false,
  uncoated: false,
  confirmed: false,
  consent: false,
  aiAnalysis: null,
  photos: [],
};
export default function Home() {
  const [input, setInput] = useState<CaseInput>(initial),
    [dark, setDark] = useState(false),
    [preferencesLoaded, setPreferencesLoaded] = useState(false),
    [history, setHistory] = useState<string[]>([]),
    [busy, setBusy] = useState(""),
    [message, setMessage] = useState(""),
    [recipient, setRecipient] = useState(""),
    [analyses, setAnalyses] = useState<(AIAnalysis | null)[]>([]),
    [saved, setSaved] = useState<{
      item: SavedCase;
      fingerprint: string;
    } | null>(null);
  const [result, setResult] = useState<{
    key: string;
    treatment: Treatment | null;
    error?: string;
  } | null>(null);
  const chooser = useRef<HTMLInputElement>(null),
    camera = useRef<HTMLInputElement>(null);
  const lang = input.language,
    t = translations[lang];
  const selection = JSON.stringify({
    substrate: input.substrate,
    contamination: input.contamination,
    language: lang,
    area: input.area,
    waterParts: input.waterParts,
    acidResistant: input.acidResistant,
    uncoated: input.uncoated,
  });
  const treatment = result?.key === selection ? result.treatment : null,
    loading =
      !!input.substrate && !!input.contamination && result?.key !== selection;
  const fingerprint = JSON.stringify(input),
    savedCurrent = !!saved && saved.fingerprint === fingerprint;
  const displayedTreatment = savedCurrent ? saved!.item.treatment : treatment;
  const product = treatment ? findProduct(treatment.productId) : null;
  function update<K extends keyof CaseInput>(key: K, value: CaseInput[K]) {
    setInput((prev) => ({
      ...prev,
      [key]: value,
      ...(["substrate", "contamination"].includes(key)
        ? { confirmed: false, waterParts: 0 }
        : {}),
      ...(key === "substrate" ? { acidResistant: false, uncoated: false } : {}),
    }));
    setMessage("");
  }
  useEffect(() => {
    // Defer browser-only preferences until hydration completes.
    const frame = requestAnimationFrame(() => {
      try {
        const preferred = localStorage.getItem("mavro-language");
        if (LANGUAGES.includes(preferred as Language))
          setInput((prev) => ({ ...prev, language: preferred as Language }));
        setDark(localStorage.getItem("mavro-dark-mode") === "true");
        const ids = JSON.parse(
          localStorage.getItem("mavro-case-history") || "[]",
        );
        if (Array.isArray(ids))
          setHistory(
            ids
              .filter(
                (id) => typeof id === "string" && /^[a-f0-9-]{36}$/.test(id),
              )
              .slice(0, 20),
          );
      } catch {}
      setPreferencesLoaded(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);
  useEffect(() => {
    if (!preferencesLoaded) return;
    document.documentElement.lang = lang;
    try {
      localStorage.setItem("mavro-language", lang);
      localStorage.setItem("mavro-dark-mode", String(dark));
    } catch {}
  }, [lang, dark, preferencesLoaded]);
  useEffect(() => {
    const selected = JSON.parse(selection);
    if (!selected.substrate || !selected.contamination) return;
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      jsonRequest<{ treatment: Treatment | null }>(
        "/api/recommend",
        selected,
        "POST",
        controller.signal,
      )
        .then((data) =>
          setResult({ key: selection, treatment: data.treatment }),
        )
        .catch((error) => {
          if (!controller.signal.aborted)
            setResult({
              key: selection,
              treatment: null,
              error: String(error.message),
            });
        });
    }, 250);
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [selection]);
  async function action(name: string, fn: () => Promise<void>) {
    setBusy(name);
    setMessage("");
    try {
      await fn();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : copy(lang, "failed"));
    } finally {
      setBusy("");
    }
  }
  async function addPhotos(files: FileList | null) {
    if (!files || busy) return;
    const incoming = Array.from(files).slice(0, 5 - input.photos.length);
    await action("photos", async () => {
      const added = await Promise.all(incoming.map(compressPhoto));
      setInput((prev) => ({
        ...prev,
        photos: [...prev.photos, ...added].slice(0, 5),
      }));
      setAnalyses((prev) => [...prev, ...added.map(() => null)]);
    });
  }
  function chooseAnalysis(analysis: AIAnalysis) {
    setInput((prev) => ({
      ...prev,
      substrate: analysis.surfaceSuggestion || prev.substrate,
      contamination: analysis.detectedContamination || prev.contamination,
      aiAnalysis: analysis,
      waterParts: 0,
      confirmed: false,
      acidResistant: false,
      uncoated: false,
    }));
  }
  async function analyze() {
    await action("ai", async () => {
      const next: (AIAnalysis | null)[] = [];
      const errors: string[] = [];
      for (const photo of input.photos) {
        try {
          const data = await jsonRequest<{ analysis: AIAnalysis }>(
            "/api/analyze-image",
            { image: photo.data, language: lang },
          );
          next.push(data.analysis);
        } catch (error) {
          next.push(null);
          errors.push(
            error instanceof Error ? error.message : copy(lang, "failed"),
          );
        }
      }
      setAnalyses(next);
      const first = next[0];
      if (
        first &&
        first.confidence >= 0.8 &&
        first.surfaceSuggestion &&
        first.detectedContamination
      )
        chooseAnalysis(first);
      if (errors.length) setMessage(errors[0]);
    });
  }
  async function save() {
    await action("save", async () => {
      const data = await jsonRequest<{ case: SavedCase }>(
        "/api/diagnose",
        input,
      );
      setSaved({ item: data.case, fingerprint });
      const ids = [data.case.id, ...history].slice(0, 20);
      setHistory(ids);
      try {
        localStorage.setItem("mavro-case-history", JSON.stringify(ids));
      } catch {}
      setMessage(`${copy(lang, "saved")} ${data.case.id}`);
    });
  }
  async function restore(id: string) {
    await action("restore", async () => {
      const data = await jsonRequest<{ case: SavedCase }>(`/api/cases/${id}`);
      const photos = await Promise.all(
        data.case.photos.map(async (photo) => {
          const response = await fetch(`/api/cases/${id}/photos/${photo.id}`);
          if (!response.ok) throw new Error(copy(lang, "failed"));
          const blob = await response.blob();
          return new Promise<{ name: string; data: string }>(
            (resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () =>
                resolve({ name: photo.name, data: String(reader.result) });
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            },
          );
        }),
      );
      const restored = { ...data.case.input, photos };
      setInput(restored);
      setSaved({ item: data.case, fingerprint: JSON.stringify(restored) });
      setAnalyses(restored.aiAnalysis ? [restored.aiAnalysis] : []);
    });
  }
  async function download() {
    if (!savedCurrent || !saved) return;
    await action("pdf", async () => {
      const response = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId: saved.item.id }),
      });
      await downloadResponse(response, `Mavro-${saved.item.id}.pdf`);
    });
  }
  async function email() {
    if (!savedCurrent || !saved) return;
    await action("email", async () => {
      await jsonRequest("/api/send-pdf-email", {
        caseId: saved.item.id,
        recipientEmail: recipient,
      });
      setMessage(t.step4.emailSent);
    });
  }
  const section = (n: number, title: string) => (
    <h2>
      <span className="step-number">{n}</span>
      {title}
    </h2>
  );
  return (
    <div className={`advisor ${dark ? "theme-dark" : ""}`}>
      <header className="brand-header">
        <div className="shell header-inner">
          <div>
            <Image
              src="/mavro-logo.png"
              alt="Mavro"
              width={160}
              height={48}
              priority
              className="brand-logo"
            />
            <p>{t.header.subtitle}</p>
          </div>
          <div className="toolbar">
            <label className="sr-only" htmlFor="language">
              {t.language}
            </label>
            <select
              id="language"
              value={lang}
              onChange={(e) => update("language", e.target.value as Language)}
            >
              {LANGUAGES.map((code) => (
                <option key={code} value={code}>
                  {languageNames[code]}
                </option>
              ))}
            </select>
            <button
              onClick={() => setDark(!dark)}
              aria-label={t.header.darkModeLabel}
            >
              {dark ? "☀" : "☾"}
            </button>
          </div>
        </div>
      </header>
      <main className="shell advisor-grid">
        <div className="workflow">
          <section className="card">
            <h2>
              {t.customerInfo.title}
              <small>{t.customerInfo.optional}</small>
            </h2>
            <div className="field-grid">
              <label>
                {t.customerInfo.customerName}
                <input
                  value={input.customerName}
                  maxLength={200}
                  onChange={(e) => update("customerName", e.target.value)}
                  autoComplete="name"
                />
              </label>
              <label>
                {t.customerInfo.projectLocation}
                <input
                  value={input.location}
                  maxLength={300}
                  onChange={(e) => update("location", e.target.value)}
                />
              </label>
              <label>
                {t.customerInfo.contactInfo}
                <input
                  value={input.contactInfo}
                  maxLength={300}
                  onChange={(e) => update("contactInfo", e.target.value)}
                />
              </label>
            </div>
          </section>
          <section className="card">
            {section(1, t.step1.title)}
            <p className="small muted">{copy(lang, "privacy")}</p>
            <div
              className="upload-zone"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                void addPhotos(e.dataTransfer.files);
              }}
            >
              <div className="toolbar">
                <button
                  disabled={!!busy || input.photos.length >= 5}
                  onClick={() => chooser.current?.click()}
                >
                  {t.step1.selectImages}
                </button>
                <button
                  disabled={!!busy || input.photos.length >= 5}
                  onClick={() => camera.current?.click()}
                >
                  {t.step1.takePhoto}
                </button>
                <span className="small muted">{input.photos.length}/5</span>
              </div>
              <input
                ref={chooser}
                hidden
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => {
                  void addPhotos(e.target.files);
                  e.target.value = "";
                }}
              />
              <input
                ref={camera}
                hidden
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => {
                  void addPhotos(e.target.files);
                  e.target.value = "";
                }}
              />
              <div className="photo-grid">
                {input.photos.map((photo, i) => (
                  <div className="photo-tile" key={`${photo.name}-${i}`}>
                    <Image
                      src={photo.data}
                      alt={photo.name}
                      width={240}
                      height={160}
                      unoptimized
                    />
                    <button
                      className="remove"
                      disabled={!!busy}
                      aria-label={t.step1.removeImage}
                      onClick={() => {
                        update(
                          "photos",
                          input.photos.filter((_, index) => index !== i),
                        );
                        setAnalyses((prev) =>
                          prev.filter((_, index) => index !== i),
                        );
                        update("aiAnalysis", null);
                      }}
                    >
                      ×
                    </button>
                    {analyses[i] && (
                      <div className="photo-result">
                        <strong>
                          {Math.round(analyses[i]!.confidence * 100)}%
                        </strong>
                        <p>
                          {t.surfaces[analyses[i]!.surfaceSuggestion || ""] ||
                            "—"}{" "}
                          ·{" "}
                          {t.contaminations[
                            analyses[i]!.detectedContamination || ""
                          ] || "—"}
                        </p>
                        <p>{analyses[i]!.notes}</p>
                        <button
                          disabled={!!busy}
                          onClick={() => chooseAnalysis(analyses[i]!)}
                        >
                          {copy(lang, "choose")}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            {input.photos.length > 0 && (
              <button
                className="primary"
                disabled={!!busy}
                onClick={() => void analyze()}
              >
                {busy === "ai" ? t.step1.analyzing : t.step1.analyzeAI}
              </button>
            )}
            <p className="small muted">{copy(lang, "uncertainty")}</p>
          </section>
          <section className="card">
            {section(2, t.step2.title)}
            <label className="sr-only" htmlFor="substrate">
              {t.step2.title}
            </label>
            <select
              id="substrate"
              value={input.substrate}
              onChange={(e) => update("substrate", e.target.value)}
            >
              <option value="">{t.step2.placeholder}</option>
              {SUBSTRATES.map((value) => (
                <option key={value} value={value}>
                  {t.surfaces[value] || value}
                </option>
              ))}
            </select>
            {section(3, t.step3.title)}
            <label className="sr-only" htmlFor="contamination">
              {t.step3.title}
            </label>
            <select
              id="contamination"
              value={input.contamination}
              onChange={(e) => update("contamination", e.target.value)}
            >
              <option value="">{t.step3.placeholder}</option>
              {CONTAMINATIONS.map((value) => (
                <option key={value} value={value}>
                  {t.contaminations[value] || value}
                </option>
              ))}
            </select>
            <div className="field-grid">
              <label>
                {copy(lang, "area")}
                <input
                  type="number"
                  min={0.01}
                  max={1_000_000}
                  step="any"
                  value={input.area ?? ""}
                  onChange={(e) =>
                    update(
                      "area",
                      e.target.value ? Number(e.target.value) : null,
                    )
                  }
                />
              </label>
              <label>
                {copy(lang, "water")}
                <select
                  value={input.waterParts}
                  onChange={(e) => update("waterParts", Number(e.target.value))}
                >
                  {(product?.allowedWaterParts || [0, 1, 2, 5, 10, 20, 30]).map(
                    (value) => (
                      <option key={value} value={value}>
                        {value === 0 ? "1:0" : `1:${value}`}
                      </option>
                    ),
                  )}
                </select>
              </label>
            </div>
            {input.contamination === "Efflorescence / cement veil" && (
              <label className="checkbox">
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
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={input.uncoated}
                    onChange={(e) => update("uncoated", e.target.checked)}
                  />
                  {copy(lang, "uncoated")}
                </label>
              )}
            <label className="checkbox">
              <input
                type="checkbox"
                checked={input.confirmed}
                onChange={(e) => update("confirmed", e.target.checked)}
              />
              {copy(lang, "confirm")}
            </label>
          </section>
        </div>
        <aside className="result-column">
          <section className="card">
            {section(4, t.step4.title)}
            {loading ? (
              <p role="status">{copy(lang, "loading")}</p>
            ) : displayedTreatment ? (
              <TreatmentResult treatment={displayedTreatment} language={lang} />
            ) : (
              <div className="panel">
                <h3>
                  {input.substrate && input.contamination
                    ? t.step4.noRecommendationTitle
                    : t.step4.emptyState}
                </h3>
                <p>
                  {result?.key === selection && result.error
                    ? result.error
                    : input.substrate && input.contamination
                      ? t.step4.noRecommendationText
                      : ""}
                </p>
              </div>
            )}
            <label className="checkbox">
              <input
                type="checkbox"
                checked={input.consent}
                onChange={(e) => update("consent", e.target.checked)}
              />
              {copy(lang, "consent")}
            </label>
            <a
              className="small"
              href="https://mavro-int.shop/files/Privacy_statement_Mavro_International.pdf"
              target="_blank"
              rel="noopener noreferrer"
            >
              {lang === "sl"
                ? "Zasebnost"
                : lang === "hr"
                  ? "Privatnost"
                  : lang === "nl"
                    ? "Privacy"
                    : "Privacy"}
            </a>
            <button
              className="primary full"
              disabled={
                !!busy ||
                !input.substrate ||
                !input.contamination ||
                !input.confirmed ||
                !input.consent
              }
              onClick={() => void save()}
            >
              {busy === "save" ? t.step4.saving : copy(lang, "request")}
            </button>
            {saved && (
              <div className="panel">
                <p className="small">ID: {saved.item.id}</p>
                <p>
                  {copy(
                    lang,
                    saved.item.review === "pending"
                      ? "pending"
                      : saved.item.review,
                  )}
                </p>
                {!savedCurrent && (
                  <p className="notice">{copy(lang, "changes")}</p>
                )}
                <button
                  disabled={!!busy || !savedCurrent}
                  onClick={() => void download()}
                >
                  {t.step4.downloadPDF}
                </button>
                <label>
                  {copy(lang, "email")}
                  <input
                    type="email"
                    value={recipient}
                    maxLength={254}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder={t.step4.emailPlaceholder}
                  />
                </label>
                <button
                  disabled={
                    !!busy || !savedCurrent || !/^\S+@\S+\.\S+$/.test(recipient)
                  }
                  onClick={() => void email()}
                >
                  {busy === "email" ? t.step4.sendingEmail : t.step4.sendEmail}
                </button>
              </div>
            )}
            {message && (
              <p role="status" className="notice break-words">
                {message}
              </p>
            )}
          </section>
          {history.length > 0 && (
            <section className="card">
              <h3>{copy(lang, "history")}</h3>
              <ul className="history-list">
                {history.map((id) => (
                  <li key={id}>
                    <button
                      disabled={!!busy}
                      onClick={() => void restore(id)}
                      title={id}
                    >
                      {copy(lang, "restored")} · {id.slice(0, 8)}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </main>
      <footer className="shell page-footer">
        Mavro Slovenija ·{" "}
        <a href="mailto:info@mavro-int.si">info@mavro-int.si</a> · +386 41 902
        700 <a href="/admin">Admin</a>
      </footer>
    </div>
  );
}
