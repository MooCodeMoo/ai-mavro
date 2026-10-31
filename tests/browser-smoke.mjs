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
let browser;
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
  const page = await context.newPage();
  const errors = [];
  page.setDefaultTimeout(12000);
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(origin);
  await page.locator("#substrate").selectOption("Wood");
  await page.locator("#contamination").selectOption("Paint");
  await page
    .getByRole("heading", { name: "Strip-Off Plus", exact: true })
    .waitFor();
  await page.locator("#substrate").selectOption("Concrete");
  await page
    .locator("#contamination")
    .selectOption("Green deposits (algae/moss/lichen)");
  await page
    .getByRole("heading", { name: "FacadeClean HC", exact: true })
    .waitFor();
  await page.getByLabel("Površina (m²)", { exact: true }).fill("100");
  await page.getByText("6.67–20 L", { exact: true }).waitFor();

  const labels = page.locator(".field-grid input");
  await labels.nth(0).fill("Črt Šušterič — test");
  await labels.nth(1).fill("Ljubljana");
  await labels.nth(2).fill("test@example.invalid");
  await page
    .locator("input[type=file]")
    .first()
    .setInputFiles({
      name: "surface.png",
      mimeType: "image/png",
      buffer: await sharp({
        create: { width: 120, height: 80, channels: 3, background: "#90a2ad" },
      })
        .png()
        .toBuffer(),
    });
  await page.locator(".photo-tile").first().waitFor();
  await page.getByLabel("Preveril sem izbrano podlago in umazanijo.").check();
  await page
    .getByLabel(
      "Dovoljujem shranjevanje podatkov in fotografij za obravnavo pri Mavru.",
    )
    .check();
  await page
    .getByRole("button", {
      name: "Shrani za strokovni pregled / povpraševanje",
      exact: true,
    })
    .click();
  await page.getByText("Čaka na pregled", { exact: true }).waitFor();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Prenesi PDF", exact: true }).click();
  const download = await downloadPromise;
  await download.saveAs(path.join(temporary, "report.pdf"));
  if (process.env.BROWSER_OUTPUT_DIR) {
    await mkdir(process.env.BROWSER_OUTPUT_DIR, { recursive: true });
    await download.saveAs(
      path.join(process.env.BROWSER_OUTPUT_DIR, "report.pdf"),
    );
  }
  assert.equal(
    (await readFile(path.join(temporary, "report.pdf")))
      .subarray(0, 4)
      .toString(),
    "%PDF",
  );
  await page.locator("#language").selectOption("hr");
  await page
    .getByRole("heading", { name: "Preporuka postupka", exact: false })
    .waitFor();
  await page
    .getByText("Blago 1:2; srednje 1:1; jako nerazrijeđeno (proizvod:voda).", {
      exact: true,
    })
    .waitFor();
  assert.ok(
    await page
      .getByRole("button", { name: "Preuzmi PDF", exact: true })
      .isDisabled(),
  );
  await page.reload();
  await page
    .getByRole("heading", { name: "Preporuka postupka", exact: false })
    .waitFor();
  assert.equal(await page.locator("#language").inputValue(), "hr");
  await page.locator("#substrate").selectOption("Concrete");
  await page
    .locator("#contamination")
    .selectOption("Green deposits (algae/moss/lichen)");
  await page
    .getByRole("heading", { name: "FacadeClean HC", exact: true })
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
  await page.waitForTimeout(200);
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
  await page.getByRole("button", { name: "Odpri primer", exact: true }).click();
  await page
    .getByRole("button", { name: "Potrdi pregled", exact: true })
    .click();
  await page
    .getByRole("link", { name: "Osnutek za Asano", exact: true })
    .waitFor();
  if (output)
    await page.screenshot({
      path: path.join(output, "admin.png"),
      fullPage: true,
    });
  assert.deepEqual(errors, []);
  console.log(
    "Browser checks passed: wood/paint correction, live calculation, photo/save/PDF, HR instructions, unsaved-change lock, 390px layout, private administration, technical review.",
  );
} finally {
  if (browser) await browser.close();
  server.kill("SIGTERM");
}
