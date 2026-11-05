"use client";

import { useEffect, useRef } from "react";
import { useHQ } from "../store";
import { Icon } from "./Icon";

/** Runs the scripted tour: flies to each stop, sends the packet, advances on a timer. */
export function useTourDirector() {
  const active = useHQ((s) => s.tour.active);
  const playing = useHQ((s) => s.tour.playing);
  const index = useHQ((s) => s.tour.index);
  const nonce = useHQ((s) => s.tour.nonce);
  const steps = useHQ((s) => s.world?.tour);
  const remaining = useRef(0);

  // Entering a step.
  useEffect(() => {
    if (!active || !steps) return;
    const step = steps[index];
    if (!step) return;
    const s = useHQ.getState();
    if (step.divisionId) {
      s.focusDivision(step.divisionId);
    } else {
      useHQ.setState({ selectedDivisionId: null, selectedAgentId: null, cameraMode: "overview", roofOpenId: null });
    }
    useHQ.setState({ rosterOpen: false });
    remaining.current = step.durationSec * 1000;
    let packetTimer: ReturnType<typeof setTimeout> | undefined;
    if (step.packet) {
      const { from, to } = step.packet;
      packetTimer = setTimeout(() => {
        useHQ.getState().addPulse(from, to, "packet", Math.max(3, step.durationSec - 2));
      }, 1100);
    }
    return () => {
      if (packetTimer) clearTimeout(packetTimer);
    };
  }, [active, index, nonce, steps]);

  // The clock for the current step; pausing keeps what's left.
  useEffect(() => {
    if (!active || !playing || !steps) return;
    const started = performance.now();
    const timer = setTimeout(() => {
      const s = useHQ.getState();
      if (index + 1 < steps.length) s.gotoTourStep(index + 1);
      else s.stopTour();
    }, remaining.current);
    return () => {
      clearTimeout(timer);
      remaining.current = Math.max(0, remaining.current - (performance.now() - started));
    };
  }, [active, playing, index, nonce, steps]);
}

export function TourControls() {
  const tour = useHQ((s) => s.tour);
  const steps = useHQ((s) => s.world?.tour ?? []);
  const setTourPlaying = useHQ((s) => s.setTourPlaying);
  const setPaused = useHQ((s) => s.setPaused);
  const gotoTourStep = useHQ((s) => s.gotoTourStep);
  const stopTour = useHQ((s) => s.stopTour);
  if (!tour.active) return null;
  const step = steps[tour.index];
  if (!step) return null;

  const toggle = () => {
    setTourPlaying(!tour.playing);
    setPaused(tour.playing);
  };
  const go = (next: number) => {
    setPaused(false);
    setTourPlaying(true);
    gotoTourStep(Math.min(steps.length - 1, Math.max(0, next)));
  };
  const exit = () => {
    setPaused(false);
    stopTour();
  };

  const btn = "w-9 h-9 rounded-full grid place-items-center text-[#FBF5ED] hover:bg-white/10 disabled:opacity-40";
  return (
    <div className="absolute left-1/2 -translate-x-1/2 bottom-[5.5rem] sm:bottom-[6.1rem] w-[min(92vw,44rem)] glass rounded-2xl px-4 py-3 fade-in" role="group" aria-label="Guided tour">
      <div className="flex items-center gap-2 mb-1.5" aria-hidden="true">
        {steps.map((s, i) => (
          <span key={s.id} className="flex-1 h-1 rounded-full" style={{ background: i <= tour.index ? "#D4A853" : "rgba(232,220,203,.22)" }} />
        ))}
      </div>
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[0.6875rem] tracking-[0.18em] uppercase text-[#D4A853]">
            {tour.index + 1} of {steps.length} · {step.stage}
          </p>
          <p className="text-sm sm:text-[0.95rem] leading-snug" aria-live="polite">{step.caption}</p>
        </div>
        <div className="flex items-center flex-none">
          <button type="button" className={btn} onClick={() => go(tour.index - 1)} disabled={tour.index === 0} aria-label="Previous stop">
            <Icon name="prev" size={17} />
          </button>
          <button type="button" className={`${btn} bg-[#D4A853] !text-[#2C2420] hover:!bg-[#E0B968]`} onClick={toggle} aria-label={tour.playing ? "Pause tour" : "Play tour"}>
            <Icon name={tour.playing ? "pause" : "play"} size={18} />
          </button>
          <button type="button" className={btn} onClick={() => go(tour.index + 1)} disabled={tour.index === steps.length - 1} aria-label="Next stop">
            <Icon name="next" size={17} />
          </button>
          <button type="button" className={btn} onClick={exit} aria-label="Exit tour">
            <Icon name="x" size={17} />
          </button>
        </div>
      </div>
    </div>
  );
}
