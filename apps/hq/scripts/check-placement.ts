import { ownerWorld } from "../src/server/projection";
import { buildWorld, buildingRadius, HELIPAD, WATERFALLS, MARINA } from "../src/world/world";

/**
 * Placement check for new buildings: terrace clearance from every building, the
 * helipad, waterfalls and docks; natural terrain is land; inside the camera bounds;
 * no foreign path crosses the terrace and its own path avoids other terraces.
 * Usage: pnpm exec tsx scripts/check-placement.ts [division-id ...]
 */
const NEW = process.argv.slice(2).length > 0 ? process.argv.slice(2) : ["website-seo", "visual-studio"];
const all = ownerWorld().divisions;
const without = all.filter((d) => !NEW.includes(d.id));
const base = buildWorld(without, 340);
const full = buildWorld(all, 340);

let ok = true;
for (const id of NEW) {
  const d = all.find((x) => x.id === id)!;
  const b = d.building;
  const r = buildingRadius(b) + 6;
  console.log(`\n== ${id} at (${b.x}, ${b.z}) r=${r}`);
  // Camera boundary box from CameraRig: x [-300,300], z [-320,200].
  const inBox = b.x - r > -300 && b.x + r < 300 && b.z - r > -320 && b.z + r < 200;
  console.log(`inside camera bounds: ${inBox}`);
  ok &&= inBox;
  // Natural terrain under the footprint (before its own terrace).
  const hs: number[] = [];
  for (let a = 0; a < 16; a++) for (const rr of [0, r * 0.5, r, r + 10]) hs.push(base.sample(b.x + Math.cos(a) * rr, b.z + Math.sin(a) * rr));
  const min = Math.min(...hs), max = Math.max(...hs), mean = hs.reduce((s, v) => s + v, 0) / hs.length;
  console.log(`natural terrain: min ${min.toFixed(1)} max ${max.toFixed(1)} mean ${mean.toFixed(1)} (elevation set ${b.elevation})`);
  ok &&= min > 2;
  // Other buildings and the helipad.
  const others = all.filter((o) => o.id !== id).map((o) => ({ id: o.id, x: o.building.x, z: o.building.z, r: buildingRadius(o.building) + 6 }));
  others.push({ id: "helipad", x: HELIPAD.x, z: HELIPAD.z, r: HELIPAD.rx });
  const gaps = others.map((o) => ({ id: o.id, gap: Math.hypot(o.x - b.x, o.z - b.z) - o.r - r })).sort((a, c) => a.gap - c.gap);
  console.log(`nearest buildings (terrace gap): ${gaps.slice(0, 3).map((g) => `${g.id} ${g.gap.toFixed(1)}`).join(", ")}`);
  ok &&= (gaps[0]?.gap ?? 0) > 6;
  // Waterfalls and marina docks.
  const wf = Math.min(...WATERFALLS.map((f) => Math.hypot(f.topX - b.x, f.topZ - b.z) - r));
  const dock = Math.min(...MARINA.docks.map((k) => Math.hypot(k.x - b.x, k.z - b.z) - r));
  console.log(`waterfall gap ${wf.toFixed(1)}, marina dock gap ${dock.toFixed(1)}`);
  ok &&= wf > 12 && dock > 12;
  // Paths that don't belong to this building must stay off its terrace.
  let pathGap = Infinity;
  for (const e of full.edges) {
    if (e.a === id || e.b === id) continue;
    for (const p of e.points) pathGap = Math.min(pathGap, Math.hypot(p.x - b.x, p.z - b.z) - r);
  }
  console.log(`closest foreign path to terrace edge: ${pathGap.toFixed(1)}`);
  ok &&= pathGap > 3;
  // Its own path must not cut through another building.
  let ownCut = Infinity;
  let cutBy = "";
  for (const e of full.edges) {
    if (e.a !== id && e.b !== id) continue;
    for (const p of e.points) for (const o of others) {
      const g = Math.hypot(p.x - o.x, p.z - o.z) - o.r;
      if (g < ownCut) { ownCut = g; cutBy = o.id; }
    }
    console.log(`own path ${e.a} -> ${e.b}`);
  }
  console.log(`own path clearance from other terraces: ${ownCut.toFixed(1)} (${cutBy})`);
  ok &&= ownCut > 0;
}
console.log(ok ? "\nPLACEMENT OK" : "\nPLACEMENT PROBLEM");
