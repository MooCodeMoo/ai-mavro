"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { findProduct, findAlternatives, getProductUrl, type Product } from "@/lib/products";

const SUBSTRATES = [
  "Concrete",
  "Brick",
  "Render / mineral plaster",
  "Natural stone (soft)",
  "Natural stone (hard)",
  "Roof tiles",
  "Paving stones",
  "Aluminium",
  "Wood",
];

const CONTAMINATIONS = [
  "Green deposits (algae/moss/lichen)",
  "Black mould",
  "General dirt / traffic film",
  "Efflorescence / cement veil",
  "Rust / oxide",
  "Oil / grease",
  "Graffiti",
  "Paint",
];

type Recommendation = {
  product: string;
  dilution: string;
  steps: string[];
  safety: string;
  alternatives?: string[];
};

type AIAnalysis = {
  detectedContamination: string | null;
  confidence: number;
  surfaceSuggestion: string | null;
  notes: string;
};

function getRecommendation(
  substrate: string | null,
  contamination: string | null
): Recommendation | null {
  if (!substrate || !contamination) return null;

  // Substrate-specific overrides (run before contamination checks)
  if (substrate === "Aluminium") {
    return {
      product: "Alu Clean",
      dilution: "1:5–1:10 with water depending on soiling",
      steps: [
        "Rinse the aluminium surface with clean water first.",
        "Apply diluted product with a soft brush or low-pressure sprayer.",
        "Allow to work for 5–15 minutes, do not let it dry.",
        "Rinse thoroughly with clean water.",
      ],
      safety:
        "Wear gloves and eye protection. Avoid contact with anodised or painted aluminium without testing first.",
      alternatives: [],
    };
  }

  if (substrate === "Wood") {
    return {
      product: "Wood Renovator",
      dilution: "Ready to use or dilute 1:2 for light cleaning",
      steps: [
        "Clean loose dirt from the wood surface first.",
        "Apply with a brush or low-pressure sprayer.",
        "Allow to work for 10–20 minutes.",
        "Rinse thoroughly with clean water.",
      ],
      safety:
        "Wear gloves and eye protection. Avoid run-off onto plants. Test on an inconspicuous area first.",
      alternatives: [],
    };
  }

  if (contamination.startsWith("Green deposits")) {
    return {
      product: "FacadeClean HC",
      dilution: "1:2 – 1:3 with water",
      steps: [
        "Wet the surface lightly if it is very dry or warm.",
        "Apply with low-pressure sprayer from bottom to top.",
        "Allow to work for 15–30 minutes, do not let it dry.",
        "Rinse thoroughly with clean water.",
      ],
      safety:
        "Wear gloves and eye protection. Avoid contact with plants; rinse them with water if exposed.",
      alternatives: [],
    };
  }

  if (contamination === "Black mould") {
    return {
      product: "FacadeClean HC",
      dilution: "1:2 – 1:3",
      steps: [
        "Apply to the affected areas.",
        "Allow to work sufficiently 15–45 min (do not rinse too early).",
        "Rinse with water.",
      ],
      safety:
        "Wear gloves, eye protection and consider respiratory protection in confined spaces. Do not mix with other cleaners.",
      alternatives: [],
    };
  }

  if (contamination === "General dirt / traffic film") {
    return {
      product: "Uniclean High Alkaline",
      dilution: "1:5–1:20 depending on soiling",
      steps: [
        "Apply evenly with low-pressure sprayer or brush.",
        "Allow to work for 10–20 minutes.",
        "Agitate if needed with a brush or pad.",
        "Rinse thoroughly with clean water, preferably low/medium pressure.",
      ],
      safety:
        "Wear gloves and eye protection. Do not allow the product to dry on the surface.",
      alternatives: ["Uniclean Low Foaming", "Uniclean High Foaming"],
    };
  }

  if (contamination === "Efflorescence / cement veil") {
    if (substrate === "Natural stone (soft)") {
      return {
        product: "Cement Efflorescence Cleaner",
        dilution: "According to product label (typically 1:1–1:5, non-acidic use)",
        steps: [
          "Always test in an inconspicuous area first.",
          "Apply with brush or low-pressure sprayer.",
          "Allow to work according to instructions.",
          "Rinse thoroughly with plenty of clean water.",
        ],
        safety:
          "Do NOT use strong acids on soft natural stone. Always test first. Wear gloves and eye protection.",
        alternatives: [],
      };
    }

    return {
      product: "Cement Efflorescence Cleaner",
      dilution: "Typically 1:5–1:10 with water",
      steps: [
        "Pre-wet the surface with clean water.",
        "Apply the product evenly.",
        "Allow to work for a few minutes, do not let it dry.",
        "Rinse thoroughly with plenty of water.",
      ],
      safety:
        "Wear gloves, eye and face protection. Do not use on acid-sensitive surfaces (polished stone, some metals).",
      alternatives: [],
    };
  }

  if (contamination === "Graffiti") {
    return {
      product: "Strip-Off Plus",
      dilution: "Ready to use (check product label)",
      steps: [
        "Apply product directly to graffiti.",
        "Allow to work for several minutes.",
        "Agitate with a suitable brush or pad if required.",
        "Rinse with high or medium pressure water according to substrate.",
      ],
      safety:
        "Wear gloves and eye protection. Always test first on a small area.",
      alternatives: ["Strip-Off", "Strip-Off HD"],
    };
  }

  if (contamination === "Oil / grease") {
    return {
      product: "Uniclean High Alkaline",
      dilution: "Ready to use or 1:1–1:5 depending on soiling level",
      steps: [
        "Apply to contaminated area.",
        "Allow to work for sufficient time (follow label).",
        "Agitate if necessary.",
        "Rinse thoroughly with clean water.",
      ],
      safety:
        "Wear gloves and eye protection. Avoid discharge of dirty wash water into drains without proper separation.",
      alternatives: ["Uniclean High Foaming"],
    };
  }

  if (contamination === "Rust / oxide") {
    return {
      product: "Mavro Rust / Oxide Remover",
      dilution: "Typically ready to use or light dilution (see label)",
      steps: [
        "Apply directly to the rust or oxide stains.",
        "Allow to work until reaction is visible.",
        "Rinse thoroughly with clean water.",
      ],
      safety:
        "Wear gloves and eye protection. Test first on sensitive surfaces.",
      alternatives: [],
    };
  }

  if (contamination === "Paint") {
    return {
      product: "Strip-Off HD",
      dilution: "Ready to use",
      steps: [
        "Apply generously to the painted surface.",
        "Allow to work for 10–30 minutes depending on paint thickness.",
        "Agitate with a stiff brush or pad.",
        "Rinse thoroughly with medium to high pressure water.",
      ],
      safety:
        "Wear gloves, eye and face protection. Test on a small area first. Avoid contact with glass and polished surfaces.",
      alternatives: ["Strip-Off Plus"],
    };
  }

  return null;
}

