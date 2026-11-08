/**
 * Furnished interiors. Each returns merged furniture plus "slots": where people sit,
 * meet and relax. Characters read the slots; nothing here knows about agents, so a
 * new agent or division just picks up the next free desk.
 */
import * as THREE from "three";
import type { FootprintType, InteriorKind } from "../types";
import { GeoBuilder, leafBlade } from "./geo";
import {
  calendarTexture,
  chartTexture,
  editorTexture,
  listBoardTexture,
  mapTexture,
  storyboardTexture,
  studioSignTexture,
  titleBoard,
  travelTexture,
} from "./textures";

export interface Slot {
  x: number;
  z: number;
  /** Facing: rotation about Y; 0 looks towards +z. */
  ry: number;
  /** Stands at a ring light instead of sitting at a desk. */
  present?: boolean;
  seated?: boolean;
  standing?: boolean;
}

export interface Screen {
  texture: THREE.Texture;
  x: number;
  y: number;
  z: number;
  w: number;
  h: number;
  ry: number;
  /** Tilts up slightly for wall boards. */
  emissive?: number;
}

export interface InteriorLayout {
  solid: THREE.BufferGeometry;
  /** Self-lit: ring lights, LED, glowing table. */
  lit: THREE.BufferGeometry;
  screens: Screen[];
  desks: Slot[];
  meeting: Slot[];
  lounge: Slot[];
  /** Waypoints walkers pass through between zones. */
  hubs: { x: number; z: number }[];
  floor: { kind: "polygon"; points: readonly (readonly [number, number])[] } | { kind: "circles"; circles: { x: number; z: number; r: number }[] };
  mTable: { x: number; z: number } | null;
  light: { x: number; y: number; z: number; distance: number };
  /** Furniture and people relative to the shell. */
  contentScale: number;
}

const DESK = "#caa679";
const DESK_DARK = "#8d6a44";
const LEG = "#4a4340";
const CHAIR = "#2c2826";
const MONITOR = "#141414";
const SOFA = "#e3d4bb";
const SOFA_DARK = "#c5b294";
const CUSHION = "#c17a4a";
const TABLE = "#e6dccb";
const POT = "#e4dccf";
const LEAF = "#2f7a33";
const LEAF2 = "#4f9c3e";
const RUG = "#d7c7ad";

function chair(b: GeoBuilder, x: number, z: number, ry: number, color = CHAIR) {
  // Seat at 1.05, back behind the sitter (opposite the facing direction).
  const bx = -Math.sin(ry) * 0.62;
  const bz = -Math.cos(ry) * 0.62;
  b.cyl(0.62, 0.62, 0.16, x, 1.05, z, color, 14);
  b.box(1.05, 0.72, 0.12, x + bx, 1.5, z + bz, color, ry);
  b.cyl(0.07, 0.07, 0.9, x, 0.55, z, "#6b6660", 6);
  b.cyl(0.5, 0.56, 0.08, x, 0.06, z, "#6b6660", 10);
}

