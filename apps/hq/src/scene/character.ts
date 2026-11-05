/**
 * Stylized semi-realistic figures, built in code with a small joint hierarchy and
 * posed procedurally. No CC0 rig matched the master render's look, so this keeps
 * full control of skin tones, hair, outfits and poses from registry config.
 * Figures face +z. Standing height is about 3.5 world units.
 */
import * as THREE from "three";
import type { CharacterAppearance } from "../types";
import { printTexture } from "./textures";

export type Pose = "stand" | "walk" | "type" | "sit" | "sitTalk" | "talk" | "present" | "blocked" | "lounge";

export interface Rig {
  root: THREE.Group;
  hips: THREE.Group;
  torso: THREE.Group;
  head: THREE.Group;
  armL: THREE.Group;
  armR: THREE.Group;
  foreL: THREE.Group;
  foreR: THREE.Group;
  legL: THREE.Group;
  legR: THREE.Group;
  shinL: THREE.Group;
  shinR: THREE.Group;
  /** Face details, hidden when far away. */
  detail: THREE.Group;
}

const geos = {
  head: new THREE.SphereGeometry(0.31, 18, 14),
  jaw: new THREE.SphereGeometry(0.24, 12, 10),
  neck: new THREE.CylinderGeometry(0.1, 0.12, 0.24, 10),
  torso: new THREE.LatheGeometry(
    [
      [0.0, -0.04], [0.33, -0.02], [0.36, 0.14], [0.32, 0.4], [0.35, 0.68], [0.44, 0.92], [0.42, 1.02], [0.26, 1.13], [0.0, 1.17],
    ].map(([x, y]) => new THREE.Vector2(x, y)),
    18,
  ),
  torsoF: new THREE.LatheGeometry(
    [
      [0.0, -0.04], [0.36, -0.02], [0.38, 0.14], [0.27, 0.42], [0.33, 0.72], [0.37, 0.92], [0.34, 1.02], [0.2, 1.12], [0.0, 1.15],
    ].map(([x, y]) => new THREE.Vector2(x, y)),
    18,
  ),
  upperArm: new THREE.CapsuleGeometry(0.1, 0.42, 4, 10),
  foreArm: new THREE.CapsuleGeometry(0.08, 0.4, 4, 10),
  hand: new THREE.SphereGeometry(0.095, 10, 8),
  thigh: new THREE.CapsuleGeometry(0.15, 0.56, 4, 10),
  shin: new THREE.CapsuleGeometry(0.11, 0.56, 4, 10),
  shoe: new THREE.SphereGeometry(0.14, 10, 8),
  hairCap: new THREE.SphereGeometry(0.335, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.56),
  hairLong: new THREE.CylinderGeometry(0.31, 0.25, 0.86, 16, 1, true, Math.PI * 0.62, Math.PI * 1.76),
  bun: new THREE.SphereGeometry(0.15, 10, 8),
  curl: new THREE.SphereGeometry(0.13, 8, 6),
  eye: new THREE.SphereGeometry(0.036, 8, 6),
  brow: new THREE.BoxGeometry(0.11, 0.022, 0.02),
  nose: new THREE.SphereGeometry(0.035, 6, 5),
  mouth: new THREE.BoxGeometry(0.1, 0.018, 0.02),
  ear: new THREE.SphereGeometry(0.05, 6, 5),
  band: new THREE.TorusGeometry(0.33, 0.024, 6, 18, Math.PI),
  cup: new THREE.CylinderGeometry(0.1, 0.1, 0.07, 12),
  collar: new THREE.TorusGeometry(0.15, 0.04, 6, 14),
};

const materials = new Map<string, THREE.MeshStandardMaterial>();
function mat(color: string, roughness = 0.72): THREE.MeshStandardMaterial {
  const key = `${color}-${roughness}`;
  let m = materials.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color, roughness });
    materials.set(key, m);
  }
  return m;
}
function fabric(look: CharacterAppearance): THREE.MeshStandardMaterial {
  if (!look.print) return mat(look.top, 0.85);
  const key = `print-${look.top}-${look.print}`;
  let m = materials.get(key);
  if (!m) {
    const t = printTexture(look.top, look.print);
    t.repeat.set(3, 3);
    m = new THREE.MeshStandardMaterial({ map: t, roughness: 0.85 });
    materials.set(key, m);
  }
  return m;
}

