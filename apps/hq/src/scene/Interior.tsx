"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { agentStateOf, clock, useHQ } from "../store";
import type { AgentStatus, ClientAgent, ClientDivision } from "../types";
import { applyPose, createRig, emptyPose, poseTarget, type Pose } from "./character";
import { buildInterior, type InteriorLayout, type Slot } from "./interiors";
import { agentPositions, QUALITY } from "./shared";
import { floorTexture, softGlowTexture } from "./textures";
import { STUDIO_POLYGON } from "./buildingKit";
import { GeoBuilder } from "./geo";

/** Which spot each agent is heading for, derived from status. Unique per zone. */
function assignSlots(agents: ClientAgent[], statuses: Record<string, AgentStatus>, layout: InteriorLayout) {
  const out = new Map<string, { slot: Slot; pose: Pose }>();
  let meetingIndex = 0;
  let loungeIndex = 0;
  agents.forEach((agent, agentIndex) => {
    const status = statuses[agent.id] ?? agent.status;
    const desk: Slot =
      layout.desks[agent.homeDesk % Math.max(1, layout.desks.length)] ??
      layout.desks[0] ?? { x: 0, z: 0, ry: 0 };
    // More agents than desks: extras stand and work around the room's hubs.
    const overflow = agent.homeDesk >= layout.desks.length;
    const hub = layout.hubs[agentIndex % Math.max(1, layout.hubs.length)] ?? { x: 0, z: 0 };
    const home: Slot = overflow ? { x: hub.x + agentIndex * 0.3, z: hub.z, ry: 0, standing: true } : desk;

    switch (status) {
      case "meeting": {
        const slot = layout.meeting[meetingIndex++];
        if (slot) out.set(agent.id, { slot, pose: slot.standing ? "talk" : "sitTalk" });
        else out.set(agent.id, { slot: home, pose: home.seated === false ? "stand" : "type" });
        break;
      }
      case "idle": {
        const slot = layout.lounge[loungeIndex++];
        if (slot) out.set(agent.id, { slot, pose: "lounge" });
        else out.set(agent.id, { slot: { ...home, standing: true }, pose: "stand" });
        break;
      }
      case "blocked": {
        const bx = home.x - Math.sin(home.ry) * 1.3;
        const bz = home.z - Math.cos(home.ry) * 1.3;
        out.set(agent.id, { slot: { x: bx, z: bz, ry: home.ry, standing: true }, pose: "blocked" });
        break;
      }
      default:
        if (home.present) out.set(agent.id, { slot: home, pose: "present" });
        else if (overflow) out.set(agent.id, { slot: home, pose: "stand" });
        else out.set(agent.id, { slot: home, pose: "type" });
    }
  });
  return out;
}

function walkRoute(from: THREE.Vector3, slot: Slot, hubs: InteriorLayout["hubs"]): THREE.Vector3[] {
  const nearest = (x: number, z: number) => {
    let best = hubs[0];
    let bestD = Infinity;
    for (const h of hubs) {
      const d = Math.hypot(h.x - x, h.z - z);
      if (d < bestD) {
        bestD = d;
        best = h;
      }
    }
    return best;
  };
  const route: THREE.Vector3[] = [];
  const direct = Math.hypot(slot.x - from.x, slot.z - from.z);
  const a = nearest(from.x, from.z);
  const b = nearest(slot.x, slot.z);
  if (direct > 5) {
    if (a) route.push(new THREE.Vector3(a.x, 0, a.z));
    if (b && b !== a) route.push(new THREE.Vector3(b.x, 0, b.z));
  }
  // Approach from behind the seat, so nobody walks through a desk.
  const backX = slot.x - Math.sin(slot.ry) * 1.25;
  const backZ = slot.z - Math.cos(slot.ry) * 1.25;
  if (!slot.standing) route.push(new THREE.Vector3(backX, 0, backZ));
  route.push(new THREE.Vector3(slot.x, 0, slot.z));
  return route;
}

