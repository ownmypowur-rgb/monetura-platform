/**
 * Architecture kit. Every building is the same three parts: exterior shell, interior
 * (see interiors.ts), and a removable roof with its upper walls. Roof parts are kept
 * as separate geometries so the cutaway lifts exactly the same object that was there.
 */
import * as THREE from "three";
import type { DivisionStatus, FootprintType } from "../types";
import { GeoBuilder, glassRing, leafBlade, mergeOrEmpty } from "./geo";

const WHITE = "#ebe4d8";
const CONCRETE = "#d9d1c3";
const SHADE = "#c9bfb0";
const WOOD = "#96704f";
const WOOD_DARK = "#7c5434";
const MULLION = "#6a5845";
const PLANT = "#3f7a34";
const PLANTER = "#d8cfc1";
const STEEL = "#6e6a64";
const SCAFFOLD = "#8f7a5a";
const BARRIER = "#c17a4a";
const CRANE = "#d9a441";

export interface BuildingGeometry {
  /** Stays in place during the cutaway. */
  shell: THREE.BufferGeometry;
  shellGlass: THREE.BufferGeometry;
  /** Warm plate behind the glass, faking a lit interior from afar. */
  glow: THREE.BufferGeometry;
  /** Only drawn when close: mullions and small fittings. */
  detail: THREE.BufferGeometry;
  /** Lifts and fades. */
  roof: THREE.BufferGeometry;
  roofGlass: THREE.BufferGeometry;
  roofGlow: THREE.BufferGeometry;
  /** LED strips and similar, always emissive. */
  lights: THREE.BufferGeometry;
  roofLights: THREE.BufferGeometry;
  /** Scaffolding, crane and barriers for "building" status. */
  construction: THREE.BufferGeometry;
  /** Floor height the interior sits on, in building-local units. */
  floorY: number;
  height: number;
  /** Local position of the big M sign, Atlas only. */
  sign: { y: number; z: number; size: number } | null;
  /** Local circles used to keep the camera out of the building. */
  colliders: { x: number; z: number; r: number; top: number }[];
}

function mullionRing(b: GeoBuilder, r: number, y: number, h: number, count: number, cx = 0, cz = 0) {
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    b.box(0.22, h, 0.22, cx + Math.cos(a) * r, y + h / 2, cz + Math.sin(a) * r, MULLION);
  }
}

function deck(b: GeoBuilder, rIn: number, rOut: number, y: number, cx = 0, cz = 0) {
  b.slab(rOut, 0.35, cx, y, cz, WOOD, 48, rIn);
  const planks = Math.floor(rOut * 3.4);
  for (let i = 0; i < planks; i++) {
    const a = (i / planks) * Math.PI * 2;
    const mid = (rIn + rOut) / 2;
    b.box(rOut - rIn - 0.2, 0.06, 0.08, cx + Math.cos(a) * mid, y + 0.37, cz + Math.sin(a) * mid, WOOD_DARK, -a);
  }
}

function planter(b: GeoBuilder, x: number, y: number, z: number, size = 1) {
  b.cyl(0.95 * size, 0.75 * size, 0.9 * size, x, y + 0.45 * size, z, PLANTER, 14);
  b.sphere(0.55 * size, x, y + 1 * size, z, PLANT, 1, 0.7, 1, 6);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    b.add(leafBlade(1.5 * size, 0.46 * size), i % 2 ? PLANT : "#54923f", [x, y + 1.1 * size, z], [0, -a, i % 2 ? 0.5 : 0.1]);
  }
}