function mesh(g: THREE.BufferGeometry, m: THREE.Material, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1): THREE.Mesh {
  const out = new THREE.Mesh(g, m);
  out.position.set(x, y, z);
  out.scale.set(sx, sy, sz);
  out.raycast = () => undefined;
  return out;
}

function joint(parent: THREE.Object3D, x: number, y: number, z: number): THREE.Group {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  parent.add(g);
  return g;
}

export function createRig(look: CharacterAppearance): Rig {
  const skin = mat(look.skin, 0.62);
  const cloth = fabric(look);
  const pants = mat(look.bottom, 0.86);
  const shoe = mat(look.shoes, 0.6);
  const hair = mat(look.hair, 0.55);
  const f = Boolean(look.feminine);

  const root = new THREE.Group();
  const hips = joint(root, 0, 1.8, 0);

  const torso = joint(hips, 0, 0, 0);
  torso.add(mesh(f ? geos.torsoF : geos.torso, cloth, 0, 0, 0, 1, 1, 0.68));
  torso.add(mesh(geos.collar, cloth, 0, 1.13, 0, 1, 0.6, 1).rotateX(Math.PI / 2));
  torso.add(mesh(geos.neck, skin, 0, 1.22, 0));

  const head = joint(torso, 0, 1.34, 0.01);
  head.add(mesh(geos.head, skin, 0, 0.17, 0, 0.93, 1.06, 0.98));
  head.add(mesh(geos.jaw, skin, 0, 0.02, 0.03, 0.9, 0.9, 0.92));

  const detail = new THREE.Group();
  head.add(detail);
  const eyeDark = mat("#1a120c", 0.3);
  const eyeWhite = mat("#f8f4ee", 0.4);
  for (const s of [-1, 1]) {
    detail.add(mesh(geos.eye, eyeWhite, s * 0.115, 0.17, 0.262, 1.25, 0.8, 0.5));
    detail.add(mesh(geos.eye, eyeDark, s * 0.115, 0.17, 0.277, 0.72, 0.72, 0.4));
    detail.add(mesh(geos.brow, hair, s * 0.115, 0.235, 0.27));
    detail.add(mesh(geos.ear, skin, s * 0.29, 0.14, 0, 0.6, 1, 0.8));
  }
  detail.add(mesh(geos.nose, skin, 0, 0.11, 0.3, 0.9, 1.1, 1));
  detail.add(mesh(geos.mouth, mat(f ? "#a4453d" : "#7b4a3b", 0.5), 0, 0.0, 0.272));

  // Hair.
  const cap = mesh(geos.hairCap, hair, 0, 0.19, -0.015, 0.98, 1, 1);
  cap.rotation.x = -0.22;
  switch (look.hairStyle) {
    case "bald":
      break;
    case "short":
      head.add(cap);
      break;
    case "bun":
      head.add(cap);
      head.add(mesh(geos.bun, hair, 0, 0.5, -0.17));
      break;
    case "ponytail":
      head.add(cap);
      head.add(mesh(geos.bun, hair, 0, 0.26, -0.33, 0.8, 0.8, 1));
      head.add(mesh(geos.curl, hair, 0, 0, -0.36, 0.75, 1.9, 0.75));
      break;
    case "long":
      head.add(cap);
      head.add(mesh(geos.hairLong, hair, 0, -0.14, -0.015, 1, 1, 0.98));
      break;
    case "curly": {
      head.add(cap);
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        const y = 0.27 - (i % 3) * 0.13;
        if (Math.sin(a) > 0.55 && y < 0.2) continue;
        head.add(mesh(geos.curl, hair, Math.cos(a) * 0.3, y, Math.sin(a) * 0.3 - 0.03));
      }
      if (f) for (let i = 0; i < 9; i++) head.add(mesh(geos.curl, hair, (i - 4) * 0.08, -0.14 - (i % 2) * 0.1, -0.24));
      break;
    }
  }
  if (look.headphones) {
    const phones = mat("#1b1b1d", 0.4);
    const band = mesh(geos.band, phones, 0, 0.17, 0);
    head.add(band);
    for (const s of [-1, 1]) {
      const c = mesh(geos.cup, phones, s * 0.33, 0.17, 0);
      c.rotation.z = Math.PI / 2;
      head.add(c);
    }
  }

  // Arms: pivots at the shoulders and elbows.
  const shoulder = f ? 0.39 : 0.48;
  const armL = joint(torso, -shoulder, 0.98, 0);
  const armR = joint(torso, shoulder, 0.98, 0);
  const foreL = joint(armL, 0, -0.6, 0);
  const foreR = joint(armR, 0, -0.6, 0);
  for (const [arm, fore] of [[armL, foreL], [armR, foreR]] as const) {
    arm.add(mesh(geos.upperArm, cloth, 0, -0.29, 0));
    fore.add(mesh(geos.foreArm, f || look.print ? skin : cloth, 0, -0.27, 0));
    fore.add(mesh(geos.hand, skin, 0, -0.58, 0, 0.9, 1.2, 0.8));
  }

  // Legs: pivots at the hips and knees.
  const legL = joint(hips, -0.18, 0, 0);
  const legR = joint(hips, 0.18, 0, 0);
  const shinL = joint(legL, 0, -0.84, 0);
  const shinR = joint(legR, 0, -0.84, 0);
  for (const [leg, shin] of [[legL, shinL], [legR, shinR]] as const) {
    leg.add(mesh(geos.thigh, pants, 0, -0.41, 0));
    shin.add(mesh(geos.shin, pants, 0, -0.4, 0));
    shin.add(mesh(geos.shoe, shoe, 0, -0.84, 0.07, 0.95, 0.68, 1.75));
  }

  return { root, hips, torso, head, armL, armR, foreL, foreR, legL, legR, shinL, shinR, detail };
}

