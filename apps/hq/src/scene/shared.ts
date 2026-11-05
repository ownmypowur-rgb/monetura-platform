import * as THREE from "three";
import type { QualityTier } from "../store";

/** Shared animated uniforms. Fed by the pausable animation clock. */
export const sharedUniforms = {
  uTime: { value: 0 },
};

/** Golden-hour sun: low, warm, from the front right so facades glow toward camera. */
export const SUN_DIRECTION = new THREE.Vector3(0.72, 0.38, 0.46).normalize();
export const SUN_COLOR = "#ffcf94";
export const HAZE_COLOR = "#a9c7c6";

export interface QualitySettings {
  dpr: [number, number];
  shadows: boolean;
  shadowSize: number;
  post: boolean;
  ao: boolean;
  palms: number;
  bushes: number;
  rocks: number;
  terrainRes: number;
  maxCharacters: number;
}

export const QUALITY: Record<QualityTier, QualitySettings> = {
  high: { dpr: [1, 1.75], shadows: true, shadowSize: 4096, post: true, ao: true, palms: 2400, bushes: 7000, rocks: 700, terrainRes: 400, maxCharacters: 24 },
  medium: { dpr: [1, 1.25], shadows: true, shadowSize: 2048, post: true, ao: false, palms: 1300, bushes: 3200, rocks: 380, terrainRes: 300, maxCharacters: 14 },
  low: { dpr: [0.75, 1], shadows: false, shadowSize: 1024, post: false, ao: false, palms: 520, bushes: 1100, rocks: 160, terrainRes: 200, maxCharacters: 8 },
};

export function detectQuality(): QualityTier {
  if (typeof window === "undefined") return "medium";
  const forced = new URLSearchParams(window.location.search).get("quality");
  if (forced === "high" || forced === "medium" || forced === "low") return forced;
  const mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || window.innerWidth < 720;
  if (mobile) return "low";
  const cores = navigator.hardwareConcurrency ?? 4;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
  let renderer = "";
  try {
    const gl = document.createElement("canvas").getContext("webgl2");
    const info = gl?.getExtension("WEBGL_debug_renderer_info");
    if (gl && info) renderer = String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL));
  } catch {
    renderer = "";
  }
  if (/swiftshader|llvmpipe|software/i.test(renderer)) return "low";
  const discrete = /nvidia|geforce|radeon|rtx|gtx|apple m[1-9]/i.test(renderer);
  if (discrete && cores >= 6) return "high";
  if (cores >= 6 && memory >= 8) return "medium";
  return cores >= 4 ? "medium" : "low";
}

/** Live world-space positions of the characters on screen, for the camera. */
export const agentPositions = new Map<string, THREE.Vector3>();

/** Set when something changes shape enough to re-render the static shadow map. */
export const shadowState = { dirtyFrames: 8 };