/** Desk with monitors in front of the sitter's slot. Adds screens. */
function desk(
  b: GeoBuilder,
  screens: Screen[],
  slot: Slot,
  monitors: number,
  seed: number,
  texture: (i: number) => THREE.Texture,
  width = 5.6,
) {
  const { x, z, ry } = slot;
  const fx = Math.sin(ry);
  const fz = Math.cos(ry);
  const rx = Math.cos(ry);
  const rz = -Math.sin(ry);
  const cx = x + fx * 1.55;
  const cz = z + fz * 1.55;
  b.box(width, 0.18, 2.3, cx, 1.42, cz, DESK, ry);
  b.box(width - 0.2, 0.9, 0.12, cx + fx * 1.02, 0.95, cz + fz * 1.02, DESK_DARK, ry);
  for (const s of [-1, 1]) {
    b.box(0.14, 1.34, 2.1, cx + rx * s * (width / 2 - 0.2), 0.68, cz + rz * s * (width / 2 - 0.2), DESK_DARK, ry);
  }
  // Keyboard, mouse, mug.
  b.box(1.5, 0.05, 0.5, cx - fx * 0.5, 1.54, cz - fz * 0.5, "#efe9df", ry);
  b.box(0.22, 0.06, 0.32, cx - fx * 0.5 + rx * 1.05, 1.54, cz - fz * 0.5 + rz * 1.05, "#efe9df", ry);
  b.cyl(0.13, 0.11, 0.26, cx - rx * (width / 2 - 0.5), 1.64, cz - rz * (width / 2 - 0.5), "#d4a853", 8);
  const mw = monitors >= 3 ? 1.72 : 2.1;
  const start = -((monitors - 1) * (mw + 0.08)) / 2;
  for (let i = 0; i < monitors; i++) {
    const off = start + i * (mw + 0.08);
    const angle = monitors >= 2 ? -off * 0.12 : 0;
    const mx = cx + fx * 0.55 + rx * off;
    const mz = cz + fz * 0.55 + rz * off;
    b.box(mw + 0.1, mw * 0.6, 0.08, mx, 2.5, mz, MONITOR, ry + angle);
    b.box(0.12, 0.72, 0.12, mx + fx * 0.06, 1.85, mz + fz * 0.06, LEG, ry);
    b.box(0.72, 0.05, 0.42, mx + fx * 0.06, 1.53, mz + fz * 0.06, LEG, ry);
    screens.push({
      texture: texture(seed + i),
      x: mx - fx * 0.05,
      y: 2.5,
      z: mz - fz * 0.05,
      w: mw,
      h: mw * 0.56,
      // Plane faces +z at ry=0; screens must face back toward the sitter.
      ry: ry + Math.PI + angle,
    });
  }
  chair(b, x, z, ry);
}

function plant(b: GeoBuilder, x: number, z: number, size = 1, y = 0) {
  b.cyl(0.62 * size, 0.46 * size, 1 * size, x, y + 0.5 * size, z, POT, 12);
  b.cyl(0.06 * size, 0.09 * size, 1.5 * size, x, y + 1.6 * size, z, "#6a4a2c", 6);
  const n = 14;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + (i % 3) * 0.2;
    const len = (1.5 + (i % 4) * 0.28) * size;
    const lift = i % 2 ? 0.45 : 0.05;
    b.add(leafBlade(len, 0.42 * size), i % 3 ? LEAF : LEAF2, [x, y + 2.25 * size, z], [0, -a, lift]);
  }
}

function roundTable(b: GeoBuilder, x: number, z: number, r: number, chairs: number, slots: Slot[], color = TABLE, chairColor = "#7c8f52") {
  b.cyl(r, r, 0.16, x, 1.45, z, color, 28);
  b.cyl(0.2, 0.36, 1.4, x, 0.7, z, "#8b6e52", 12);
  for (let i = 0; i < chairs; i++) {
    const a = (i / chairs) * Math.PI * 2 + 0.4;
    const sx = x + Math.cos(a) * (r + 1);
    const sz = z + Math.sin(a) * (r + 1);
    const ry = Math.atan2(x - sx, z - sz);
    chair(b, sx, sz, ry, chairColor);
    slots.push({ x: sx, z: sz, ry, seated: true });
    // Laptop or notebook on the table.
    if (i % 2 === 0) {
      b.box(0.75, 0.05, 0.5, x + Math.cos(a) * (r - 0.5), 1.56, z + Math.sin(a) * (r - 0.5), "#55504b", -a);
    }
  }
}

function circleSofa(b: GeoBuilder, x: number, z: number, r: number, from: number, to: number, lounge: Slot[], count: number) {
  const segs = 14;
  for (let i = 0; i < segs; i++) {
    const a = from + ((to - from) * (i + 0.5)) / segs;
    const len = (((to - from) * r) / segs) * 1.08;
    const sx = x + Math.cos(a) * r;
    const sz = z + Math.sin(a) * r;
    b.box(len, 0.95, 1.5, sx, 0.5, sz, SOFA, -a + Math.PI / 2);
    const bx = x + Math.cos(a) * (r + 0.9);
    const bz = z + Math.sin(a) * (r + 0.9);
    b.box(len, 1.8, 0.5, bx, 0.92, bz, SOFA_DARK, -a + Math.PI / 2);
    if (i % 4 === 1) {
      b.box(0.8, 0.8, 0.28, x + Math.cos(a) * (r + 0.42), 1.28, z + Math.sin(a) * (r + 0.42), CUSHION, -a + Math.PI / 2);
    }
  }
  for (let i = 0; i < count; i++) {
    const a = from + ((to - from) * (i + 0.5)) / count;
    const sx = x + Math.cos(a) * r;
    const sz = z + Math.sin(a) * r;
    lounge.push({ x: sx, z: sz, ry: Math.atan2(x - sx, z - sz), seated: true });
  }
}

