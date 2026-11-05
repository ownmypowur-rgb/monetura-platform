"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { clock, useHQ } from "../store";
import type { ClientDivision } from "../types";
import { buildBuilding } from "./buildingKit";
import { Interior } from "./Interior";
import { shadowState } from "./shared";
import { interiorGlowTexture } from "./textures";

const ROOF_SECONDS = 0.8;
const ROOF_LIFT = 13;

/** Glow by status: live is fully lit, building partly lit, planned dark. */
const GLOW: Record<ClientDivision["status"], number> = { live: 1.3, building: 1, planned: 0.16 };
const LED: Record<ClientDivision["status"], number> = { live: 2.2, building: 1.6, planned: 0.12 };
const GLASS: Record<ClientDivision["status"], { color: string; opacity: number }> = {
  live: { color: "#b8e2ea", opacity: 0.2 },
  building: { color: "#b8e2ea", opacity: 0.22 },
  planned: { color: "#6f96a6", opacity: 0.5 },
};

function letterM(size: number): THREE.BufferGeometry {
  const s = size / 2;
  const shape = new THREE.Shape();
  const t = size * 0.17;
  shape.moveTo(-s, -s);
  shape.lineTo(-s, s);
  shape.lineTo(-s + t * 0.9, s);
  shape.lineTo(0, -s * 0.05);
  shape.lineTo(s - t * 0.9, s);
  shape.lineTo(s, s);
  shape.lineTo(s, -s);
  shape.lineTo(s - t, -s);
  shape.lineTo(s - t, s * 0.42);
  shape.lineTo(0.06, -s * 0.62);
  shape.lineTo(-0.06, -s * 0.62);
  shape.lineTo(-s + t, s * 0.42);
  shape.lineTo(-s + t, -s);
  shape.closePath();
  return new THREE.ExtrudeGeometry(shape, { depth: 0.28, bevelEnabled: false });
}

interface Props {
  division: ClientDivision;
  shadows: boolean;
}

