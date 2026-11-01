import { chromium } from "playwright";
import assert from "node:assert/strict";
import sharp from "sharp";
import { spawn } from "node:child_process";
import { mkdtemp, mkdir, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { randomBytes } from "node:crypto";
const temporary = await mkdtemp(path.join(os.tmpdir(), "mavro-browser-"));
const origin = "http://127.0.0.1:3071",
  password = "browser-test-" + randomBytes(10).toString("hex");
const server = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "start",
    "--hostname",
    "127.0.0.1",
    "--port",
    "3071",
  ],
  {
    cwd: process.cwd(),
    env: {
      ...process.env,
      APP_ORIGIN: origin,
      ADMIN_PASSWORD: password,
      SESSION_SECRET: randomBytes(32).toString("hex"),
      DATABASE_URL: `file:${path.join(temporary, "test.db")}`,
      TURSO_DATABASE_URL: "",
      TURSO_AUTH_TOKEN: "",
      ANTHROPIC_API_KEY: "",
      EMAIL_HOST: "",
      MAVRO_STORAGE: "",
      AI_GATEWAY_ENABLED: "",
      INTERNAL_TEST_MODE: "",
    },
    stdio: ["ignore", "pipe", "pipe"],
  },
);
let serverLog = "";
server.stdout.on("data", (v) => {
  serverLog += v;
});
server.stderr.on("data", (v) => {
  serverLog += v;
});
let browser, page;
try {
  let ready = false;
  for (let i = 0; i < 100; i++) {
    try {
      const res = await fetch(origin);
      if (res.ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  assert.ok(ready, serverLog);
  browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || undefined,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    acceptDownloads: true,
  });
  page = await context.newPage();
  const errors = [];
  page.setDefaultTimeout(12000);
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(origin);
  const image = await sharp({
    create: { width: 120, height: 80, channels: 3, background: "#90a2ad" },
  })
    .png()
    .toBuffer();
  await page.locator("input[type=file]").first().setInputFiles({
    name: "surface.png",
    mimeType: "image/png",
    buffer: image,
  });
  let aiCalls = 0;
  await page.route("**/api/analyze-image", async (route) => {
    const body = route.request().postDataJSON();
    assert.equal(body.language, "sl");
    assert.ok(body.image.startsWith("data:image/jpeg;base64,"));
    aiCalls++;
    await route.fulfill({
      json: {
        analysis: {
          surfaceSuggestion: "Concrete",
          detectedContamination: "Green deposits (algae/moss/lichen)",
          confidence: 0.93,
          notes: "Synthetic UI test.",
        },
      },
    });
  });
  await page
    .getByRole("button", { name: "Analiziraj z AI", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "Izberi rezultat te fotografije",
      exact: false,
    })
    .click();
  assert.equal(aiCalls, 1);
  assert.equal(await page.locator("#substrate").inputValue(), "Concrete");
  assert.equal(
    await page
      .getByRole("button", { name: "Pokaži priporočilo", exact: false })
      .isDisabled(),
    true,
  );
  await page.locator("#substrate").selectOption("Wood");
  await page.locator("#contamination").selectOption("Paint");
  await page
    .getByLabel("Preveril sem izbrano podlago in umazanijo.", { exact: true })
    .check();
  await page
    .getByRole("button", { name: "Pokaži priporočilo", exact: false })
    .click();
  await page
    .getByRole("heading", { name: "Strip-Off Plus", exact: true })
    .waitFor();
  await page.locator("#result-area").fill("100");
  await page.getByText("25–100 kg", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Spremeni", exact: true }).click();
  await page.locator("#substrate").selectOption("Concrete");
  await page
    .locator("#contamination")
    .selectOption("Green deposits (algae/moss/lichen)");
  await page
    .getByLabel("Preveril sem izbrano podlago in umazanijo.", { exact: true })
    .check();
  await page
    .getByRole("button", { name: "Pokaži priporočilo", exact: false })
    .click();
  await page
    .getByRole("heading", { name: "FacadeClean HC", exact: true })
    .waitFor();
  await page.getByText("6,67–20 L", { exact: true }).waitFor();
  await page.locator("#result-area").fill("");
  await page.locator("#result-area").pressSequentially("125", { delay: 40 });
  assert.equal(await page.locator("#result-area").inputValue(), "125");
  await page.getByText("8,34–25 L", { exact: true }).waitFor();
  await page
    .getByLabel("Deli vode na 1 del izdelka", { exact: true })
    .selectOption("1");
  await page
    .getByText(
      "Porabo potrdi s poskusnim nanosom; podatek za izbrano redčenje ni potrjen.",
      { exact: true },
    )
    .waitFor();
  await page
    .getByLabel("Deli vode na 1 del izdelka", { exact: true })
    .selectOption("0");
  await page.locator("#result-area").fill("100");
  await page.getByText("6,67–20 L", { exact: true }).waitFor();
  let storedRequests = 0;
  page.on("request", (r) => {
    if (r.url().endsWith("/api/diagnose") && r.method() === "POST")
      storedRequests++;
  });
  const quickDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Prenesi PDF", exact: false }).click();
  await (await quickDownload).saveAs(path.join(temporary, "anonymous.pdf"));
  assert.equal(
    (await readFile(path.join(temporary, "anonymous.pdf")))
      .subarray(0, 4)
      .toString(),
    "%PDF",
  );
  assert.equal(storedRequests, 0);
  assert.equal(await page.locator("#contact-name").count(), 0);
  await page.evaluate(() => {
    window.__printed = 0;
    window.print = () => window.__printed++;
  });
  await page
    .getByRole("button", { name: "Natisni poročilo", exact: false })
    .click();
  assert.equal(await page.evaluate(() => window.__printed), 1);
  await page
    .getByRole("button", {
      name: "Želim, da me kontaktira prodajalec",
      exact: false,
    })
    .click();
  await page.emulateMedia({ media: "print" });
  assert.equal(await page.locator("#contact-request").isVisible(), false);
  await page.emulateMedia({ media: "screen" });
  await page
    .getByLabel("Ime in priimek", { exact: true })
    .fill("Črt Šušterič — test");
  await page
    .getByLabel("E-pošta ali telefon", { exact: true })
    .fill("not-a-contact");
  const saveButton = page.getByRole("button", {
    name: "Pošlji zahtevo za stik",
    exact: false,
  });
  assert.equal(await saveButton.isDisabled(), true);
  await page
    .getByLabel("E-pošta ali telefon", { exact: true })
    .fill("test@example.invalid");
  await page
    .getByLabel(
      "Dovoljujem, da Mavro shrani ta primer in me kontaktira glede priporočene rešitve.",
      { exact: true },
    )
    .check();
  const savedResponse = page.waitForResponse(
    (r) => r.url().endsWith("/api/diagnose") && r.request().method() === "POST",
  );
  await saveButton.click();
  const response = await savedResponse;
  assert.equal(response.status(), 200);
  const savedCase = (await response.json()).case;
  assert.equal(savedCase.input.contactRequested, true);
  await page
    .getByText("Zahteva za stik je shranjena za prodajalca.", { exact: true })
    .waitFor();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Prenesi PDF", exact: false }).click();
  const download = await downloadPromise;
  await download.saveAs(path.join(temporary, "report.pdf"));
  assert.equal(
    (await readFile(path.join(temporary, "report.pdf")))
      .subarray(0, 4)
      .toString(),
    "%PDF",
  );
  await page.locator("#language").selectOption("hr");
  await page
    .getByRole("heading", { name: "Preporuka za tvoju površinu.", exact: true })
    .waitFor();
  await page
    .getByText("Blago 1:2; srednje 1:1; jako nerazrijeđeno (proizvod:voda).", {
      exact: true,
    })
    .waitFor();
  assert.equal(
    await page
      .getByRole("button", { name: "Preuzmi PDF", exact: false })
      .isEnabled(),
    true,
  );
  await page.locator("#language").selectOption("en");
  await page
    .getByRole("heading", { name: "Your surface recommendation.", exact: true })
    .waitFor();
  await page
    .getByText("Light 1:2; medium 1:1; heavy undiluted (product:water).", {
      exact: true,
    })
    .waitFor();
  await page.locator("#language").selectOption("nl");
  await page
    .getByRole("heading", { name: "Advies voor jouw ondergrond.", exact: true })
    .waitFor();
  await page
    .getByRole("heading", { name: "Reinigingsproces", exact: true })
    .waitFor();
  const output = process.env.BROWSER_OUTPUT_DIR;
  if (output) {
    await mkdir(output, { recursive: true });
    await page.screenshot({
      path: path.join(output, "desktop.png"),
      fullPage: true,
    });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  );
  if (output)
    await page.screenshot({
      path: path.join(output, "mobile.png"),
      fullPage: true,
    });
  await page.locator("#language").selectOption("hr");
  await page.reload();
  await page
    .getByRole("heading", { name: "Što želiš očistiti?", exact: true })
    .waitFor();
  assert.equal(await page.locator("#language").inputValue(), "hr");
  await page
    .getByText("Moji spremljeni slučajevi na ovom uređaju", { exact: true })
    .click();
  await page
    .getByRole("button", { name: new RegExp(savedCase.id.slice(0, 8)) })
    .click();
  await page
    .getByRole("heading", {
      name: "Priporočilo za tvojo površino.",
      exact: true,
    })
    .waitFor();
  await page
    .getByRole("heading", { name: "FacadeClean HC", exact: true })
    .waitFor();
  assert.equal(
    await page
      .getByRole("button", { name: "Prenesi PDF", exact: false })
      .isEnabled(),
    true,
  );
  const unauthorized = await browser.newContext();
  assert.equal(
    (await unauthorized.request.get(origin + "/api/analyses")).status(),
    401,
  );
  await unauthorized.close();
  await page.goto(origin + "/admin");
  await page.waitForURL("**/admin/login");
  await page.getByLabel("Geslo", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Prijava", exact: true }).click();
  await page.waitForURL("**/admin");
  await page
    .getByRole("heading", { name: "Črt Šušterič — test", exact: true })
    .waitFor();
  await page.getByText("Želi stik s prodajalcem", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Odpri primer", exact: true }).click();
  await page
    .getByRole("button", { name: "Potrdi pregled", exact: true })
    .click();
  assert.equal(
    await page
      .getByRole("link", { name: "Osnutek za Asano", exact: true })
      .count(),
    0,
  );
  assert.equal(
    (await context.request.get(origin + "/api/cases/not-a-case/lead")).status(),
    404,
  );
  if (output)
    await page.screenshot({
      path: path.join(output, "admin.png"),
      fullPage: true,
    });
  assert.deepEqual(errors, []);
  console.log(
    "Browser checks passed: mocked AI proposal and manual confirmation, wood/paint correction, editable quantity without losing focus, dilution estimate guard, real case/photo/PDF, all four languages, immutable case restore, private administration and review.",
  );
} catch (error) {
  console.error("Browser check failed:", error.message);
  if (page)
    console.error((await page.locator("body").innerText()).slice(0, 7000));
  throw error;
} finally {
  if (browser) await browser.close();
  server.kill("SIGTERM");
}