/** A round pavilion at (cx, cz): the core of the kit. */
function pavilion(
  parts: Parts,
  R: number,
  wallH: number,
  cx: number,
  cz: number,
  opts: { drum?: boolean; deckWidth?: number; base?: number } = {},
) {
  const base = opts.base ?? 0;
  const { shell, detail, roof, lights, roofLights } = parts;
  const floorTop = base + 1;
  shell.slab(R + 0.8, 1, cx, base, cz, WHITE);
  const dw = opts.deckWidth ?? 4;
  if (dw > 0) {
    deck(shell, R + 0.7, R + 0.7 + dw, base + 0.2, cx, cz);
    const n = Math.max(4, Math.round(R * 0.8));
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + 0.3;
      planter(detail, cx + Math.cos(a) * (R + dw), base + 0.55, cz + Math.sin(a) * (R + dw), 0.8);
    }
  }
  const lowerH = Math.min(wallH * 0.48, 5.4);
  const upperH = wallH - lowerH;
  // The kept part of the wall: glass to waist height, with a white rim on top.
  parts.shellGlass.push(glassRing(R, lowerH, floorTop + lowerH / 2, cx, cz));
  parts.glowLower.push(glassRing(R - 0.25, lowerH, floorTop + lowerH / 2, cx, cz));
  mullionRing(detail, R, floorTop, lowerH, Math.round(R * 1.3), cx, cz);
  shell.slab(R + 0.35, 0.55, cx, floorTop + lowerH - 0.2, cz, WHITE, 48, R - 0.5);

  // The removable part: upper glass, roof disc with overhang, top drum.
  const upperBase = floorTop + lowerH + 0.35;
  parts.roofGlass.push(glassRing(R, upperH, upperBase + upperH / 2, cx, cz));
  parts.glowUpper.push(glassRing(R - 0.25, upperH, upperBase + upperH / 2, cx, cz));
  mullionRing(roof, R, upperBase, upperH, Math.round(R * 1.3), cx, cz);
  const roofY = upperBase + upperH;
  roof.slab(R + 2.5, 0.95, cx, roofY, cz, WHITE);
  roofLights.torus(R + 1.8, 0.13, cx, roofY - 0.03, cz, "#ffc777");
  lights.torus(R + 0.5, 0.1, cx, floorTop - 0.02, cz, "#ffb760");
  if (opts.drum !== false) {
    const dR = R * 0.66;
    const drumH = R > 12 ? 3.8 : 2.6;
    parts.roofGlass.push(glassRing(dR, drumH, roofY + 0.9 + drumH / 2, cx, cz));
    parts.glowUpper.push(glassRing(dR - 0.2, drumH, roofY + 0.9 + drumH / 2, cx, cz));
    mullionRing(roof, dR, roofY + 0.9, drumH, Math.round(dR * 1.4), cx, cz);
    roof.slab(dR + 1.7, 0.7, cx, roofY + 0.9 + drumH, cz, WHITE);
    roof.slab(dR * 0.5, 0.3, cx, roofY + 1.6 + drumH, cz, CONCRETE);
    roofLights.torus(dR + 1.1, 0.1, cx, roofY + 0.88 + drumH, cz, "#ffc777");
  } else {
    roof.slab(R * 0.7, 0.4, cx, roofY + 1.1, cz, CONCRETE);
  }
  parts.colliders.push({ x: cx, z: cz, r: R + 2.5, top: roofY + 7 });
  parts.height = Math.max(parts.height, roofY + 6);
  parts.floorY = floorTop;
}

interface Parts {
  shell: GeoBuilder;
  detail: GeoBuilder;
  roof: GeoBuilder;
  lights: GeoBuilder;
  roofLights: GeoBuilder;
  construction: GeoBuilder;
  shellGlass: THREE.BufferGeometry[];
  roofGlass: THREE.BufferGeometry[];
  glowLower: THREE.BufferGeometry[];
  glowUpper: THREE.BufferGeometry[];
  colliders: BuildingGeometry["colliders"];
  floorY: number;
  height: number;
  sign: BuildingGeometry["sign"];
}

/** Content Studio's footprint: a long angular hall, [x, z]. */
export const STUDIO_POLYGON: readonly (readonly [number, number])[] = [
  [-42, -6],
  [-27, -24],
  [27, -24],
  [42, -6],
  [42, 9],
  [24, 24],
  [-24, 24],
  [-42, 9],
];

function quadStrip(ax: number, az: number, bx: number, bz: number, y0: number, y1: number): THREE.BufferGeometry {
  const geo = new THREE.PlaneGeometry(Math.hypot(bx - ax, bz - az), y1 - y0);
  geo.rotateY(Math.atan2(-(bz - az), bx - ax));
  geo.translate((ax + bx) / 2, (y0 + y1) / 2, (az + bz) / 2);
  return geo;
}

/** A flat polygon, facing up, with a uv so glow textures map across it. */
function flatPolygon(points: readonly (readonly [number, number])[], y: number): THREE.BufferGeometry {
  const shape = new THREE.Shape(points.map(([x, z]) => new THREE.Vector2(x, -z)));
  const g = new THREE.ShapeGeometry(shape);
  g.rotateX(-Math.PI / 2);
  g.translate(0, y, 0);
  const uv = g.getAttribute("uv") as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 0.03, 0.5);
  return g;
}

