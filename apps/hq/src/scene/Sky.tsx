"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { clock } from "../store";
import { HAZE_COLOR, SUN_DIRECTION } from "./shared";
import { cloudTexture } from "./textures";

const SKY_VERT = /* glsl */ `
  varying vec3 vDir;
  void main(){
    vDir = normalize(position);
    vec4 p = projectionMatrix * mat4(mat3(viewMatrix)) * vec4(position,1.0);
    gl_Position = p.xyww;
  }
`;
const SKY_FRAG = /* glsl */ `
  uniform vec3 uSun;
  uniform vec3 uHaze;
  varying vec3 vDir;
  void main(){
    vec3 d = normalize(vDir);
    float h = clamp(d.y, 0.0, 1.0);
    vec3 top = vec3(0.17,0.42,0.68);
    vec3 mid = vec3(0.55,0.72,0.82);
    vec3 horizon = vec3(1.0,0.81,0.60);
    vec3 col = mix(horizon, mid, smoothstep(0.0,0.16,h));
    col = mix(col, top, smoothstep(0.12,0.75,h));
    float s = max(dot(d,uSun),0.0);
    col += vec3(1.0,0.72,0.42) * pow(s,12.0) * 0.45;
    col += vec3(1.0,0.86,0.66) * pow(s,380.0) * 2.4;
    if (d.y < 0.0) col = mix(col, uHaze, smoothstep(0.0,-0.1,d.y));
    gl_FragColor = vec4(col,1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export function SkyDome() {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: SKY_VERT,
        fragmentShader: SKY_FRAG,
        side: THREE.BackSide,
        depthWrite: false,
        depthTest: true,
        uniforms: {
          uSun: { value: SUN_DIRECTION.clone() },
          uHaze: { value: new THREE.Color(HAZE_COLOR) },
        },
      }),
    [],
  );
  return (
    <mesh material={material} frustumCulled={false} renderOrder={-10} raycast={() => undefined}>
      <sphereGeometry args={[10, 32, 18]} />
    </mesh>
  );
}

const CLOUDS = [
  { x: -300, y: 118, z: -300, s: 260, v: 1.1 },
  { x: 60, y: 136, z: -420, s: 340, v: 0.8 },
  { x: 340, y: 124, z: -280, s: 280, v: 1 },
  { x: -420, y: 150, z: -80, s: 320, v: 0.9 },
  { x: 460, y: 142, z: 40, s: 300, v: 0.7 },
  { x: -120, y: 160, z: -560, s: 420, v: 0.6 },
  { x: 260, y: 170, z: -620, s: 460, v: 0.5 },
];

export function Clouds() {
  const group = useRef<THREE.Group>(null);
  const material = useMemo(
    () =>
      new THREE.SpriteMaterial({
        map: cloudTexture(),
        transparent: true,
        opacity: 0.72,
        depthWrite: false,
        fog: false,
      }),
    [],
  );
  useFrame(() => {
    const g = group.current;
    if (!g) return;
    g.children.forEach((child, i) => {
      const c = CLOUDS[i];
      if (!c) return;
      const span = 1400;
      const x = c.x + clock.t * c.v * 1.3;
      child.position.x = ((x + span / 2) % span + span) % span - span / 2;
    });
  });
  return (
    <group ref={group}>
      {CLOUDS.map((c, i) => (
        <sprite key={i} material={material} position={[c.x, c.y, c.z]} scale={[c.s, c.s * 0.42, 1]} raycast={() => undefined} />
      ))}
    </group>
  );
}
