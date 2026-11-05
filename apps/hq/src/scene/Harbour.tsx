"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { clock, useHQ, type Pulse } from "../store";
import { HELIPAD, MARINA, WATERFALLS, makeRandom, type World } from "../world/world";
import { GeoBuilder } from "./geo";
import { sharedUniforms } from "./shared";
import { helipadTexture, softGlowTexture } from "./textures";

const WOOD = "#9c6f46";
const WOOD_DARK = "#6f4c2e";

/** A white motor yacht, nose towards +x. */
function yachtGeometry(): THREE.BufferGeometry {
  const b = new GeoBuilder();
  const hull = new THREE.Shape();
  hull.moveTo(-6.4, -1.6);
  hull.lineTo(2.4, -1.75);
  hull.quadraticCurveTo(6, -1.3, 8.4, 0);
  hull.quadraticCurveTo(6, 1.3, 2.4, 1.75);
  hull.lineTo(-6.4, 1.6);
  hull.closePath();
  const hullGeo = new THREE.ExtrudeGeometry(hull, { depth: 1.5, bevelEnabled: true, bevelSize: 0.16, bevelThickness: 0.2, bevelSegments: 2 });
  b.add(hullGeo, "#fbf8f3", [0, -0.45, 0], [-Math.PI / 2, 0, 0]);
  b.add(hullGeo, "#2b3d4f", [0, -0.75, 0], [-Math.PI / 2, 0, 0], [1.002, 1.002, 0.2]);
  b.add(hullGeo, "#b98a58", [-0.35, 1.25, 0], [-Math.PI / 2, 0, 0], [0.9, 0.84, 0.05]);
  // Superstructure.
  b.box(6.8, 1.15, 2.4, -0.8, 1.95, 0, "#f7f3ec");
  b.box(4.4, 0.75, 2.5, -0.5, 2.05, 0, "#26343f");
  b.box(4.4, 0.9, 2, -1.2, 3, 0, "#f7f3ec");
  b.box(2.8, 0.5, 2.05, -0.8, 3.1, 0, "#26343f");
  b.box(4.8, 0.1, 2.3, -1.3, 3.5, 0, "#ece6da");
  b.cyl(0.06, 0.06, 1.2, -2, 4.1, 0, "#d9d6cf", 6);
  return b.build();
}

function dockGeometry(): THREE.BufferGeometry {
  const b = new GeoBuilder();
  for (const d of MARINA.docks) {
    const c = Math.cos(d.angle);
    const s = Math.sin(d.angle);
    const at = (t: number, off = 0): [number, number] => [d.x + c * t - s * off, d.z + s * t + c * off];
    const [mx, mz] = at(d.length / 2);
    b.box(d.length, 0.32, 4, mx, 1.15, mz, WOOD, -d.angle);
    const planks = Math.floor(d.length / 1.5);
    for (let i = 0; i <= planks; i++) {
      const [x, z] = at((i / planks) * d.length);
      b.box(0.12, 0.05, 4, x, 1.33, z, WOOD_DARK, -d.angle);
    }
    for (let i = 0; i <= 9; i++) {
      const t = (i / 9) * d.length;
      for (const off of [-1.9, 1.9]) {
        const [x, z] = at(t, off);
        b.cyl(0.17, 0.2, 4.6, x, -0.8, z, "#4a3524", 6);
      }
    }
    // Finger piers.
    for (let i = 1; i <= 3; i++) {
      const t = (i / 3.6) * d.length;
      for (const side of [-1, 1]) {
        const [x, z] = at(t, side * 8);
        b.box(2, 0.28, 12, x, 1.1, z, WOOD, -d.angle);
      }
    }
  }
  return b.build();
}

function beachKit(world: World): THREE.BufferGeometry {
  const b = new GeoBuilder();
  const spots: [number, number, number][] = [];
  for (let i = 0; i < 12; i++) spots.push([170 + i * 4.6, 66 - i * 3.4, 0.55]);
  for (let i = 0; i < 9; i++) spots.push([206 + i * 2, 14 - i * 5, 1.5]);
  for (const [x, z, a] of spots) {
    const y = world.sample(x, z);
    if (y < 0.5) continue;
    const c = Math.cos(a);
    const s = Math.sin(a);
    b.box(1.1, 0.2, 2.7, x, y + 0.45, z, "#f5efe4", -a);
    b.box(1.05, 0.2, 1, x - s * 1.5, y + 0.75, z - c * 1.5, "#f5efe4", -a);
    if (Math.round(x) % 2 === 0) {
      b.cyl(0.05, 0.05, 2.7, x + c * 1.6, y + 1.5, z - s * 1.6, "#6f5740", 6);
      b.cyl(0.08, 1.85, 0.7, x + c * 1.6, y + 2.9, z - s * 1.6, "#f0d7a8", 12);
    }
  }
  return b.build();
}

