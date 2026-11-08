/**
 * Functional check against a running app. Not a substitute for looking at it, but it
 * catches the things a screenshot can't:
 *   owner login, the feed, recording an approval, staff behaviours, walking,
 *   the guided tour end to end, every building's roof, and restoring the roof.
 * Needs HQ_OWNER_PASSWORD (from .env.local). Prints PASS/FAIL per check; exits 1 on any FAIL.
 */
import { resolve } from "node:path";
import dotenv from "dotenv";
import { chromium, type Page } from "@playwright/test";
import type { OwnerFeed, PublicFeed } from "../src/types";

dotenv.config({ path: resolve(".env.local"), quiet: true });

const BASE = process.env["HQ_BASE_URL"] ?? "http://localhost:3003";
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
let failures = 0;
function check(name: string, ok: boolean, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  (${detail})` : ""}`);
  if (!ok) failures++;
}

async function ownerFeed(page: Page): Promise<OwnerFeed> {
  return page.evaluate(async () => (await (await fetch("/api/hq/events?mode=owner")).json()) as OwnerFeed);
}

async function main() {
  const browser = await chromium.launch({
    headless: true,
    args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist", "--enable-webgl", "--enable-unsafe-swiftshader"],
  });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));

  // Login.
  await page.goto(`${BASE}/login`);
  await page.fill('input[name="password"]', "definitely-not-the-password");
  await page.click('button[type="submit"]');
  await page.waitForURL(/error=invalid/, { timeout: 60_000 });
  check("wrong password is refused", page.url().includes("error=invalid"));
  await page.fill('input[name="password"]', process.env["HQ_OWNER_PASSWORD"] ?? "");
  await page.click('button[type="submit"]');
  await page.waitForURL(`${BASE}/`, { timeout: 120_000 });
  check("owner password signs in", true);

  await page.goto(`${BASE}/?quality=medium&debug=1`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => !document.querySelector('[role="status"][aria-live="polite"].absolute'), undefined, { timeout: 180_000 });

  // Camera: orbit, zoom, limits, and an exact return.
  const cam = () =>
    page.evaluate(() => {
      const c = (window as unknown as { __hqCamera: { position: { x: number; y: number; z: number } } }).__hqCamera;
      return { x: c.position.x, y: c.position.y, z: c.position.z };
    });
  const distanceBetween = (a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) =>
    Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
  await wait(1500);
  const home = await cam();

  // Wheel over a nameplate must reach the camera too.
  const plate = page.getByRole("button", { name: /^Research Centre, Destinations/ });
  const box = await plate.boundingBox({ timeout: 5000 });
  if (box) {
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    for (let i = 0; i < 3; i++) {
      await page.mouse.wheel(0, -200);
      await wait(100);
    }
    await wait(1500);
    check("wheel over a nameplate still zooms", distanceBetween(home, await cam()) > 3);
  } else {
    check("wheel over a nameplate still zooms", false, "plate not on screen");
  }
  await page.getByRole("button", { name: "Island Overview" }).first().click();
  await wait(6000);

  await page.mouse.move(1000, 640);
  for (let i = 0; i < 5; i++) {
    await page.mouse.wheel(0, -300);
    await wait(100);
  }
  await wait(2500);
  const zoomed = await cam();
  check("mouse wheel zooms in, and not wildly", distanceBetween(home, zoomed) > 20 && distanceBetween(home, zoomed) < 300, `moved ${distanceBetween(home, zoomed).toFixed(0)} units`);

  // Zoom right in: the camera must stay above ground and outside closed buildings.
  await page.mouse.move(1000, 640);
  let lowest = Infinity;
  for (let i = 0; i < 40; i++) {
    await page.mouse.wheel(0, -500);
    await wait(40);
    lowest = Math.min(lowest, (await cam()).y);
  }
  await wait(1500);
  lowest = Math.min(lowest, (await cam()).y);
  check("zooming in stays above the ground, sea and canopy", lowest > 20, `lowest y ${lowest.toFixed(1)}`);

  // Orbit down hard: the camera must not go under.
  await page.mouse.move(800, 300);
  await page.mouse.down();
  await page.mouse.move(800, 860, { steps: 12 });
  await page.mouse.up();
  await wait(1800);
  const orbited = await cam();
  check("dragging orbits the camera", distanceBetween(zoomed, orbited) > 1);
  check("orbiting low stays above the ground and sea", orbited.y > 1, `y ${orbited.y.toFixed(1)}`);

  // Zoom right out: clamped.
  await page.getByRole("button", { name: "Island Overview" }).first().click();
  await wait(5000);
  await page.mouse.move(1000, 640);
  for (let i = 0; i < 40; i++) {
    await page.mouse.wheel(0, 600);
    await wait(30);
  }
  await wait(2500);
  const far = await cam();
  check("zoom out is clamped", Math.hypot(far.x, far.y, far.z) < 900, `${Math.hypot(far.x, far.y, far.z).toFixed(0)} units from centre`);

  // Island Overview returns to the same pose, exactly.
  await page.getByRole("button", { name: "Island Overview" }).first().click();
  await wait(7000);
  const back = await cam();
  check("Island Overview restores the original camera", distanceBetween(home, back) < 1, `off by ${distanceBetween(home, back).toFixed(2)} units`);

  // Into a building and back: no spatial jump on return.
  await page.getByRole("navigation", { name: "Departments" }).getByRole("button", { name: /^Story Lab/ }).click();
  await wait(6000);
  const focused = await cam();
  check("focusing flies the camera to the building", distanceBetween(home, focused) > 40);
  await page.keyboard.press("Escape");
  await wait(7000);
  check("returning restores the camera", distanceBetween(home, await cam()) < 1);

  // Feed.
  const feed = await ownerFeed(page);
  check("owner feed returns events", feed.events.length > 0, `${feed.events.length} events, source ${feed.source}`);
  check("feed comes from the database", feed.source === "database");
  // Demo generator rows carry demo- task ids; everything else comes from the
  // authenticated ingest (real agents) and must not be flagged Demo.
  check(
    "demo rows are flagged, real rows are not",
    feed.events.every((e) => (e.taskId?.startsWith("demo-") ? e.isDemo : true)) &&
      feed.events.filter((e) => !e.isDemo).every((e) => !e.taskId?.startsWith("demo-")),
  );

  // Approval round trip.
  let pending = feed.pendingApprovals[0];
  for (let i = 0; i < 40 && !pending; i++) {
    await wait(5000);
    pending = (await ownerFeed(page)).pendingApprovals[0];
  }
  check("there is a pending approval to act on", Boolean(pending));
  if (pending) {
    const eventId = pending.eventId;
    const first = await page.evaluate(async (id) => {
      const r = await fetch("/api/hq/approvals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ eventId: id, decision: "approved", note: "Verification script" }) });
      return { status: r.status, body: (await r.json()) as { persisted?: boolean; approvalId?: number } };
    }, eventId);
    check("approval is recorded", first.status === 200 && first.body.persisted === true && (first.body.approvalId ?? 0) > 0, `approval row ${first.body.approvalId}`);
    const again = await page.evaluate(async (id) => (await fetch("/api/hq/approvals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ eventId: id, decision: "rejected" }) })).status, eventId);
    check("a second decision on it is refused", again === 409, `status ${again}`);
    const after = await ownerFeed(page);
    check("it leaves the pending list", !after.pendingApprovals.some((p) => p.eventId === eventId));
    check("the decision appears as an event", after.events.some((e) => e.eventType === "approved" && e.summary === "Verification script"));
  }

  // Every building: fly in, roof lifts, Escape restores.
  const names = await page.getByRole("navigation", { name: "Departments" }).getByRole("button").evaluateAll((els) => els.map((e) => e.getAttribute("aria-label") ?? ""));
  check("department bar lists every division", names.length === 17, `${names.length}`);
  for (const name of names) {
    await page.getByRole("navigation", { name: "Departments" }).getByRole("button", { name }).click();
    await wait(1100);
    const stats = await page.getByRole("region", { name: /stats$/ }).count();
    const backVisible = await page.getByRole("button", { name: "Close roof" }).count();
    check(`${name.split(",")[0]}: roof lifts`, stats === 1 && backVisible === 1);
    await page.keyboard.press("Escape");
    await wait(250);
    const closed = await page.getByRole("button", { name: "Guided Tour" }).count();
    check(`${name.split(",")[0]}: Escape returns`, closed === 1);
  }

  // Studio behaviours: everyone placed, and someone walks.
  await page.getByRole("navigation", { name: "Departments" }).getByRole("button", { name: /^Content Studio/ }).click();
  await wait(5000);
  const snapshot = () =>
    page.evaluate(() => {
      const map = (window as unknown as { __hqAgentPositions?: Map<string, { x: number; z: number }> }).__hqAgentPositions;
      return map ? [...map.entries()].map(([id, p]) => ({ id, x: p.x, z: p.z })) : [];
    });
  const before = await snapshot();
  check("Content Studio is fully staffed on screen", before.length === 12, `${before.length} figures: ${before.map((b) => b.id).join(", ")}`);

  // Walking needs status changes. Content Studio is live (real events only, no demo),
  // so watch a building division whose labelled demo activity still runs.
  await page.keyboard.press("Escape");
  await wait(1500);
  await page.getByRole("navigation", { name: "Departments" }).getByRole("button", { name: /^Visual Studio/ }).click();
  await wait(5000);
  const walkBefore = await snapshot();
  let moved = 0;
  const seen = new Set<string>();
  for (let i = 0; i < 36 && moved === 0; i++) {
    await wait(2500);
    const now = await snapshot();
    for (const p of now) {
      const old = walkBefore.find((b) => b.id === p.id);
      if (old && Math.hypot(p.x - old.x, p.z - old.z) > 1) {
        moved++;
        seen.add(p.id);
      }
    }
  }
  check("characters walk between spots when status changes", moved > 0, [...seen].join(", "));
  const statuses = new Set(Object.values((await ownerFeed(page)).agents).map((a) => a.status));
  check("agents show more than one status", statuses.size > 1, [...statuses].join(", "));
  await page.keyboard.press("Escape");
  await wait(1500);
  await page.getByRole("navigation", { name: "Departments" }).getByRole("button", { name: /^Content Studio/ }).click();
  await wait(3000);

  // Agent card.
  await page.getByRole("complementary", { name: /Content Studio team/ }).getByRole("button", { name: /Ava/ }).click();
  await wait(600);
  const card = page.getByRole("complementary", { name: /Ava details/ });
  const cardText = (await card.textContent()) ?? "";
  check("agent card shows specialty, model, tools", ["Specialty", "Model", "Tools", "Blockers"].every((w) => cardText.toUpperCase().includes(w.toUpperCase())));
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");
  await wait(600);

  // Nav panels.
  for (const nav of ["Departments", "Team", "Projects", "Performance"]) {
    await page.getByRole("button", { name: nav, exact: true }).first().click();
    await wait(300);
    check(`${nav} panel opens`, (await page.getByRole("dialog", { name: nav }).count()) === 1);
    await page.keyboard.press("Escape");
    await wait(200);
  }

  // Guided tour end to end, using Next so this doesn't take a minute.
  await page.getByRole("button", { name: "Guided Tour" }).click();
  await wait(1500);
  const tour = page.getByRole("group", { name: "Guided tour" });
  const captions: string[] = [];
  for (let i = 0; i < 7; i++) {
    captions.push(((await tour.locator('[aria-live="polite"]').textContent()) ?? "").slice(0, 28));
    if (i === 2) {
      await page.getByRole("button", { name: "Pause tour" }).click();
      await wait(200);
      check("tour pauses", (await page.getByRole("button", { name: "Play tour" }).count()) === 1);
      await page.getByRole("button", { name: "Play tour" }).click();
    }
    if (i < 6) {
      await page.getByRole("button", { name: "Next stop" }).click();
      await wait(1300);
    }
  }
  check("tour has a distinct caption at all 7 stops", new Set(captions).size === 7, `${new Set(captions).size}`);
  await page.getByRole("button", { name: "Exit tour" }).click();
  await wait(500);
  check("tour exits", (await page.getByRole("group", { name: "Guided tour" }).count()) === 0);

  // The tour also ends by itself.
  await page.getByRole("button", { name: "Guided Tour" }).click();
  const started = Date.now();
  await page.getByRole("group", { name: "Guided tour" }).waitFor({ state: "detached", timeout: 90_000 }).catch(() => undefined);
  const lasted = (Date.now() - started) / 1000;
  check("tour plays to the end unattended", (await page.getByRole("group", { name: "Guided tour" }).count()) === 0, `${lasted.toFixed(0)}s`);

  check("no uncaught page errors", errors.length === 0, errors.slice(0, 3).join(" | "));

  // Public.
  const pub = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await pub.goto(`${BASE}/tour?quality=low`, { waitUntil: "domcontentloaded" });
  const feedP = await pub.evaluate(async () => (await (await fetch("/api/hq/events?mode=public")).json()) as PublicFeed);
  check("public feed is aggregates only", feedP.mode === "public" && !("events" in feedP) && !("agents" in feedP));
  check("/tour labels itself Public Tour", ((await pub.textContent("header")) ?? "").includes("Public Tour"));
  check("/tour has no approvals bell", (await pub.getByRole("button", { name: /Approvals/ }).count()) === 0);

  await browser.close();
  console.log(failures === 0 ? "\nALL PASS" : `\n${failures} FAILED`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
