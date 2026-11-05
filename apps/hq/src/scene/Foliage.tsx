"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { makeRandom, WORLD_MIN_X, WORLD_MIN_Z, WORLD_SIZE, type World } from "../world/world";
import { mergeOrEmpty, GeoBuilder } from "./geo";
import { sharedUniforms } from "./shared";
import { leafClumpTexture, palmFrondTexture } from "./textures";

/** One palm frond: a bent strip whose uvs paint a feathered leaf with alpha. */
function frondGeometry(length: number, width: number, droop: number, segs: number): THREE.BufferGeometry {
  const positions: number[] = [];
  const uvs: number[] = [];
  const index: number[] = [];
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const x = t * length;
    const y = Math.sin(t * 1.35) * length * 0.2 - droop * t * t * length;
    const w = width;
    positions.push(x, y, -w / 2, x, y, w / 2);
    uvs.push(0, t, 1, t);
    if (i < segs) {
      const a = i * 2;
      index.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(index);
  g.computeVertexNormals();
  return g;
}

function palmCrown(): THREE.BufferGeometry {
  const list: THREE.BufferGeometry[] = [];
  const n = 13;
  for (let i = 0; i < n; i++) {
    const inner = i % 2 === 0;
    const g = frondGeometry(inner ? 5.6 : 6.4, inner ? 2 : 2.3, inner ? 0.52 : 0.72, 6);
    const m = new THREE.Matrix4();
    const yaw = (i / n) * Math.PI * 2 + (i % 3) * 0.17;
    const pitch = inner ? 0.2 : -0.03;
    m.makeRotationFromEuler(new THREE.Euler(0, yaw, pitch, "YXZ"));
    g.applyMatrix4(m);
    list.push(g);
  }
  return mergeOrEmpty(list);
}

function palmTrunk(): THREE.BufferGeometry {
  const b = new GeoBuilder();
  const rings = 6;
  for (let i = 0; i < rings; i++) {
    const t = i / rings;
    const t1 = (i + 1) / rings;
    const r0 = 0.42 - t * 0.2;
    const r1 = 0.42 - t1 * 0.2;
    const bend = (v: number) => v * v * 1.6;
    const cx = (bend(t) + bend(t1)) / 2;
    b.add(new THREE.CylinderGeometry(r1, r0, 1 / rings + 0.01, 7, 1, true), i % 2 ? "#8c6b4a" : "#7a5c40", [cx, (t + t1) / 2, 0], [0, 0, 0], [1, 1, 1]);
  }
  return b.build();
}

/** Sway applied in the vertex shader: cheap for thousands of crowns. */
function swayMaterial(map: THREE.Texture, strength: number, alphaTest: number): THREE.MeshStandardMaterial {
  const m = new THREE.MeshStandardMaterial({
    map,
    alphaTest,
    side: THREE.DoubleSide,
    roughness: 0.82,
    metalness: 0,
  });
  m.onBeforeCompile = (shader) => {
    shader.uniforms["uTime"] = sharedUniforms.uTime;
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nuniform float uTime;")
      .replace(
        "#include <begin_vertex>",
        /* glsl */ `#include <begin_vertex>
        #ifdef USE_INSTANCING
          float swayPh = instanceMatrix[3].x*0.21 + instanceMatrix[3].z*0.17;
          float reach = length(position.xz);
          float sway = sin(uTime*0.9 + swayPh + reach*0.35) * ${strength.toFixed(3)} * reach;
          transformed.y += sway * 0.55;
          transformed.xz += normalize(position.xz + 0.001) * sway * 0.22;
        #endif`,
      );
    // Soft translucency so sunlit leaves glow like the render.
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <emissivemap_fragment>",
      "#include <emissivemap_fragment>\ntotalEmissiveRadiance += diffuseColor.rgb * 0.07;",
    );
  };
  return m;
}

