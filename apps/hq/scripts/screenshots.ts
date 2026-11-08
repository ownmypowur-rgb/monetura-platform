/**
 * Visual self-check. Captures the key views for comparison with the master render.
 * Needs the app running on HQ_BASE_URL (default http://localhost:3003).
 *   pnpm shots [outDir] [only,comma,separated]
 * Reads HQ_OWNER_PASSWORD from .env.local. Uses the real GPU when there is one.
 */
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import dotenv from "dotenv";
import { chromium, type Browser, type Page } from "@playwright/test";

dotenv.config({ path: resolve(".env.local"), quiet: true });

const BASE = process.env["HQ_BASE_URL"] ?? "http://localhost:3003";
const OUT = resolve(process.argv[2] ?? "screenshots");
const ONLY = process.argv[3]?.split(",");
const QS = process.env["HQ_QUALITY"] ? `?quality=${process.env["HQ_QUALITY"]}` : "?quality=high";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function launch(): Promise<Browser> {
  return chromium.launch({
    headless: true,
    args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist", "--enable-webgl", "--enable-unsafe-swiftshader"],
  });
}

function attachLogging(page: Page, label: string) {
  page.on("pageerror", (e) => console.log(`[${label}] pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error") console.log(`[${label}] console: ${m.text().slice(0, 300)}`);
  });
}

async function waitReady(page: Page) {
  await page.waitForFunction(() => !document.querySelector('[role="status"][aria-live="polite"].absolute'), undefined, { timeout: 180_000 });
  await wait(2500);
}

async function login(page: Page) {
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.fill('input[name="password"]', process.env["HQ_OWNER_PASSWORD"] ?? "");
  await page.click('button[type="submit"]');
  await page.waitForURL(`${BASE}/`, { timeout: 180_000 });
}

const want = (name: string) => !ONLY || ONLY.includes(name);

async function main() {
  mkdirSync(OUT, { recursive: true });
  const browser = await launch();

  const owner = await browser.newContext({ viewport: { width: 1672, height: 941 } });
  const page = await owner.newPage();
  attachLogging(page, "owner");
  await login(page);
  await page.goto(`${BASE}/${QS}`, { waitUntil: "domcontentloaded" });
  await waitReady(page);
  const renderer = await page.evaluate(() => {
    const gl = document.createElement("canvas").getContext("webgl2");
    const info = gl?.getExtension("WEBGL_debug_renderer_info");
    return gl && info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : "unknown";
  });
  console.log("renderer:", renderer);

  const shot = async (name: string) => {
    await page.screenshot({ path: `${OUT}/${name}.png` });
    console.log("shot", name);
  };

  if (want("01-island-overview")) await shot("01-island-overview");

  if (want("02-campus-view")) {
    await page.mouse.move(1000, 640);
    for (let i = 0; i < 4; i++) {
      await page.mouse.wheel(0, -200);
      await wait(120);
    }
    await wait(2200);
    await shot("02-campus-view");
    await page.getByRole("button", { name: "Island Overview" }).first().click();
    await wait(5000);
  }

  const focus = async (name: RegExp) => {
    await page.getByRole("navigation", { name: "Departments" }).getByRole("button", { name }).click();
    await wait(4200);
  };

  if (want("03-content-studio-roof-off") || want("05-agent-card")) {
    await focus(/^Content Studio/);
    await shot("03-content-studio-roof-off");
    if (want("05-agent-card")) {
      await page.getByRole("complementary", { name: /Content Studio team/ }).getByRole("button", { name: /Ava/ }).click();
      await wait(2600);
      await shot("05-agent-card");
      await page.keyboard.press("Escape");
      await wait(600);
    }
    await page.keyboard.press("Escape");
    await wait(6000);
    if (want("08-roof-restored")) await shot("08-roof-restored");
  }

  if (want("04-atlas-command")) {
    await focus(/^Atlas Command/);
    await shot("04-atlas-command");
    await page.keyboard.press("Escape");
    await wait(2200);
  }

  for (const [file, re] of [
    ["10-research-centre", /^Research Centre/],
    ["11-publishing-hub", /^Publishing Hub/],
    ["12-it-integrations", /^IT & Integrations/],
    ["13-marketplace", /^Marketplace/],
    ["14-partnerships-hub", /^Partnerships Hub/],
    ["15-strategy-growth", /^Strategy & Growth/],
    ["16-story-lab", /^Story Lab/],
    ["17-client-success", /^Client Success/],
    ["18-trip-planning", /^Trip Planning/],
    ["19-finance", /^Finance/],
    ["20-agent-operations", /^Agent Operations/],
    ["21-legal-compliance", /^Legal/],
    ["22-business-intelligence", /^Business Intelligence/],
    ["23-website-seo", /^Website & SEO/],
    ["24-visual-studio", /^Visual Studio/],
  ] as const) {
    if (!want(file)) continue;
    await focus(re);
    await shot(file);
    await page.keyboard.press("Escape");
    await wait(1800);
  }

  if (want("09-approvals-panel")) {
    await page.getByRole("button", { name: /Approvals, / }).click();
    await wait(700);
    await shot("09-approvals-panel");
    await page.keyboard.press("Escape");
  }

  if (want("06-tour-mid-flight")) {
    await page.getByRole("button", { name: "Guided Tour" }).click();
    await wait(3200);
    await shot("06-tour-mid-flight-a");
    await wait(9000);
    await shot("06-tour-mid-flight");
    await page.keyboard.press("Escape");
  }
  await owner.close();

  if (want("07-tour-phone")) {
    const phone = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148",
    });
    const p = await phone.newPage();
    attachLogging(p, "phone");
    await p.goto(`${BASE}/tour`, { waitUntil: "domcontentloaded" });
    await waitReady(p);
    await p.screenshot({ path: `${OUT}/07-tour-phone.png` });
    console.log("shot 07-tour-phone");
    await p.getByRole("button", { name: "Guided Tour" }).click();
    await wait(7000);
    await p.screenshot({ path: `${OUT}/07-tour-phone-flight.png` });
    await phone.close();
  }

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
