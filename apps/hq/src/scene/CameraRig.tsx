"use client";

import { useEffect, useMemo, useRef } from "react";
import { CameraControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useHQ } from "../store";
import type { ClientDivision } from "../types";
import { footprintSize, type World } from "../world/world";
import { buildBuilding } from "./buildingKit";
import { agentPositions, exposeDebug } from "./shared";

/** Fly-to timing: the roof starts lifting as the camera settles. */
const ROOF_DELAY_MS = 800;
export const FOV = 44;

type Pose = [number, number, number, number, number, number];

/** The authored default: framed like the master render. Pulls back on tall screens. */
export function overviewPose(aspect: number): Pose {
  const k = aspect < 1.2 ? (1.35 / Math.max(0.45, aspect)) * 0.82 : 1;
  return [6, 196 * k, 292 * k, 6, 0, -36];
}

/** ?cam=px,py,pz,tx,ty,tz frames a clean hero shot, for stills and ads. */
function captureCamera(): Pose | null {
  if (typeof window === "undefined") return null;
  const raw = new URLSearchParams(window.location.search).get("cam");
  if (!raw) return null;
  const v = raw.split(",").map(Number);
  return v.length === 6 && v.every(Number.isFinite) ? (v as Pose) : null;
}

/** A composed, elevated isometric angle over this exact building. */
function focusPose(d: ClientDivision, aspect: number): Pose {
  const b = d.building;
  const f = footprintSize(b.footprint, b.scale);
  const halfV = THREE.MathUtils.degToRad(FOV / 2);
  const halfH = Math.atan(Math.tan(halfV) * aspect);
  // Fit the building with room for the HUD around it.
  const fit = Math.max(f.rx / Math.tan(halfH), (f.rz * 1.25) / Math.tan(halfV));
  const distance = fit * (b.footprint === "angular" ? 0.86 : 1) + (b.footprint === "angular" ? 2 : 6);
  const elevation = THREE.MathUtils.degToRad(b.footprint === "angular" ? 38 : 42);
  const azimuth = b.rotation * 0.5 + (b.x > 40 ? -0.18 : b.x < -40 ? 0.18 : 0);
  const ty = b.elevation + 2;
  // Screen-space lift: keep the room clear of the bottom HUD.
  const tz = b.z + f.rz * (b.footprint === "angular" ? 0.2 : 0.1);
  return [
    b.x + Math.sin(azimuth) * Math.cos(elevation) * distance,
    ty + Math.sin(elevation) * distance,
    tz + Math.cos(azimuth) * Math.cos(elevation) * distance,
    b.x,
    ty,
    tz,
  ];
}

export function CameraRig({ world, divisions }: { world: World; divisions: ClientDivision[] }) {
  const ref = useRef<CameraControls>(null);
  const { size, camera } = useThree();
  const selectedId = useHQ((s) => s.selectedDivisionId);
  const agentId = useHQ((s) => s.selectedAgentId);
  const overviewNonce = useHQ((s) => s.overviewNonce);
  const setRoofOpen = useHQ((s) => s.setRoofOpen);
  const reduced = useHQ((s) => s.reducedMotion);
  const setZoomTier = useHQ((s) => s.setZoomTier);
  const tourActive = useHQ((s) => s.tour.active);
  const tourIndex = useHQ((s) => s.tour.index);
  const tourNonce = useHQ((s) => s.tour.nonce);
  const worldData = useHQ((s) => s.world);
  const firstRun = useRef(true);
  const aspect = size.width / Math.max(1, size.height);

  const colliders = useMemo(
    () =>
      divisions.flatMap((d) =>
        buildBuilding(d.building.footprint, "planned").colliders.map((c) => ({
          id: d.id,
          x: d.building.x + c.x * Math.cos(d.building.rotation) + c.z * Math.sin(d.building.rotation),
          z: d.building.z - c.x * Math.sin(d.building.rotation) + c.z * Math.cos(d.building.rotation),
          r: c.r * d.building.scale,
          top: d.building.elevation + c.top * d.building.scale,
          floor: d.building.elevation,
        })),
      ),
    [divisions],
  );

  // Limits: no going under the ground or sea, zoom clamped, target kept on the island.
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    c.minDistance = 14;
    c.maxDistance = aspect < 1 ? 1100 : 640;
    c.maxPolarAngle = 1.38;
    c.minPolarAngle = 0.12;
    c.smoothTime = 0.85;
    c.draggingSmoothTime = 0.14;
    c.dollyToCursor = true;
    c.setBoundary(new THREE.Box3(new THREE.Vector3(-300, -2, -320), new THREE.Vector3(300, 110, 200)));
  }, [aspect]);

  // Selection drives the camera.
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const division = divisions.find((d) => d.id === selectedId);
    const animate = !reduced && !firstRun.current;
    firstRun.current = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (division) {
      const pose = focusPose(division, aspect);
      void c.setLookAt(...pose, animate);
      const step = tourActive ? worldData?.tour[tourIndex] : undefined;
      const wantsRoof = tourActive ? Boolean(step?.roofOff) : true;
      setRoofOpen(null);
      timer = setTimeout(() => {
        if (wantsRoof) setRoofOpen(division.id);
      }, animate ? ROOF_DELAY_MS : 0);
    } else if (animate || !captureCamera()) {
      void c.setLookAt(...overviewPose(aspect), animate);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
    // aspect handled separately so resizing doesn't re-fly mid-orbit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, overviewNonce, tourNonce, divisions, reduced]);

  // Agent drill-down: ease slightly toward them; deselecting eases back.
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const division = divisions.find((d) => d.id === selectedId);
    if (!division) return;
    if (agentId) {
      const p = agentPositions.get(agentId);
      if (!p) return;
      const [px, py, pz] = focusPose(division, aspect);
      const k = 0.3;
      void c.setLookAt(
        px + (p.x - px) * k,
        py + (p.y - py) * k,
        pz + (p.z - pz) * k,
        p.x,
        p.y,
        p.z,
        !reduced,
      );
    } else {
      void c.setLookAt(...focusPose(division, aspect), !reduced);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId]);

  const tmp = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    const c = ref.current;
    if (!c) return;
    // Hard floors for the camera: terrain, sea, and any closed building.
    const pos = camera.position;
    const openId = useHQ.getState().roofOpenId;
    const ground = Math.max(world.sample(pos.x, pos.z), 0) + 5;
    let minY = ground;
    for (const col of colliders) {
      const d = Math.hypot(pos.x - col.x, pos.z - col.z);
      if (d < col.r + 3) {
        const top = col.id === openId ? col.floor + 7 : col.top + 3;
        if (top > minY) minY = top;
      }
    }
    if (pos.y < minY) {
      c.getTarget(tmp);
      void c.setPosition(pos.x, minY, pos.z, false);
    }
    const distance = c.distance;
    const state = useHQ.getState();
    const tier: 0 | 1 | 2 = state.selectedDivisionId ? 2 : distance < 330 ? 1 : 0;
    if (tier !== state.zoomTier) setZoomTier(tier);
  });

  const initial = useMemo(() => overviewPose(aspect), [aspect]);
  useEffect(() => {
    exposeDebug();
    const c = ref.current;
    if (c && !useHQ.getState().selectedDivisionId) void c.setLookAt(...(captureCamera() ?? initial), false);
    // Only on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <CameraControls ref={ref} makeDefault />;
}