function backWallBoard(screens: Screen[], b: GeoBuilder, texture: THREE.Texture, x: number, y: number, z: number, w: number, h: number, ry: number) {
  b.box(w + 0.4, h + 0.4, 0.25, x - Math.sin(ry) * 0.14, y, z - Math.cos(ry) * 0.14, "#231f1c", ry);
  screens.push({ texture, x, y, z, w, h, ry });
}

/* ---------- Content Studio, the flagship ---------- */

/** People and furniture read larger than the hall's real scale, as in the master render. */
export const STUDIO_CONTENT_SCALE = 1.35;

function studioInterior(): InteriorLayout {
  const b = new GeoBuilder();
  const lit = new GeoBuilder();
  const screens: Screen[] = [];
  const edit = (i: number) => editorTexture(i);
  const photo = (i: number) => travelTexture(i);

  // Room coordinates here are the hall divided by STUDIO_CONTENT_SCALE: x +/-31, z +/-17.8.
  // Back wall: warm timber, with curtains on the right.
  b.box(52, 10.4, 0.5, -1, 5.2, -18.2, "#a98a68");
  for (let i = -20; i < 27; i += 1.15) {
    b.box(0.42, 10.4, 0.16, i, 5.2, -17.9, Math.round(i / 1.15) % 2 ? "#987a56" : "#86694a");
  }
  for (let i = 0; i < 9; i++) b.box(0.42, 10.2, 0.3, 21.4 + i * 0.42, 5.1, -17.6, i % 2 ? "#5f4938" : "#7a5e44");
  // Warm rugs.
  b.cyl(7.8, 7.8, 0.05, 0, 0.04, -1.2, "#cdb896", 44);
  b.cyl(5.4, 5.4, 0.06, 20, 0.04, 9.5, "#bda67f", 36);

  // The large display: "CONTENT STUDIO · Create · Edit · Enhance · Deliver".
  backWallBoard(screens, b, studioSignTexture(), -8.5, 6.65, -17.45, 22.5, 6.6, 0);
  // Angled left wall: a big travel screen.
  backWallBoard(screens, b, travelTexture(0), -25.3, 5.6, -11, 12, 6.2, 0.884);
  // Photo wall: a grid of travel images, back right.
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      backWallBoard(screens, b, photo(r * 3 + c + 1), 7.6 + c * 4.55, 4.4 + r * 2.3, -17.45, 4.2, 2.05, 0);
    }
  }
  // Gold ring pendant over the stand-up alcove, held by slender rods.
  lit.torus(2.9, 0.16, 5, 5.8, -9.4, "#ffc56b");
  lit.torus(2, 0.08, 5, 6.3, -9.4, "#ffd893");
  b.cyl(0.05, 0.05, 5.8, 2.1, 2.9, -9.4, "#b08a5e", 6);
  b.cyl(0.05, 0.05, 5.8, 7.9, 2.9, -9.4, "#b08a5e", 6);

  // Twelve desks, indexed by each agent's homeDesk in the registry.
  const desks: Slot[] = [
    /* 0 creative director */ { x: 1, z: 3.5, ry: 0 },
    /* 1 media librarian */ { x: -27, z: 1.2, ry: -Math.PI / 2 },
    /* 2 video editor: the hero triple-screen desk */ { x: -11, z: 12.8, ry: Math.PI },
    /* 3 photo specialist */ { x: -24.5, z: 9.2, ry: Math.PI * 0.86 },
    /* 4 designer */ { x: 8.4, z: 12.8, ry: Math.PI },
    /* 5 copywriter */ { x: -17.5, z: -2.2, ry: Math.PI },
    /* 6 facebook */ { x: -13.5, z: -10.2, ry: Math.PI },
    /* 7 instagram */ { x: -5, z: -10.2, ry: Math.PI },
    /* 8 tiktok */ { x: 13, z: -9.6, ry: Math.PI },
    /* 9 youtube presenter, at the ring light */ { x: 20.3, z: -2.8, ry: 0.55, present: true },
    /* 10 creative QA */ { x: 26.4, z: -5.4, ry: Math.PI / 2 },
    /* 11 publishing coordinator */ { x: 25.8, z: 2.2, ry: Math.PI / 2 },
  ];
  const seeds = [0, 3, 8, 1, 6, 2, 4, 9, 7, 0, 5, 10];
  desks.forEach((slot, i) => {
    if (slot.present || i === 0) return;
    const monitors = i === 2 || i === 4 ? 3 : i === 3 || i === 6 ? 2 : 2;
    desk(b, screens, slot, monitors, seeds[i] ?? i, i % 3 === 1 ? photo : edit, monitors === 3 ? 7.4 : 5.4);
  });
  // The creative director reviews at a low island desk in front of the lounge.
  b.box(5, 0.18, 1.8, 1, 1.42, 5.1, "#caa679");
  b.box(4.8, 1.3, 1.4, 1, 0.7, 5.1, "#8d6a44");
  chair(b, 1, 3.5, 0);
  b.box(1.1, 0.06, 0.8, 0.4, 1.54, 5.1, "#55504b");

  // Vertical-video corner: backdrop, ring light, camera on a tripod.
  b.box(8.2, 6.6, 0.3, 19.6, 3.3, -7, "#f1ebe2");
  b.box(0.3, 6.6, 3.6, 15.6, 3.3, -5.2, "#e8dccb");
  const rl = { x: 18.2, z: 1.5 };
  lit.torus(1.2, 0.12, rl.x, 3.75, rl.z, "#fff3dc", 0, 0.55);
  b.cyl(0.05, 0.07, 2.9, rl.x, 1.45, rl.z, "#1c1c1c", 6);
  const tripod = (x: number, z: number) => {
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      b.add(new THREE.CylinderGeometry(0.04, 0.04, 1.3), "#1c1c1c", [x + Math.cos(a) * 0.35, 0.55, z + Math.sin(a) * 0.35], [Math.sin(a) * 0.55, 0, -Math.cos(a) * 0.55]);
    }
  };
  tripod(rl.x, rl.z);
  const cam = { x: 22.3, z: 2.7 };
  b.box(0.85, 0.6, 1.1, cam.x, 3, cam.z, "#17171a", 0.5);
  b.cyl(0.25, 0.28, 0.65, cam.x - 0.25, 3.05, cam.z - 0.75, "#242428", 12);
  b.cyl(0.05, 0.05, 2.6, cam.x, 1.4, cam.z, "#1c1c1c", 6);
  tripod(cam.x, cam.z);

  // Central lounge: circular sofa and the glowing M table.
  const lounge: Slot[] = [];
  circleSofa(b, 0, -1.2, 5.2, Math.PI * 0.92, Math.PI * 2.08, lounge, 5);
  b.cyl(1.9, 2, 0.8, 0, 0.48, -1.2, "#5b4532", 32);
  lit.cyl(1.65, 1.65, 0.05, 0, 0.91, -1.2, "#ffcf87", 32);

  // Production review table, front right.
  const meeting: Slot[] = [];
  roundTable(b, 20, 9.5, 3, 6, meeting);
  // Stand-up review alcove, back centre.
  b.cyl(1.15, 1.15, 0.12, 5, 2.2, -9.4, TABLE, 20);
  b.cyl(0.1, 0.16, 2.2, 5, 1.1, -9.4, "#8b6e52", 8);
  meeting.push(
    { x: 3.4, z: -8.1, ry: 2.3, standing: true },
    { x: 6.7, z: -8.2, ry: -2.1, standing: true },
    { x: 5.4, z: -11.2, ry: -0.2, standing: true },
  );

  // Plants throughout.
  for (const [x, z, s] of [
    [-29.5, 4.8, 1.5], [-17.5, 14.8, 1.5], [-1.4, 13, 1.7], [15.2, 14.5, 1.3], [28.5, -0.8, 1.2],
    [-8.4, 3, 1.1], [8.5, 3.6, 1.2], [-20.5, -13.5, 1.2], [2, -14.8, 1.1], [25.5, -11, 1.3], [-29, -4, 1.1],
  ] as const) {
    plant(b, x, z, s);
  }
  // Low media shelves along the left.
  for (let i = 0; i < 2; i++) {
    b.box(3.6, 1.8, 0.9, -28 + i * 2.6, 0.9, 10 + i * 2.9, "#ae8a5e", -0.8);
    b.box(3.3, 0.1, 0.8, -28 + i * 2.6, 1.15, 10 + i * 2.9, "#7c5e3c", -0.8);
  }

  return {
    solid: b.build(),
    lit: lit.build(),
    screens,
    desks,
    meeting,
    lounge,
    hubs: [{ x: -13, z: 6.5 }, { x: 11, z: 6.5 }, { x: -9, z: -6 }, { x: 8.5, z: -5.6 }],
    floor: { kind: "polygon", points: [] },
    mTable: { x: 0, z: -1.2 },
    light: { x: 0, y: 12, z: 0, distance: 80 },
    contentScale: STUDIO_CONTENT_SCALE,
  };
}