export function Building({ division, shadows }: Props) {
  const { building, status, id } = division;
  const geo = useMemo(() => buildBuilding(building.footprint, status), [building.footprint, status]);
  const focusDivision = useHQ((s) => s.focusDivision);
  const tourActive = useHQ((s) => s.tour.active);
  const isOpen = useHQ((s) => s.roofOpenId === id);
  const isSelected = useHQ((s) => s.selectedDivisionId === id);
  const reduced = useHQ((s) => s.reducedMotion);
  const { camera } = useThree();

  const roofGroup = useRef<THREE.Group>(null);
  const detailRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const roofGlowRef = useRef<THREE.Mesh>(null);
  const progress = useRef(0);
  const [interiorMounted, setInteriorMounted] = useState(false);
  const world = useMemo(() => new THREE.Vector3(building.x, building.elevation, building.z), [building]);

  const materials = useMemo(() => {
    const glow = interiorGlowTexture();
    const level = GLOW[status];
    const led = LED[status];
    const glass = GLASS[status];
    return {
      shell: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.58, metalness: 0.02 }),
      glass: new THREE.MeshStandardMaterial({
        color: glass.color,
        roughness: 0.06,
        metalness: 0.65,
        transparent: true,
        opacity: glass.opacity,
        envMapIntensity: 1.5,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
      glow: new THREE.MeshBasicMaterial({
        map: glow,
        color: new THREE.Color(level, level * 0.95, level * 0.88),
        side: THREE.DoubleSide,
      }),
      led: new THREE.MeshBasicMaterial({
        vertexColors: true,
        color: new THREE.Color(led, led, led),
        toneMapped: false,
      }),
      // Roof parts have their own clones so they fade independently per building.
      roof: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.58, metalness: 0.02 }),
      roofGlass: new THREE.MeshStandardMaterial({
        color: glass.color,
        roughness: 0.06,
        metalness: 0.65,
        transparent: true,
        opacity: glass.opacity,
        envMapIntensity: 1.5,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
      roofGlow: new THREE.MeshBasicMaterial({
        map: glow,
        color: new THREE.Color(level, level * 0.95, level * 0.88),
        side: THREE.DoubleSide,
        transparent: true,
      }),
      roofLed: new THREE.MeshBasicMaterial({
        vertexColors: true,
        color: new THREE.Color(led, led, led),
        toneMapped: false,
        transparent: true,
      }),
      sign: new THREE.MeshBasicMaterial({
        color: new THREE.Color(2.1, 1.42, 0.52),
        toneMapped: false,
        transparent: true,
      }),
      construction: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7, metalness: 0.2 }),
    };
  }, [status]);

  const signGeo = useMemo(() => (geo.sign ? letterM(geo.sign.size) : null), [geo.sign]);
  const baseGlassOpacity = GLASS[status].opacity;

  useEffect(() => {
    // Interiors mount before the lift starts so nothing pops in.
    if (isOpen || isSelected) setInteriorMounted(true);
  }, [isOpen, isSelected]);

  useFrame((_, delta) => {
    const target = isOpen ? 1 : 0;
    const before = progress.current;
    if (reduced) progress.current = target;
    else if (before !== target) {
      const step = Math.min(delta, 0.05) / ROOF_SECONDS;
      progress.current = target > before ? Math.min(target, before + step) : Math.max(target, before - step);
    }
    const p = progress.current;
    if (p !== before) {
      // Eased: gentle start and landing.
      const e = p * p * (3 - 2 * p);
      const roof = roofGroup.current;
      if (roof) {
        roof.position.y = e * ROOF_LIFT;
        roof.visible = p < 0.995;
      }
      const o = 1 - e;
      materials.roof.transparent = p > 0.001;
      materials.roof.opacity = o;
      materials.roof.depthWrite = p < 0.2;
      materials.roofGlass.opacity = baseGlassOpacity * o;
      materials.roofGlow.opacity = o;
      materials.roofLed.opacity = o;
      materials.sign.opacity = o;
      shadowState.dirtyFrames = Math.max(shadowState.dirtyFrames, 2);
      if (p === 0) setInteriorMounted(false);
    }
    // Cheap exterior LOD: the fine fittings only matter up close.
    if (detailRef.current) {
      detailRef.current.visible = camera.position.distanceTo(world) < 300;
    }
    if (glowRef.current) {
      // With a real interior showing, the fake lit plate gets out of the way.
      glowRef.current.visible = !interiorMounted;
      if (roofGlowRef.current) roofGlowRef.current.visible = !interiorMounted;
    }
    void clock;
  });

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > 5) return;
    e.stopPropagation();
    if (tourActive) return;
    focusDivision(id);
  };
  const onOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    document.body.style.cursor = "pointer";
  };
  const onOut = () => {
    document.body.style.cursor = "";
  };
  const handlers = isOpen
    ? {}
    : { onClick, onPointerOver: onOver, onPointerOut: onOut };

  return (
    <group position={[building.x, building.elevation, building.z]} rotation={[0, building.rotation, 0]} scale={building.scale}>
      <mesh geometry={geo.shell} material={materials.shell} castShadow={shadows} receiveShadow={shadows} {...handlers} />
      <mesh geometry={geo.shellGlass} material={materials.glass} raycast={() => undefined} renderOrder={3} />
      <mesh ref={glowRef} geometry={geo.glow} material={materials.glow} raycast={() => undefined} />
      <mesh ref={detailRef} geometry={geo.detail} material={materials.shell} castShadow={false} raycast={() => undefined} />
      <mesh geometry={geo.lights} material={materials.led} raycast={() => undefined} />
      {!geo.construction.getAttribute("position") ? null : (
        <mesh geometry={geo.construction} material={materials.construction} castShadow={shadows} raycast={() => undefined} />
      )}

      <group ref={roofGroup}>
        <mesh geometry={geo.roof} material={materials.roof} castShadow={shadows} {...handlers} />
        <mesh geometry={geo.roofGlass} material={materials.roofGlass} raycast={() => undefined} renderOrder={3} />
        <mesh ref={roofGlowRef} geometry={geo.roofGlow} material={materials.roofGlow} raycast={() => undefined} />
        <mesh geometry={geo.roofLights} material={materials.roofLed} raycast={() => undefined} />
        {signGeo && geo.sign ? (
          <mesh geometry={signGeo} material={materials.sign} position={[0, geo.sign.y, geo.sign.z]} raycast={() => undefined} />
        ) : null}
      </group>

      {interiorMounted ? <Interior division={division} floorY={geo.floorY} /> : null}
    </group>
  );
}
