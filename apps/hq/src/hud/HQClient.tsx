"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { detectQuality } from "../scene/shared";
import { useHQ } from "../store";
import type { WorldData } from "../types";
import { AgentCard, DepartmentBar, LiveOps, LoadingScreen, Nameplates, OverlayPanel, Roster, StatsStrip, ToolBar, TopBar } from "./HUD";
import { useFeed } from "./useFeed";
import { TourControls, useTourDirector } from "./TourDirector";

const HQScene = dynamic(() => import("../scene/HQScene").then((m) => m.HQScene), { ssr: false });

function webglAvailable(): boolean {
  try {
    const c = document.createElement("canvas");
    return Boolean(c.getContext("webgl2") ?? c.getContext("webgl"));
  } catch {
    return false;
  }
}

export function HQClient({ world }: { world: WorldData }) {
  const setWorld = useHQ((s) => s.setWorld);
  const setReducedMotion = useHQ((s) => s.setReducedMotion);
  const setQuality = useHQ((s) => s.setQuality);
  const goBack = useHQ((s) => s.goBack);
  const stopTour = useHQ((s) => s.stopTour);
  const setPaused = useHQ((s) => s.setPaused);
  const setReady = useHQ((s) => s.setReady);
  const reduced = useHQ((s) => s.reducedMotion);
  const [configured, setConfigured] = useState(false);
  const [noWebgl, setNoWebgl] = useState(false);
  const [clean, setClean] = useState(false);

  useEffect(() => {
    setWorld(world);
    setQuality(detectQuality());
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(media.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    media.addEventListener("change", onChange);
    if (!webglAvailable()) {
      setNoWebgl(true);
      setReady();
    }
    setClean(new URLSearchParams(window.location.search).get("hud") === "0");
    setConfigured(true);
    return () => media.removeEventListener("change", onChange);
  }, [world, setWorld, setQuality, setReducedMotion, setReady]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const s = useHQ.getState();
      if (s.tour.active) {
        setPaused(false);
        stopTour();
      } else {
        goBack();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goBack, stopTour, setPaused]);

  useFeed(world.mode);
  useTourDirector();

  return (
    <main className={`hq-root ${reduced ? "reduced" : ""}`}>
      <h1 className="sr-only">Monetura Corporate Headquarters</h1>
      {configured && !noWebgl ? <HQScene divisions={world.divisions} /> : null}
      {noWebgl ? (
        <div className="absolute inset-0 grid place-items-center p-6 text-center bg-[#2C2420]">
          <p className="text-sm text-[#E8DCCB] max-w-sm">This device can&apos;t show the 3D island, but everything else is available from the menu and the department bar.</p>
        </div>
      ) : null}
      <div className={`hud-layer ${clean ? "hidden" : ""}`}>
        <Nameplates />
        <TopBar />
        <LiveOps />
        <Roster />
        <AgentCard />
        <StatsStrip />
        <ToolBar />
        <DepartmentBar />
        <TourControls />
        <OverlayPanel />
      </div>
      <LoadingScreen />
    </main>
  );
}
