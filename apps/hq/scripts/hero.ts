/**
 * Clean stills from any camera: pnpm exec tsx scripts/hero.ts <outDir> name=px,py,pz,tx,ty,tz ...
 * Uses /tour?hud=0, so it needs no login.
 */
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "@playwright/test";

const BASE = process.env["HQ_BASE_URL"] ?? "http://localhost:3003";
const OUT = resolve(process.argv[2] ?? "screenshots");
const SHOTS = process.argv.slice(3);

async function main() {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist", "--enable-webgl", "--enable-unsafe-swiftshader"],
  });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  page.on("pageerror", (e) => console.log("pageerror:", e.message));
  for (const spec of SHOTS) {
    const [name, cam] = spec.split("=");
    await page.goto(`${BASE}/tour?quality=high&hud=0&cam=${cam}`, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => !document.querySelector('[role="status"][aria-live="polite"].absolute'), undefined, { timeout: 180_000 });
    await new Promise((r) => setTimeout(r, 2500));
    await page.screenshot({ path: `${OUT}/${name}.png` });
    console.log("shot", name);
  }
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
