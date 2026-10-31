"use client";
import {
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type ReactNode,
} from "react";
import Link from "next/link";
import Image from "next/image";
import { PRODUCT_CATALOG, findProduct } from "@/lib/products";
import { SEED_RULES } from "@/lib/rule-seeds";
import { resolveTreatment } from "@/lib/recommendations";
import { SUBSTRATES, CONTAMINATIONS } from "@/lib/domain";
import { translations } from "@/lib/translations";
import styles from "./preview.module.css";

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const paths: Record<string, ReactNode> = {
    plus: <path d="M12 5v14M5 12h14" />,
    arrow: <path d="m9 5 7 7-7 7M4 12h12" />,
    scan: (
      <>
        <path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5M3 12h18" />
      </>
    ),
    folder: <path d="M3 7V5h6l2 2h10v13H3V7Z" />,
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </>
    ),
    camera: (
      <>
        <path d="m8 6 1-3h6l1 3h5v15H3V6Z" />
        <circle cx="12" cy="13" r="4" />
      </>
    ),
    upload: (
      <>
        <path d="M12 16V3m-5 5 5-5 5 5M4 16v5h16v-5" />
      </>
    ),
    check: <path d="m5 12 4 4L20 5" />,
    chevron: <path d="m9 6 6 6-6 6" />,
    help: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M9.5 9a2.5 2.5 0 1 1 4 2c-1 .7-1.5 1-1.5 3m0 2v1" />
      </>
    ),
    leaf: (
      <>
        <path d="M20 4C7 2 1 8 5 16c8 4 15-1 15-12ZM5 19 16 8" />
      </>
    ),
    close: <path d="m6 6 12 12M6 18 18 6" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] || paths.scan}
    </svg>
  );
}
function SurfaceArt({ small = false }: { small?: boolean }) {
  return (
    <div
      className={`${styles.surfaceArt} ${small ? styles.smallArt : ""}`}
      aria-label="Ilustracija vzorčne mineralne površine"
    >
      <div className={styles.artSky} />
      <div className={styles.artWall}>
        <i />
        <i />
        <i />
        <i />
        <i />
        <i />
      </div>
      <div className={styles.artGreen} />
      <span className={styles.artFocus} />
      <span className={styles.artLabel}>VZORČNA POVRŠINA</span>
    </div>
  );
}
const samples = [
  {
    name: "Zelene obloge na fasadi",
    surface: "Render / mineral plaster",
    dirt: "Green deposits (algae/moss/lichen)",
    tag: "Fasada",
    icon: "leaf",
  },
  {
    name: "Stara barva na lesu",
    surface: "Wood",
    dirt: "Paint",
    tag: "Les",
    icon: "grid",
  },
  {
    name: "Grafiti na betonu",
    surface: "Concrete",
    dirt: "Graffiti",
    tag: "Beton",
    icon: "scan",
  },
];
export default function DesignPreview() {
  const [view, setView] = useState<"advisor" | "cases" | "products">("advisor");
  const [step, setStep] = useState(0),
    [photo, setPhoto] = useState(""),
    [photoName, setPhotoName] = useState("");
  const [surface, setSurface] = useState("Render / mineral plaster"),
    [dirt, setDirt] = useState("Green deposits (algae/moss/lichen)");
  const [area, setArea] = useState("100"),
    [confirmed, setConfirmed] = useState(false),
    [dragging, setDragging] = useState(false),
    [error, setError] = useState("");
  const [details, setDetails] = useState(false),
    [message, setMessage] = useState("");
  const file = useRef<HTMLInputElement>(null);
  const treatment = resolveTreatment(
    {
      substrate: surface,
      contamination: dirt,
      language: "sl",
      area: Number(area) > 0 ? Number(area) : null,
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
  const labels = translations.sl;
  function reset() {
    setView("advisor");
    setStep(0);
    setPhoto("");
    setPhotoName("");
    setConfirmed(false);
    setMessage("");
    setDetails(false);
    setError("");
  }
  function demo(index = 0) {
    const s = samples[index];
    setSurface(s.surface);
    setDirt(s.dirt);
    setPhoto("");
    setPhotoName("Vzorčni primer");
    setConfirmed(false);
    setStep(1);
    setView("advisor");
    setDetails(false);
    setError("");
  }
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
    setPhotoName(selected.name);
    setConfirmed(false);
    setError("");
    setStep(1);
  }
  function drop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    void loadPhoto(e.dataTransfer.files[0]);
  }
  return (
    <div className={styles.app}>
      <aside className={styles.sidebar}>
        <Link
          href="/preview"
          className={styles.brand}
          aria-label="Mavro AI predogled"
        >
          <Image
            src="/mavro-logo.png"
            alt="Mavro"
            width={130}
            height={22}
            priority
          />
          <span>AI</span>
        </Link>
        <span className={styles.workspace}>DELOVNI PROSTOR</span>
        <nav aria-label="Glavna navigacija">
          <button
            className={view === "advisor" ? styles.activeNav : ""}
            onClick={() => setView("advisor")}
          >
            <Icon name="scan" />
            Svetovalec
            <span className={styles.navDot} />
          </button>
          <button
            className={view === "cases" ? styles.activeNav : ""}
            onClick={() => setView("cases")}
          >
            <Icon name="folder" />
            Primeri<span className={styles.count}>3</span>
          </button>
          <button
            className={view === "products" ? styles.activeNav : ""}
            onClick={() => setView("products")}
          >
            <Icon name="grid" />
            Izdelki
          </button>
        </nav>
        <div className={styles.sideBottom}>
          <div className={styles.helpBox}>
            <Icon name="help" />
            <strong>
              Strokovno znanje.
              <br />
              Vedno pri roki.
            </strong>
            <p>Od fotografije do pravega postopka čiščenja.</p>
            <Link href="/">
              Odpri obstoječe orodje <Icon name="arrow" size={16} />
            </Link>
          </div>
          <div className={styles.profile}>
            <span>MI</span>
            <div>
              <strong>Mavro International</strong>
              <small>Interni delovni prostor</small>
            </div>
          </div>
        </div>
      </aside>
      <div className={styles.main}>
        <header className={styles.topbar}>
          <div>
            <span>Delovni prostor</span>
            <Icon name="chevron" size={14} />
            <strong>
              {view === "advisor"
                ? "Svetovalec"
                : view === "cases"
                  ? "Primeri"
                  : "Izdelki"}
            </strong>
          </div>
          <span className={styles.previewBadge}>
            <i />
            Predogled novega izgleda
          </span>
          <span className={styles.language}>SL</span>
        </header>
        <main className={styles.content}>
          <div className={styles.titleRow}>
            <div>
              <p className={styles.eyebrow}>MAVRO SVETOVALEC</p>
              <h1>
                {view === "advisor" ? (
                  <>
                    Čista rešitev.
                    <br />
                    <span>V nekaj korakih.</span>
                  </>
                ) : view === "cases" ? (
                  <>Vse na enem mestu.</>
                ) : (
                  <>
                    Pravi izdelek.
                    <br />
                    <span>Za vsako nalogo.</span>
                  </>
                )}
              </h1>
              <p className={styles.intro}>
                {view === "advisor"
                  ? "Dodaj fotografijo. Potrdi površino. Odkrij pravi postopek."
                  : view === "cases"
                    ? "Pregleden prostor za vaše primere in strokovni pregled."
                    : "Preverjeni Mavro izdelki, povezani s priporočili svetovalca."}
              </p>
            </div>
            {view !== "advisor" && (
              <button className={styles.darkButton} onClick={reset}>
                <Icon name="plus" size={18} />
                Nov primer
              </button>
            )}
            <div className={styles.heroMark} aria-hidden="true">
              <Icon name="scan" size={48} />
            </div>
          </div>
          {view === "advisor" && (
            <>
              <ol className={styles.stepper} aria-label="Koraki svetovanja">
                {["Fotografija", "Potrditev površine", "Priporočilo"].map(
                  (name, i) => (
                    <li
                      key={name}
                      className={
                        i === step
                          ? styles.currentStep
                          : i < step
                            ? styles.doneStep
                            : ""
                      }
                    >
                      <button
                        onClick={() => i <= step && setStep(i)}
                        disabled={i > step}
                        aria-current={i === step ? "step" : undefined}
                      >
                        <span>
                          {i < step ? (
                            <Icon name="check" size={14} />
                          ) : (
                            String(i + 1).padStart(2, "0")
                          )}
                        </span>
                        {name}
                      </button>
                      {i < 2 && <div />}
                    </li>
                  ),
                )}
              </ol>
              {step === 0 && (
                <div className={styles.startGrid}>
                  <section className={styles.uploadCard}>
                    <div className={styles.cardHeading}>
                      <span className={styles.iconTile}>
                        <Icon name="camera" />
                      </span>
                      <div>
                        <h2>Začnimo s fotografijo</h2>
                        <p>Pokaži nam površino, ki potrebuje rešitev.</p>
                      </div>
                      <span className={styles.optional}>01 / 03</span>
                    </div>
                    <div
                      className={`${styles.dropzone} ${dragging ? styles.dragging : ""}`}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragging(true);
                      }}
                      onDragLeave={() => setDragging(false)}
                      onDrop={drop}
                    >
                      <span className={styles.uploadIcon}>
                        <Icon name="upload" size={28} />
                      </span>
                      <h3>Povleci fotografijo sem</h3>
                      <p>ali jo izberi iz svoje naprave</p>
                      <button
                        className={styles.darkButton}
                        onClick={() => file.current?.click()}
                      >
                        <Icon name="plus" size={17} />
                        Dodaj fotografijo
                      </button>
                      <small>JPG, PNG ali WebP · do 20 MB</small>
                    </div>
                    <div className={styles.uploadFooter}>
                      <Icon name="scan" size={16} />
                      <span>
                        Za dober rezultat naj bo površina jasno vidna.
                      </span>
                    </div>
                  </section>
                  <aside className={styles.tipCard}>
                    <span className={styles.tipLabel}>
                      <i />
                      DOBRO JE VEDETI
                    </span>
                    <h2>
                      Vsaka površina
                      <br />
                      ima svojo rešitev.
                    </h2>
                    <p>
                      Fotografiraj od blizu, pri dnevni svetlobi. Vključi
                      umazanijo in del čiste površine.
                    </p>
                    <SurfaceArt />
                    <div className={styles.tipFoot}>
                      <span>01</span>
                      <p>
                        Najprej prepoznamo težavo.
                        <br />
                        <strong>Nato izberemo pravi postopek.</strong>
                      </p>
                    </div>
                  </aside>
                </div>
              )}
              {step === 1 && (
                <section className={styles.confirmCard}>
                  <div className={styles.photoPanel}>
                    {photo ? (
                      <img
                        src={photo}
                        alt="Naložena površina za vizualni predogled"
                      />
                    ) : (
                      <SurfaceArt />
                    )}
                    <div>
                      <span>
                        <Icon name="camera" size={16} />
                        {photoName}
                      </span>
                      <button
                        aria-label="Zamenjaj fotografijo"
                        onClick={() => file.current?.click()}
                      >
                        Zamenjaj
                      </button>
                    </div>
                    <p>
                      Fotografija ostane v tem predogledu v tvojem brskalniku.
                    </p>
                  </div>
                  <div className={styles.confirmForm}>
                    <span className={styles.eyebrow}>ŠE HITER PREGLED</span>
                    <h2>Kaj je na površini?</h2>
                    <p>
                      V predogledu izberi podlago in umazanijo ročno. AI analiza
                      tukaj ni vključena.
                    </p>
                    <label htmlFor="preview-surface">Površina</label>
                    <select
                      id="preview-surface"
                      value={surface}
                      onChange={(e) => {
                        setSurface(e.target.value);
                        setConfirmed(false);
                      }}
                    >
                      {SUBSTRATES.map((s) => (
                        <option value={s} key={s}>
                          {labels.surfaces[s]}
                        </option>
                      ))}
                    </select>
                    <label htmlFor="preview-dirt">Vrsta umazanije</label>
                    <select
                      id="preview-dirt"
                      value={dirt}
                      onChange={(e) => {
                        setDirt(e.target.value);
                        setConfirmed(false);
                      }}
                    >
                      {CONTAMINATIONS.map((s) => (
                        <option value={s} key={s}>
                          {labels.contaminations[s]}
                        </option>
                      ))}
                    </select>
                    <label htmlFor="preview-area">
                      Velikost površine <span>neobvezno</span>
                    </label>
                    <div className={styles.areaInput}>
                      <input
                        id="preview-area"
                        type="number"
                        min="1"
                        max="100000"
                        value={area}
                        onChange={(e) => setArea(e.target.value)}
                      />
                      <span>m²</span>
                    </div>
                    <label className={styles.checkLabel}>
                      <input
                        type="checkbox"
                        checked={confirmed}
                        onChange={(e) => setConfirmed(e.target.checked)}
                      />
                      Potrjujem izbrano površino in umazanijo.
                    </label>
                    <button
                      className={styles.primaryButton}
                      disabled={!confirmed}
                      onClick={() => {
                        setStep(2);
                        setDetails(false);
                      }}
                    >
                      Pokaži priporočilo
                      <Icon name="arrow" size={18} />
                    </button>
                  </div>
                </section>
              )}
              {step === 2 && (
                <section className={styles.result}>
                  <div className={styles.resultHeading}>
                    <span className={styles.resultCheck}>
                      <Icon name={treatment ? "check" : "help"} />
                    </span>
                    <div>
                      <span className={styles.eyebrow}>
                        TVOJ NASLEDNJI KORAK
                      </span>
                      <h2>
                        {treatment
                          ? "Priporočilo je pripravljeno."
                          : "Potreben je strokovni pregled."}
                      </h2>
                      <p>
                        {labels.surfaces[surface]}
                        <span> / </span>
                        {labels.contaminations[dirt]}
                      </p>
                    </div>
                    <button
                      className={styles.textButton}
                      onClick={() => setStep(1)}
                    >
                      Uredi izbor
                    </button>
                  </div>
                  {treatment && product ? (
                    <>
                      <div className={styles.resultGrid}>
                        <div className={styles.productBlock}>
                          <div
                            className={styles.productVisual}
                            aria-label="Grafična ponazoritev izdelka, ne fotografija embalaže"
                          >
                            <div className={styles.canHandle} />
                            <div className={styles.canBody}>
                              <strong>mavro</strong>
                              <span>{product.name}</span>
                              <small>PROFESSIONAL CARE</small>
                            </div>
                          </div>
                          <div className={styles.productCopy}>
                            <span className={styles.productTag}>
                              PRIPOROČEN IZDELEK
                            </span>
                            <h3>{product.name}</h3>
                            <p>{product.description.sl}</p>
                            <a
                              href={product.links?.sl || product.sourceUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Podrobnosti izdelka
                              <Icon name="arrow" size={16} />
                            </a>
                          </div>
                        </div>
                        <div className={styles.estimate}>
                          <Icon name="grid" />
                          <span>Okvirna poraba</span>
                          <strong>
                            {treatment.estimate
                              ? `${treatment.estimate.min}–${treatment.estimate.max} ${treatment.estimate.unit}`
                              : "Po strokovnem pregledu"}
                          </strong>
                          <p>
                            {area
                              ? `Za ${area} m² · nerazredčen izdelek`
                              : "Vnesi površino za izračun."}
                          </p>
                          <small>
                            Dejanska poraba je odvisna od podlage. Najprej
                            izvedi preizkus.
                          </small>
                        </div>
                      </div>
                      <div className={styles.procedure}>
                        <h3>Kako naprej?</h3>
                        <div className={styles.procedureGrid}>
                          {treatment.steps.slice(0, 3).map((s, i) => (
                            <div key={s}>
                              <span>0{i + 1}</span>
                              <p>{s}</p>
                            </div>
                          ))}
                        </div>
                        <button
                          className={styles.textButton}
                          onClick={() => setDetails(!details)}
                          aria-expanded={details}
                        >
                          {details
                            ? "Skrij podrobnosti"
                            : "Celoten postopek in varnost"}
                          <Icon name="plus" size={16} />
                        </button>
                        {details && (
                          <div className={styles.details}>
                            <p>
                              <strong>Redčenje: </strong>
                              {treatment.dilution}
                            </p>
                            <ol>
                              {treatment.steps.map((s) => (
                                <li key={s}>{s}</li>
                              ))}
                            </ol>
                            <p>{treatment.safety}</p>
                            <a
                              href={treatment.sourceUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Vir priporočila · preverjeno {treatment.checkedAt}
                            </a>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <p className={styles.reviewMessage}>
                      Za to kombinacijo ni potrjenega varnega postopka. V
                      obstoječem orodju lahko primer oddaš Mavro strokovnjaku.
                    </p>
                  )}
                  <div className={styles.resultFooter}>
                    <p>
                      <Icon name="help" size={17} />
                      Pred uporabo preveri tehnični in varnostni list.
                    </p>
                    <button
                      className={styles.darkButton}
                      onClick={() =>
                        setMessage(
                          "To je predogled izgleda. Za shranjevanje primera in PDF uporabi obstoječe orodje.",
                        )
                      }
                    >
                      Shrani primer
                      <Icon name="arrow" size={17} />
                    </button>
                  </div>
                  {message && (
                    <p role="status" className={styles.notice}>
                      {message} <Link href="/">Odpri orodje →</Link>
                    </p>
                  )}
                </section>
              )}
              {step === 0 && (
                <section className={styles.examples}>
                  <div className={styles.sectionHeading}>
                    <h2>Ali najprej raziščemo primer?</h2>
                    <span>BREZ NALAGANJA FOTOGRAFIJE</span>
                  </div>
                  <div className={styles.sampleGrid}>
                    {samples.map((s, i) => (
                      <button
                        key={s.name}
                        className={styles.sampleCard}
                        onClick={() => demo(i)}
                      >
                        <span
                          className={`${styles.sampleIcon} ${styles["sample" + i]}`}
                        >
                          <Icon name={s.icon} size={24} />
                        </span>
                        <span>
                          <small>{s.tag}</small>
                          <strong>{s.name}</strong>
                        </span>
                        <Icon name="arrow" size={18} />
                      </button>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
          {view === "cases" && (
            <section className={styles.casesCard}>
              <div className={styles.sectionHeading}>
                <h2>Vzorčni primeri</h2>
                <span>PONAZORITVENI PODATKI</span>
              </div>
              {samples.map((s, i) => (
                <button
                  key={s.name}
                  className={styles.caseRow}
                  onClick={() => demo(i)}
                >
                  <span className={styles.caseThumb}>
                    <Icon name={s.icon} size={24} />
                  </span>
                  <span>
                    <strong>{s.name}</strong>
                    <small>
                      Vzorec 00{i + 1} · {s.tag}
                    </small>
                  </span>
                  <span className={styles.status}>
                    <Icon name="clock" size={14} />
                    Za pregled
                  </span>
                  <Icon name="chevron" size={18} />
                </button>
              ))}
              <p className={styles.dataNote}>
                Prikaz zasnove seznama. Dejanski shranjeni primeri so v{" "}
                <Link href="/admin">obstoječi administraciji</Link>.
              </p>
            </section>
          )}
          {view === "products" && (
            <section className={styles.catalog}>
              {PRODUCT_CATALOG.map((p) => (
                <a
                  href={p.links?.sl || p.sourceUrl}
                  key={p.id}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span className={styles.catalogIcon}>
                    <Icon name="grid" size={26} />
                  </span>
                  <h2>{p.name}</h2>
                  <p>{p.description.sl}</p>
                  <span>
                    Preveri izdelek <Icon name="arrow" size={16} />
                  </span>
                </a>
              ))}
            </section>
          )}
          {error && (
            <p className={styles.notice} role="alert">
              {error}
            </p>
          )}
          <input
            ref={file}
            className={styles.hiddenFile}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            aria-label="Izberi fotografijo površine"
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              void loadPhoto(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <footer className={styles.footer}>
            <span>
              MAVRO INTERNATIONAL<span className={styles.footerDot}>·</span>
              Znanje, ki varuje površine.
            </span>
            <span>
              Oblikovni predogled <i /> v1.0
            </span>
          </footer>
        </main>
      </div>
    </div>
  );
}