const WALK_SPEED = 3.1;

function Character({
  agent,
  target,
  floorY,
  worldBase,
  scale,
  rotation,
  hubs,
  contentScale,
}: {
  agent: ClientAgent;
  target: { slot: Slot; pose: Pose };
  floorY: number;
  worldBase: THREE.Vector3;
  scale: number;
  rotation: number;
  hubs: InteriorLayout["hubs"];
  contentScale: number;
}) {
  const rig = useMemo(() => createRig(agent.appearance), [agent.appearance]);
  const pose = useMemo(emptyPose, []);
  const phase = useMemo(() => (agent.id.charCodeAt(0) * 0.37 + agent.id.length) % 6.28, [agent.id]);
  const route = useRef<THREE.Vector3[]>([]);
  const lastTarget = useRef<Slot | null>(null);
  const selectAgent = useHQ((s) => s.selectAgent);
  const setHovered = useHQ((s) => s.setHoveredAgent);
  const isHovered = useHQ((s) => s.hoveredAgentId === agent.id);
  const isSelected = useHQ((s) => s.selectedAgentId === agent.id);
  const reduced = useHQ((s) => s.reducedMotion);
  const blocked = target.pose === "blocked";
  const ringRef = useRef<THREE.Mesh>(null);
  const { camera } = useThree();
  const worldPos = useMemo(() => new THREE.Vector3(), []);

  // First placement: already at their spot, no walking in from nowhere.
  useEffect(() => {
    rig.root.position.set(target.slot.x, 0, target.slot.z);
    rig.root.rotation.y = target.slot.ry;
    lastTarget.current = target.slot;
    return () => {
      agentPositions.delete(agent.id);
    };
    // Runs once per rig; later slot changes walk instead.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rig]);

  useEffect(() => {
    if (lastTarget.current === target.slot) return;
    lastTarget.current = target.slot;
    if (reduced) {
      rig.root.position.set(target.slot.x, 0, target.slot.z);
      rig.root.rotation.y = target.slot.ry;
      route.current = [];
    } else {
      route.current = walkRoute(rig.root.position, target.slot, hubs);
    }
  }, [target.slot, hubs, reduced, rig]);

  useFrame((_, delta) => {
    const dt = useHQ.getState().paused ? 0 : Math.min(delta, 0.05);
    const t = clock.t;
    let current: Pose = target.pose;
    if (route.current.length > 0) {
      current = "walk";
      const next = route.current[0] as THREE.Vector3;
      const dx = next.x - rig.root.position.x;
      const dz = next.z - rig.root.position.z;
      const dist = Math.hypot(dx, dz);
      const step = WALK_SPEED * dt;
      if (dist <= step + 0.02) {
        rig.root.position.x = next.x;
        rig.root.position.z = next.z;
        route.current.shift();
      } else {
        rig.root.position.x += (dx / dist) * step;
        rig.root.position.z += (dz / dist) * step;
      }
      if (dist > 0.05 && dt > 0) {
        const want = Math.atan2(dx, dz);
        const diff = ((want - rig.root.rotation.y + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
        rig.root.rotation.y += diff * Math.min(1, dt * 7);
      }
    } else if (dt > 0) {
      const diff = ((target.slot.ry - rig.root.rotation.y + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      rig.root.rotation.y += diff * Math.min(1, dt * 5);
    }
    poseTarget(current, t, phase, pose);
    applyPose(rig, pose, dt === 0 ? 0 : Math.min(1, dt * 7));

    // Store world position for the camera's drill-down.
    const c = Math.cos(rotation);
    const s = Math.sin(rotation);
    worldPos.set(
      worldBase.x + (rig.root.position.x * c + rig.root.position.z * s) * scale * contentScale,
      worldBase.y + (floorY + 2) * scale,
      worldBase.z + (-rig.root.position.x * s + rig.root.position.z * c) * scale * contentScale,
    );
    agentPositions.set(agent.id, worldPos);

    rig.detail.visible = camera.position.distanceTo(worldPos) < 110;
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 0.6;
      const pulse = 1 + Math.sin(t * 3) * 0.04;
      ringRef.current.scale.set(pulse, pulse, 1);
    }
  });

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > 5) return;
    e.stopPropagation();
    selectAgent(agent.id);
  };

  return (
    <primitive object={rig.root}>
      <mesh
        position={[0, 1.7, 0]}
        visible={false}
        onClick={onClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(agent.id);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(null);
          document.body.style.cursor = "";
        }}
      >
        <capsuleGeometry args={[0.85, 2.4, 2, 8]} />
      </mesh>
      {/* Contact shadow, cheap and steady under every figure. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} raycast={() => undefined} renderOrder={2}>
        <circleGeometry args={[0.75, 18]} />
        <meshBasicMaterial color="#2c1a0e" transparent opacity={0.3} depthWrite={false} />
      </mesh>
      {isHovered || isSelected ? (
        <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.07, 0]} raycast={() => undefined}>
          <ringGeometry args={[1, 1.22, 40]} />
          <meshBasicMaterial color={isSelected ? new THREE.Color(2.6, 1.9, 0.85) : new THREE.Color(0.6, 2.2, 2.1)} toneMapped={false} side={THREE.DoubleSide} />
        </mesh>
      ) : null}
      {blocked ? (
        <sprite position={[0, 4.15, 0]} scale={[0.6, 0.6, 1]} raycast={() => undefined}>
          <spriteMaterial map={softGlowTexture()} color={new THREE.Color(3, 1.65, 0.3)} toneMapped={false} depthWrite={false} />
        </sprite>
      ) : null}
    </primitive>
  );
}

/** Keeps demo life in the public tour, which receives no agent state from the server. */
function useAgentStatuses(agents: ClientAgent[]): Record<string, AgentStatus> {
  const feed = useHQ((s) => s.feed);
  const paused = useHQ((s) => s.paused);
  const owner = feed?.mode === "owner";
  const [ambient, setAmbient] = useState<Record<string, AgentStatus>>({});

  useEffect(() => {
    if (owner || paused || agents.length === 0) return;
    const cycle: AgentStatus[] = ["working", "meeting", "idle", "working"];
    const timer = setInterval(() => {
      const who = agents[Math.floor(Math.random() * agents.length)];
      if (!who) return;
      setAmbient((prev) => {
        const current = prev[who.id] ?? who.status;
        const next = cycle[(cycle.indexOf(current) + 1) % cycle.length] ?? "working";
        return { ...prev, [who.id]: next };
      });
    }, 6000);
    return () => clearInterval(timer);
  }, [agents, owner, paused]);

  if (!owner) return ambient;
  const fromFeed: Record<string, AgentStatus> = {};
  for (const a of agents) {
    const state = agentStateOf(feed, a.id);
    if (state) fromFeed[a.id] = state.status;
  }
  return fromFeed;
}

export function Interior({ division, floorY }: { division: ClientDivision; floorY: number }) {
  const { building, agents, staffed } = division;
  const layout = useMemo(() => buildInterior(building.footprint, building.interior), [building.footprint, building.interior]);
  const floorGeo = useMemo(() => {
    const g = new GeoBuilder();
    const color = "#ffffff";
    if (building.footprint === "angular") {
      g.polygon(STUDIO_POLYGON, 0.03, 0.005, color);
    } else if (layout.floor.kind === "circles") {
      for (const c of layout.floor.circles) g.cyl(c.r - 0.2, c.r - 0.2, 0.03, c.x, 0.02, c.z, color, 48);
    }
    const out = g.build();
    // Planar uvs from world position: the stone runs under the whole room.
    const pos = out.getAttribute("position") as THREE.BufferAttribute | undefined;
    if (pos) {
      const uv = new Float32Array(pos.count * 2);
      for (let i = 0; i < pos.count; i++) {
        uv[i * 2] = pos.getX(i) * 0.05;
        uv[i * 2 + 1] = pos.getZ(i) * 0.05;
      }
      out.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
    }
    return out;
  }, [building.footprint, layout]);

  const quality = useHQ((s) => s.quality);
  const onFloor = useMemo(
    () => agents.slice(0, Math.min(staffed, QUALITY[quality].maxCharacters)),
    [agents, staffed, quality],
  );
  const statusesFromFeed = useAgentStatuses(onFloor);
  const assignments = useMemo(
    () => assignSlots(onFloor, statusesFromFeed, layout),
    // The feed produces a new object each poll; key on its contents.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onFloor, JSON.stringify(statusesFromFeed), layout],
  );
  const worldBase = useMemo(() => new THREE.Vector3(building.x, building.elevation, building.z), [building]);

  return (
    <group position={[0, floorY, 0]}>
      <mesh geometry={floorGeo} receiveShadow raycast={() => undefined}>
        <meshStandardMaterial vertexColors map={floorTexture()} roughness={0.36} metalness={0.05} />
      </mesh>
      <group scale={layout.contentScale}>
      <mesh geometry={layout.solid} castShadow={false} receiveShadow raycast={() => undefined}>
        <meshStandardMaterial vertexColors roughness={0.62} emissive="#2c1a0c" emissiveIntensity={0.28} />
      </mesh>
      <mesh geometry={layout.lit} raycast={() => undefined}>
        <meshBasicMaterial vertexColors color={new THREE.Color(2.4, 2.1, 1.7)} toneMapped={false} />
      </mesh>
      {layout.screens.map((s, i) => (
        <mesh key={i} position={[s.x, s.y, s.z]} rotation={[0, s.ry, 0]} raycast={() => undefined}>
          <planeGeometry args={[s.w, s.h]} />
          <meshBasicMaterial map={s.texture} side={THREE.DoubleSide} color={new THREE.Color(1.12, 1.12, 1.12)} />
        </mesh>
      ))}
      {layout.mTable ? <MTable x={layout.mTable.x} z={layout.mTable.z} /> : null}
      {division.status !== "planned" ? (
        <pointLight position={[layout.light.x, layout.light.y, layout.light.z]} distance={layout.light.distance} intensity={34} decay={1.1} color="#ffd6a0" />
      ) : null}
      {onFloor.map((agent) => {
        const target = assignments.get(agent.id);
        if (!target) return null;
        return (
          <Character
            key={agent.id}
            agent={agent}
            target={target}
            floorY={floorY}
            worldBase={worldBase}
            scale={building.scale}
            rotation={building.rotation}
            hubs={layout.hubs}
            contentScale={layout.contentScale}
          />
        );
      })}
      </group>
    </group>
  );
}

function MTable({ x, z }: { x: number; z: number }) {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    const s = 0.82;
    const t = 0.28;
    shape.moveTo(-s, -s);
    shape.lineTo(-s, s);
    shape.lineTo(-s + t, s);
    shape.lineTo(0, 0);
    shape.lineTo(s - t, s);
    shape.lineTo(s, s);
    shape.lineTo(s, -s);
    shape.lineTo(s - t, -s);
    shape.lineTo(s - t, s * 0.36);
    shape.lineTo(0, -s * 0.45);
    shape.lineTo(-s + t, s * 0.36);
    shape.lineTo(-s + t, -s);
    shape.closePath();
    return new THREE.ExtrudeGeometry(shape, { depth: 0.08, bevelEnabled: false }).rotateX(-Math.PI / 2);
  }, []);
  return (
    <mesh geometry={geometry} position={[x, 1, z]} raycast={() => undefined}>
      <meshBasicMaterial color={new THREE.Color(2.8, 2.5, 2)} toneMapped={false} />
    </mesh>
  );
}