function offsetPolygon(points: readonly (readonly [number, number])[], factor: number): [number, number][] {
  return points.map(([x, z]) => [x * factor, z * factor]);
}

function angularStudio(parts: Parts) {
  const { shell, detail, roof, lights, roofLights } = parts;
  const poly = STUDIO_POLYGON;
  const plinth = offsetPolygon(poly, 1.09);
  shell.polygon(plinth, 1.1, 0, WHITE, 0.3);
  // Wooden terrace along the front edge, facing the sea.
  shell.polygon(
    [[-30, 24.5], [30, 24.5], [36, 19.5], [36, 25], [26, 31], [-26, 31], [-36, 25], [-36, 19.5]],
    0.4,
    0.75,
    WOOD,
  );
  for (let i = -24; i <= 24; i += 8) planter(detail, i, 1.1, 29.6, 1);

  const floorTop = 1.1;
  const keptH = 5;
  const totalH = 10.6;
  for (let i = 0; i < poly.length; i++) {
    const [ax, az] = poly[i] as readonly [number, number];
    const [bx, bz] = poly[(i + 1) % poly.length] as readonly [number, number];
    parts.shellGlass.push(quadStrip(ax, az, bx, bz, floorTop, floorTop + keptH));
    parts.roofGlass.push(quadStrip(ax, az, bx, bz, floorTop + keptH + 1.3, floorTop + totalH));
    parts.glowLower.push(quadStrip(ax * 0.99, az * 0.99, bx * 0.99, bz * 0.99, floorTop, floorTop + keptH));
    parts.glowUpper.push(quadStrip(ax * 0.99, az * 0.99, bx * 0.99, bz * 0.99, floorTop + keptH + 1.3, floorTop + totalH));
    // The thick white rim of the cutaway stays with the shell.
    shell.beam(ax, az, bx, bz, floorTop + keptH + 0.65, 1.3, 1.3, WHITE);
    const len = Math.hypot(bx - ax, bz - az);
    const n = Math.max(2, Math.round(len / 3.2));
    for (let k = 0; k <= n; k++) {
      const t = k / n;
      const x = ax + (bx - ax) * t;
      const z = az + (bz - az) * t;
      detail.box(0.26, keptH, 0.26, x, floorTop + keptH / 2, z, MULLION);
      roof.box(0.26, totalH - keptH - 1.3, 0.26, x, floorTop + keptH + 1.3 + (totalH - keptH - 1.3) / 2, z, MULLION);
    }
    // Heavier concrete columns at the corners.
    shell.box(1, keptH + 0.2, 1, ax, floorTop + keptH / 2, az, CONCRETE);
    lights.beam(ax * 0.985, az * 0.985, bx * 0.985, bz * 0.985, floorTop + keptH - 0.02, 0.1, 0.14, "#ffbe6f");
  }
  const roofY = floorTop + totalH;
  roof.polygon(offsetPolygon(poly, 1.09), 1.3, roofY, WHITE, 0.4);
  roof.polygon(offsetPolygon(poly, 0.9), 0.24, roofY + 1.3, WOOD);
  for (let x = -36; x <= 36; x += 1.5) {
    const half = 21 - Math.max(0, Math.abs(x) - 22) * 1;
    roof.box(0.09, 0.05, half * 2, x, roofY + 1.57, 0, WOOD_DARK);
  }
  // The long central atrium: glass over warm light, the roof's main feature.
  const atrium: [number, number][] = [[-28, -6], [-19, -14], [19, -14], [28, -6], [28, 5], [19, 13], [-19, 13], [-28, 5]];
  roof.polygon(offsetPolygon(atrium, 1.06), 1.1, roofY + 1.3, WHITE, 0.2);
  parts.glowUpper.push(flatPolygon(atrium, roofY + 2.42));
  parts.roofGlass.push(flatPolygon(atrium, roofY + 3.2));
  for (let x = -26; x <= 26; x += 4) {
    roof.box(0.2, 0.2, 26, x, roofY + 3.2, 0, MULLION);
  }
  roof.box(54, 0.2, 0.2, 0, roofY + 3.2, 0, MULLION);
  for (const [x, z] of [[-34, 0], [34, 0], [-22, 18], [22, 18], [-22, -18.5], [22, -18.5], [0, 17.5], [0, -18]] as const) {
    planter(roof, x, roofY + 1.5, z, 1.3);
  }
  roofLights.beam(-27, 26.1, 27, 26.1, roofY - 0.05, 0.12, 0.16, "#ffc777");
  roofLights.beam(-27, -26, 27, -26, roofY - 0.05, 0.12, 0.16, "#ffc777");
  parts.floorY = floorTop;
  parts.height = roofY + 3.4;
  parts.colliders.push({ x: -20, z: 0, r: 26, top: roofY + 4 });
  parts.colliders.push({ x: 20, z: 0, r: 26, top: roofY + 4 });
}