/** Target joint angles, blended toward each frame so pose changes are never abrupt. */
export interface PoseTarget {
  hipsY: number;
  torsoX: number;
  headX: number;
  headY: number;
  armLX: number; armLZ: number; foreLX: number;
  armRX: number; armRZ: number; foreRX: number;
  legLX: number; shinLX: number;
  legRX: number; shinRX: number;
}

export function poseTarget(pose: Pose, t: number, phase: number, out: PoseTarget): void {
  const breath = Math.sin(t * 1.4 + phase) * 0.012;
  out.hipsY = 1.8 + breath;
  out.torsoX = 0;
  out.headX = 0.02;
  out.headY = 0;
  out.armLX = 0; out.armLZ = -0.1; out.foreLX = -0.15;
  out.armRX = 0; out.armRZ = 0.1; out.foreRX = -0.15;
  out.legLX = 0; out.shinLX = 0; out.legRX = 0; out.shinRX = 0;

  const seat = (y: number) => {
    out.hipsY = y + breath * 0.4;
    out.legLX = -1.5; out.shinLX = 1.46; out.legRX = -1.5; out.shinRX = 1.46;
  };

  switch (pose) {
    case "walk": {
      const w = t * 6.2 + phase;
      out.legLX = Math.sin(w) * 0.56;
      out.legRX = -Math.sin(w) * 0.56;
      out.shinLX = Math.max(0, Math.sin(w - 1.2)) * 0.82;
      out.shinRX = Math.max(0, -Math.sin(w - 1.2)) * 0.82;
      out.armLX = -Math.sin(w) * 0.42;
      out.armRX = Math.sin(w) * 0.42;
      out.foreLX = -0.32;
      out.foreRX = -0.32;
      out.hipsY = 1.78 + Math.abs(Math.cos(w)) * 0.05;
      out.torsoX = 0.05;
      break;
    }
    case "type": {
      seat(1.12);
      out.torsoX = 0.06;
      const k = t * 13 + phase;
      out.armLX = -0.72; out.armLZ = -0.06;
      out.armRX = -0.72; out.armRZ = 0.06;
      out.foreLX = -0.86 + Math.sin(k) * 0.05;
      out.foreRX = -0.86 + Math.sin(k + 2.1) * 0.05;
      // Looks between the monitors and the keyboard.
      out.headX = 0.02 + Math.sin(t * 0.35 + phase) * 0.08;
      out.headY = Math.sin(t * 0.27 + phase * 2) * 0.28;
      break;
    }
    case "sit": {
      seat(1.12);
      out.armLX = -0.42; out.armRX = -0.42;
      out.foreLX = -0.72; out.foreRX = -0.72;
      out.headY = Math.sin(t * 0.3 + phase) * 0.3;
      break;
    }
    case "sitTalk": {
      seat(1.12);
      out.armLX = -0.5; out.foreLX = -0.8;
      const beat = Math.sin(t * 0.6 + phase);
      out.armRX = -0.72 - Math.max(0, beat) * 0.4;
      out.foreRX = -1.15 + Math.sin(t * 3 + phase) * 0.16 * Math.max(0, beat);
      out.headY = Math.sin(t * 0.5 + phase) * 0.4;
      out.headX = Math.sin(t * 2.2 + phase) * 0.03;
      out.torsoX = 0.04;
      break;
    }
    case "lounge": {
      seat(1.0);
      out.torsoX = -0.14;
      out.armLX = -0.3; out.foreLX = -0.5; out.armLZ = -0.2;
      out.armRX = -0.3; out.foreRX = -0.5; out.armRZ = 0.2;
      out.headY = Math.sin(t * 0.22 + phase) * 0.35;
      out.headX = -0.04;
      break;
    }
    case "talk": {
      const beat = Math.sin(t * 0.7 + phase);
      out.armRX = -0.7 - Math.max(0, beat) * 0.3;
      out.foreRX = -1.1 + Math.sin(t * 3.2 + phase) * 0.18;
      out.armLX = -0.12;
      out.foreLX = -0.5;
      out.headY = Math.sin(t * 0.45 + phase) * 0.4;
      out.headX = Math.sin(t * 2.4 + phase) * 0.025;
      break;
    }
    case "present": {
      const wave = Math.sin(t * 1.5 + phase);
      out.armLX = -1.05 + wave * 0.16;
      out.armLZ = -0.3;
      out.foreLX = -1.2 + Math.sin(t * 3 + phase) * 0.16;
      out.armRX = -0.85 - wave * 0.22;
      out.armRZ = 0.3;
      out.foreRX = -1.25;
      out.headY = Math.sin(t * 0.6 + phase) * 0.14;
      out.headX = Math.sin(t * 2.5 + phase) * 0.03;
      break;
    }
    case "blocked": {
      // Arms folded, waiting.
      out.armLX = -0.6; out.armLZ = 0.26; out.foreLX = -1.55;
      out.armRX = -0.6; out.armRZ = -0.26; out.foreRX = -1.55;
      out.headX = 0.12;
      out.headY = Math.sin(t * 0.25 + phase) * 0.15;
      break;
    }
    default: {
      out.headY = Math.sin(t * 0.4 + phase) * 0.3;
      out.armLX = Math.sin(t * 0.8 + phase) * 0.03;
      out.armRX = -Math.sin(t * 0.8 + phase) * 0.03;
    }
  }
}

