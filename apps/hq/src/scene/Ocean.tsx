"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { WORLD_MIN_X, WORLD_MIN_Z, WORLD_SIZE, type World } from "../world/world";
import { HAZE_COLOR, sharedUniforms, SUN_DIRECTION } from "./shared";

const VERT = /* glsl */ `
  varying vec3 vWorld;
  void main(){
    vec4 w = modelMatrix * vec4(position,1.0);
    vWorld = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`;

const FRAG = /* glsl */ `
  uniform float uTime;
  uniform sampler2D uHeight;
  uniform vec2 uOrigin;
  uniform float uSize;
  uniform vec3 uSun;
  uniform vec3 uHaze;
  varying vec3 vWorld;

  float hash(vec2 p){ return fract(sin(dot(p, vec2(41.3,289.1))) * 43758.5453); }
  float noise(vec2 p){
    vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
    return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);
  }
  float fbm(vec2 p){ float s=0.,a=.5; for(int i=0;i<4;i++){ s+=a*noise(p); p=p*2.02+vec2(3.1,1.7); a*=.5; } return s; }

  float waves(vec2 p, float t){
    float h = fbm(p*0.055 + vec2(t*0.035, t*0.02));
    h += 0.55*fbm(p*0.15 - vec2(t*0.05, -t*0.028));
    h += 0.22*noise(p*0.55 + vec2(-t*0.12, t*0.09));
    return h;
  }

  void main(){
    vec2 uv = (vWorld.xz - uOrigin) / uSize;
    // Height map stores h in [-16, 8] across [0, 1].
    vec2 edge = smoothstep(vec2(0.0), vec2(0.07), uv) * smoothstep(vec2(1.0), vec2(0.93), uv);
    float inMap = edge.x * edge.y;
    float ground = mix(-16.0, texture2D(uHeight, uv).r * 24.0 - 16.0, inMap);
    float depth = max(0.0, -ground);
    if (ground > 0.6) discard;

    vec3 toCam = cameraPosition - vWorld;
    float dist = length(toCam);
    vec3 V = toCam / dist;

    float e = 0.7 + dist*0.0016;
    float h0 = waves(vWorld.xz, uTime);
    float hx = waves(vWorld.xz + vec2(e,0.0), uTime);
    float hz = waves(vWorld.xz + vec2(0.0,e), uTime);
    float amp = 1.25 * clamp(depth*0.3, 0.3, 1.0);
    vec3 N = normalize(vec3((h0-hx)*amp/e, 1.0, (h0-hz)*amp/e));

    // Colour by depth: pale turquoise over sand, teal, then deep ocean blue.
    float d = clamp(depth/16.0, 0.0, 1.0);
    vec3 shallow = vec3(0.07, 0.78, 0.72);
    vec3 mid = vec3(0.0, 0.46, 0.60);
    vec3 deep = vec3(0.0, 0.13, 0.33);
    vec3 col = mix(shallow, mid, smoothstep(0.0, 0.34, d));
    col = mix(col, deep, smoothstep(0.26, 1.0, d));
    // Sand visible through the shallowest water.
    col = mix(vec3(0.58, 0.82, 0.62), col, smoothstep(0.0, 1.8, depth));
    col *= 0.9 + 0.22*h0;

    float fres = pow(1.0 - clamp(dot(N,V),0.0,1.0), 4.0);
    vec3 skyRefl = mix(vec3(0.55,0.72,0.82), vec3(1.0,0.85,0.66), clamp(dot(reflect(-V,N),uSun)*0.6+0.4,0.0,1.0));
    col = mix(col, skyRefl, fres*0.7);

    // Sun sparkle.
    vec3 H = normalize(uSun + V);
    float spec = pow(max(dot(N,H),0.0), 340.0);
    float glints = pow(noise(vWorld.xz*1.5 + uTime*0.55), 5.0);
    col += vec3(1.0,0.86,0.62) * (spec*1.8 + glints*spec*7.0);
    col += vec3(1.0,0.88,0.7) * pow(max(dot(N,H),0.0), 34.0) * 0.14;

    // Cloud shadows drifting over the sea.
    float cs = fbm(vWorld.xz*0.0065 + vec2(uTime*0.006, 0.0));
    col *= 0.88 + 0.2*smoothstep(0.3,0.62,cs);

    // Shoreline foam: two slow bands that breathe against the sand.
    float wob = noise(vWorld.xz*0.14 + uTime*0.1)*0.9;
    float band1 = smoothstep(0.42,0.0,abs(depth - (0.32 + 0.24*sin(uTime*0.55 + vWorld.x*0.02) + wob*0.26)));
    float band2 = smoothstep(0.34,0.0,abs(depth - (1.15 + 0.3*sin(uTime*0.4 + vWorld.z*0.03 + 1.5) + wob*0.4)));
    float lace = smoothstep(0.32,0.72,noise(vWorld.xz*1.1 + vec2(uTime*0.14,0.0)));
    float foam = clamp(band1 + band2*0.42*lace, 0.0, 1.0) * (1.0 - smoothstep(1.9,3.2,depth));
    col = mix(col, vec3(1.0,0.99,0.95), foam*0.88);
    // Edge against the beach fades into wet sand instead of cutting.
    float alpha = smoothstep(0.6, 0.12, ground);

    // Depth haze over the ocean.
    float haze = 1.0 - exp(-pow(dist*0.00058, 2.0));
    col = mix(col, uHaze, clamp(haze,0.0,0.92));

    gl_FragColor = vec4(col, alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export function Ocean({ world }: { world: World }) {
  const { material, geometry } = useMemo(() => {
    const { res, heights } = world;
    const size = res + 1;
    const data = new Uint8Array(size * size);
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.max(0, Math.min(255, Math.round((((heights[i] as number) + 16) / 24) * 255)));
    }
    const tex = new THREE.DataTexture(data, size, size, THREE.RedFormat, THREE.UnsignedByteType);
    tex.magFilter = THREE.LinearFilter;
    tex.minFilter = THREE.LinearFilter;
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.needsUpdate = true;
    const m = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthWrite: true,
      uniforms: {
        uTime: sharedUniforms.uTime,
        uHeight: { value: tex },
        uOrigin: { value: new THREE.Vector2(WORLD_MIN_X, WORLD_MIN_Z) },
        uSize: { value: WORLD_SIZE },
        uSun: { value: SUN_DIRECTION.clone() },
        uHaze: { value: new THREE.Color(HAZE_COLOR) },
      },
    });
    const g = new THREE.PlaneGeometry(5200, 5200, 1, 1);
    g.rotateX(-Math.PI / 2);
    return { material: m, geometry: g };
  }, [world]);
  return <mesh geometry={geometry} material={material} position={[0, 0, 0]} raycast={() => undefined} renderOrder={1} />;
}
