/**
 * GeoBuilder: collects coloured primitives and merges them into one vertex-coloured
 * geometry. A whole building or furnished room becomes one or two draw calls, which
 * is what keeps a campus of pavilions cheap to render.
 */
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

const tmpMatrix = new THREE.Matrix4();
const tmpQuat = new THREE.Quaternion();
const tmpEuler = new THREE.Euler();
const tmpPos = new THREE.Vector3();
const tmpScale = new THREE.Vector3();
const tmpColor = new THREE.Color();

export class GeoBuilder {
  private parts: THREE.BufferGeometry[] = [];

  add(
    source: THREE.BufferGeometry,
    color: string,
    pos: readonly [number, number, number] = [0, 0, 0],
    rot: readonly [number, number, number] = [0, 0, 0],
    scale: readonly [number, number, number] = [1, 1, 1],
  ): this {
    const geo = source.index ? source.toNonIndexed() : source.clone();
    geo.deleteAttribute("uv");
    tmpEuler.set(rot[0], rot[1], rot[2]);
    tmpQuat.setFromEuler(tmpEuler);
    tmpMatrix.compose(tmpPos.set(pos[0], pos[1], pos[2]), tmpQuat, tmpScale.set(scale[0], scale[1], scale[2]));
    geo.applyMatrix4(tmpMatrix);
    tmpColor.set(color);
    const n = (geo.getAttribute("position") as THREE.BufferAttribute).count;
    const colors = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      colors[i * 3] = tmpColor.r;
      colors[i * 3 + 1] = tmpColor.g;
      colors[i * 3 + 2] = tmpColor.b;
    }
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    this.parts.push(geo);
    return this;
  }

  box(w: number, h: number, d: number, x: number, y: number, z: number, color: string, ry = 0): this {
    return this.add(new THREE.BoxGeometry(w, h, d), color, [x, y, z], [0, ry, 0]);
  }

  /** A box between two points on the ground plane: walls, beams, mullions. */
  beam(ax: number, az: number, bx: number, bz: number, y: number, h: number, thick: number, color: string): this {
    const len = Math.hypot(bx - ax, bz - az);
    const ang = Math.atan2(-(bz - az), bx - ax);
    return this.add(new THREE.BoxGeometry(len, h, thick), color, [(ax + bx) / 2, y, (az + bz) / 2], [0, ang, 0]);
  }

  cyl(rTop: number, rBot: number, h: number, x: number, y: number, z: number, color: string, seg = 24, open = false): this {
    return this.add(new THREE.CylinderGeometry(rTop, rBot, h, seg, 1, open), color, [x, y, z]);
  }

  sphere(r: number, x: number, y: number, z: number, color: string, sx = 1, sy = 1, sz = 1, seg = 12): this {
    return this.add(new THREE.SphereGeometry(r, seg, Math.max(6, seg - 3)), color, [x, y, z], [0, 0, 0], [sx, sy, sz]);
  }

  torus(r: number, t: number, x: number, y: number, z: number, color: string, rx = Math.PI / 2, ry = 0, seg = 40): this {
    return this.add(new THREE.TorusGeometry(r, t, 8, seg), color, [x, y, z], [rx, ry, 0]);
  }

  /** Round slab with soft edges: the signature of the architecture kit. */
  slab(rOuter: number, h: number, x: number, y: number, z: number, color: string, seg = 48, rInner = 0): this {
    const e = Math.min(h * 0.45, 0.55);
    const profile = [
      new THREE.Vector2(rInner, 0),
      new THREE.Vector2(rOuter - e, 0),
      new THREE.Vector2(rOuter - e * 0.3, e * 0.3),
      new THREE.Vector2(rOuter, e),
      new THREE.Vector2(rOuter, h - e),
      new THREE.Vector2(rOuter - e * 0.3, h - e * 0.3),
      new THREE.Vector2(rOuter - e, h),
      new THREE.Vector2(rInner, h),
    ];
    return this.add(new THREE.LatheGeometry(profile, seg), color, [x, y, z]);
  }

  /** Extruded polygon on the ground plane; points are [x, z]. */
  polygon(points: readonly (readonly [number, number])[], h: number, y: number, color: string, bevel = 0): this {
    const shape = new THREE.Shape(points.map(([px, pz]) => new THREE.Vector2(px, -pz)));
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: Math.max(0.01, h - bevel * 2),
      bevelEnabled: bevel > 0,
      bevelSize: bevel,
      bevelThickness: bevel,
      bevelSegments: 2,
      steps: 1,
    });
    return this.add(geo, color, [0, y + bevel, 0], [-Math.PI / 2, 0, 0]);
  }

  get empty(): boolean {
    return this.parts.length === 0;
  }

  build(): THREE.BufferGeometry {
    if (this.parts.length === 0) return new THREE.BufferGeometry();
    const merged = mergeGeometries(this.parts, false);
    for (const p of this.parts) p.dispose();
    this.parts = [];
    return merged ?? new THREE.BufferGeometry();
  }
}

/** Outward-facing plain glass ring with no colour attribute baggage. */
export function glassRing(r: number, h: number, y: number, x = 0, z = 0): THREE.BufferGeometry {
  const geo = new THREE.CylinderGeometry(r, r, h, 48, 1, true);
  geo.translate(x, y, z);
  return geo;
}

export function mergeOrEmpty(list: THREE.BufferGeometry[]): THREE.BufferGeometry {
  if (list.length === 0) return new THREE.BufferGeometry();
  const merged = mergeGeometries(list.map((g) => (g.index ? g.toNonIndexed() : g)), false);
  return merged ?? new THREE.BufferGeometry();
}