/* ---------- Round buildings ---------- */

interface RoundSpec {
  title: string;
  sub: string;
  desks: number;
  monitors: number;
  deskTexture: (i: number) => THREE.Texture;
  wall: { texture: () => THREE.Texture; w: number; h: number }[];
}

const INTERIOR_SPECS: Record<Exclude<InteriorKind, "studio">, RoundSpec> = {
  command: {
    title: "Command",
    sub: "Coordination · Visibility · Control",
    desks: 6,
    monitors: 3,
    deskTexture: (i) => chartTexture(i),
    wall: [
      { texture: () => listBoardTexture("workflows", "Open workflows", ["Trip uploads", "Research briefs", "Production queue", "Approvals", "Publishing"], "#d4a853"), w: 11, h: 6.4 },
      { texture: () => chartTexture(1), w: 11, h: 6.2 },
      { texture: () => mapTexture(), w: 12, h: 6.2 },
      { texture: () => chartTexture(2), w: 11, h: 6.2 },
    ],
  },
  research: {
    title: "Research Centre",
    sub: "Destinations & Trends",
    desks: 5,
    monitors: 2,
    deskTexture: (i) => (i % 2 ? mapTexture() : travelTexture(i)),
    wall: [
      { texture: () => mapTexture(), w: 12, h: 6 },
      { texture: () => listBoardTexture("sources", "Verified sources", ["Tourism boards", "Official advisories", "Season calendars", "Local events"], "#3fd0c9"), w: 8, h: 5 },
      { texture: () => mapTexture(), w: 10, h: 5 },
    ],
  },
  partnerships: {
    title: "Partnerships",
    sub: "Brands & Experiences",
    desks: 4,
    monitors: 1,
    deskTexture: (i) => chartTexture(i),
    wall: [
      { texture: () => listBoardTexture("deals", "Deal board", ["Boutique hotels", "Airbnb hosts", "Tourism boards", "Affiliate offers"], "#d4a853"), w: 12, h: 6.4 },
      { texture: () => travelTexture(2), w: 8, h: 4.6 },
    ],
  },
  story: {
    title: "Story Lab",
    sub: "Copy, Campaigns & Storytelling",
    desks: 5,
    monitors: 1,
    deskTexture: (i) => travelTexture(i + 3),
    wall: [
      { texture: () => storyboardTexture(), w: 14, h: 5.6 },
      { texture: () => storyboardTexture(), w: 11, h: 4.6 },
    ],
  },
  publishing: {
    title: "Publishing",
    sub: "Scheduling & Distribution",
    desks: 6,
    monitors: 2,
    deskTexture: (i) => (i % 2 ? calendarTexture() : chartTexture(i)),
    wall: [
      { texture: () => calendarTexture(), w: 18, h: 7 },
      { texture: () => calendarTexture(), w: 13, h: 6 },
    ],
  },
  strategy: {
    title: "Strategy & Growth",
    sub: "Audience & Revenue",
    desks: 5,
    monitors: 3,
    deskTexture: (i) => chartTexture(i),
    wall: [
      { texture: () => chartTexture(0), w: 10, h: 5.6 },
      { texture: () => chartTexture(1), w: 10, h: 5.6 },
      { texture: () => chartTexture(2), w: 10, h: 5.6 },
    ],
  },
  support: {
    title: "Client Success",
    sub: "Support & Experience",
    desks: 6,
    monitors: 1,
    deskTexture: (i) => chartTexture(i + 1),
    wall: [{ texture: () => listBoardTexture("tickets", "Member care", ["Onboarding", "Open requests", "Satisfaction", "Escalations"], "#3fd0c9"), w: 12, h: 6 }],
  },
  marketplace: {
    title: "Marketplace",
    sub: "Showroom & Commerce",
    desks: 4,
    monitors: 2,
    deskTexture: (i) => travelTexture(i + 1),
    wall: [
      { texture: () => travelTexture(5), w: 7, h: 4.2 },
      { texture: () => travelTexture(1), w: 7, h: 4.2 },
      { texture: () => travelTexture(2), w: 7, h: 4.2 },
    ],
  },
  trip: {
    title: "Trip Planning",
    sub: "Itineraries & Traveller Care",
    desks: 4,
    monitors: 2,
    deskTexture: (i) => (i % 2 ? mapTexture() : travelTexture(i)),
    wall: [
      { texture: () => listBoardTexture("itinerary", "Itinerary", ["Day 1  Arrive, sunset walk", "Day 2  Island boat day", "Day 3  Markets, cooking", "Day 4  Free morning"], "#d4a853"), w: 12, h: 6 },
      { texture: () => mapTexture(), w: 9, h: 5 },
    ],
  },
  web: {
    title: "Website & SEO",
    sub: "Site, Search & Analytics",
    desks: 4,
    monitors: 2,
    deskTexture: (i) => chartTexture(i),
    wall: [
      { texture: () => listBoardTexture("site-pages", "monetura.com", ["Home", "Our story", "Membership", "Waitlist", "Blog"], "#d4a853"), w: 11, h: 6.2 },
      { texture: () => chartTexture(2), w: 10, h: 5.6 },
    ],
  },
  visual: {
    title: "Visual Studio",
    sub: "Cinematic Images & Reels",
    desks: 4,
    monitors: 2,
    deskTexture: (i) => travelTexture(i + 2),
    wall: [
      { texture: () => storyboardTexture(), w: 13, h: 5.6 },
      { texture: () => travelTexture(4), w: 9, h: 5 },
    ],
  },
  office: {
    title: "Internal",
    sub: "Headquarters Operations",
    desks: 3,
    monitors: 2,
    deskTexture: (i) => chartTexture(i),
    wall: [{ texture: () => chartTexture(3), w: 5.5, h: 3.2 }],
  },
};

