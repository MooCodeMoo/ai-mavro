import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";
import nodemailer from "nodemailer";
import { NextRequest } from "next/server";
import { getRules, consumeRate, getDb } from "../lib/database";
import { POST as login } from "../app/api/session/route";
import { GET as analyses } from "../app/api/analyses/route";
import { PUT as updateRule } from "../app/api/rules/route";
import { POST as recommend } from "../app/api/recommend/route";
import { POST as diagnose } from "../app/api/diagnose/route";
import { GET as fetchCase } from "../app/api/cases/[id]/route";
import { GET as photoRoute } from "../app/api/cases/[id]/photos/[photoId]/route";
import { PUT as review } from "../app/api/cases/[id]/review/route";
import { GET as lead } from "../app/api/cases/[id]/lead/route";
import { POST as pdf } from "../app/api/generate-pdf/route";
import { POST as email } from "../app/api/send-pdf-email/route";
import { POST as analyze } from "../app/api/analyze-image/route";
import type { SavedCase } from "../lib/domain";
const origin = "http://localhost:3000";
const request = (
  url: string,
  body?: unknown,
  cookie = "",
  originValue = origin,
) =>
  new NextRequest(origin + url, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      Origin: originValue,
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
const input = {
  substrate: "Concrete",
  contamination: "Green deposits (algae/moss/lichen)",
  language: "sl",
  customerName: "Črt Šušterič",
  location: "Ljubljana",
  contactInfo: "test@example.invalid",
  area: 100,
  waterParts: 0,
  acidResistant: false,
  uncoated: false,
  confirmed: true,
  consent: true,
  aiAnalysis: null,
  photos: [],
};
test("private workflow, shared rules, preserved snapshots and PDF", async (t) => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "mavro-tests-"));
  process.env.DATABASE_URL = `file:${path.join(dir, "cases.db")}`;
  process.env.ADMIN_PASSWORD = "test-only-password-123";
  process.env.SESSION_SECRET =
    "test-only-session-secret-at-least-32-characters";
  process.env.APP_ORIGIN = origin;
  delete process.env.ANTHROPIC_API_KEY;
  delete process.env.EMAIL_HOST;
  await t.test("admin data and writes reject anonymous requests", async () => {
    assert.equal((await analyses(request("/api/analyses"))).status, 401);
    assert.equal((await updateRule(request("/api/rules", {}))).status, 401);
  });
  let cookie = "";
  await t.test(
    "login requires correct password and request origin",
    async () => {
      assert.equal(
        (
          await login(
            request(
              "/api/session",
              { password: process.env.ADMIN_PASSWORD },
              "",
              "https://evil.example",
            ),
          )
        ).status,
        403,
      );
      assert.equal(
        (await login(request("/api/session", { password: "wrong" }))).status,
        401,
      );
      const res = await login(
        request("/api/session", { password: process.env.ADMIN_PASSWORD }),
      );
      assert.equal(res.status, 200);
      assert.match(res.headers.get("set-cookie")!, /HttpOnly/i);
      cookie = res.headers.get("set-cookie")!.split(";")[0];
      assert.equal(
        (await analyses(request("/api/analyses", undefined, cookie))).status,
        200,
      );
    },
  );
  const jpeg = await sharp({
    create: { width: 50, height: 50, channels: 3, background: "#aabbcc" },
  })
    .jpeg()
    .toBuffer();
  const photos = [
    {
      name: "test.jpg",
      data: "data:image/jpeg;base64," + jpeg.toString("base64"),
    },
  ];
  let item: SavedCase,
    ownerCookie = "";
  await t.test(
    "saving requires confirmation and consent; stores complete private case",
    async () => {
      assert.equal(
        (await diagnose(request("/api/diagnose", { ...input, consent: false })))
          .status,
        400,
      );
      assert.equal(
        (
          await diagnose(
            request("/api/diagnose", { ...input, confirmed: false }),
          )
        ).status,
        400,
      );
      const res = await diagnose(
        request("/api/diagnose", { ...input, photos }),
      );
      assert.equal(res.status, 200);
      item = (await res.json()).case;
      ownerCookie = res.headers.get("set-cookie")!.split(";")[0];
      assert.equal(item.input.customerName, input.customerName);
      assert.equal(item.treatment!.productId, "facadeclean-hc");
      assert.equal(item.photos.length, 1);
      assert.equal(item.review, "pending");
    },
  );
  await t.test(
    "case and photograph are available only to the owner or admin",
    async () => {
      const params = Promise.resolve({ id: item.id });
      assert.equal(
        (await fetchCase(request("/api/cases/" + item.id), { params })).status,
        401,
      );
      assert.equal(
        (
          await fetchCase(
            request("/api/cases/" + item.id, undefined, ownerCookie),
            { params },
          )
        ).status,
        200,
      );
      const photoParams = Promise.resolve({
        id: item.id,
        photoId: item.photos[0].id,
      });
      assert.equal(
        (await photoRoute(request("/photo"), { params: photoParams })).status,
        401,
      );
      const image = await photoRoute(request("/photo", undefined, cookie), {
        params: photoParams,
      });
      assert.equal(image.status, 200);
      assert.equal(image.headers.get("content-type"), "image/jpeg");
    },
  );
  await t.test(
    "admin rule edits change live recommendations without modifying saved snapshots",
    async () => {
      const rules = await getRules();
      const rule = rules.find(
        (r) =>
          r.productId === "facadeclean-hc" &&
          r.substrate === "Concrete" &&
          r.contamination === input.contamination,
      )!;
      rule.instructions.sl.steps = ["Preverjeno novo navodilo."];
      const changed = await updateRule(request("/api/rules", rule, cookie));
      assert.equal(changed.status, 200);
      const live = await recommend(request("/api/recommend", input));
      assert.equal(live.status, 200);
      assert.deepEqual((await live.json()).treatment.steps, [
        "Preverjeno novo navodilo.",
      ]);
      const stored = await fetchCase(
        request("/api/cases/" + item.id, undefined, cookie),
        { params: Promise.resolve({ id: item.id }) },
      );
      assert.notDeepEqual((await stored.json()).case.treatment.steps, [
        "Preverjeno novo navodilo.",
      ]);
    },
  );
  await t.test(
    "server generates a Unicode PDF from saved data and ignores forged PDF content",
    async () => {
      const result = await pdf(
        request(
          "/api/generate-pdf",
          { caseId: item.id, product: "INJECTED" },
          ownerCookie,
        ),
      );
      assert.equal(result.status, 200);
      const bytes = Buffer.from(await result.arrayBuffer());
      assert.equal(bytes.subarray(0, 4).toString(), "%PDF");
      assert.ok(bytes.length > 10_000);
    },
  );
  await t.test("review and lead preparation stay private", async () => {
    const params = Promise.resolve({ id: item.id });
    assert.equal(
      (
        await review(
          request(
            "/review",
            { status: "approved", note: "Preverjeno" },
            ownerCookie,
          ),
          { params },
        )
      ).status,
      401,
    );
    assert.equal(
      (
        await review(
          request(
            "/review",
            { status: "approved", note: "Preverjeno" },
            cookie,
          ),
          { params },
        )
      ).status,
      200,
    );
    assert.equal(
      (await lead(request("/lead", undefined, ownerCookie), { params })).status,
      401,
    );
    const draft = await lead(request("/lead", undefined, cookie), { params });
    assert.equal(draft.status, 200);
    assert.match(await draft.text(), /No task has been created/);
  });
  await t.test(
    "AI has no random fallback and email fails clearly without SMTP",
    async () => {
      assert.equal(
        (
          await analyze(
            request("/api/analyze-image", {
              image: photos[0].data,
              language: "sl",
            }),
          )
        ).status,
        503,
      );
      assert.equal(
        (
          await email(
            request(
              "/api/send-pdf-email",
              { caseId: item.id, recipientEmail: "test@example.invalid" },
              ownerCookie,
            ),
          )
        ).status,
        503,
      );
    },
  );
  await t.test(
    "configured AI validates output using an active model (mocked network)",
    async () => {
      const original = globalThis.fetch;
      process.env.ANTHROPIC_API_KEY = "test-only-not-a-real-key";
      try {
        globalThis.fetch = async (_url, options) => {
          const payload = JSON.parse(String(options?.body));
          assert.equal(payload.model, "claude-sonnet-4-6");
          return new Response(
            JSON.stringify({
              content: [
                {
                  type: "text",
                  text: JSON.stringify({
                    surfaceSuggestion: "Concrete",
                    detectedContamination: input.contamination,
                    confidence: 0.88,
                    notes: "Preverjeno",
                  }),
                },
              ],
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        };
        const response = await analyze(
          request("/api/analyze-image", {
            image: photos[0].data,
            language: "sl",
          }),
        );
        assert.equal(response.status, 200);
        assert.equal((await response.json()).analysis.confidence, 0.88);
      } finally {
        globalThis.fetch = original;
        delete process.env.ANTHROPIC_API_KEY;
      }
    },
  );
  await t.test(
    "email builds its own PDF instead of sending a client-supplied attachment (mocked transport)",
    async () => {
      const original = nodemailer.createTransport;
      let sent = false;
      process.env.EMAIL_HOST = "smtp.example.invalid";
      process.env.EMAIL_USER = "test@example.invalid";
      process.env.EMAIL_PASSWORD = "test-only-not-a-real-password";
      try {
        nodemailer.createTransport = (() => ({
          sendMail: async (message: {
            to: string;
            attachments: { content: Buffer }[];
          }) => {
            sent = true;
            assert.equal(message.to, "test@example.invalid");
            assert.equal(
              message.attachments[0].content.subarray(0, 4).toString(),
              "%PDF",
            );
          },
        })) as unknown as typeof nodemailer.createTransport;
        const response = await email(
          request(
            "/api/send-pdf-email",
            {
              caseId: item.id,
              recipientEmail: "test@example.invalid",
              pdfBase64: Buffer.from("forged attachment").toString("base64"),
            },
            ownerCookie,
          ),
        );
        assert.equal(response.status, 200);
        assert.equal(sent, true);
      } finally {
        nodemailer.createTransport = original;
        delete process.env.EMAIL_HOST;
        delete process.env.EMAIL_USER;
        delete process.env.EMAIL_PASSWORD;
      }
    },
  );
  await t.test(
    "a disabled rule stays disabled across schema initialization and is not offered",
    async () => {
      const rules = await getRules();
      const rule = rules.find(
        (r) =>
          r.productId === "facadeclean-hc" &&
          r.substrate === "Concrete" &&
          r.contamination === input.contamination,
      )!;
      rule.approved = false;
      assert.equal(
        (await updateRule(request("/api/rules", rule, cookie))).status,
        200,
      );
      await getDb();
      const res = await recommend(request("/api/recommend", input));
      assert.equal((await res.json()).treatment, null);
    },
  );
  await t.test("parallel rate limiting is atomic", async () => {
    const limits = await Promise.all(
      Array.from({ length: 5 }, () => consumeRate("parallel-test", 2, 60000)),
    );
    assert.equal(limits.filter((l) => l.allowed).length, 2);
  });
});