export function Harbour({ world, shadows }: { world: World; shadows: boolean }) {
  const docks = useMemo(dockGeometry, []);
  const yacht = useMemo(yachtGeometry, []);
  const beach = useMemo(() => beachKit(world), [world]);
  const yachts = useMemo(() => {
    const out: { x: number; z: number; ry: number; s: number; moving: boolean; phase: number }[] = [];
    const rand = makeRandom(77);
    for (const d of MARINA.docks) {
      const c = Math.cos(d.angle);
      const s = Math.sin(d.angle);
      for (let i = 1; i <= 3; i++) {
        const t = (i / 3.6) * d.length + 4.4;
        for (const side of [-1, 1]) {
          if (rand() < 0.2) continue;
          out.push({
            x: d.x + c * t - s * side * 9.5,
            z: d.z + s * t + c * side * 9.5,
            ry: -d.angle + Math.PI / 2 + (side < 0 ? Math.PI : 0),
            s: 0.72 + rand() * 0.45,
            moving: false,
            phase: rand() * 6,
          });
        }
      }
    }
    // Hero yachts, off the marina, and one that glides slowly.
    out.push({ x: 270, z: 96, ry: 0.5, s: 1.5, moving: false, phase: 1 });
    out.push({ x: 292, z: -40, ry: 2.3, s: 1.2, moving: true, phase: 2.5 });
    return out;
  }, []);
  const groupRef = useRef<THREE.Group>(null);
  const solidMat = useMemo(() => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.48 }), []);

  useFrame(() => {
    const g = groupRef.current;
    if (!g) return;
    const t = clock.t;
    g.children.forEach((child, i) => {
      const y = yachts[i];
      if (!y) return;
      child.position.y = 0.55 + Math.sin(t * 0.8 + y.phase) * 0.14;
      child.rotation.z = Math.sin(t * 0.6 + y.phase) * 0.018;
      child.rotation.x = Math.cos(t * 0.5 + y.phase) * 0.012;
      if (y.moving) {
        const along = ((t * 1.4 + y.phase * 30) % 460) - 230;
        child.position.x = y.x + Math.cos(y.ry) * along;
        child.position.z = y.z - Math.sin(y.ry) * along;
      }
    });
  });

  return (
    <group>
      <mesh geometry={docks} material={solidMat} castShadow={shadows} receiveShadow={shadows} raycast={() => undefined} />
      <mesh geometry={beach} material={solidMat} castShadow={shadows} raycast={() => undefined} />
      <group ref={groupRef}>
        {yachts.map((y, i) => (
          <mesh key={i} geometry={yacht} material={solidMat} position={[y.x, 0.55, y.z]} rotation={[0, y.ry, 0]} scale={y.s} castShadow={shadows} raycast={() => undefined} />
        ))}
      </group>
    </group>
  );
}

export function Helipad({ world, shadows }: { world: World; shadows: boolean }) {
  const y = HELIPAD.elevation;
  const heli = useMemo(() => {
    const b = new GeoBuilder();
    b.sphere(1.45, 0, 1.75, 0, "#f6f2ea", 1.65, 1, 1);
    b.sphere(1.3, 0.7, 1.95, 0, "#26343f", 1.2, 0.72, 0.92);
    b.add(new THREE.CylinderGeometry(0.16, 0.48, 5.4, 8), "#f6f2ea", [-4.3, 2.1, 0], [0, 0, Math.PI / 2 - 0.05]);
    b.box(0.14, 1.6, 0.5, -6.8, 2.8, 0, "#d4a853");
    b.box(0.2, 0.2, 3, 0, 0.26, 0, "#59544e");
    b.box(4.6, 0.12, 0.14, 0, 0.14, 1.05, "#59544e");
    b.box(4.6, 0.12, 0.14, 0, 0.14, -1.05, "#59544e");
    b.cyl(0.13, 0.13, 0.7, 0, 3.15, 0, "#59544e", 8);
    b.box(11, 0.05, 0.42, 0, 3.5, 0, "#2d2a27", 0.5);
    b.box(11, 0.05, 0.42, 0, 3.5, 0, "#2d2a27", 2.07);
    return b.build();
  }, []);
  const texture = useMemo(helipadTexture, []);
  void world;
  return (
    <group position={[HELIPAD.x, y, HELIPAD.z]}>
      <mesh position={[0, 0.2, 0]} castShadow={shadows} receiveShadow={shadows} raycast={() => undefined}>
        <cylinderGeometry args={[12.8, 13.6, 0.8, 48]} />
        <meshStandardMaterial color="#d7cdbd" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.63, 0]} rotation={[-Math.PI / 2, 0, 0.1]} receiveShadow={shadows} raycast={() => undefined}>
        <circleGeometry args={[11.6, 48]} />
        <meshStandardMaterial map={texture} roughness={0.8} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.66, 0]} raycast={() => undefined}>
        <ringGeometry args={[11.7, 12.05, 64]} />
        <meshBasicMaterial color={new THREE.Color(2.4, 1.7, 0.8)} toneMapped={false} />
      </mesh>
      <mesh geometry={heli} position={[-1, 0.66, 3.2]} rotation={[0, 0.7, 0]} castShadow={shadows} raycast={() => undefined}>
        <meshStandardMaterial vertexColors roughness={0.4} />
      </mesh>
    </group>
  );
}