function tieredAtlas(parts: Parts) {
  const { roof, shell, roofLights } = parts;
  // Ground tier: the command floor. Its upper wall and everything above lift away.
  pavilion(parts, 24, 8, 0, 0, { drum: false, deckWidth: 3.4 });
  const t2 = 10.3;
  // Second tier.
  roof.slab(19, 0.8, 0, t2, 0, WHITE);
  parts.roofGlass.push(glassRing(17, 7, t2 + 4.3, 0, 0));
  parts.glowUpper.push(glassRing(16.7, 7, t2 + 4.3, 0, 0));
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    roof.box(0.24, 7, 0.24, Math.cos(a) * 17, t2 + 4.3, Math.sin(a) * 17, MULLION);
  }
  roof.slab(21, 1, 0, t2 + 7.8, 0, WHITE);
  roofLights.torus(20, 0.13, 0, t2 + 7.77, 0, "#ffc777");
  // Top tier.
  parts.roofGlass.push(glassRing(10, 3.6, t2 + 10.6, 0, 0));
  parts.glowUpper.push(glassRing(9.7, 3.6, t2 + 10.6, 0, 0));
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    roof.box(0.2, 3.6, 0.2, Math.cos(a) * 10, t2 + 10.6, Math.sin(a) * 10, MULLION);
  }
  roof.slab(13.5, 0.9, 0, t2 + 12.4, 0, WHITE);
  roof.cyl(4.4, 5, 1.3, 0, t2 + 13.9, 0, CONCRETE, 28);
  roof.cyl(0.14, 0.14, 4, 0, t2 + 16.4, 0, STEEL, 8);
  roofLights.sphere(0.32, 0, t2 + 18.5, 0, "#ffd9a0");
  // Terraced garden ring around the hill foot.
  shell.slab(31, 0.5, 0, -0.42, 0, CONCRETE, 56, 27.6);
  parts.height = t2 + 18;
  parts.sign = { y: t2 + 4.2, z: 17.3, size: 6.2 };
  parts.colliders[0] = { x: 0, z: 0, r: 27, top: t2 + 18 };
}

function construction(parts: Parts, footprint: FootprintType, R: number) {
  const c = parts.construction;
  const top = Math.min(parts.height, footprint === "tiered" ? 18 : parts.height);
  const startA = footprint === "angular" ? 0 : -0.5;
  const span = footprint === "angular" ? 0 : 1.9;
  const addBay = (x: number, z: number, ry: number) => {
    for (let y = 0; y < top; y += 3.2) {
      c.box(3.6, 0.1, 1.1, x, y + 1.6, z, SCAFFOLD, ry);
      c.box(3.6, 0.1, 0.1, x + Math.sin(ry) * 0.75, y + 2.7, z + Math.cos(ry) * 0.75, STEEL, ry);
    }
    for (const dx of [-1.7, 1.7]) {
      for (const dz of [-0.7, 0.7]) {
        const px = x + Math.cos(ry) * dx + Math.sin(ry) * dz;
        const pz = z - Math.sin(ry) * dx + Math.cos(ry) * dz;
        c.cyl(0.08, 0.08, top, px, top / 2, pz, STEEL, 6);
      }
    }
  };
  if (footprint === "angular") {
    // One end of the hall sits in scaffolding.
    for (let i = 0; i < 4; i++) addBay(46.6, -5 + i * 3.7, Math.PI / 2);
  } else {
    const r = R + 2.4;
    const bays = Math.max(4, Math.round((span * r) / 3.6));
    for (let i = 0; i < bays; i++) {
      const a = startA + (i / bays) * span;
      addBay(Math.cos(a) * r, Math.sin(a) * r, -a + Math.PI / 2);
    }
  }
  // A small tower crane on the far side.
  const cx = footprint === "angular" ? 54 : R + 8;
  const cz = footprint === "angular" ? -14 : -R - 2;
  const craneH = parts.height + 8;
  c.box(3, 0.6, 3, cx, 0.3, cz, "#57504a");
  c.box(0.8, craneH, 0.8, cx, craneH / 2, cz, CRANE);
  c.box(16, 0.55, 0.55, cx - 5, craneH, cz, CRANE);
  c.box(1.4, 1.4, 1.4, cx + 2.6, craneH - 0.2, cz, "#57504a");
  c.box(0.08, 6, 0.08, cx - 10, craneH - 3, cz, STEEL);
  c.box(1, 0.6, 1, cx - 10, craneH - 6, cz, STEEL);
  // Barriers along the front.
  const bz = footprint === "angular" ? 33 : R + 7.5;
  for (let i = -3; i <= 3; i++) {
    const bx = (footprint === "angular" ? 34 : 0) + i * 2.3;
    c.box(1.9, 0.55, 0.14, bx, 0.9, bz, BARRIER);
    c.box(0.14, 0.9, 0.5, bx - 0.95, 0.45, bz, "#e8dccb");
  }
}

