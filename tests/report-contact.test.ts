import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";
import { NextRequest } from "next/server";
import { POST as report } from "../app/api/report/route";
import { POST as save } from "../app/api/diagnose/route";
import { listCases } from "../lib/database";
import { validContact } from "../lib/contact-validation";
const origin = "http://localhost:3000";
const req = (route: string, data: unknown) =>
  new NextRequest(origin + route, {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
test("independent PDF does not create a case; sales requests require valid contact and consent", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "mavro-report-"));
  process.env.DATABASE_URL = `file:${path.join(dir, "test.db")}`;
  process.env.APP_ORIGIN = origin;
  process.env.ADMIN_PASSWORD = "test-only-password-123";
  process.env.SESSION_SECRET =
    "test-only-session-secret-at-least-32-characters";
  const image =
    "data:image/jpeg;base64," +
    (
      await sharp({
        create: { width: 20, height: 20, channels: 3, background: "gray" },
      })
        .jpeg()
        .toBuffer()
    ).toString("base64");
  const input = {
    substrate: "Concrete",
    contamination: "Green deposits (algae/moss/lichen)",
    language: "sl",
    confirmed: true,
    consent: false,
    photos: [{ name: "test.jpg", data: image }],
  };
  const before = (await listCases()).total;
  const pdf = await report(
    req("/api/report", {
      ...input,
      customerName: "Must not be stored",
      contactInfo: "test@example.invalid",
      treatment: { product: "forged" },
    }),
  );
  assert.equal(pdf.status, 200);
  const bytes = Buffer.from(await pdf.arrayBuffer());
  assert.equal(bytes.subarray(0, 4).toString(), "%PDF");
  assert.ok(bytes.includes(Buffer.from("/Subtype /Image")));
  assert.equal((await listCases()).total, before);
  assert.equal(
    (await report(req("/api/report", { ...input, confirmed: false }))).status,
    400,
  );
  const request = {
    ...input,
    contactRequested: true,
    customerName: "Test User",
    contactInfo: "bad",
  };
  assert.equal(
    (await save(req("/api/diagnose", { ...request, consent: true }))).status,
    400,
  );
  assert.equal(
    (
      await save(
        req("/api/diagnose", {
          ...request,
          contactInfo: "test@example.invalid",
        }),
      )
    ).status,
    400,
  );
  for (const contact of ["test@example.invalid", "+386 41 123 456"]) {
    assert.ok(validContact(contact));
    const response = await save(
      req("/api/diagnose", { ...request, consent: true, contactInfo: contact }),
    );
    assert.equal(response.status, 200);
    assert.equal((await response.json()).case.input.contactRequested, true);
  }
  assert.equal(validContact("hello"), false);
  assert.equal(validContact("123"), false);
});
