"use client";
import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CONTAMINATIONS,
  LANGUAGES,
  SUBSTRATES,
  type Rule,
  type SavedCase,
} from "@/lib/domain";
import { PRODUCT_CATALOG } from "@/lib/products";
import { jsonRequest } from "@/lib/client";
import { TreatmentResult } from "@/components/treatment-result";
export default function Admin() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false),
    [tab, setTab] = useState<"cases" | "rules">("cases"),
    [rules, setRules] = useState<Rule[]>([]),
    [cases, setCases] = useState<SavedCase[]>([]),
    [total, setTotal] = useState(0),
    [pending, setPending] = useState(0),
    [offset, setOffset] = useState(0),
    [legacy, setLegacy] = useState(false),
    [filter, setFilter] = useState(""),
    [editing, setEditing] = useState<Rule | null>(null),
    [selected, setSelected] = useState<SavedCase | null>(null),
    [note, setNote] = useState(""),
    [photo, setPhoto] = useState<string | null>(null),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    const page = await jsonRequest<{
      analyses: SavedCase[];
      total: number;
      pending: number;
      legacyAvailable: boolean;
    }>(`/api/analyses?limit=25&offset=${offset}`);
    setCases(page.analyses);
    setTotal(page.total);
    setPending(page.pending);
    setLegacy(page.legacyAvailable);
    const data = await jsonRequest<{ rules: Rule[] }>("/api/rules");
    setRules(data.rules);
  }, [offset]);
  useEffect(() => {
    let cancelled = false;
    jsonRequest<{ authenticated: boolean }>("/api/session")
      .then(async (data) => {
        if (!data.authenticated) {
          window.location.replace("/admin/login");
          return;
        }
        if (!cancelled) {
          setAuthenticated(true);
          await load();
        }
      })
      .catch((error) => {
        if (!cancelled) setMessage(error.message);
      });
    return () => {
      cancelled = true;
    };
  }, [load]);
  async function act(fn: () => Promise<void>) {
    setBusy(true);
    setMessage("");
    try {
      await fn();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Zahteva ni uspela");
    } finally {
      setBusy(false);
    }
  }
  if (!authenticated)
    return (
      <main className="login-page">
        <p>{message || "Preverjam prijavo…"}</p>
        <a href="/admin/login">Prijava</a>
      </main>
    );
  const filteredRules = rules.filter((r) =>
    `${r.substrate} ${r.contamination} ${r.productId}`
      .toLowerCase()
      .includes(filter.toLowerCase()),
  );
  const filteredCases = cases.filter((c) =>
    `${c.input.customerName} ${c.input.contactInfo} ${c.input.location} ${c.id}`
      .toLowerCase()
      .includes(filter.toLowerCase()),
  );
  function changeInstruction(
    lang: (typeof LANGUAGES)[number],
    key: "dilution" | "steps" | "safety",
    value: string,
  ) {
    if (!editing) return;
    setEditing({
      ...editing,
      instructions: {
        ...editing.instructions,
        [lang]: {
          ...editing.instructions[lang],
          [key]: key === "steps" ? value.split("\n") : value,
        },
      },
    });
  }
  return (
    <div className="advisor">
      <header className="brand-header">
        <div className="shell header-inner">
          <h1>
            MAVRO <small>Administracija</small>
          </h1>
          <div className="toolbar">
            <Link href="/">Svetovalec ↗</Link>
            <button
              disabled={busy}
              onClick={() =>
                void act(async () => {
                  await jsonRequest("/api/session", {}, "DELETE");
                  router.push("/admin/login");
                })
              }
            >
              Odjava
            </button>
          </div>
        </div>
      </header>
      <main className="shell admin-main">
        <div className="stats-grid">
          <div className="card">
            <span>Primeri</span>
            <strong>{total}</strong>
          </div>
          <div className="card">
            <span>Čaka na pregled</span>
            <strong>{pending}</strong>
          </div>
          <div className="card">
            <span>Objavljena pravila</span>
            <strong>{rules.filter((r) => r.approved).length}</strong>
          </div>
        </div>
        <div className="toolbar">
          <button
            className={tab === "cases" ? "primary" : ""}
            onClick={() => {
              setTab("cases");
              setFilter("");
            }}
          >
            Primeri
          </button>
          <button
            className={tab === "rules" ? "primary" : ""}
            onClick={() => {
              setTab("rules");
              setFilter("");
            }}
          >
            Pravila
          </button>
          <button disabled={busy} onClick={() => void act(load)}>
            Osveži
          </button>
        </div>
        {legacy && (
          <p className="notice">
            Prejšnje tabele so ohranjene. Stara navodila se ne objavijo
            samodejno.{" "}
            <a href="/api/analyses?legacy=1">Prenesi prejšnje podatke</a>
          </p>
        )}
        <label>
          Iskanje {tab === "cases" ? "na trenutni strani" : ""}
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Stranka, podlaga, izdelek…"
          />
        </label>
        {message && (
          <p role="status" className="notice">
            {message}
          </p>
        )}
        {tab === "cases" ? (
          <>
            <div className="case-grid">
              {filteredCases.map((item) => (
                <article className="card" key={item.id}>
                  <div className="toolbar">
                    <span className={`status ${item.review}`}>
                      {item.review === "pending"
                        ? "Čaka na pregled"
                        : item.review === "approved"
                          ? "Pregledano"
                          : "Zavrnjeno"}
                    </span>
                    <time>
                      {new Date(item.createdAt).toLocaleDateString("sl-SI")}
                    </time>
                  </div>
                  <h3>{item.input.customerName || "Brez imena"}</h3>
                  <p>{item.input.location}</p>
                  <p>
                    {item.input.substrate} · {item.input.contamination}
                  </p>
                  <p>
                    <strong>
                      {item.treatment?.product || "Potreben strokovni pregled"}
                    </strong>
                  </p>
                  <div className="thumbs">
                    {item.photos.map((p) => (
                      <button
                        key={p.id}
                        onClick={() =>
                          setPhoto(`/api/cases/${item.id}/photos/${p.id}`)
                        }
                      >
                        <Image
                          width={100}
                          height={75}
                          unoptimized
                          src={`/api/cases/${item.id}/photos/${p.id}`}
                          alt={p.name}
                        />
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      setSelected(item);
                      setNote(item.reviewNote);
                    }}
                  >
                    Odpri primer
                  </button>
                  <p className="small muted">{item.id}</p>
                </article>
              ))}
            </div>
            <div className="toolbar">
              <button
                disabled={offset === 0 || busy}
                onClick={() => setOffset(Math.max(0, offset - 25))}
              >
                Prejšnja
              </button>
              <span>
                {offset + 1}–{Math.min(offset + 25, total)} / {total}
              </span>
              <button
                disabled={offset + 25 >= total || busy}
                onClick={() => setOffset(offset + 25)}
              >
                Naslednja
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="notice">
              Spremembe objavljenih pravil se uporabljajo pri novih
              priporočilih. Shranjeni primeri in PDF-ji ohranijo prvotno
              različico. Objava pomeni preveritev vira; strokovni pregled
              posameznega primera je ločen.
            </p>
            <button
              onClick={() => {
                const base = structuredClone(rules[0]);
                if (base)
                  setEditing({
                    ...base,
                    id: crypto.randomUUID(),
                    approved: false,
                  });
              }}
            >
              Novo pravilo
            </button>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Podlaga</th>
                    <th>Umazanija</th>
                    <th>Izdelek</th>
                    <th>Objavljeno</th>
                    <th>Vir preverjen</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRules.map((rule) => (
                    <tr key={rule.id}>
                      <td>{rule.substrate}</td>
                      <td>{rule.contamination}</td>
                      <td>
                        {
                          PRODUCT_CATALOG.find((p) => p.id === rule.productId)
                            ?.name
                        }
                      </td>
                      <td>{rule.approved ? "Da" : "Ne"}</td>
                      <td>{rule.checkedAt}</td>
                      <td>
                        <button
                          onClick={() => setEditing(structuredClone(rule))}
                        >
                          Uredi
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        {editing && (
          <div className="modal-backdrop">
            <section
              className="card modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="rule-title"
            >
              <div className="toolbar">
                <h2 id="rule-title">Uredi pravilo</h2>
                <button onClick={() => setEditing(null)}>Zapri</button>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void act(async () => {
                    await jsonRequest("/api/rules", editing, "PUT");
                    setEditing(null);
                    await load();
                  });
                }}
              >
                <label>
                  Podlaga
                  <select
                    value={editing.substrate}
                    onChange={(e) =>
                      setEditing({ ...editing, substrate: e.target.value })
                    }
                  >
                    {SUBSTRATES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Umazanija
                  <select
                    value={editing.contamination}
                    onChange={(e) =>
                      setEditing({ ...editing, contamination: e.target.value })
                    }
                  >
                    {CONTAMINATIONS.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Mavrov izdelek
                  <select
                    value={editing.productId}
                    onChange={(e) => {
                      const product = PRODUCT_CATALOG.find(
                        (p) => p.id === e.target.value,
                      )!;
                      setEditing({
                        ...editing,
                        productId: product.id,
                        sourceUrl: product.tdsUrl || product.sourceUrl,
                        approved: false,
                      });
                    }}
                  >
                    {PRODUCT_CATALOG.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Uradni vir (TDS ali stran izdelka)
                  <input
                    type="url"
                    required
                    value={editing.sourceUrl}
                    onChange={(e) =>
                      setEditing({ ...editing, sourceUrl: e.target.value })
                    }
                  />
                </label>
                <label>
                  Datum preveritve vira
                  <input
                    type="date"
                    required
                    value={editing.checkedAt}
                    onChange={(e) =>
                      setEditing({ ...editing, checkedAt: e.target.value })
                    }
                  />
                </label>
                <label>
                  Prednost (nižja številka je glavni predlog)
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    value={editing.priority ?? 10}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        priority: Number(e.target.value),
                      })
                    }
                  />
                </label>
                <fieldset>
                  <legend>Alternative za enako podlago in umazanijo</legend>
                  {rules
                    .filter(
                      (rule) =>
                        rule.approved &&
                        rule.id !== editing.id &&
                        rule.substrate === editing.substrate &&
                        rule.contamination === editing.contamination &&
                        rule.productId !== editing.productId,
                    )
                    .map((rule) => (
                      <label className="checkbox" key={rule.id}>
                        <input
                          type="checkbox"
                          checked={editing.alternatives.includes(
                            rule.productId,
                          )}
                          onChange={(e) =>
                            setEditing({
                              ...editing,
                              alternatives: e.target.checked
                                ? [
                                    ...new Set([
                                      ...editing.alternatives,
                                      rule.productId,
                                    ]),
                                  ]
                                : editing.alternatives.filter(
                                    (id) => id !== rule.productId,
                                  ),
                            })
                          }
                        />
                        {
                          PRODUCT_CATALOG.find((p) => p.id === rule.productId)
                            ?.name
                        }
                      </label>
                    ))}
                </fieldset>
                {LANGUAGES.map((lang) => (
                  <fieldset key={lang}>
                    <legend>{lang.toUpperCase()}</legend>
                    <label>
                      Redčenje
                      <input
                        required
                        value={editing.instructions[lang].dilution}
                        onChange={(e) =>
                          changeInstruction(lang, "dilution", e.target.value)
                        }
                      />
                    </label>
                    <label>
                      Koraki (vsak v svoji vrstici)
                      <textarea
                        required
                        rows={4}
                        value={editing.instructions[lang].steps.join("\n")}
                        onChange={(e) =>
                          changeInstruction(lang, "steps", e.target.value)
                        }
                      />
                    </label>
                    <label>
                      Varnost
                      <textarea
                        required
                        rows={3}
                        value={editing.instructions[lang].safety}
                        onChange={(e) =>
                          changeInstruction(lang, "safety", e.target.value)
                        }
                      />
                    </label>
                  </fieldset>
                ))}
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={editing.approved}
                    onChange={(e) =>
                      setEditing({ ...editing, approved: e.target.checked })
                    }
                  />
                  Preveril sem izdelek, združljivost podlage, navodila v vseh
                  jezikih in uradni vir. Objavi pravilo.
                </label>
                <button disabled={busy} className="primary">
                  Shrani
                </button>
              </form>
            </section>
          </div>
        )}
        {selected && (
          <div className="modal-backdrop">
            <section
              className="card modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="case-title"
            >
              <div className="toolbar">
                <h2 id="case-title">
                  {selected.input.customerName || selected.id.slice(0, 8)}
                </h2>
                <button onClick={() => setSelected(null)}>Zapri</button>
              </div>
              <p>
                {selected.input.contactInfo} · {selected.input.location}
              </p>
              <p>
                {selected.input.substrate} · {selected.input.contamination}
              </p>
              {selected.treatment ? (
                <TreatmentResult
                  treatment={selected.treatment}
                  language={selected.input.language}
                />
              ) : (
                <p className="notice">
                  Za ta primer ni potrjenega postopka. Dopolni strokovna pravila
                  in ustvari novo priporočilo.
                </p>
              )}
              <label>
                Opomba pregleda
                <textarea
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  maxLength={2000}
                />
              </label>
              <div className="toolbar">
                {(["pending", "approved", "rejected"] as const).map(
                  (status) => (
                    <button
                      key={status}
                      disabled={
                        busy || (status === "approved" && !selected.treatment)
                      }
                      onClick={() =>
                        void act(async () => {
                          await jsonRequest(
                            `/api/cases/${selected.id}/review`,
                            { status, note },
                            "PUT",
                          );
                          setSelected({
                            ...selected,
                            review: status,
                            reviewNote: note,
                          });
                          await load();
                        })
                      }
                    >
                      {status === "pending"
                        ? "Čaka"
                        : status === "approved"
                          ? "Potrdi pregled"
                          : "Zavrni"}
                    </button>
                  ),
                )}
              </div>
              <div className="toolbar">
                <a className="button" href={`/api/cases/${selected.id}/pdf`}>
                  PDF
                </a>
                <button
                  className="danger"
                  disabled={busy}
                  onClick={() => {
                    if (confirm("Trajno izbrišem primer s fotografijami?"))
                      void act(async () => {
                        const response = await fetch(
                          `/api/cases/${selected.id}`,
                          { method: "DELETE" },
                        );
                        if (!response.ok) throw new Error("Brisanje ni uspelo");
                        setSelected(null);
                        await load();
                      });
                  }}
                >
                  Izbriši
                </button>
              </div>
            </section>
          </div>
        )}
        {photo && (
          <div className="modal-backdrop" onClick={() => setPhoto(null)}>
            <div
              className="photo-modal"
              role="dialog"
              aria-modal="true"
              aria-label="Fotografija"
            >
              <button onClick={() => setPhoto(null)}>Zapri</button>
              <Image
                src={photo}
                alt="Fotografija primera"
                width={1200}
                height={900}
                unoptimized
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
