import test from "node:test";
import assert from "node:assert/strict";
import { BlobPreconditionFailedError } from "@vercel/blob";
import { createBlobDatabase } from "../lib/blob-database";
import type { AtomicStore, Versioned } from "../lib/atomic-store";
import type { CaseInput } from "../lib/domain";
import { resolveTreatment } from "../lib/recommendations";
class MemoryStore implements AtomicStore {
  rows = new Map<string, Versioned<unknown>>();
  counter = 0;
  async read<T>(path: string) {
    await Promise.resolve();
    return structuredClone((this.rows.get(path) as Versioned<T>) || null);
  }
  async write<T>(path: string, value: T, etag?: string) {
    await Promise.resolve();
    const current = this.rows.get(path);
    if ((current && !etag) || (etag && etag !== current?.etag))
      throw new BlobPreconditionFailedError();
    this.rows.set(path, {
      value: structuredClone(value),
      etag: String(++this.counter),
    });
  }
  async remove(path: string) {
    this.rows.delete(path);
  }
}
const input: CaseInput = {
  substrate: "Concrete",
  contamination: "General dirt / traffic film",
  language: "sl",
  customerName: "Test",
  location: "Ljubljana",
  contactInfo: "test@example.invalid",
  area: 30,
  waterParts: 0,
  acidResistant: false,
  uncoated: false,
  confirmed: true,
  consent: true,
  aiAnalysis: null,
  photos: [{ name: "test.jpg", data: "test-photo" }],
};
test("private object storage survives fresh instances, edits, reviews and deletion", async () => {
  const storage = new MemoryStore(),
    first = createBlobDatabase(storage);
  const rules = await first.getRules();
  assert.equal(rules.length, 59);
  const treatment = resolveTreatment(input, rules);
  const item = await first.saveCase(input, treatment);
  const second = createBlobDatabase(storage);
  assert.equal((await second.getCase(item.id))?.input.customerName, "Test");
  assert.equal(await second.getPhoto(item.id, item.photos[0].id), "test-photo");
  assert.equal((await second.overview()).pending, 1);
  await second.reviewCase(item.id, "approved", "Checked");
  assert.equal((await first.getCase(item.id))?.review, "approved");
  assert.equal((await first.overview()).pending, 0);
  const rule = rules.find(
    (r) =>
      r.productId === "uniclean-lf" &&
      r.substrate === "Concrete" &&
      r.contamination === input.contamination,
  )!;
  await second.putRule({ ...rule, approved: false });
  assert.ok(!(await first.getRules(true)).some((r) => r.id === rule.id));
  assert.equal(
    (await first.getCase(item.id))?.treatment?.productId,
    "uniclean-lf",
  );
  await second.deleteCase(item.id);
  assert.equal(await first.getCase(item.id), null);
  assert.equal((await first.listCases()).total, 0);
  assert.equal(await first.getPhoto(item.id, item.photos[0].id), null);
});
test("ETag retries prevent lost cases, rule edits and rate increments across instances", async () => {
  const store = new MemoryStore(),
    a = createBlobDatabase(store),
    b = createBlobDatabase(store);
  const cases = await Promise.all(
    Array.from({ length: 6 }, (_, i) =>
      (i % 2 ? a : b).saveCase({ ...input, photos: [] }, null),
    ),
  );
  assert.equal((await a.listCases()).total, 6);
  assert.equal(new Set(cases.map((c) => c.id)).size, 6);
  const results = await Promise.all(
    Array.from({ length: 8 }, (_, i) =>
      (i % 2 ? a : b).consumeRate("shared", 3, 60000),
    ),
  );
  assert.equal(results.filter((r) => r.allowed).length, 3);
  const rules = await a.getRules();
  await Promise.all([
    a.putRule({ ...rules[0], approved: false }),
    b.putRule({ ...rules[1], approved: false }),
  ]);
  assert.equal((await a.getRules()).filter((r) => !r.approved).length, 2);
});