export default function Home() {
  const [darkMode, setDarkMode] = useState(false);
  const [substrate, setSubstrate] = useState<string | null>(null);
  const [contamination, setContamination] = useState<string | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [analyzingIndex, setAnalyzingIndex] = useState<number | null>(null);
  const [aiAnalyses, setAiAnalyses] = useState<(AIAnalysis | null)[]>([]);

  const analyzing = analyzingIndex !== null;
  const aiAnalysis: AIAnalysis | null = aiAnalyses.reduce<AIAnalysis | null>(
    (best, curr) => (curr && (!best || curr.confidence > best.confidence) ? curr : best),
    null
  );

  const recommendation = getRecommendation(substrate, contamination);

  const catalogProduct: Product | null =
    recommendation ? findProduct(recommendation.product) : null;
  const catalogAlternatives: Product[] = catalogProduct
    ? findAlternatives(catalogProduct)
    : (recommendation?.alternatives ?? [])
        .map((n) => findProduct(n))
        .filter((p): p is Product => p !== null);

  const [customerName, setCustomerName] = useState("");
  const [projectLocation, setProjectLocation] = useState("");
  const [contactInfo, setContactInfo] = useState("");

  const [sending, setSending] = useState(false);
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const [pdfSuccess, setPdfSuccess] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const [recipientEmail, setRecipientEmail] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);

  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  useEffect(() => {
    const saved = localStorage.getItem("mavro-dark-mode");
    if (saved === "true") setDarkMode(true);
  }, []);

  useEffect(() => {
    localStorage.setItem("mavro-dark-mode", String(darkMode));
  }, [darkMode]);

  const dm = darkMode;

  function addRipple(e: React.MouseEvent<HTMLButtonElement | HTMLLabelElement>) {
    const btn = e.currentTarget;
    const circle = document.createElement("span");
    const d = Math.max(btn.clientWidth, btn.clientHeight);
    const rect = btn.getBoundingClientRect();
    circle.className = "ripple-circle";
    circle.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - rect.left - d / 2}px;top:${e.clientY - rect.top - d / 2}px`;
    btn.appendChild(circle);
    circle.addEventListener("animationend", () => circle.remove());
  }

  function addImages(files: FileList | File[]) {
    const incoming = Array.from(files)
      .filter(f => f.type.startsWith("image/"))
      .slice(0, 5 - photoFiles.length);
    if (incoming.length === 0) return;
    setPhotoFiles(prev => [...prev, ...incoming].slice(0, 5));
    setPhotos(prev => [...prev, ...incoming.map(f => URL.createObjectURL(f))].slice(0, 5));
    setAiAnalyses(prev => [...prev, ...incoming.map(() => null)].slice(0, 5));
  }

  function removeImage(i: number) {
    setPhotos(prev => prev.filter((_, idx) => idx !== i));
    setPhotoFiles(prev => prev.filter((_, idx) => idx !== i));
    setAiAnalyses(prev => prev.filter((_, idx) => idx !== i));
  }

  function clearAllImages() {
    setPhotos([]);
    setPhotoFiles([]);
    setAiAnalyses([]);
  }

  async function handleAnalyzeImages() {
    if (photoFiles.length === 0) return;
    try {
      for (let i = 0; i < photoFiles.length; i++) {
        setAnalyzingIndex(i);
        const formData = new FormData();
        formData.append("image", photoFiles[i]);
        const res = await fetch("/api/analyze-image", { method: "POST", body: formData });
        const data = await res.json();
        if (res.ok) {
          setAiAnalyses(prev => {
            const next = [...prev];
            next[i] = data.analysis;
            return next;
          });
          if (i === 0) {
            if (data.analysis.detectedContamination && data.analysis.confidence > 0.7)
              setContamination(data.analysis.detectedContamination);
            if (data.analysis.surfaceSuggestion)
              setSubstrate(data.analysis.surfaceSuggestion);
          }
        }
      }
    } catch (err) {
      console.error(err);
      setLastMessage("Could not analyze image.");
    } finally {
      setAnalyzingIndex(null);
    }
  }

  async function handleSendToServer() {
    if (!substrate || !contamination) {
      setLastMessage("Please select both surface and contamination first.");
      return;
    }

    try {
      setSending(true);
      setLastMessage(null);

      const res = await fetch("/api/diagnose", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          substrate,
          contamination,
          hasPhoto: photos.length > 0,
          aiAnalysis,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setLastMessage("✓ Uspešno shranjeno");
        console.log("Server response:", data);
      } else {
        setLastMessage("Server responded with an error.");
        console.error("Server error:", data);
      }
    } catch (err) {
      console.error(err);
      setLastMessage("Could not reach server.");
    } finally {
      setSending(false);
    }
  }

  async function downloadPDF() {
    if (!substrate || !contamination || !recommendation) return;

    try {
      setLastMessage(null);
      const res = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          surface: substrate,
          contamination,
          product: recommendation.product,
          dilution: recommendation.dilution,
          steps: recommendation.steps,
          safety: recommendation.safety,
          aiAnalysis,
          customerName,
          location: projectLocation,
          contactInfo,
          productUrl: catalogProduct?.webshopUrl ?? "",
          productPrice: catalogProduct?.price,
        }),
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Mavro-Treatment-Plan-${Date.now()}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        setPdfSuccess(true);
        setTimeout(() => setPdfSuccess(false), 1600);
      } else {
        setLastMessage("Failed to generate PDF.");
      }
    } catch (err) {
      console.error(err);
      setLastMessage("Could not generate PDF.");
    }
  }

  async function sendViaEmail() {
    if (!substrate || !contamination || !recommendation || !isValidEmail(recipientEmail)) return;

    try {
      setSendingEmail(true);
      setLastMessage(null);

      // 1. Generate PDF
      const pdfRes = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          surface: substrate,
          contamination,
          product: recommendation.product,
          dilution: recommendation.dilution,
          steps: recommendation.steps,
          safety: recommendation.safety,
          aiAnalysis,
          customerName,
          location: projectLocation,
          contactInfo,
          productUrl: catalogProduct?.webshopUrl ?? "",
          productPrice: catalogProduct?.price,
        }),
      });

      if (!pdfRes.ok) { setLastMessage("Failed to generate PDF for email."); return; }

      // 2. Convert to base64 (loop avoids call stack limit on large buffers)
      const blob = await pdfRes.blob();
      const buffer = await blob.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = "";
      for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
      const pdfBase64 = btoa(binary);

      // 3. Send email
      const emailRes = await fetch("/api/send-pdf-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientEmail,
          customerName,
          pdfBase64,
          surface: substrate,
          contamination,
          product: recommendation.product,
        }),
      });

      if (emailRes.ok) {
        setEmailSuccess(true);
        setTimeout(() => setEmailSuccess(false), 3000);
      } else {
        const err = await emailRes.json();
        setLastMessage(err.error || "Failed to send email.");
      }
    } catch (err) {
      console.error(err);
      setLastMessage("Could not send email.");
    } finally {
      setSendingEmail(false);
    }
  }

  return (
    <div className={`min-h-screen transition-colors duration-200 ${dm ? "bg-slate-900" : "bg-[#f5f7fa]"}`}>
      {/* Full-width brand header */}
      <header className={`w-full ${dm ? "bg-slate-800 border-b border-slate-700" : "bg-[#3d4f5c]"}`}>
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <Image
              src="/mavro-logo.png"
              alt="Mavro"
              width={160}
              height={48}
              priority
              className="h-9 md:h-11 w-auto brightness-0 invert"
            />
            <p className="text-[#f5a623] text-[10px] font-bold tracking-widest mt-1 uppercase">
              Površinska izboljševalna tehnologija
            </p>
            <p className="text-slate-400 text-[10px]">Surface Improvement Technology</p>
          </div>
          <button
            onClick={() => setDarkMode(!dm)}
            aria-label="Toggle dark mode"
            className="w-10 h-10 rounded-full flex items-center justify-center touch-manipulation transition-colors bg-white/10 hover:bg-white/20 text-white"
          >
            {dm ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.166 17.834a.75.75 0 00-1.06 1.06l1.59 1.591a.75.75 0 001.061-1.06l-1.59-1.591zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.166 6.106a.75.75 0 00-1.061 1.06l1.59 1.591a.75.75 0 001.061-1.06l-1.59-1.59z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>
      </header>
      <main className="relative py-6 px-0 pb-safe">
        <div className="max-w-2xl w-full mx-auto px-4">

          {/* Main Card */}
          <div className={`rounded-xl shadow-lg border transition-colors duration-200 ${dm ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"}`}>
            <div className="p-5 md:p-7 space-y-6 md:space-y-7">

              {/* Customer Information */}
              <section className={`rounded-lg shadow-md border p-4 space-y-3 transition-colors duration-200 ${dm ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"}`}>
                <div className="flex items-center justify-between">
                  <h2 className={`text-base font-bold ${dm ? "text-slate-100" : "text-gray-800"}`}>Informacije o stranki <span className="text-xs font-normal text-gray-400 ml-2">Customer Information</span></h2>
                  <span className={`text-xs font-medium ${dm ? "text-slate-400" : "text-gray-400"}`}>Optional</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${dm ? "text-slate-300" : "text-gray-600"}`}>Ime stranke</label>
                    <input
                      type="text"
                      placeholder="npr. Janez Novak"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className={`w-full border rounded-lg px-3 py-3 md:py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#a855a7] focus:border-transparent focus:scale-[1.02] transition-all duration-200 touch-manipulation ${dm ? "bg-slate-700 border-slate-600 text-white placeholder-slate-400" : "bg-white border-gray-300 text-gray-700"}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${dm ? "text-slate-300" : "text-gray-600"}`}>Lokacija projekta</label>
                    <input
                      type="text"
                      placeholder="npr. Stavba A, Ljubljana"
                      value={projectLocation}
                      onChange={(e) => setProjectLocation(e.target.value)}
                      className={`w-full border rounded-lg px-3 py-3 md:py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#a855a7] focus:border-transparent focus:scale-[1.02] transition-all duration-200 touch-manipulation ${dm ? "bg-slate-700 border-slate-600 text-white placeholder-slate-400" : "bg-white border-gray-300 text-gray-700"}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${dm ? "text-slate-300" : "text-gray-600"}`}>Kontaktni podatki</label>
                    <input
                      type="text"
                      placeholder="e.g., +386 40 123 456"
                      value={contactInfo}
                      onChange={(e) => setContactInfo(e.target.value)}
                      className={`w-full border rounded-lg px-3 py-3 md:py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#a855a7] focus:border-transparent focus:scale-[1.02] transition-all duration-200 touch-manipulation ${dm ? "bg-slate-700 border-slate-600 text-white placeholder-slate-400" : "bg-white border-gray-300 text-gray-700"}`}
                    />
                  </div>
                </div>

                <p className={`text-xs ${dm ? "text-slate-400" : "text-gray-500"}`}>💡 Podatki o stranki bodo personalizirali PDF poročilo</p>
              </section>

              {/* Step 1: Image Upload */}
              <section className="space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-full bg-[#a855a7] flex items-center justify-center text-white text-sm font-bold">
                    1
                  </div>
                  <h2 className={`text-lg font-bold ${dm ? "text-slate-100" : "text-gray-800"}`}>Naloži fotografijo površine</h2>
                </div>

                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files) addImages(e.dataTransfer.files); }}
                  className={`transition-all duration-300 rounded-lg border-2 border-dashed p-3 ${isDragging ? `scale-[1.02] ${dm ? "border-[#a855a7] bg-purple-950" : "border-[#a855a7] bg-purple-50"}` : "border-transparent"}`}
                >
                <div className="flex flex-wrap gap-3">
                  <label
                    htmlFor="camera-upload"
                    onMouseDown={addRipple}
                    className="btn-ripple md:hidden cursor-pointer inline-flex items-center gap-2 px-4 py-3 min-h-[48px] touch-manipulation bg-[#3d4f5c] text-white text-sm font-medium rounded-lg hover:bg-[#2d3d48] hover:scale-105 active:scale-95 transition-all duration-200"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Take Photo
                  </label>
                  <label
                    htmlFor="photo-upload"
                    onMouseDown={addRipple}
                    className="btn-ripple cursor-pointer inline-flex items-center gap-2 px-4 py-3 md:py-2 min-h-[48px] touch-manipulation bg-[#3d4f5c] text-white text-sm font-medium rounded-lg hover:bg-[#2d3d48] hover:scale-105 active:scale-95 transition-all duration-200"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {photos.length > 0 ? `Add More (${photos.length}/5)` : "Select Images"}
                  </label>

                  {photos.length > 0 && (
                    <button
                      onClick={handleAnalyzeImages}
                      onMouseDown={addRipple}
                      disabled={analyzing}
                      className="btn-ripple inline-flex items-center gap-2 px-4 py-3 md:py-2 min-h-[48px] touch-manipulation bg-[#a855a7] text-white text-sm font-medium rounded-lg hover:bg-[#9333a0] hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      {analyzing ? (
                        <>
                          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                          Analyze with AI
                        </>
                      )}
                    </button>
                  )}
                </div>

                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => { if (e.target.files) addImages(e.target.files); }}
                />
                <input
                  id="camera-upload"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => { if (e.target.files) addImages(e.target.files); }}
                />

                {photos.length > 0 && (
                  <div className="mt-3 space-y-3">
                    {/* Count + Clear All */}
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-medium ${dm ? "text-slate-400" : "text-gray-500"}`}>
                        {photos.length} image{photos.length !== 1 ? "s" : ""} selected{photos.length === 5 ? " (max)" : ""}
                      </span>
                      <button
                        onClick={clearAllImages}
                        className={`text-xs underline transition-colors ${dm ? "text-slate-400 hover:text-slate-200" : "text-gray-400 hover:text-gray-600"}`}
                      >
                        Clear all
                      </button>
                    </div>

                    {/* Thumbnail grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {photos.map((src, i) => (
                        <div
                          key={i}
                          className={`relative rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                            analyzingIndex === i
                              ? "border-[#a855a7]"
                              : dm ? "border-slate-600" : "border-gray-200"
                          }`}
                        >
                          <img
                            src={src}
                            alt={`Surface ${i + 1}`}
                            className={`w-full h-28 object-cover ${dm ? "bg-slate-700" : "bg-gray-50"}`}
                          />
                          {/* Index badge */}
                          <div className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full bg-gray-700/80 text-white text-xs font-bold flex items-center justify-center">
                            {i + 1}
                          </div>
                          {/* Remove button */}
                          <button
                            onClick={() => removeImage(i)}
                            disabled={analyzing}
                            aria-label="Remove image"
                            className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors disabled:opacity-40"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                          {/* Analyzing overlay */}
                          {analyzingIndex === i && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <svg className="animate-spin w-6 h-6 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                            </div>
                          )}
                          {/* Done checkmark */}
                          {aiAnalyses[i] && analyzingIndex !== i && (
                            <div className="absolute bottom-1.5 right-1.5 w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Skeleton while analyzing */}
                    {analyzing && (
                      <div className={`animate-fade-in rounded-lg border p-4 space-y-3 ${dm ? "border-slate-600 bg-slate-700" : "border-gray-300 bg-gray-50"}`}>
                        <div className={`h-4 w-1/3 ${dm ? "skeleton-dark" : "skeleton"}`} />
                        <div className="grid sm:grid-cols-2 gap-3">
                          <div className={`h-16 ${dm ? "skeleton-dark" : "skeleton"}`} />
                          <div className={`h-16 ${dm ? "skeleton-dark" : "skeleton"}`} />
                        </div>
                        <div className={`h-10 w-full ${dm ? "skeleton-dark" : "skeleton"}`} />
                      </div>
                    )}

                    {/* Per-image analysis results */}
                    {aiAnalyses.some(a => a !== null) && !analyzing && (
                      <div className="space-y-3">
                        {aiAnalyses.map((analysis, i) => analysis && (
                          <div key={i} className={`animate-fade-in rounded-lg border p-4 ${dm ? "border-slate-600 bg-slate-700" : "border-gray-300 bg-gray-50"}`}>
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-6 h-6 rounded-full bg-[#3d4f5c] text-white text-xs font-bold flex items-center justify-center">
                                {i + 1}
                              </div>
                              <h3 className={`text-sm font-bold ${dm ? "text-slate-100" : "text-gray-800"}`}>
                                Slika {i + 1} — AI Analiza
                              </h3>
                            </div>
                            <div className="grid sm:grid-cols-2 gap-3">
                              {analysis.detectedContamination && (
                                <div className={`rounded-lg p-3 border transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md ${dm ? "bg-slate-800 border-slate-600" : "bg-white border-gray-200"}`}>
                                  <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${dm ? "text-slate-400" : "text-gray-500"}`}>Umazanija</p>
                                  <p className={`text-sm font-bold ${dm ? "text-slate-100" : "text-gray-800"}`}>{analysis.detectedContamination}</p>
                                  <div className="mt-2 flex items-center gap-2">
                                    <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${dm ? "bg-slate-600" : "bg-gray-200"}`}>
                                      <div className="h-full bg-[#a855a7] transition-all duration-1000" style={{ width: `${analysis.confidence * 100}%` }} />
                                    </div>
                                    <span className={`text-xs font-semibold ${dm ? "text-slate-300" : "text-gray-600"}`}>{Math.round(analysis.confidence * 100)}%</span>
                                  </div>
                                </div>
                              )}
                              {analysis.surfaceSuggestion && (
                                <div className={`rounded-lg p-3 border transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md ${dm ? "bg-slate-800 border-slate-600" : "bg-white border-gray-200"}`}>
                                  <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${dm ? "text-slate-400" : "text-gray-500"}`}>Vrsta površine</p>
                                  <p className={`text-sm font-bold ${dm ? "text-slate-100" : "text-gray-800"}`}>{analysis.surfaceSuggestion}</p>
                                </div>
                              )}
                            </div>
                            {analysis.notes && (
                              <div className={`mt-3 rounded-lg p-3 border ${dm ? "bg-slate-800 border-slate-600" : "bg-white border-gray-200"}`}>
                                <p className={`text-sm italic ${dm ? "text-slate-300" : "text-gray-600"}`}>{analysis.notes}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                </div>{/* end dropzone */}
              </section>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className={`w-full border-t ${dm ? "border-slate-600" : "border-gray-200"}`}></div>
                </div>
                <div className="relative flex justify-center">
                  <span className={`px-3 text-xs font-medium ${dm ? "bg-slate-800 text-slate-400" : "bg-white text-gray-500"}`}>Potrdite podatke</span>
                </div>
              </div>

              {/* Step 2: Surface Type */}
              <section className="space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-full bg-[#a855a7] flex items-center justify-center text-white text-sm font-bold">
                    2
                  </div>
                  <h2 className={`text-lg font-bold ${dm ? "text-slate-100" : "text-gray-800"}`}>Vrsta površine</h2>
                </div>

                <div className="relative">
                  <select
                    className={`w-full appearance-none border rounded-lg px-4 py-3.5 md:py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#a855a7] focus:border-transparent focus:scale-[1.02] transition-all duration-200 cursor-pointer touch-manipulation ${dm ? "bg-slate-700 border-slate-600 text-white hover:border-slate-500" : "bg-white border-gray-300 text-gray-700 hover:border-gray-400"}`}
                    value={substrate ?? ""}
                    onChange={(e) => setSubstrate(e.target.value || null)}
                  >
                    <option value="">Select surface type...</option>
                    {SUBSTRATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <div className={`pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 ${dm ? "text-slate-400" : "text-gray-400"}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </section>

              {/* Step 3: Contamination */}
              <section className="space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-full bg-[#a855a7] flex items-center justify-center text-white text-sm font-bold">
                    3
                  </div>
                  <h2 className={`text-lg font-bold ${dm ? "text-slate-100" : "text-gray-800"}`}>Vrsta umazanije</h2>
                </div>

                <div className="relative">
                  <select
                    className={`w-full appearance-none border rounded-lg px-4 py-3.5 md:py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#a855a7] focus:border-transparent focus:scale-[1.02] transition-all duration-200 cursor-pointer touch-manipulation ${dm ? "bg-slate-700 border-slate-600 text-white hover:border-slate-500" : "bg-white border-gray-300 text-gray-700 hover:border-gray-400"}`}
                    value={contamination ?? ""}
                    onChange={(e) => setContamination(e.target.value || null)}
                  >
                    <option value="">Select contamination type...</option>
                    {CONTAMINATIONS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <div className={`pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 ${dm ? "text-slate-400" : "text-gray-400"}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </section>

              {/* Step 4: Recommendation */}
              <section className="space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-full bg-[#a855a7] flex items-center justify-center text-white text-sm font-bold">
                    4
                  </div>
                  <h2 className={`text-lg font-bold ${dm ? "text-slate-100" : "text-gray-800"}`}>Priporočilo za zdravljenje</h2>
                </div>

                {!substrate || !contamination ? (
                  <div className={`border-2 border-dashed rounded-lg p-6 text-center ${dm ? "bg-slate-700 border-slate-600" : "bg-gray-50 border-gray-300"}`}>
                    <svg className={`w-12 h-12 mx-auto mb-3 ${dm ? "text-slate-500" : "text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className={`text-sm font-medium ${dm ? "text-slate-300" : "text-gray-600"}`}>
                      Izberite vrsto površine in umazanije za priporočilo.
                    </p>
                  </div>
                ) : recommendation ? (
                  <div className={`animate-fade-in rounded-lg border overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl ${dm ? "bg-slate-800 border-slate-700" : "bg-white border-gray-300"}`}>
                    <div className="bg-[#3d4f5c] px-4 py-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-white font-bold text-base">Rešitev za površino</h3>
                        <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>

                    <div className="p-4 space-y-4">
                      <div className={`flex items-start gap-2 pb-3 border-b ${dm ? "border-slate-600" : "border-gray-200"}`}>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${dm ? "bg-slate-700" : "bg-gray-100"}`}>
                          <svg className={`w-5 h-5 ${dm ? "text-slate-300" : "text-gray-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                        </div>
                        <div>
                          <p className={`text-xs font-semibold uppercase tracking-wide mb-0.5 ${dm ? "text-slate-400" : "text-gray-500"}`}>Priporočen izdelek</p>
                          <p className={`text-base font-bold ${dm ? "text-slate-100" : "text-gray-900"}`}>{recommendation.product}</p>
                        </div>
                      </div>

                      {/* Feature badges */}
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${dm ? "bg-emerald-900/20 text-emerald-400" : "bg-emerald-50 text-emerald-700"}`}>
                          <span>🌱</span><span>Biorazgradljivo</span>
                        </span>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${dm ? "bg-blue-900/20 text-blue-400" : "bg-blue-50 text-blue-700"}`}>
                          <span>⚡</span><span>Hitro in učinkovito</span>
                        </span>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${dm ? "bg-purple-900/20 text-purple-400" : "bg-purple-50 text-purple-700"}`}>
                          <span>⭐</span><span>Profesionalna kakovost</span>
                        </span>
                      </div>

                      {/* Product catalog card */}
                      {catalogProduct && (
                        <div className={`rounded-lg border p-3 animate-fade-in ${dm ? "bg-slate-700 border-slate-600" : "bg-gray-50 border-gray-200"}`}>
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <p className={`text-xs leading-relaxed ${dm ? "text-slate-300" : "text-gray-500"}`}>
                              {catalogProduct.description}
                            </p>
                            <div className="text-right flex-shrink-0">
                              <div>
                                <span className={`text-lg font-bold ${dm ? "text-white" : "text-gray-800"}`}>
                                  €{catalogProduct.price.toFixed(2)}
                                </span>
                                <span className={`text-xs ${dm ? "text-slate-400" : "text-gray-400"}`}>/L</span>
                              </div>
                              <div className={`text-xs font-semibold ${catalogProduct.inStock ? "text-green-500" : "text-amber-500"}`}>
                                {catalogProduct.inStock ? "✓ In Stock" : "⚠ Low Stock"}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-1.5 mb-3">
                            {catalogProduct.sizes.map((s) => (
                              <div key={s.label} className={`flex-1 rounded-md border text-center py-1.5 ${dm ? "bg-slate-800 border-slate-600" : "bg-white border-gray-200"}`}>
                                <div className={`text-xs font-bold ${dm ? "text-white" : "text-gray-700"}`}>{s.label}</div>
                                <div className={`text-xs ${dm ? "text-slate-400" : "text-gray-500"}`}>€{s.price}</div>
                              </div>
                            ))}
                          </div>
                          <a
                            href={getProductUrl(catalogProduct)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-gradient-to-r from-[#a855a7] to-[#7c3aed] text-white text-sm font-semibold hover:from-[#9333a0] hover:to-[#6d28d9] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.647 9M16 13v9m-4-9v9m5-9l2.647 9" />
                            </svg>
                            Order {catalogProduct.name}
                          </a>
                        </div>
                      )}

                      <div className="grid sm:grid-cols-2 gap-3">
                        <div className={`rounded-lg p-3 border ${dm ? "bg-slate-700 border-slate-600" : "bg-gray-50 border-gray-200"}`}>
                          <p className={`text-xs font-semibold uppercase tracking-wide mb-0.5 ${dm ? "text-slate-400" : "text-gray-600"}`}>Površina</p>
                          <p className={`text-sm font-medium ${dm ? "text-slate-200" : "text-gray-800"}`}>{substrate}</p>
                        </div>
                        <div className={`rounded-lg p-3 border ${dm ? "bg-slate-700 border-slate-600" : "bg-gray-50 border-gray-200"}`}>
                          <p className={`text-xs font-semibold uppercase tracking-wide mb-0.5 ${dm ? "text-slate-400" : "text-gray-600"}`}>Umazanija</p>
                          <p className={`text-sm font-medium ${dm ? "text-slate-200" : "text-gray-800"}`}>{contamination}</p>
                        </div>
                      </div>

                      <div className={`rounded-lg p-3 border ${dm ? "bg-slate-700 border-slate-600" : "bg-gray-50 border-gray-200"}`}>
                        <div className="flex items-start gap-2">
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${dm ? "bg-slate-600" : "bg-gray-300"}`}>
                            <svg className={`w-4 h-4 ${dm ? "text-slate-300" : "text-gray-700"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <p className={`text-xs font-semibold mb-0.5 ${dm ? "text-slate-300" : "text-gray-700"}`}>Razmerje redčenja</p>
                            <p className={`text-sm ${dm ? "text-slate-300" : "text-gray-700"}`}>{recommendation.dilution}</p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className={`text-sm font-bold mb-2 flex items-center gap-2 ${dm ? "text-slate-200" : "text-gray-800"}`}>
                          <svg className={`w-4 h-4 ${dm ? "text-slate-400" : "text-gray-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          Navodila za uporabo
                        </h4>
                        <div className="space-y-2">
                          {recommendation.steps.map((step, index) => (
                            <div key={index} className="flex gap-2 items-start">
                              <div className="w-6 h-6 rounded-full bg-[#3d4f5c] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                {index + 1}
                              </div>
                              <p className={`text-sm pt-0.5 leading-relaxed ${dm ? "text-slate-300" : "text-gray-700"}`}>{step}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className={`rounded-lg p-3 border ${dm ? "bg-slate-700 border-slate-600" : "bg-gray-100 border-gray-300"}`}>
                        <div className="flex items-start gap-2">
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${dm ? "bg-slate-600" : "bg-gray-300"}`}>
                            <svg className={`w-4 h-4 ${dm ? "text-slate-300" : "text-gray-700"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <p className={`text-xs font-bold mb-1 ${dm ? "text-slate-300" : "text-gray-700"}`}>Varnostna navodila</p>
                            <p className={`text-sm leading-relaxed ${dm ? "text-slate-300" : "text-gray-700"}`}>{recommendation.safety}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col md:flex-row gap-2 mt-2">
                        <button
                          onClick={handleSendToServer}
                          onMouseDown={addRipple}
                          disabled={sending}
                          className="btn-ripple w-full md:flex-1 px-4 py-3 md:py-2.5 min-h-[48px] touch-manipulation bg-[#3d4f5c] text-white text-sm font-semibold rounded-lg hover:bg-[#2d3d48] hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                        >
                          {sending ? (
                            <>
                              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Saving...
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                              </svg>
                              Shrani načrt
                            </>
                          )}
                        </button>

                        <button
                          onClick={downloadPDF}
                          onMouseDown={addRipple}
                          className="btn-ripple w-full md:flex-1 px-4 py-3 md:py-2.5 min-h-[48px] touch-manipulation bg-[#f5a623] text-white text-sm font-semibold rounded-lg hover:bg-[#e09612] hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Prenesi PDF
                        </button>
                      </div>

                      {/* Email row */}
                      <div className={`mt-1 rounded-lg border p-3 space-y-2 ${dm ? "bg-slate-700 border-slate-600" : "bg-gray-50 border-gray-200"}`}>
                        <label className={`block text-xs font-semibold ${dm ? "text-slate-300" : "text-gray-600"}`}>
                          Pošlji poročilo po e-pošti <span className={`font-normal ${dm ? "text-slate-400" : "text-gray-400"}`}>(neobvezno)</span>
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="email"
                            placeholder="customer@example.com"
                            value={recipientEmail}
                            onChange={(e) => setRecipientEmail(e.target.value)}
                            className={`flex-1 border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#a855a7] focus:border-transparent transition-all duration-200 ${dm ? "bg-slate-800 border-slate-600 text-white placeholder-slate-400" : "bg-white border-gray-300 text-gray-700"} ${recipientEmail && !isValidEmail(recipientEmail) ? "border-red-400 focus:ring-red-400" : ""}`}
                          />
                          <button
                            onClick={sendViaEmail}
                            onMouseDown={addRipple}
                            disabled={sendingEmail || !isValidEmail(recipientEmail)}
                            className="btn-ripple inline-flex items-center gap-2 px-4 py-2.5 min-h-[42px] touch-manipulation bg-[#a855a7] text-white text-sm font-medium rounded-lg hover:bg-[#9333a0] hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 whitespace-nowrap"
                          >
                            {sendingEmail ? (
                              <>
                                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                Sending...
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                Send Email
                              </>
                            )}
                          </button>
                        </div>
                        {recipientEmail && !isValidEmail(recipientEmail) && (
                          <p className="text-xs text-red-500">Vnesite veljavni e-naslov</p>
                        )}
                        {emailSuccess && (
                          <div className="animate-bounce-once flex items-center gap-2 text-green-600 font-semibold text-sm py-0.5">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            E-pošta uspešno poslana!
                          </div>
                        )}
                      </div>

                      {/* Alternative products */}
                      {catalogAlternatives.length > 0 && (
                        <div className={`rounded-lg border p-3 ${dm ? "bg-slate-700 border-slate-600" : "bg-gray-50 border-gray-200"}`}>
                          <p className={`text-xs font-semibold mb-2 ${dm ? "text-slate-300" : "text-gray-600"}`}>
                            Alternativni izdelki
                          </p>
                          <div className="space-y-2">
                            {catalogAlternatives.map((alt) => (
                              <div key={alt.name} className={`flex items-center justify-between rounded-md border px-3 py-2 ${dm ? "bg-slate-800 border-slate-600" : "bg-white border-gray-200"}`}>
                                <div className="min-w-0">
                                  <p className={`text-xs font-semibold truncate ${dm ? "text-white" : "text-gray-700"}`}>{alt.name}</p>
                                  <p className={`text-xs truncate ${dm ? "text-slate-400" : "text-gray-400"}`}>{alt.description}</p>
                                </div>
                                <a
                                  href={getProductUrl(alt, "alternative")}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`ml-3 flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-md border transition-all hover:scale-105 ${dm ? "border-slate-500 text-slate-300 hover:bg-slate-600" : "border-gray-300 text-gray-600 hover:bg-gray-100"}`}
                                >
                                  View →
                                </a>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {pdfSuccess && (
                        <div className="animate-bounce-once flex items-center justify-center gap-2 text-green-600 font-semibold text-sm py-1">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          PDF uspešno prenesen
                        </div>
                      )}
                      {!pdfSuccess && lastMessage && (
                        <div className={`text-center py-2 px-3 rounded-lg text-sm font-medium ${dm ? "bg-slate-700 text-slate-200" : "bg-gray-100 text-gray-700"}`}>
                          <p>{lastMessage}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className={`animate-fade-in border rounded-lg p-6 text-center ${dm ? "bg-slate-700 border-slate-600" : "bg-gray-100 border-gray-300"}`}>
                    <svg className={`w-12 h-12 mx-auto mb-3 ${dm ? "text-slate-500" : "text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className={`font-semibold mb-1 text-sm ${dm ? "text-slate-200" : "text-gray-700"}`}>Ni priporočila</p>
                    <p className={`text-sm ${dm ? "text-slate-300" : "text-gray-600"}`}>
                      Za to kombinacijo nimamo priporočila. Prosimo, kontaktirajte Mavro tehnično podporo.
                    </p>
                  </div>
                )}
              </section>
            </div>
          </div>

          {/* Footer */}
          <footer className={`mt-8 rounded-xl overflow-hidden ${dm ? "bg-slate-800 border border-slate-700" : "bg-[#3d4f5c]"}`}>
            <div className="px-6 py-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">

              {/* Column 1: Contact */}
              <div>
                <h3 className="text-white font-bold mb-3 text-xs uppercase tracking-widest">Kontakt</h3>
                <p className="text-slate-300 leading-relaxed text-xs">
                  Mavro Slovenija<br/>
                  Kajakaška cesta 40<br/>
                  1211 Ljubljana – Šmartno<br/>
                  <span className="text-[#f5a623]">+386 (0) 41 902 700</span><br/>
                  info@mavro-int.si
                </p>
              </div>

              {/* Column 2: Quick links */}
              <div>
                <h3 className="text-white font-bold mb-3 text-xs uppercase tracking-widest">Povezave</h3>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  <li><a href="https://mavro-int.com/sl" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">O podjetju</a></li>
                  <li><a href="https://mavro-int.shop/sl/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Izdelki</a></li>
                  <li><a href="mailto:info@mavro-int.si" className="hover:text-white transition-colors">Kontakt</a></li>
                  <li><a href="https://www.mavro-int.com/sl" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">www.mavro-int.com/sl</a></li>
                </ul>
              </div>

              {/* Column 3: AI */}
              <div>
                <h3 className="text-white font-bold mb-3 text-xs uppercase tracking-widest">Tehnologija AI</h3>
                <p className="text-slate-300 text-xs leading-relaxed">
                  Razvito s Claude AI<br/>
                  <span className="text-slate-400">Powered by Anthropic</span>
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/10 text-slate-300 text-[10px]">🤖 AI-Powered</span>
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/10 text-slate-300 text-[10px]">✅ ISO 9001</span>
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/10 text-slate-300 text-[10px]">🌱 Trajnostno</span>
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/10 text-slate-300 text-[10px]">🌍 30+ let</span>
                </div>
              </div>
            </div>
            <div className={`px-6 py-3 border-t ${dm ? "border-slate-700" : "border-slate-600"}`}>
              <p className="text-center text-[10px] text-slate-400">
                © {new Date().getFullYear()} Mavro International · www.mavro-int.com
              </p>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}
