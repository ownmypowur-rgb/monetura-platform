"use client";

import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, PerformanceMonitor } from "@react-three/drei";
import { Bloom, BrightnessContrast, EffectComposer, HueSaturation, N8AO, ToneMapping, Vignette } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import * as THREE from "three";
import { clock, useHQ, type QualityTier } from "../store";
import type { ClientDivision } from "../types";
import { buildWorld, footprintSize, type World } from "../world/world";
import { Building } from "./Building";
import { CameraRig, FOV, overviewPose } from "./CameraRig";
import { Foliage } from "./Foliage";
import { Harbour, Helipad, Pulses, Waterfalls } from "./Harbour";
import { Ocean } from "./Ocean";
import { plateElements } from "./plates";
import { HAZE_COLOR, QUALITY, shadowState, sharedUniforms, SUN_COLOR, SUN_DIRECTION } from "./shared";
import { Clouds, SkyDome } from "./Sky";
import { Paths, Terrain } from "./Terrain";

/** Pausable animation clock and the static shadow map's refresh. */
function SceneClock() {
  const { gl } = useThree();
  useEffect(() => {
    gl.shadowMap.autoUpdate = false;
    shadowState.dirtyFrames = 10;
  }, [gl]);
  useFrame((_, delta) => {
    const s = useHQ.getState();
    if (!s.paused) {
      clock.t += Math.min(delta, 0.1) * (s.reducedMotion ? 0.2 : 1);
      sharedUniforms.uTime.value = clock.t;
    }
    if (shadowState.dirtyFrames > 0) {
      gl.shadowMap.needsUpdate = true;
      shadowState.dirtyFrames -= 1;
    }
  });
  return null;
}

/** Marks the loading screen done once real frames have been drawn. */
function ReadySignal() {
  const frames = useRef(0);
  const setReady = useHQ((s) => s.setReady);
  useFrame(() => {
    frames.current += 1;
    if (frames.current === 6) setReady();
  });
  return null;
}

/** Keeps the nameplates over their buildings, with greedy decluttering in screen space. */
function PlateProjector({ divisions }: { divisions: ClientDivision[] }) {
  const { camera, size } = useThree();
  const anchors = useMemo(
    () =>
      divisions.map((d) => {
        const f = footprintSize(d.building.footprint, d.building.scale);
        return {
          id: d.id,
          important: d.building.footprint === "angular" || d.building.footprint === "tiered",
          // Above the back edge, so the plate never covers the building itself.
          pos: new THREE.Vector3(d.building.x, d.building.elevation + f.height + 2, d.building.z - f.rz * 0.72),
          y: 0,
          x: 0,
          offset: 0,
          visible: true,
        };
      }),
    [divisions],
  );
  const v = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    const placed: { x: number; y: number; w: number; h: number }[] = [];
    for (const a of anchors) {
      v.copy(a.pos).project(camera);
      a.visible = v.z < 1;
      a.x = (v.x * 0.5 + 0.5) * size.width;
      a.y = (-v.y * 0.5 + 0.5) * size.height;
    }
    // Back to front, so the most prominent plates keep their spot.
    const order = [...anchors].sort((p, q) => {
      if (p.important !== q.important) return p.important ? -1 : 1;
      return q.y - p.y;
    });
    for (const a of order) {
      const el = plateElements.get(a.id);
      if (!el) continue;
      const w = el.offsetWidth || 160;
      const h = el.offsetHeight || 36;
      let y = a.y;
      for (let tries = 0; tries < 12; tries++) {
        const hit = placed.find((p) => Math.abs(p.x - a.x) < (p.w + w) / 2 + 4 && Math.abs(p.y - y) < (p.h + h) / 2 + 2);
        if (!hit) break;
        y = hit.y - (hit.h + h) / 2 - 3;
      }
      placed.push({ x: a.x, y, w, h });
      a.offset += (y - a.y - a.offset) * 0.14;
      const screenY = a.y + a.offset;
      const onScreen = a.visible && a.x > -80 && a.x < size.width + 80 && screenY > -30 && screenY < size.height + 30;
      el.style.transform = `translate3d(${a.x.toFixed(1)}px, ${screenY.toFixed(1)}px, 0) translate(-50%, -100%)`;
      el.style.visibility = onScreen ? "visible" : "hidden";
    }
  });
  return null;
}

function Lights({ shadowSize, shadows }: { shadowSize: number; shadows: boolean }) {
  const pos = useMemo(() => SUN_DIRECTION.clone().multiplyScalar(620), []);
  const sun = useRef<THREE.DirectionalLight>(null);
  useLayoutEffect(() => {
    // Pierced shadow-camera props don't refresh the projection on their own.
    sun.current?.shadow.camera.updateProjectionMatrix();
    shadowState.dirtyFrames = 10;
  }, []);
  return (
    <>
      <hemisphereLight args={["#a8c4dc", "#94703f", 0.86]} />
      <ambientLight intensity={0.16} color="#ffe6c9" />
      <directionalLight
        ref={sun}
        position={[pos.x, pos.y, pos.z]}
        intensity={4.3}
        color={SUN_COLOR}
        castShadow={shadows}
        shadow-mapSize={[shadowSize, shadowSize]}
        shadow-bias={-0.0006}
        shadow-normalBias={0.6}
        shadow-camera-left={-340}
        shadow-camera-right={340}
        shadow-camera-top={330}
        shadow-camera-bottom={-330}
        shadow-camera-near={40}
        shadow-camera-far={1300}
      />
    </>
  );
}

