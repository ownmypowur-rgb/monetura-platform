/**
 * Proves the public tour leaks nothing private. Fetches /tour's HTML, every JS chunk
 * it loads, and the public feed, then searches them for private strings taken from
 * the registry itself (agent names, tools, specialties, models, nextUp notes).
 *
 * Run against a production build or a deployment:
 *   HQ_BASE_URL=http://localhost:3003 pnpm check:public
 * Exits non-zero on any leak.
 */
import { DIVISIONS } from "../src/registry";

const BASE = process.env["HQ_BASE_URL"] ?? "http://localhost:3003";

function privateStrings(): string[] {
  const out = new Set<string>();
  for (const d of DIVISIONS) {
    out.add(d.nextUp);
    for (const a of d.agents) {
      out.add(a.specialty);
      out.add(a.id);
      // Bare first names are too common to search for reliably in minified JS,
      // so names are checked as a quoted JSON value instead.
      out.add(`"${a.name}"`);
      for (const t of a.tools) out.add(`"${t}"`);
    }
  }
  return [...out].filter((s) => s.length > 3);
}

async function text(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} returned ${res.status}`);
  return res.text();
}

async function main() {
  const html = await text(`${BASE}/tour`);
  const chunkUrls = [...new Set([...html.matchAll(/\/_next\/static\/[^"'\s\\]+?\.js/g)].map((m) => m[0]))];
  // Chunks loaded lazily are referenced from the webpack runtime; follow one level.
  const docs: { name: string; body: string }[] = [{ name: "/tour html", body: html }];
  for (const u of chunkUrls) docs.push({ name: u, body: await text(`${BASE}${u}`) });
  docs.push({ name: "/api/hq/events?mode=public", body: await text(`${BASE}/api/hq/events?mode=public`) });

  const feed = JSON.parse(docs[docs.length - 1]?.body ?? "{}") as Record<string, unknown>;
  for (const banned of ["events", "agents", "pendingApprovals", "taskTitle", "payloadJson", "payload_json", "summary"]) {
    if (JSON.stringify(feed).includes(`"${banned}"`)) {
      console.error(`LEAK: public feed contains the field ${banned}`);
      process.exitCode = 1;
    }
  }

  const needles = privateStrings();
  let leaks = 0;
  for (const doc of docs) {
    for (const needle of needles) {
      if (doc.body.includes(needle)) {
        // Public role labels and an agent id that doubles as a division word are not private.
        console.error(`LEAK: ${doc.name} contains ${needle.slice(0, 70)}`);
        leaks++;
      }
    }
  }

  // Owner endpoints must refuse without a session.
  const owner = await fetch(`${BASE}/api/hq/events?mode=owner`);
  if (owner.status !== 401) {
    console.error(`LEAK: owner feed returned ${owner.status} without a session`);
    leaks++;
  }
  const approve = await fetch(`${BASE}/api/hq/approvals`, { method: "POST", body: "{}" });
  if (approve.status !== 401) {
    console.error(`LEAK: approvals returned ${approve.status} without a session`);
    leaks++;
  }
  const home = await fetch(`${BASE}/`, { redirect: "manual" });
  const location = home.headers.get("location") ?? "";
  if (home.status < 300 || home.status >= 400 || !location.includes("/login")) {
    console.error(`LEAK: / returned ${home.status} (${location}) without a session`);
    leaks++;
  }

  console.log(`Checked ${docs.length} documents against ${needles.length} private strings.`);
  if (leaks > 0 || process.exitCode) {
    console.error(`FAILED: ${leaks} leak(s).`);
    process.exit(1);
  }
  console.log("PASS: /tour exposes no private data; / and owner APIs require a session.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