/* ---------- waterfalls ---------- */

const FALL_VERT = /* glsl */ `
  varying vec2 vUv;
  void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
`;
const FALL_FRAG = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;
  float h(vec2 p){ return fract(sin(dot(p,vec2(12.9,78.2)))*43758.5); }
  float n(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f);
    return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y); }
  void main(){
    vec2 p = vec2(vUv.x*9.0, vUv.y*3.0 + uTime*1.05);
    float s = n(p*vec2(1.0,0.8)) * 0.6 + n(p*vec2(2.6,1.3)+3.0)*0.4;
    float edge = smoothstep(0.0,0.14,vUv.x)*smoothstep(1.0,0.86,vUv.x);
    vec3 col = mix(vec3(0.42,0.78,0.86), vec3(1.0), smoothstep(0.34,0.72,s));
    float a = edge * (0.72 + s*0.28);
    gl_FragColor = vec4(col, a);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export function Waterfalls({ world }: { world: World }) {
  const data = useMemo(() => {
    const material = new THREE.ShaderMaterial({
      vertexShader: FALL_VERT,
      fragmentShader: FALL_FRAG,
      uniforms: { uTime: sharedUniforms.uTime },
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const geometries: THREE.BufferGeometry[] = [];
    const pools: { x: number; y: number; z: number; r: number }[] = [];
    const rocks = new GeoBuilder();
    for (const f of WATERFALLS) {
      const yTop = world.sample(f.topX, f.topZ) + 0.6;
      const bx = f.topX + f.dirX * f.length;
      const bz = f.topZ + f.dirZ * f.length;
      const yBottom = Math.min(world.sample(bx, bz), yTop - 9) + 0.2;
      const segs = 12;
      const pos: number[] = [];
      const uv: number[] = [];
      const idx: number[] = [];
      const px = -f.dirZ;
      const pz = f.dirX;
      for (let i = 0; i <= segs; i++) {
        const t = i / segs;
        const out = Math.sin(t * Math.PI * 0.5) * f.length;
        const y = yTop + (yBottom - yTop) * Math.pow(t, 1.5);
        const w = f.width * (0.9 + t * 0.25);
        pos.push(f.topX + f.dirX * out + (px * w) / 2, y, f.topZ + f.dirZ * out + (pz * w) / 2);
        pos.push(f.topX + f.dirX * out - (px * w) / 2, y, f.topZ + f.dirZ * out - (pz * w) / 2);
        uv.push(0, 1 - t, 1, 1 - t);
        if (i < segs) {
          const a = i * 2;
          idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
        }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
      g.setIndex(idx);
      geometries.push(g);
      pools.push({ x: bx + f.dirX * 2, y: yBottom + 0.12, z: bz + f.dirZ * 2, r: f.width * 1.05 });

      // Dark rock face behind and around the fall.
      const rand = makeRandom(Math.round(f.topX * 13 + 1000));
      for (let i = 0; i < 16; i++) {
        const side = rand() < 0.5 ? -1 : 1;
        const along = f.width * 0.65 + rand() * 4;
        const rx = f.topX + px * side * along + f.dirX * rand() * f.length;
        const rz = f.topZ + pz * side * along + f.dirZ * rand() * f.length;
        const ry = yBottom + rand() * (yTop - yBottom);
        const size = 1.6 + rand() * 3;
        rocks.add(new THREE.DodecahedronGeometry(size, 0), rand() < 0.5 ? "#3c332b" : "#574a3e", [rx, ry, rz], [rand(), rand(), rand()]);
      }
      for (let i = 0; i < 7; i++) {
        const off = (i / 6 - 0.5) * f.width * 1.2;
        rocks.add(new THREE.DodecahedronGeometry(1.4 + rand() * 1.6, 0), "#3c332b", [f.topX + px * off - f.dirX * 2, yTop - 2.4 + rand(), f.topZ + pz * off - f.dirZ * 2], [rand(), rand(), rand()]);
      }
    }
    return { material, geometries, pools, rockGeo: rocks.build() };
  }, [world]);

  const mist = useMemo(softGlowTexture, []);
  return (
    <group>
      <mesh geometry={data.rockGeo} raycast={() => undefined} castShadow>
        <meshStandardMaterial vertexColors flatShading roughness={0.95} />
      </mesh>
      {data.geometries.map((g, i) => (
        <mesh key={i} geometry={g} material={data.material} raycast={() => undefined} renderOrder={4} />
      ))}
      {data.pools.map((p, i) => (
        <group key={i} position={[p.x, p.y, p.z]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} raycast={() => undefined}>
            <circleGeometry args={[p.r, 28]} />
            <meshStandardMaterial color="#49cfc8" roughness={0.12} metalness={0.25} />
          </mesh>
          <sprite position={[0, 1.6, 0]} scale={[p.r * 2.5, p.r * 1.3, 1]} raycast={() => undefined}>
            <spriteMaterial map={mist} color="#ffffff" transparent opacity={0.42} depthWrite={false} />
          </sprite>
        </group>
      ))}
    </group>
  );
}

/* ---------- light pulses and the content packet ---------- */

function PulseDot({ pulse, world }: { pulse: Pulse; world: World }) {
  const route = useMemo(() => world.route(pulse.from, pulse.to), [world, pulse.from, pulse.to]);
  const cumulative = useMemo(() => {
    const out = [0];
    for (let i = 1; i < route.length; i++) {
      const a = route[i - 1] as { x: number; y: number; z: number };
      const b = route[i] as { x: number; y: number; z: number };
      out.push((out[i - 1] as number) + Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z));
    }
    return out;
  }, [route]);
  const group = useRef<THREE.Group>(null);
  const glow = useMemo(softGlowTexture, []);
  const removePulse = useHQ((s) => s.removePulse);
  const packet = pulse.kind === "packet";
  const started = useRef<number | null>(null);
  const elapsed = useRef(0);

  useEffect(() => {
    if (route.length < 2) removePulse(pulse.id);
  }, [route, removePulse, pulse.id]);

  const trail = useRef<THREE.Sprite[]>([]);
  const trailCount = packet ? 8 : 5;

  useFrame((_, delta) => {
    const g = group.current;
    if (!g || route.length < 2) return;
    if (started.current === null) started.current = clock.t;
    if (!useHQ.getState().paused) elapsed.current += Math.min(delta, 0.05);
    const raw = Math.min(1, elapsed.current / pulse.duration);
    const eased = raw * raw * (3 - 2 * raw);
    const total = cumulative[cumulative.length - 1] as number;
    const place = (distance: number, out: THREE.Object3D) => {
      let i = 1;
      while (i < cumulative.length - 1 && (cumulative[i] as number) < distance) i++;
      const a = route[i - 1] as { x: number; y: number; z: number };
      const b = route[i] as { x: number; y: number; z: number };
      const span = (cumulative[i] as number) - (cumulative[i - 1] as number) || 1;
      const t = Math.min(1, Math.max(0, (distance - (cumulative[i - 1] as number)) / span));
      out.position.set(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t + (packet ? 2.4 : 1.2), a.z + (b.z - a.z) * t);
    };
    place(eased * total, g);
    trail.current.forEach((s, i) => {
      const back = (i + 1) * (packet ? 2.2 : 1.7);
      place(Math.max(0, eased * total - back), s);
      s.position.sub(g.position);
    });
    if (raw >= 1) removePulse(pulse.id);
  });

  const color = packet ? new THREE.Color(3.4, 2.5, 1.05) : new THREE.Color(0.8, 3, 2.8);
  return (
    <group ref={group}>
      <mesh raycast={() => undefined}>
        <sphereGeometry args={[packet ? 1 : 0.5, 14, 12]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      <sprite scale={packet ? [8, 8, 1] : [3.4, 3.4, 1]} raycast={() => undefined}>
        <spriteMaterial map={glow} color={color} transparent opacity={0.72} depthWrite={false} toneMapped={false} blending={THREE.AdditiveBlending} />
      </sprite>
      {Array.from({ length: trailCount }).map((_, i) => (
        <sprite
          key={i}
          ref={(s) => {
            if (s) trail.current[i] = s;
          }}
          scale={packet ? [4.4 - i * 0.42, 4.4 - i * 0.42, 1] : [1.9 - i * 0.28, 1.9 - i * 0.28, 1]}
          raycast={() => undefined}
        >
          <spriteMaterial map={glow} color={color} transparent opacity={0.46 - i * 0.05} depthWrite={false} toneMapped={false} blending={THREE.AdditiveBlending} />
        </sprite>
      ))}
    </group>
  );
}

export function Pulses({ world }: { world: World }) {
  const pulses = useHQ((s) => s.pulses);
  return (
    <group>
      {pulses.map((p) => (
        <PulseDot key={p.id} pulse={p} world={world} />
      ))}
    </group>
  );
}