function roundRoom(
  b: GeoBuilder,
  lit: GeoBuilder,
  screens: Screen[],
  spec: RoundSpec,
  kind: InteriorKind,
  cx: number,
  cz: number,
  R: number,
  desks: Slot[],
  meeting: Slot[],
  lounge: Slot[],
  deskCount: number,
  wallY: number,
) {
  // Wall boards on the back half of the ring.
  const boards = spec.wall;
  boards.forEach((w, i) => {
    const a = -Math.PI / 2 + (i - (boards.length - 1) / 2) * (Math.min(1.5, (w.w + 1) / (R - 1)));
    const px = cx + Math.cos(a) * (R - 1.6);
    const pz = cz + Math.sin(a) * (R - 1.6);
    const ry = Math.atan2(cx - px, cz - pz);
    backWallBoard(screens, b, w.texture(), px, wallY, pz, w.w, w.h, ry);
  });

  const placeTable = kind !== "marketplace";
  const tableR = Math.min(4.6, R * 0.22);
  const tableZ = cz + (R > 12 ? -R * 0.08 : 0);

  // Desks ring around the front two thirds, facing the glass.
  const startA = -Math.PI * 0.15;
  const spanA = Math.PI * 1.3;
  for (let i = 0; i < deskCount; i++) {
    const t = deskCount === 1 ? 0.5 : i / (deskCount - 1);
    const a = startA + t * spanA;
    const dr = R - 5.2;
    const sx = cx + Math.cos(a) * dr;
    const sz = cz + Math.sin(a) * dr;
    const slot: Slot = { x: sx, z: sz, ry: Math.atan2(Math.cos(a), Math.sin(a)) };
    const seed = i * 2 + (kind.charCodeAt(0) % 5);
    desk(b, screens, slot, spec.monitors, seed, spec.deskTexture, spec.monitors === 3 ? 6.4 : 4.6);
    desks.push(slot);
  }

  if (kind === "marketplace") {
    // A showroom: product plinths with lit displays.
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + 0.3;
      const px = cx + Math.cos(a) * 4.4;
      const pz = cz + Math.sin(a) * 4.4;
      b.cyl(1, 1.1, 1.3, px, 0.65, pz, "#efe6d6", 16);
      b.sphere(0.55, px, 1.8, pz, ["#c17a4a", "#d4a853", "#3fa7d6", "#59c19a"][i % 4] as string, 1, 1.1, 1);
      lit.torus(1, 0.04, px, 1.32, pz, "#ffd28d");
    }
    meeting.push({ x: cx, z: cz + 8, ry: Math.PI, standing: true }, { x: cx - 2, z: cz + 8.6, ry: Math.PI, standing: true });
  } else if (kind === "trip") {
    // A big globe on a plinth.
    b.cyl(1.4, 1.7, 1.2, cx, 0.6, cz, "#8b6e52", 18);
    b.torus(2.45, 0.08, cx, 3.4, cz, "#d4a853", 1.2, 0.3);
    b.sphere(2.2, cx, 3.4, cz, "#2f7fa8", 1, 1, 1, 22);
    for (let i = 0; i < 14; i++) {
      const u = i * 2.1;
      const v = 0.7 + (i % 5) * 0.4;
      b.sphere(0.6, cx + Math.cos(u) * Math.sin(v) * 1.9, 3.4 + Math.cos(v) * 1.9, cz + Math.sin(u) * Math.sin(v) * 1.9, "#5f9a58", 1, 0.5, 1, 7);
    }
    const n = 4;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + 0.6;
      const sx = cx + Math.cos(a) * 4.6;
      const sz = cz + Math.sin(a) * 4.6;
      meeting.push({ x: sx, z: sz, ry: Math.atan2(cx - sx, cz - sz), standing: true });
    }
  } else if (placeTable) {
    if (kind === "command") {
      // The command table: a glowing ring and a holo-map.
      b.cyl(5.4, 5.6, 1.3, cx, 0.65, tableZ, "#3a2f28", 40);
      lit.cyl(5, 5, 0.06, cx, 1.34, tableZ, "#3fd0c9", 40);
      lit.torus(5.45, 0.08, cx, 1.35, tableZ, "#ffcf87");
      b.cyl(4.2, 4.2, 0.05, cx, 1.38, tableZ, "#10394b", 40);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const sx = cx + Math.cos(a) * 7;
        const sz = tableZ + Math.sin(a) * 7;
        const ry = Math.atan2(cx - sx, tableZ - sz);
        chair(b, sx, sz, ry, "#6b5138");
        meeting.push({ x: sx, z: sz, ry, seated: true });
      }
    } else {
      roundTable(b, cx, tableZ, tableR, Math.max(3, Math.min(6, Math.round(tableR * 1.4))), meeting, TABLE, kind === "story" ? "#c17a4a" : "#7c8f52");
    }
  }

  // Lounge corner and planting.
  const lx = cx + Math.cos(-Math.PI * 0.68) * (R - 5);
  const lz = cz + Math.sin(-Math.PI * 0.68) * (R - 5);
  if (R >= 12) {
    circleSofa(b, lx * 0.82 + cx * 0.18, lz * 0.5 + cz * 0.5 + 1, 2.5, 2.4, 5.2, lounge, 3);
  } else {
    b.box(4, 0.9, 1.5, cx - R * 0.5, 0.5, cz - R * 0.45, SOFA, 0.6);
    lounge.push({ x: cx - R * 0.5, z: cz - R * 0.45, ry: 0.6, seated: true });
  }
  const plants = Math.max(3, Math.round(R * 0.45));
  for (let i = 0; i < plants; i++) {
    const a = (i / plants) * Math.PI * 2 + 0.55;
    plant(b, cx + Math.cos(a) * (R - 1.3), cz + Math.sin(a) * (R - 1.3), R > 12 ? 1 : 0.7);
  }
}