function bushGeometry(): THREE.BufferGeometry {
  // Crossed cards with spherical normals, so clumps shade like round foliage.
  const list: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 3; i++) {
    const g = new THREE.PlaneGeometry(2, 1.7);
    g.translate(0, 0.72, 0);
    g.rotateY((i / 3) * Math.PI);
    list.push(g);
  }
  const top = new THREE.PlaneGeometry(2, 2);
  top.rotateX(-Math.PI / 2 + 0.25);
  top.translate(0, 1.1, 0);
  list.push(top);
  const top2 = new THREE.PlaneGeometry(1.8, 1.8);
  top2.rotateX(-Math.PI / 2 - 0.3);
  top2.rotateY(1.2);
  top2.translate(0, 0.8, 0);
  list.push(top2);
  const merged = mergeOrEmpty(list);
  const pos = merged.getAttribute("position") as THREE.BufferAttribute;
  const nor = merged.getAttribute("normal") as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.set(pos.getX(i), pos.getY(i) + 0.3, pos.getZ(i)).normalize();
    nor.setXYZ(i, v.x, v.y, v.z);
  }
  return merged;
}

function rockGeometry(): THREE.BufferGeometry {
  const g = new THREE.IcosahedronGeometry(1, 1);
  const pos = g.getAttribute("position") as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const n = Math.sin(v.x * 5.1 + v.y * 2.3) * Math.cos(v.z * 4.7 - v.x * 1.9) * 0.22 + Math.sin(v.y * 9) * 0.06;
    v.multiplyScalar(1 + n);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}

interface FoliageProps {
  world: World;
  palms: number;
  bushes: number;
  rocks: number;
  shadows: boolean;
}

