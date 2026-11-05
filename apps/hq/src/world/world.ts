/**
 * The island as data: a deterministic heightfield, flattened terraces under every
 * building in the registry, and a path network that connects them. No rendering.
 * All coordinates are world units. +x is screen right and +z is towards the
 * default camera, matching the master render's composition.
 */
import type { BuildingConfig, ClientDivision, FootprintType } from "../types";

export const WORLD_MIN_X = -340;
export const WORLD_MIN_Z = -360;
export const WORLD_SIZE = 680;
export const SEA_LEVEL = 0;

/* ---------- noise ---------- */

function hash(x: number, y: number): number {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return s - Math.floor(s);
}
function vnoise(x: number, y: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const a = hash(ix, iy);
  const b = hash(ix + 1, iy);
  const c = hash(ix, iy + 1);
  const d = hash(ix + 1, iy + 1);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}
export function fbm(x: number, y: number, octaves = 4): number {
  let sum = 0;
  let amp = 0.5;
  let f = 1;
  for (let i = 0; i < octaves; i++) {
    sum += amp * vnoise(x * f, y * f);
    amp *= 0.5;
    f *= 2.03;
  }
  return sum;
}
function smoothstep(a: number, b: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Small deterministic PRNG for placement. */
export function makeRandom(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------- island shape ---------- */

interface Lobe { cx: number; cz: number; rx: number; rz: number; }

/** Union of ellipses, perturbed by noise. Inside-distance is approximate. */
const LOBES: Lobe[] = [
  { cx: 0, cz: -48, rx: 196, rz: 150 }, // main body
  { cx: 142, cz: 8, rx: 88, rz: 66 }, // right, towards the marina
  { cx: 165, cz: -128, rx: 78, rz: 62 }, // back right, under the peak
  { cx: -158, cz: -78, rx: 66, rz: 78 }, // back left, internal cluster
  { cx: -132, cz: 44, rx: 40, rz: 36 }, // helipad headland
  { cx: 0, cz: 66, rx: 88, rz: 62 }, // Content Studio cliff
  { cx: -30, cz: -190, rx: 74, rz: 40 }, // marketplace bluff
  { cx: 265, cz: -205, rx: 16, rz: 13 }, // offshore islet
  { cx: -262, cz: 40, rx: 11, rz: 9 }, // offshore islet
];

function insideDistance(x: number, z: number): number {
  const wobble = (fbm(x * 0.013 + 7, z * 0.013 + 3, 4) - 0.47) * 46;
  let best = -Infinity;
  for (const l of LOBES) {
    const u = (x - l.cx) / l.rx;
    const v = (z - l.cz) / l.rz;
    const d = (1 - Math.sqrt(u * u + v * v)) * Math.min(l.rx, l.rz);
    if (d > best) best = d;
  }
  return best + wobble;
}

/** 0 on cliffs (front and left), 1 on the long beaches (right and back right). */
function beachness(x: number, z: number): number {
  const right = smoothstep(58, 150, x);
  const notFront = 1 - smoothstep(92, 140, z) * 0.2;
  const patch = smoothstep(0.34, 0.62, fbm(x * 0.009 + 40, z * 0.009, 3));
  return Math.min(1, right * notFront * (0.65 + 0.5 * patch));
}

export interface Pad {
  x: number;
  z: number;
  /** Half-extents of the flat terrace. */
  rx: number;
  rz: number;
  rotation: number;
  blend: number;
  elevation: number;
}

interface FootprintSize { rx: number; rz: number; height: number; }

export function footprintSize(footprint: FootprintType, scale: number): FootprintSize {
  const s = scale;
  switch (footprint) {
    case "angular": return { rx: 46 * s, rz: 27 * s, height: 16 * s };
    case "tiered": return { rx: 27 * s, rz: 27 * s, height: 31 * s };
    case "twin": return { rx: 30 * s, rz: 17 * s, height: 16 * s };
    case "district": return { rx: 29 * s, rz: 22 * s, height: 18 * s };
    case "small": return { rx: 11 * s, rz: 11 * s, height: 13 * s };
    default: return { rx: 19 * s, rz: 19 * s, height: 19 * s };
  }
}

export function buildingRadius(b: BuildingConfig): number {
  const f = footprintSize(b.footprint, b.scale);
  return Math.max(f.rx, f.rz);
}

function padInfluence(p: Pad, x: number, z: number): number {
  const dx = x - p.x;
  const dz = z - p.z;
  const c = Math.cos(-p.rotation);
  const s = Math.sin(-p.rotation);
  const lx = dx * c - dz * s;
  const lz = dx * s + dz * c;
  const u = Math.abs(lx) / p.rx;
  const v = Math.abs(lz) / p.rz;
  const e = Math.sqrt(u * u + v * v) * Math.min(p.rx, p.rz);
  return 1 - smoothstep(Math.min(p.rx, p.rz) + 1, Math.min(p.rx, p.rz) + p.blend, e);
}

function baseHeight(x: number, z: number): number {
  const s = insideDistance(x, z);
  if (s <= 0) {
    // Shelf: long shallow turquoise, then deep.
    const shelf = lerp(0.17, 0.36, 1 - beachness(x, z));
    return Math.max(-16, s * shelf);
  }
  const b = beachness(x, z);
  const beachW = lerp(4, 26, b);
  const cliffH = lerp(11, 2.4, b);
  const rim = smoothstep(0, beachW, s) * cliffH;
  const inland = smoothstep(beachW, beachW + 70, s);
  const roll = (fbm(x * 0.021, z * 0.021, 4) - 0.35) * 16 * inland;
  let h = rim + inland * 7 + Math.max(roll, -3);

  // Atlas's hill and the back ridge.
  const atlas = Math.hypot(x, z + 96);
  h = Math.max(h, 40 * (1 - smoothstep(26, 104, atlas)) + 2);
  // The rocky peak, back right, as in the master render.
  const peak = Math.hypot((x - 182) * 0.9, (z + 150) * 1.1);
  const ridges = fbm(x * 0.03 + 11, z * 0.03 + 5, 5);
  h = Math.max(h, 84 * Math.pow(1 - smoothstep(4, 66, peak), 1.2) * (0.62 + ridges * 0.75));
  // A second shoulder, back left.
  const shoulder = Math.hypot(x + 196, z + 136);
  h = Math.max(h, 40 * Math.pow(1 - smoothstep(6, 54, shoulder), 1.3) * (0.7 + ridges * 0.6));
  return h;
}

/* ---------- paths ---------- */

export interface PathPoint { x: number; y: number; z: number; }
export interface PathEdge { a: string; b: string; points: PathPoint[]; }

/** Junctions the department paths feed into. Divisions attach to the nearest one. */
const HUBS: { id: string; x: number; z: number }[] = [
  { id: "hub-central", x: 2, z: -18 },
  { id: "hub-west", x: -64, z: -8 },
  { id: "hub-east", x: 54, z: -16 },
  { id: "hub-far-east", x: 122, z: -36 },
  { id: "hub-north", x: 26, z: -56 },
  { id: "hub-northwest", x: -92, z: -66 },
  { id: "hub-back", x: 34, z: -128 },
];
const HUB_LINKS: [string, string][] = [
  ["hub-central", "hub-west"],
  ["hub-central", "hub-east"],
  ["hub-central", "hub-north"],
  ["hub-east", "hub-far-east"],
  ["hub-west", "hub-northwest"],
  ["hub-north", "hub-back"],
];

export interface WaterfallSpec {
  topX: number;
  topZ: number;
  dirX: number;
  dirZ: number;
  length: number;
  width: number;
  /** Heights the terrain is carved to at the lip and the plunge pool. */
  topY: number;
  bottomY: number;
}

export const WATERFALLS: WaterfallSpec[] = [
  { topX: 38, topZ: -76, dirX: 0.42, dirZ: 0.9, length: 10, width: 8, topY: 31, bottomY: 13 },
  { topX: 34, topZ: -40, dirX: 0.05, dirZ: 1, length: 9, width: 10, topY: 19, bottomY: 4.5 },
];

export interface PlacementSpot { x: number; z: number; }

export const HELIPAD: Pad = { x: -131, z: 52, rx: 15, rz: 15, rotation: 0, blend: 15, elevation: 17 };

export const MARINA = {
  docks: [
    { x: 190, z: 70, angle: 0.62, length: 74 },
    { x: 216, z: -30, angle: -0.12, length: 62 },
    { x: 226, z: -96, angle: -0.42, length: 48 },
  ],
};

export interface World {
  res: number;
  heights: Float32Array;
  /** 1 where nothing should grow: paths, terraces, buildings. */
  clear: Uint8Array;
  edges: PathEdge[];
  nodes: Map<string, { x: number; z: number }>;
  pads: Pad[];
  /** Wider margin for palms, whose crowns overhang: keeps paths and glass visible. */
  isKept: (x: number, z: number) => boolean;
  sample: (x: number, z: number) => number;
  slope: (x: number, z: number) => number;
  isClear: (x: number, z: number) => boolean;
  route: (from: string, to: string) => PathPoint[];
}

export function buildWorld(divisions: ClientDivision[], res: number): World {
  const pads: Pad[] = [
    HELIPAD,
    ...divisions.map((d) => {
      const f = footprintSize(d.building.footprint, d.building.scale);
      return {
        x: d.building.x,
        z: d.building.z,
        rx: f.rx + 6,
        rz: f.rz + 6,
        rotation: d.building.rotation,
        blend: d.building.footprint === "angular" ? 9 : 13,
        elevation: d.building.elevation,
      };
    }),
  ];

  const size = res + 1;
  const heights = new Float32Array(size * size);
  const clear = new Uint8Array(size * size);
  const kept = new Uint8Array(size * size);
  const cell = WORLD_SIZE / res;

  for (let j = 0; j < size; j++) {
    const z = WORLD_MIN_Z + j * cell;
    for (let i = 0; i < size; i++) {
      const x = WORLD_MIN_X + i * cell;
      let h = baseHeight(x, z);
      if (h > -3) {
        for (const p of pads) {
          const w = padInfluence(p, x, z);
          if (w > 0) h = lerp(h, p.elevation, w);
        }
      }
      heights[j * size + i] = h;
    }
  }

  const sample = (x: number, z: number): number => {
    const fx = Math.min(res - 0.001, Math.max(0, (x - WORLD_MIN_X) / cell));
    const fz = Math.min(res - 0.001, Math.max(0, (z - WORLD_MIN_Z) / cell));
    const ix = Math.floor(fx);
    const iz = Math.floor(fz);
    const tx = fx - ix;
    const tz = fz - iz;
    const a = heights[iz * size + ix] as number;
    const b = heights[iz * size + ix + 1] as number;
    const c = heights[(iz + 1) * size + ix] as number;
    const d = heights[(iz + 1) * size + ix + 1] as number;
    return lerp(lerp(a, b, tx), lerp(c, d, tx), tz);
  };

  const stampClear = (x: number, z: number, radius: number, mask: Uint8Array = clear) => {
    const r = Math.ceil(radius / cell);
    const ci = Math.round((x - WORLD_MIN_X) / cell);
    const cj = Math.round((z - WORLD_MIN_Z) / cell);
    for (let j = cj - r; j <= cj + r; j++) {
      for (let i = ci - r; i <= ci + r; i++) {
        if (i < 0 || j < 0 || i >= size || j >= size) continue;
        const dx = (i - ci) * cell;
        const dz = (j - cj) * cell;
        if (dx * dx + dz * dz <= radius * radius) mask[j * size + i] = 1;
      }
    }
  };

  // Keep planting off the terraces.
  for (const p of pads) {
    const c = Math.cos(p.rotation);
    const s = Math.sin(p.rotation);
    const stepX = cell;
    for (let lx = -p.rx; lx <= p.rx; lx += stepX) {
      for (let lz = -p.rz; lz <= p.rz; lz += stepX) {
        if ((lx * lx) / (p.rx * p.rx) + (lz * lz) / (p.rz * p.rz) > 1.08) continue;
        stampClear(p.x + lx * c + lz * s, p.z - lx * s + lz * c, cell);
      }
    }
    // Palm margin around the terrace.
    for (let lx = -p.rx - 7; lx <= p.rx + 7; lx += cell * 2) {
      for (let lz = -p.rz - 7; lz <= p.rz + 7; lz += cell * 2) {
        if ((lx * lx) / ((p.rx + 7) * (p.rx + 7)) + (lz * lz) / ((p.rz + 7) * (p.rz + 7)) > 1) continue;
        stampClear(p.x + lx * c + lz * s, p.z - lx * s + lz * c, cell * 1.5, kept);
      }
    }
  }

  /* --- waterfalls: carve a lip and a plunge pool, and keep the planting off them --- */
  const stampHeight = (cx: number, cz: number, radius: number, blend: number, y: number) => {
    const r = Math.ceil((radius + blend) / cell);
    const ci = Math.round((cx - WORLD_MIN_X) / cell);
    const cj = Math.round((cz - WORLD_MIN_Z) / cell);
    for (let j = cj - r; j <= cj + r; j++) {
      for (let i = ci - r; i <= ci + r; i++) {
        if (i < 0 || j < 0 || i >= size || j >= size) continue;
        const d = Math.hypot((i - ci) * cell, (j - cj) * cell);
        const w = 1 - smoothstep(radius, radius + blend, d);
        if (w <= 0) continue;
        const k = j * size + i;
        heights[k] = lerp(heights[k] as number, y, w);
      }
    }
  };
  for (const f of WATERFALLS) {
    const bx = f.topX + f.dirX * f.length;
    const bz = f.topZ + f.dirZ * f.length;
    stampHeight(f.topX - f.dirX * 5, f.topZ - f.dirZ * 5, f.width * 1.1, 6, f.topY);
    stampHeight(bx + f.dirX * 4, bz + f.dirZ * 4, f.width * 1.05, 7, f.bottomY);
    for (let t = -0.6; t <= 2.2; t += 0.2) {
      const x = f.topX + f.dirX * f.length * t;
      const z = f.topZ + f.dirZ * f.length * t;
      stampClear(x, z, f.width * 0.95);
      stampClear(x, z, f.width * 1.35, kept);
    }
  }

  /* --- path graph --- */
  const nodes = new Map<string, { x: number; z: number }>();
  for (const h of HUBS) nodes.set(h.id, { x: h.x, z: h.z });

  const edgesToBuild: { a: string; b: string; seed: number }[] = HUB_LINKS.map(([a, b], i) => ({ a, b, seed: i + 1 }));

  const nearestHub = (x: number, z: number): string => {
    let best = HUBS[0]?.id ?? "hub-central";
    let bestD = Infinity;
    for (const h of HUBS) {
      const d = Math.hypot(h.x - x, h.z - z);
      if (d < bestD) {
        bestD = d;
        best = h.id;
      }
    }
    return best;
  };

  for (const [index, d] of divisions.entries()) {
    const { x, z } = d.building;
    const hubId = nearestHub(x, z);
    const hub = nodes.get(hubId) as { x: number; z: number };
    const r = buildingRadius(d.building) + 5;
    const dirX = hub.x - x;
    const dirZ = hub.z - z;
    const len = Math.hypot(dirX, dirZ) || 1;
    const ratio = d.building.footprint === "angular" ? 27 + 5 : r;
    const door = { x: x + (dirX / len) * ratio, z: z + (dirZ / len) * ratio };
    nodes.set(d.id, door);
    edgesToBuild.push({ a: d.id, b: hubId, seed: 20 + index });
  }
  nodes.set("helipad", { x: HELIPAD.x + 12, z: HELIPAD.z - 14 });
  edgesToBuild.push({ a: "helipad", b: nearestHub(HELIPAD.x, HELIPAD.z), seed: 90 });

  const edges: PathEdge[] = edgesToBuild.map(({ a, b, seed }) => {
    const A = nodes.get(a) as { x: number; z: number };
    const B = nodes.get(b) as { x: number; z: number };
    const length = Math.hypot(B.x - A.x, B.z - A.z);
    const count = Math.max(6, Math.ceil(length / 2.4));
    const nx = -(B.z - A.z) / (length || 1);
    const nz = (B.x - A.x) / (length || 1);
    const amp = Math.min(13, length * 0.12);
    const pts: PathPoint[] = [];
    for (let i = 0; i <= count; i++) {
      const t = i / count;
      const taper = Math.sin(Math.PI * t);
      const off = Math.sin(t * Math.PI * 2 + seed) * amp * taper + Math.sin(t * Math.PI * 5 + seed * 2) * amp * 0.25 * taper;
      const x = lerp(A.x, B.x, t) + nx * off;
      const z = lerp(A.z, B.z, t) + nz * off;
      pts.push({ x, z, y: sample(x, z) });
    }
    return { a, b, points: pts };
  });

  // Smooth heights along each path, then press the terrain to match.
  for (const edge of edges) {
    const p = edge.points;
    for (let pass = 0; pass < 8; pass++) {
      const copy = p.map((q) => q.y);
      for (let i = 1; i < p.length - 1; i++) {
        (p[i] as PathPoint).y = ((copy[i - 1] as number) + (copy[i] as number) * 2 + (copy[i + 1] as number)) / 4;
      }
    }
    for (const q of p) q.y = Math.max(q.y, 1.2);
  }
  for (const edge of edges) {
    for (const q of edge.points) {
      const r = Math.ceil(7 / cell);
      const ci = Math.round((q.x - WORLD_MIN_X) / cell);
      const cj = Math.round((q.z - WORLD_MIN_Z) / cell);
      for (let j = cj - r; j <= cj + r; j++) {
        for (let i = ci - r; i <= ci + r; i++) {
          if (i < 0 || j < 0 || i >= size || j >= size) continue;
          const d = Math.hypot((i - ci) * cell, (j - cj) * cell);
          const w = 1 - smoothstep(2.4, 7, d);
          if (w <= 0) continue;
          const k = j * size + i;
          heights[k] = lerp(heights[k] as number, q.y - 0.05, w);
        }
      }
      stampClear(q.x, q.z, 3.4);
      stampClear(q.x, q.z, 7.5, kept);
    }
  }
  for (const edge of edges) for (const q of edge.points) q.y = sample(q.x, q.z) + 0.1;

  /* --- routing --- */
  const neighbors = new Map<string, { to: string; edge: PathEdge; forward: boolean }[]>();
  const link = (from: string, to: string, edge: PathEdge, forward: boolean) => {
    const list = neighbors.get(from) ?? [];
    list.push({ to, edge, forward });
    neighbors.set(from, list);
  };
  for (const e of edges) {
    link(e.a, e.b, e, true);
    link(e.b, e.a, e, false);
  }

  const route = (from: string, to: string): PathPoint[] => {
    if (from === to) return [];
    const prev = new Map<string, { node: string; edge: PathEdge; forward: boolean }>();
    const queue = [from];
    const seen = new Set([from]);
    while (queue.length > 0) {
      const n = queue.shift() as string;
      if (n === to) break;
      for (const next of neighbors.get(n) ?? []) {
        if (seen.has(next.to)) continue;
        seen.add(next.to);
        prev.set(next.to, { node: n, edge: next.edge, forward: next.forward });
        queue.push(next.to);
      }
    }
    if (!prev.has(to)) return [];
    const legs: PathPoint[][] = [];
    let cursor = to;
    while (cursor !== from) {
      const step = prev.get(cursor);
      if (!step) break;
      legs.unshift(step.forward ? step.edge.points : [...step.edge.points].reverse());
      cursor = step.node;
    }
    return legs.flat();
  };

  const isClear = (x: number, z: number): boolean => {
    const i = Math.round((x - WORLD_MIN_X) / cell);
    const j = Math.round((z - WORLD_MIN_Z) / cell);
    if (i < 0 || j < 0 || i >= size || j >= size) return false;
    return clear[j * size + i] === 1;
  };

  const isKept = (x: number, z: number): boolean => {
    const i = Math.round((x - WORLD_MIN_X) / cell);
    const j = Math.round((z - WORLD_MIN_Z) / cell);
    if (i < 0 || j < 0 || i >= size || j >= size) return false;
    return kept[j * size + i] === 1;
  };

  const slope = (x: number, z: number): number => {
    const e = cell;
    return Math.hypot(sample(x + e, z) - sample(x - e, z), sample(x, z + e) - sample(x, z - e)) / (2 * e);
  };

  return { res, heights, clear, edges, nodes, pads, sample, slope, isClear, isKept, route };
}