export function buildInterior(footprint: FootprintType, kind: InteriorKind): InteriorLayout {
  if (kind === "studio" || footprint === "angular") return studioInterior();

  const spec = INTERIOR_SPECS[kind];
  const b = new GeoBuilder();
  const lit = new GeoBuilder();
  const screens: Screen[] = [];
  const desks: Slot[] = [];
  const meeting: Slot[] = [];
  const lounge: Slot[] = [];

  const room = (cx: number, cz: number, R: number, deskCount: number, roomSpec = spec, roomKind: InteriorKind = kind) =>
    roundRoom(b, lit, screens, roomSpec, roomKind, cx, cz, R, desks, meeting, lounge, deskCount, 4);

  let circles: { x: number; z: number; r: number }[];
  let hubs: { x: number; z: number }[];
  let light = { x: 0, y: 14, z: 0, distance: 56 };
  switch (footprint) {
    case "twin": {
      circles = [{ x: -15, z: 0, r: 14 }, { x: 15, z: 0, r: 14 }];
      const half = Math.ceil(spec.desks / 2);
      room(-15, 0, 14, half);
      room(15, 0, 14, spec.desks - half, { ...spec, wall: spec.wall.slice().reverse() });
      hubs = [{ x: -15, z: 4 }, { x: 0, z: 0 }, { x: 15, z: 4 }];
      light = { x: 0, y: 14, z: 0, distance: 70 };
      break;
    }
    case "district": {
      circles = [{ x: 0, z: -3, r: 15 }, { x: -21, z: 8, r: 7 }, { x: 21, z: 8, r: 7 }];
      room(0, -3, 15, spec.desks);
      plant(b, -21, 8, 1);
      plant(b, 21, 8, 1);
      for (const [x, z] of [[-21, 8], [21, 8]] as const) {
        b.cyl(1.6, 1.8, 1.2, x + 3, 0.6, z, "#efe6d6", 14);
        lit.torus(1.6, 0.05, x + 3, 1.22, z, "#ffd28d");
      }
      hubs = [{ x: 0, z: 2 }];
      light = { x: 0, y: 14, z: 0, distance: 60 };
      break;
    }
    case "small":
      circles = [{ x: 0, z: 0, r: 9 }];
      room(0, 0, 9, spec.desks);
      hubs = [{ x: 0, z: 0 }];
      light = { x: 0, y: 11, z: 0, distance: 34 };
      break;
    case "tiered":
      circles = [{ x: 0, z: 0, r: 24 }];
      room(0, 0, 24, spec.desks);
      hubs = [{ x: 0, z: 10 }, { x: -11, z: 0 }, { x: 11, z: 0 }];
      light = { x: 0, y: 16, z: 0, distance: 70 };
      break;
    default:
      circles = [{ x: 0, z: 0, r: 16 }];
      room(0, 0, 16, spec.desks);
      hubs = [{ x: 0, z: 6 }];
      break;
  }

  // Warm rug under each room.
  for (const c of circles) b.cyl(c.r * 0.6, c.r * 0.6, 0.04, c.x, 0.04, c.z, RUG, 30);

  return {
    solid: b.build(),
    lit: lit.build(),
    screens,
    desks,
    meeting,
    lounge,
    hubs,
    floor: { kind: "circles", circles },
    mTable: null,
    light,
    contentScale: 1,
  };
}

export { titleBoard };