export function Foliage({ world, palms, bushes, rocks, shadows }: FoliageProps) {
  const placement = useMemo(() => {
    const rand = makeRandom(20261104);
    const palmList: { x: number; y: number; z: number; s: number; r: number; lean: number; beach: boolean }[] = [];
    const bushList: { x: number; y: number; z: number; s: number; r: number; tone: number }[] = [];
    const rockList: { x: number; y: number; z: number; s: number; r: number; sq: number }[] = [];
    const inMap = () => ({
      x: WORLD_MIN_X + rand() * WORLD_SIZE,
      z: WORLD_MIN_Z + rand() * WORLD_SIZE,
    });
    const clusterNoise = (x: number, z: number) =>
      Math.sin(x * 0.051 + Math.sin(z * 0.033) * 1.4) * 0.5 + Math.sin(z * 0.043 + Math.cos(x * 0.027) * 1.7) * 0.5;

    let guard = 0;
    while (palmList.length < palms && guard++ < palms * 60) {
      const { x, z } = inMap();
      const y = world.sample(x, z);
      if (y < 1.6) continue;
      if (world.isKept(x, z)) continue;
      if (world.slope(x, z) > 1.9) continue;
      const beach = y < 3.6;
      if (beach && rand() > 0.3) continue;
      if (y > 74) continue;
      if (clusterNoise(x, z) < -0.45 && rand() > 0.3) continue;
      palmList.push({ x, y, z, s: 0.58 + rand() * 0.52, r: rand() * Math.PI * 2, lean: 0.4 + rand() * 0.9, beach });
    }

    guard = 0;
    while (bushList.length < bushes && guard++ < bushes * 40) {
      const { x, z } = inMap();
      const y = world.sample(x, z);
      if (y < 2.3) continue;
      if (world.isClear(x, z)) continue;
      if (world.slope(x, z) > 1.7) continue;
      const big = rand();
      if (big > 0.7 && world.isKept(x, z)) continue;
      bushList.push({
        x,
        y: y - 0.3,
        z,
        s: big > 0.82 ? 4.6 + rand() * 3.4 : 1.9 + rand() * 2.7,
        r: rand() * Math.PI,
        tone: clusterNoise(x, z) * 0.5 + 0.5,
      });
    }

    guard = 0;
    while (rockList.length < rocks && guard++ < rocks * 50) {
      const { x, z } = inMap();
      const y = world.sample(x, z);
      if (y < -1.4 || y > 70) continue;
      if (world.isClear(x, z)) continue;
      const slope = world.slope(x, z);
      const shoreRock = y < 2.4 && slope > 0.2;
      if (slope < 0.7 && !shoreRock) continue;
      rockList.push({ x, y: y - 0.2, z, s: 0.8 + rand() * rand() * 4.6, r: rand() * Math.PI * 2, sq: 0.5 + rand() * 0.5 });
    }
    return { palmList, bushList, rockList };
  }, [world, palms, bushes, rocks]);

  const trunkRef = useRef<THREE.InstancedMesh>(null);
  const crownRef = useRef<THREE.InstancedMesh>(null);
  const bushRef = useRef<THREE.InstancedMesh>(null);
  const rockRef = useRef<THREE.InstancedMesh>(null);

  const geos = useMemo(
    () => ({
      trunk: palmTrunk(),
      crown: palmCrown(),
      bush: bushGeometry(),
      rock: rockGeometry(),
    }),
    [],
  );
  const mats = useMemo(
    () => ({
      crown: swayMaterial(palmFrondTexture(), 0.016, 0.42),
      bush: swayMaterial(leafClumpTexture(), 0.008, 0.46),
    }),
    [],
  );

  useEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const v = new THREE.Vector3();
    const s = new THREE.Vector3();
    const c = new THREE.Color();

    const trunk = trunkRef.current;
    const crown = crownRef.current;
    if (trunk && crown) {
      placement.palmList.forEach((p, i) => {
        const h = (10 + p.lean * 5.4) * p.s * (p.beach ? 1.12 : 1);
        e.set(0, p.r, 0);
        q.setFromEuler(e);
        m.compose(v.set(p.x, p.y - 0.3, p.z), q, s.set(p.s * 1.1, h, p.s * 1.1));
        trunk.setMatrixAt(i, m);
        const tipX = 1.6 * p.s * 1.1;
        const dirX = Math.cos(p.r) * tipX;
        const dirZ = -Math.sin(p.r) * tipX;
        m.compose(v.set(p.x + dirX, p.y - 0.3 + h, p.z + dirZ), q, s.set(p.s, p.s * 0.92, p.s));
        crown.setMatrixAt(i, m);
        // Golden sunlit palms, varied.
        const k = (i * 0.618) % 1;
        c.setRGB(0.28 + k * 0.3, 0.5 + k * 0.18, 0.11 + k * 0.07);
        crown.setColorAt(i, c);
      });
      trunk.instanceMatrix.needsUpdate = true;
      crown.instanceMatrix.needsUpdate = true;
      if (crown.instanceColor) crown.instanceColor.needsUpdate = true;
    }

    const bush = bushRef.current;
    if (bush) {
      placement.bushList.forEach((b, i) => {
        e.set(0, b.r, 0);
        q.setFromEuler(e);
        m.compose(v.set(b.x, b.y, b.z), q, s.set(b.s, b.s * (0.78 + (i % 5) * 0.08), b.s));
        bush.setMatrixAt(i, m);
        const k = (i * 0.37) % 1;
        const t = b.tone * 0.6 + k * 0.4;
        c.setRGB(0.08 + t * 0.24, 0.26 + t * 0.26, 0.05 + t * 0.07);
        bush.setColorAt(i, c);
      });
      bush.instanceMatrix.needsUpdate = true;
      if (bush.instanceColor) bush.instanceColor.needsUpdate = true;
    }

    const rock = rockRef.current;
    if (rock) {
      placement.rockList.forEach((r, i) => {
        e.set(r.r * 0.3, r.r, r.r * 0.2);
        q.setFromEuler(e);
        m.compose(v.set(r.x, r.y, r.z), q, s.set(r.s, r.s * r.sq, r.s * (0.7 + r.sq * 0.4)));
        rock.setMatrixAt(i, m);
        const k = (i * 0.73) % 1;
        c.setRGB(0.13 + k * 0.11, 0.1 + k * 0.09, 0.08 + k * 0.07);
        rock.setColorAt(i, c);
      });
      rock.instanceMatrix.needsUpdate = true;
      if (rock.instanceColor) rock.instanceColor.needsUpdate = true;
    }
  }, [placement]);

  const noRay = () => undefined;
  return (
    <group>
      <instancedMesh ref={trunkRef} args={[geos.trunk, undefined, placement.palmList.length]} castShadow={shadows} raycast={noRay} frustumCulled={false}>
        <meshStandardMaterial vertexColors roughness={0.95} />
      </instancedMesh>
      <instancedMesh ref={crownRef} args={[geos.crown, mats.crown, placement.palmList.length]} castShadow={shadows} raycast={noRay} frustumCulled={false} />
      <instancedMesh ref={bushRef} args={[geos.bush, mats.bush, placement.bushList.length]} castShadow={false} receiveShadow={shadows} raycast={noRay} frustumCulled={false} />
      <instancedMesh ref={rockRef} args={[geos.rock, undefined, placement.rockList.length]} castShadow={shadows} receiveShadow={shadows} raycast={noRay} frustumCulled={false}>
        <meshStandardMaterial roughness={0.96} flatShading />
      </instancedMesh>
    </group>
  );
}