export function emptyPose(): PoseTarget {
  return {
    hipsY: 1.8, torsoX: 0, headX: 0, headY: 0,
    armLX: 0, armLZ: 0, foreLX: 0, armRX: 0, armRZ: 0, foreRX: 0,
    legLX: 0, shinLX: 0, legRX: 0, shinRX: 0,
  };
}

export function applyPose(rig: Rig, p: PoseTarget, k: number): void {
  const l = THREE.MathUtils.lerp;
  rig.hips.position.y = l(rig.hips.position.y, p.hipsY, k);
  rig.torso.rotation.x = l(rig.torso.rotation.x, p.torsoX, k);
  rig.head.rotation.x = l(rig.head.rotation.x, p.headX, k);
  rig.head.rotation.y = l(rig.head.rotation.y, p.headY, k);
  rig.armL.rotation.x = l(rig.armL.rotation.x, p.armLX, k);
  rig.armL.rotation.z = l(rig.armL.rotation.z, p.armLZ, k);
  rig.foreL.rotation.x = l(rig.foreL.rotation.x, p.foreLX, k);
  rig.armR.rotation.x = l(rig.armR.rotation.x, p.armRX, k);
  rig.armR.rotation.z = l(rig.armR.rotation.z, p.armRZ, k);
  rig.foreR.rotation.x = l(rig.foreR.rotation.x, p.foreRX, k);
  rig.legL.rotation.x = l(rig.legL.rotation.x, p.legLX, k);
  rig.shinL.rotation.x = l(rig.shinL.rotation.x, p.shinLX, k);
  rig.legR.rotation.x = l(rig.legR.rotation.x, p.legRX, k);
  rig.shinR.rotation.x = l(rig.shinR.rotation.x, p.shinRX, k);
}