export function buildBuilding(footprint: FootprintType, status: DivisionStatus): BuildingGeometry {
  const parts: Parts = {
    shell: new GeoBuilder(),
    detail: new GeoBuilder(),
    roof: new GeoBuilder(),
    lights: new GeoBuilder(),
    roofLights: new GeoBuilder(),
    construction: new GeoBuilder(),
    shellGlass: [],
    roofGlass: [],
    glowLower: [],
    glowUpper: [],
    colliders: [],
    floorY: 1,
    height: 10,
    sign: null,
  };

  let R = 16;
  switch (footprint) {
    case "angular":
      angularStudio(parts);
      R = 42;
      break;
    case "tiered":
      tieredAtlas(parts);
      R = 24;
      break;
    case "twin":
      R = 14;
      pavilion(parts, 13.5, 9, -15, 0, { deckWidth: 2.2 });
      pavilion(parts, 13.5, 9, 15, 0, { deckWidth: 2.2 });
      parts.shell.box(9, 0.9, 7, 0, 0.5, 0, WHITE);
      parts.shell.box(8, 3.4, 5, 0, 2.6, 0, CONCRETE);
      break;
    case "district": {
      R = 15;
      pavilion(parts, 15, 9.5, 0, -3, { deckWidth: 3 });
      pavilion(parts, 7, 6.2, -21, 8, { drum: false, deckWidth: 1.6 });
      pavilion(parts, 7, 6.2, 21, 8, { drum: false, deckWidth: 1.6 });
      parts.floorY = 1;
      // Market canopies between the pavilions.
      for (const [x, z, c] of [[-10, 15, "#c17a4a"], [0, 18, "#e8dccb"], [10, 15, "#d4a853"]] as const) {
        parts.shell.cyl(0.14, 0.14, 3, x, 1.5, z, STEEL, 6);
        parts.shell.cyl(0.2, 3.3, 1, x, 3.3, z, c, 10);
      }
      break;
    }
    case "small":
      R = 9;
      pavilion(parts, 9, 7.2, 0, 0, { deckWidth: 1.8 });
      break;
    default:
      R = 16;
      pavilion(parts, 15.5, 10.5, 0, 0);
  }

  if (status === "building") construction(parts, footprint, R);

  return {
    shell: parts.shell.build(),
    detail: parts.detail.build(),
    roof: parts.roof.build(),
    lights: parts.lights.build(),
    roofLights: parts.roofLights.build(),
    construction: parts.construction.build(),
    shellGlass: mergeOrEmpty(parts.shellGlass.map(stripGeo)),
    roofGlass: mergeOrEmpty(parts.roofGlass.map(stripGeo)),
    glow: mergeOrEmpty(parts.glowLower.map(stripGeo)),
    roofGlow: mergeOrEmpty(parts.glowUpper.map(stripGeo)),
    floorY: parts.floorY,
    height: parts.height,
    sign: parts.sign,
    colliders: parts.colliders,
  };
}

/** Keep position and normal, plus a v coordinate for the glow's fake interior texture. */
function stripGeo(g: THREE.BufferGeometry): THREE.BufferGeometry {
  return g.index ? g.toNonIndexed() : g;
}
