"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { WORLD_MIN_X, WORLD_MIN_Z, WORLD_SIZE, type World } from "../world/world";
import { GeoBuilder } from "./geo";
import { sharedUniforms } from "./shared";

const lampTime = sharedUniforms.uTime;

const NOISE = /* glsl */ `
  float hq_hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
  float hq_noise(vec2 p){
    vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
    return mix(mix(hq_hash(i),hq_hash(i+vec2(1,0)),f.x),mix(hq_hash(i+vec2(0,1)),hq_hash(i+vec2(1,1)),f.x),f.y);
  }
  float hq_fbm(vec2 p){ float s=0.,a=.5; for(int i=0;i<4;i++){ s+=a*hq_noise(p); p*=2.03; a*=.5; } return s; }
`;

function makeTerrainMaterial(): THREE.MeshStandardMaterial {
  const material = new THREE.MeshStandardMaterial({ roughness: 0.94, metalness: 0, color: "#ffffff" });
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vHQWorld;\nvarying vec3 vHQNormal;")
      .replace(
        "#include <worldpos_vertex>",
        "#include <worldpos_vertex>\nvHQWorld = (modelMatrix * vec4(transformed,1.0)).xyz;\nvHQNormal = normalize(mat3(modelMatrix) * objectNormal);",
      );
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>\nvarying vec3 vHQWorld;\nvarying vec3 vHQNormal;\n${NOISE}`)
      .replace(
        "#include <color_fragment>",
        /* glsl */ `
        vec3 wp = vHQWorld;
        float steep = 1.0 - clamp(vHQNormal.y, 0.0, 1.0);
        float n1 = hq_fbm(wp.xz * 0.09);
        float n2 = hq_fbm(wp.xz * 0.5);
        float n3 = hq_fbm(wp.xz * 0.018 + 7.0);

        vec3 wetSand = vec3(0.80, 0.66, 0.46);
        vec3 sand = mix(vec3(0.99, 0.90, 0.72), vec3(0.97, 0.84, 0.62), n2);
        vec3 grass = mix(vec3(0.08, 0.20, 0.05), vec3(0.22, 0.36, 0.08), n1);
        grass = mix(grass, vec3(0.05, 0.15, 0.05), smoothstep(0.42, 0.68, n3));
        // Volcanic rock with warm strata lines, as in the render's cliffs.
        float strata = sin(wp.y * 1.4 + n1 * 14.0 + wp.x*0.08) * 0.5 + 0.5;
        vec3 rock = mix(vec3(0.075, 0.06, 0.05), vec3(0.27, 0.20, 0.15), strata * 0.45 + n2 * 0.55);

        float sandMix = 1.0 - smoothstep(1.2, 3.4 + n1 * 2.0, wp.y);
        vec3 ground = mix(grass, sand, sandMix);
        ground = mix(ground, wetSand, 1.0 - smoothstep(0.1, 0.9, wp.y));
        ground = mix(ground, rock, smoothstep(0.22, 0.42, steep + (n2 - 0.5) * 0.12));
        // Underwater: fades into the seabed colour.
        ground = mix(ground, vec3(0.75, 0.82, 0.66), 1.0 - smoothstep(-1.2, 0.05, wp.y));
        diffuseColor.rgb = ground;
        `,
      );
  };
  return material;
}

export function Terrain({ world }: { world: World }) {
  const geometry = useMemo(() => {
    const { res, heights } = world;
    const size = res + 1;
    const positions = new Float32Array(size * size * 3);
    const cell = WORLD_SIZE / res;
    for (let j = 0; j < size; j++) {
      for (let i = 0; i < size; i++) {
        const k = (j * size + i) * 3;
        positions[k] = WORLD_MIN_X + i * cell;
        positions[k + 1] = heights[j * size + i] as number;
        positions[k + 2] = WORLD_MIN_Z + j * cell;
      }
    }
    const index: number[] = [];
    const deep = -9;
    for (let j = 0; j < res; j++) {
      for (let i = 0; i < res; i++) {
        const a = j * size + i;
        const b = a + 1;
        const c = a + size;
        const d = c + 1;
        if ((heights[a] as number) < deep && (heights[b] as number) < deep && (heights[c] as number) < deep && (heights[d] as number) < deep) continue;
        index.push(a, c, b, b, c, d);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setIndex(index);
    g.computeVertexNormals();
    return g;
  }, [world]);
  const material = useMemo(makeTerrainMaterial, []);
  return <mesh geometry={geometry} material={material} receiveShadow castShadow raycast={() => undefined} />;
}

/** Stone paths as ribbons pressed into the terrain, plus the path-light posts. */
export function Paths({ world }: { world: World }) {
  const { geometry, lamps } = useMemo(() => {
    const positions: number[] = [];
    const normals: number[] = [];
    const colors: number[] = [];
    const lampSpots: { x: number; y: number; z: number }[] = [];
    const stone = new THREE.Color("#efe3cf");
    const edge = new THREE.Color("#c9b89b");
    const width = 1.65;
    for (const e of world.edges) {
      const p = e.points;
      for (let i = 0; i < p.length - 1; i++) {
        const a = p[i] as { x: number; y: number; z: number };
        const b = p[i + 1] as { x: number; y: number; z: number };
        const dx = b.x - a.x;
        const dz = b.z - a.z;
        const len = Math.hypot(dx, dz) || 1;
        const nx = -dz / len;
        const nz = dx / len;
        const c = p[i + 2] ?? b;
        const dx2 = c.x - b.x;
        const dz2 = c.z - b.z;
        const len2 = Math.hypot(dx2, dz2) || 1;
        const nx2 = -dz2 / len2;
        const nz2 = dx2 / len2;
        const quad = (o0: number, o1: number, col0: THREE.Color, col1: THREE.Color) => {
          const v = [
            [a.x + nx * o0, a.y + 0.05, a.z + nz * o0, col0],
            [a.x + nx * o1, a.y + 0.05, a.z + nz * o1, col1],
            [b.x + nx2 * o0, b.y + 0.05, b.z + nz2 * o0, col0],
            [b.x + nx2 * o1, b.y + 0.05, b.z + nz2 * o1, col1],
          ] as const;
          for (const idx of [0, 1, 2, 1, 3, 2]) {
            const q = v[idx] as readonly [number, number, number, THREE.Color];
            positions.push(q[0], q[1], q[2]);
            normals.push(0, 1, 0);
            colors.push(q[3].r, q[3].g, q[3].b);
          }
        };
        quad(-width, -width * 0.72, edge, stone);
        quad(-width * 0.72, width * 0.72, stone, stone);
        quad(width * 0.72, width, stone, edge);
        if (i % 4 === 2) {
          const side = i % 8 === 2 ? 1 : -1;
          lampSpots.push({ x: a.x + nx * side * (width + 0.7), y: a.y, z: a.z + nz * side * (width + 0.7) });
        }
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    g.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
    g.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    return { geometry: g, lamps: lampSpots };
  }, [world]);

  const { postGeo, glowGeo } = useMemo(() => {
    const post = new GeoBuilder();
    post.cyl(0.07, 0.1, 1.3, 0, 0.65, 0, "#3b332c", 6);
    return { postGeo: post.build(), glowGeo: new THREE.SphereGeometry(0.2, 8, 6) };
  }, []);

  const glowMaterial = useMemo(() => {
    const m = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.6, 1.75, 0.85), toneMapped: false });
    m.onBeforeCompile = (shader) => {
      shader.uniforms["uTime"] = lampTime;
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", "#include <common>\nuniform float uTime;\nvarying float vTw;")
        .replace(
          "#include <begin_vertex>",
          "#include <begin_vertex>\n#ifdef USE_INSTANCING\nfloat ph = instanceMatrix[3].x*1.7 + instanceMatrix[3].z*2.3;\nvTw = 0.72 + 0.28*sin(uTime*1.4 + ph);\n#else\nvTw = 1.0;\n#endif",
        );
      shader.fragmentShader = shader.fragmentShader
        .replace("#include <common>", "#include <common>\nvarying float vTw;")
        .replace("#include <color_fragment>", "#include <color_fragment>\ndiffuseColor.rgb *= vTw;");
    };
    return m;
  }, []);

  const applyLamps = (mesh: THREE.InstancedMesh | null, yOffset: number) => {
    if (!mesh) return;
    const m = new THREE.Matrix4();
    lamps.forEach((l, i) => {
      m.setPosition(l.x, l.y + yOffset, l.z);
      mesh.setMatrixAt(i, m);
    });
    mesh.instanceMatrix.needsUpdate = true;
  };

  return (
    <group>
      <mesh geometry={geometry} receiveShadow raycast={() => undefined}>
        <meshStandardMaterial vertexColors roughness={0.9} polygonOffset polygonOffsetFactor={-2} polygonOffsetUnits={-2} />
      </mesh>
      <instancedMesh ref={(m) => applyLamps(m, 0)} args={[postGeo, undefined, lamps.length]} raycast={() => undefined} frustumCulled={false}>
        <meshStandardMaterial vertexColors roughness={0.6} />
      </instancedMesh>
      <instancedMesh ref={(m) => applyLamps(m, 1.42)} args={[glowGeo, glowMaterial, lamps.length]} raycast={() => undefined} frustumCulled={false} />
    </group>
  );
}