function World3D({ world, divisions, tier }: { world: World; divisions: ClientDivision[]; tier: QualityTier }) {
  const q = QUALITY[tier];
  return (
    <>
      <SkyDome />
      <Lights shadowSize={q.shadowSize} shadows={q.shadows} />
      <Suspense fallback={null}>
        <Environment resolution={128} frames={1}>
          <SkyDome />
          <mesh position={[0, -40, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={400}>
            <planeGeometry />
            <meshBasicMaterial color="#2f7a78" />
          </mesh>
          <mesh position={[120, 60, 100]} scale={[120, 60, 1]}>
            <planeGeometry />
            <meshBasicMaterial color={new THREE.Color(4, 2.9, 1.9)} side={THREE.DoubleSide} />
          </mesh>
        </Environment>
      </Suspense>
      <Terrain world={world} />
      <Ocean world={world} />
      <Paths world={world} />
      <Foliage world={world} palms={q.palms} bushes={q.bushes} rocks={q.rocks} shadows={q.shadows} />
      <Waterfalls world={world} />
      <Harbour world={world} shadows={q.shadows} />
      <Helipad world={world} shadows={q.shadows} />
      {divisions.map((d) => (
        <Building key={d.id} division={d} shadows={q.shadows} />
      ))}
      <Pulses world={world} />
      <Clouds />
      <SceneClock />
      <ReadySignal />
      <PlateProjector divisions={divisions} />
      <CameraRig world={world} divisions={divisions} />
    </>
  );
}

/** N8AO gamma-corrects by default, which double-corrects inside this effect chain. */
function disableAoGamma(pass: { configuration?: { gammaCorrection: boolean } } | null) {
  if (pass?.configuration) pass.configuration.gammaCorrection = false;
}

function Effects({ tier }: { tier: QualityTier }) {
  const q = QUALITY[tier];
  if (!q.post) return null;
  return q.ao ? (
    <EffectComposer multisampling={4} enableNormalPass={false}>
      <N8AO
        ref={disableAoGamma}
        aoRadius={5}
        intensity={1.6}
        distanceFalloff={1.2}
        quality="performance"
        halfRes
      />
      <Bloom mipmapBlur intensity={0.62} luminanceThreshold={1} luminanceSmoothing={0.3} radius={0.72} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <BrightnessContrast brightness={0.01} contrast={0.1} />
      <HueSaturation saturation={0.22} />
      <Vignette offset={0.32} darkness={0.42} />
    </EffectComposer>
  ) : (
    <EffectComposer multisampling={0}>
      <Bloom mipmapBlur intensity={0.55} luminanceThreshold={1} luminanceSmoothing={0.3} radius={0.65} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <BrightnessContrast brightness={0.01} contrast={0.1} />
      <HueSaturation saturation={0.2} />
    </EffectComposer>
  );
}

export function HQScene({ divisions }: { divisions: ClientDivision[] }) {
  const tier = useHQ((s) => s.quality);
  const setQuality = useHQ((s) => s.setQuality);
  const setLoad = useHQ((s) => s.setLoad);
  const [world, setWorld] = useState<World | null>(null);
  const [hidden, setHidden] = useState(false);
  const q = QUALITY[tier];
  // Terrain and foliage density are chosen once at load: rebuilding mid-session would
  // visibly reshape the island. Later downgrades reduce post-processing and pixel ratio.
  const [initialRes] = useState(q.terrainRes);
  const [loadTier] = useState(tier);

  useEffect(() => {
    let cancelled = false;
    // A paint between stages keeps the loading bar honest.
    const stage = () => new Promise<void>((resolve) => setTimeout(resolve, 30));
    (async () => {
      setLoad(12, "Charting the island");
      await stage();
      const built = buildWorld(divisions, initialRes);
      if (cancelled) return;
      setLoad(58, "Raising the pavilions");
      await stage();
      setWorld(built);
      setLoad(84, "Planting the palms");
    })();
    return () => {
      cancelled = true;
    };
  }, [divisions, initialRes, setLoad]);

  useEffect(() => {
    const onVisibility = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const aspect = typeof window === "undefined" ? 1.7 : window.innerWidth / Math.max(1, window.innerHeight);
  const start = overviewPose(aspect);

  if (!world) return null;
  return (
    <Canvas
      className="hq-canvas"
      shadows={q.shadows ? "soft" : false}
      flat={q.post}
      dpr={q.dpr}
      frameloop={hidden ? "never" : "always"}
      gl={{ antialias: !q.post, powerPreference: "high-performance", stencil: false, preserveDrawingBuffer: false }}
      camera={{ fov: FOV, near: 2, far: 4000, position: [start[0], start[1], start[2]] }}
      onCreated={({ gl, scene }) => {
        scene.fog = new THREE.FogExp2(HAZE_COLOR, 0.00034);
        if (!q.post) gl.toneMapping = THREE.ACESFilmicToneMapping;
      }}
      aria-hidden="true"
    >
      <PerformanceMonitor
        flipflops={2}
        onDecline={() => {
          const s = useHQ.getState();
          if (s.quality === "high") setQuality("medium");
          else if (s.quality === "medium" && !/quality=/.test(window.location.search)) setQuality("low");
        }}
      />
      <World3D world={world} divisions={divisions} tier={loadTier} />
      <Effects tier={tier} />
    </Canvas>
  );
}
