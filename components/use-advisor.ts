"use client";
import { useEffect, useRef, useState } from "react";
import {
  LANGUAGES,
  type AIAnalysis,
  type CaseInput,
  type Language,
  type SavedCase,
  type Treatment,
} from "@/lib/domain";
import { translations } from "@/lib/translations";
import { copy } from "@/lib/ui-copy";
import { compressPhoto, downloadResponse, jsonRequest } from "@/lib/client";
import { findProduct } from "@/lib/products";
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
export function useAdvisor() {
  const [step, setStep] = useState(0);
  const [analysisLanguage, setAnalysisLanguage] = useState<Language>("sl");
  const [input, setInput] = useState<CaseInput>(initial),
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
  const actionLock = useRef(false);
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
  const previous = result ? JSON.parse(result.key) : null;
  const selected = JSON.parse(selection);
  const compatible =
    previous &&
    [
      "substrate",
      "contamination",
      "language",
      "acidResistant",
      "uncoated",
    ].every((key) => previous[key] === selected[key]);
  const treatment =
      result?.key === selection
        ? result.treatment
        : compatible && result?.treatment
          ? { ...result.treatment, estimate: null }
          : null,
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
    } catch {}
  }, [lang, preferencesLoaded]);
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
    if (actionLock.current) return;
    actionLock.current = true;
    setBusy(name);
    setMessage("");
    try {
      await fn();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : copy(lang, "failed"));
    } finally {
      actionLock.current = false;
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
      substrate: analysis.surfaceSuggestion || "",
      contamination: analysis.detectedContamination || "",
      aiAnalysis: analysis,
      waterParts: 0,
      confirmed: false,
      acidResistant: false,
      uncoated: false,
    }));
  }
  async function analyze() {
    await action("ai", async () => {
      setAnalysisLanguage(lang);
      const errors: string[] = [];
      const next = await Promise.all(
        input.photos.map(async (photo) => {
          try {
            const data = await jsonRequest<{ analysis: AIAnalysis }>(
              "/api/analyze-image",
              { image: photo.data, language: lang },
            );
            return data.analysis;
          } catch (error) {
            errors.push(
              error instanceof Error ? error.message : copy(lang, "failed"),
            );
            return null;
          }
        }),
      );
      setAnalyses(next);
      const candidates = next.filter((item): item is AIAnalysis => !!item);
      const best = [...candidates]
        .sort((a, b) => b.confidence - a.confidence)
        .find((item) => item.surfaceSuggestion && item.detectedContamination);
      if (best) {
        chooseAnalysis(best);
        setStep(2);
        if (
          candidates.some(
            (item) =>
              item.surfaceSuggestion !== best.surfaceSuggestion ||
              item.detectedContamination !== best.detectedContamination,
          )
        )
          setMessage(copy(lang, "uncertainty"));
      } else if (candidates.length) {
        setInput((prev) => ({
          ...prev,
          substrate: "",
          contamination: "",
          aiAnalysis: candidates[0],
          confirmed: false,
          waterParts: 0,
          acidResistant: false,
          uncoated: false,
        }));
        setStep(2);
      }
      if (errors.length) setMessage(errors[0]);
    });
  }
  async function save(contactRequested = false) {
    await action("save", async () => {
      const data = await jsonRequest<{ case: SavedCase }>("/api/diagnose", {
        ...input,
        contactRequested,
      });
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
      setAnalysisLanguage(restored.language);
      setStep(2);
    });
  }
  async function report() {
    if (savedCurrent && saved) {
      await download();
      return;
    }
    await action("report", async () => {
      const response = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...input,
          customerName: "",
          contactInfo: "",
          location: "",
          consent: false,
          contactRequested: false,
        }),
      });
      await downloadResponse(response, "Mavro-report.pdf");
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

  function removePhoto(index: number) {
    if (busy) return;
    setInput((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
      aiAnalysis: null,
      confirmed: false,
    }));
    setAnalyses((prev) => prev.filter((_, i) => i !== index));
  }
  function reset() {
    if (busy) return;
    setInput({ ...initial, language: lang });
    setAnalyses([]);
    setSaved(null);
    setResult(null);
    setMessage("");
    setRecipient("");
    setStep(0);
  }
  return {
    input,
    update,
    lang,
    t,
    step,
    setStep,
    busy,
    message,
    recipient,
    setRecipient,
    analyses,
    analysisLanguage,
    saved,
    savedCurrent,
    displayedTreatment,
    product,
    loading,
    result,
    selection,
    history,
    addPhotos,
    chooseAnalysis,
    analyze,
    save,
    restore,
    report,
    download,
    email,
    removePhoto,
    reset,
  };
}
