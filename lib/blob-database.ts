import { randomUUID } from "node:crypto";
import type { CaseInput, Rule, SavedCase, Treatment } from "./domain";
import { HttpError } from "./http";
import { SEED_RULES } from "./rule-seeds";
import { mutate, privateBlobStore, type AtomicStore } from "./atomic-store";
const root = "mavro-internal-v1/";
export function createBlobDatabase(store: AtomicStore = privateBlobStore) {
  const rulesPath = root + "rules.json",
    casesPath = root + "case-index.json";
  const emptyRules = () => structuredClone(SEED_RULES);
  async function getRules(approvedOnly = false): Promise<Rule[]> {
    const row = await store.read<Rule[]>(rulesPath);
    const rules = row?.value ?? emptyRules();
    return approvedOnly ? rules.filter((r) => r.approved) : rules;
  }
  async function putRule(rule: Rule) {
    return mutate(store, rulesPath, emptyRules, (rules) => {
      if (
        rule.approved &&
        rules.some(
          (r) =>
            r.id !== rule.id &&
            r.approved &&
            r.productId === rule.productId &&
            r.substrate === rule.substrate &&
            r.contamination === rule.contamination,
        )
      )
        throw new HttpError(
          409,
          "A published rule already exists for this product and combination",
        );
      const updated = { ...rule, updatedAt: new Date().toISOString() };
      const index = rules.findIndex((r) => r.id === rule.id);
      if (index < 0) rules.push(updated);
      else rules[index] = updated;
      return updated;
    });
  }
  async function disableRule(id: string) {
    const rule = (await getRules()).find((r) => r.id === id);
    if (!rule) return false;
    await putRule({ ...rule, approved: false });
    return true;
  }
  async function getCase(id: string): Promise<SavedCase | null> {
    if (!/^[a-f0-9-]{36}$/.test(id)) return null;
    return (
      (await store.read<SavedCase>(root + "cases/" + id + ".json"))?.value ??
      null
    );
  }
  async function saveCase(
    input: CaseInput,
    treatment: Treatment | null,
  ): Promise<SavedCase> {
    const id = randomUUID(),
      createdAt = new Date().toISOString(),
      { photos, ...details } = input;
    const records = photos.map((photo) => ({ ...photo, id: randomUUID() }));
    const item: SavedCase = {
      id,
      createdAt,
      input: details,
      treatment,
      review: "pending",
      reviewNote: "",
      photos: records.map(({ id, name }) => ({ id, name })),
    };
    const written: string[] = [];
    try {
      for (const photo of records) {
        const file = root + "photos/" + id + "/" + photo.id + ".json";
        await store.write(file, { data: photo.data });
        written.push(file);
      }
      const file = root + "cases/" + id + ".json";
      await store.write(file, item);
      written.push(file);
      await mutate<string[], void>(
        store,
        casesPath,
        () => [],
        (ids) => {
          if (ids.length >= 300)
            throw new HttpError(
              409,
              "The internal test store is limited to 300 cases. Export or remove old test cases before adding more.",
            );
          if (!ids.includes(id)) ids.unshift(id);
        },
      );
      return item;
    } catch (error) {
      await Promise.allSettled(written.map((file) => store.remove(file)));
      throw error;
    }
  }
  async function listCases(limit = 25, offset = 0) {
    const ids = (await store.read<string[]>(casesPath))?.value ?? [];
    const rows = await Promise.all(
      ids.slice(offset, offset + limit).map(getCase),
    );
    return {
      analyses: rows.filter((r): r is SavedCase => !!r),
      total: ids.length,
      limit,
      offset,
    };
  }
  async function reviewCase(
    id: string,
    review: SavedCase["review"],
    reviewNote: string,
  ) {
    if (!(await getCase(id))) throw new HttpError(404, "Case not found");
    await mutate<SavedCase, void>(
      store,
      root + "cases/" + id + ".json",
      () => {
        throw new HttpError(404, "Case not found");
      },
      (item) => {
        item.review = review;
        item.reviewNote = reviewNote;
      },
    );
  }
  async function deleteCase(id: string) {
    const item = await getCase(id);
    if (!item) return;
    await mutate<string[], void>(
      store,
      casesPath,
      () => [],
      (ids) => {
        const index = ids.indexOf(id);
        if (index >= 0) ids.splice(index, 1);
      },
    );
    for (const photo of item.photos)
      await store.remove(root + "photos/" + id + "/" + photo.id + ".json");
    await store.remove(root + "cases/" + id + ".json");
  }
  async function getPhoto(caseId: string, photoId: string) {
    if (!/^[a-f0-9-]{36}$/.test(caseId) || !/^[a-f0-9-]{36}$/.test(photoId))
      return null;
    return (
      (
        await store.read<{ data: string }>(
          root + "photos/" + caseId + "/" + photoId + ".json",
        )
      )?.value.data ?? null
    );
  }
  async function consumeRate(key: string, maximum: number, windowMs: number) {
    const now = Date.now();
    return mutate(
      store,
      root + "rates/" + key + ".json",
      () => ({ hits: 0, expiresAt: now + windowMs }),
      (row) => {
        if (row.expiresAt <= now) {
          row.hits = 0;
          row.expiresAt = now + windowMs;
        }
        row.hits++;
        return {
          allowed: row.hits <= maximum,
          retryAfter: Math.max(1, Math.ceil((row.expiresAt - now) / 1000)),
        };
      },
    );
  }
  async function overview() {
    const ids = (await store.read<string[]>(casesPath))?.value ?? [];
    const rows = await Promise.all(ids.map(getCase));
    return {
      pending: rows.filter((row) => row?.review === "pending").length,
      legacyAvailable: false,
    };
  }
  return {
    getRules,
    putRule,
    disableRule,
    getCase,
    saveCase,
    listCases,
    reviewCase,
    deleteCase,
    getPhoto,
    consumeRate,
    overview,
  };
}
export const blobDatabase = createBlobDatabase();
