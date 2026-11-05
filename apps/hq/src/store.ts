import { create } from "zustand";
import type { AgentState, Feed, OwnerFeed, PublicFeed, WorldData } from "./types";

export type Panel = "departments" | "team" | "projects" | "performance" | "approvals" | null;
export type CameraMode = "overview" | "focus";
export type QualityTier = "high" | "medium" | "low";

export interface Pulse {
  id: number;
  from: string;
  to: string;
  kind: "handoff" | "packet";
  startedAt: number;
  duration: number;
}

export interface TourState {
  active: boolean;
  playing: boolean;
  index: number;
  /** Bumped to restart the current step's timers and packet. */
  nonce: number;
}

interface HQState {
  world: WorldData | null;
  selectedDivisionId: string | null;
  selectedAgentId: string | null;
  hoveredAgentId: string | null;
  cameraMode: CameraMode;
  /** The building whose roof is lifted. */
  roofOpenId: string | null;
  /** 0 = overview, 1 = campus closer in, 2 = focused on a building. */
  zoomTier: 0 | 1 | 2;
  panel: Panel;
  rosterOpen: boolean;
  legendOpen: boolean;
  paused: boolean;
  reducedMotion: boolean;
  quality: QualityTier;
  loadProgress: number;
  loadLabel: string;
  ready: boolean;
  tour: TourState;
  feed: Feed | null;
  feedError: boolean;
  pulses: Pulse[];
  /** Bumped when the user asks to reset the camera to the overview. */
  overviewNonce: number;

  setWorld: (world: WorldData) => void;
  focusDivision: (id: string | null) => void;
  selectAgent: (id: string | null) => void;
  setHoveredAgent: (id: string | null) => void;
  goBack: () => void;
  goOverview: () => void;
  setPanel: (panel: Panel) => void;
  setRosterOpen: (open: boolean) => void;
  setLegendOpen: (open: boolean) => void;
  setZoomTier: (tier: 0 | 1 | 2) => void;
  setPaused: (paused: boolean) => void;
  setReducedMotion: (reduced: boolean) => void;
  setQuality: (quality: QualityTier) => void;
  setLoad: (progress: number, label: string) => void;
  setReady: () => void;
  setFeed: (feed: Feed) => void;
  setFeedError: (error: boolean) => void;
  addPulse: (from: string, to: string, kind: Pulse["kind"], duration?: number) => void;
  removePulse: (id: number) => void;
  startTour: () => void;
  stopTour: () => void;
  setTourPlaying: (playing: boolean) => void;
  gotoTourStep: (index: number) => void;
  setRoofOpen: (id: string | null) => void;
}

let pulseId = 1;

export const useHQ = create<HQState>((set, get) => ({
  world: null,
  selectedDivisionId: null,
  selectedAgentId: null,
  hoveredAgentId: null,
  cameraMode: "overview",
  roofOpenId: null,
  zoomTier: 0,
  panel: null,
  rosterOpen: true,
  legendOpen: false,
  paused: false,
  reducedMotion: false,
  quality: "high",
  loadProgress: 0,
  loadLabel: "Charting the island",
  ready: false,
  tour: { active: false, playing: false, index: 0, nonce: 0 },
  feed: null,
  feedError: false,
  pulses: [],
  overviewNonce: 0,

  setWorld: (world) => set({ world }),
  focusDivision: (id) =>
    set({
      selectedDivisionId: id,
      selectedAgentId: null,
      cameraMode: id ? "focus" : "overview",
      rosterOpen: true,
      panel: null,
    }),
  selectAgent: (id) => set({ selectedAgentId: id }),
  setHoveredAgent: (id) => set({ hoveredAgentId: id }),
  goBack: () => {
    const s = get();
    if (s.panel) return set({ panel: null });
    if (s.selectedAgentId) return set({ selectedAgentId: null });
    if (s.selectedDivisionId) {
      return set({ selectedDivisionId: null, cameraMode: "overview", roofOpenId: null });
    }
    return undefined;
  },
  goOverview: () =>
    set((s) => ({
      selectedDivisionId: null,
      selectedAgentId: null,
      cameraMode: "overview",
      roofOpenId: null,
      panel: null,
      overviewNonce: s.overviewNonce + 1,
    })),
  setPanel: (panel) => set({ panel }),
  setRosterOpen: (rosterOpen) => set({ rosterOpen }),
  setLegendOpen: (legendOpen) => set({ legendOpen }),
  setZoomTier: (zoomTier) => set({ zoomTier }),
  setPaused: (paused) => set({ paused }),
  setReducedMotion: (reducedMotion) => set({ reducedMotion }),
  setQuality: (quality) => set({ quality }),
  setLoad: (loadProgress, loadLabel) => set({ loadProgress, loadLabel }),
  setReady: () => set({ ready: true }),
  setFeed: (feed) => set({ feed, feedError: false }),
  setFeedError: (feedError) => set({ feedError }),
  addPulse: (from, to, kind, duration = 7) =>
    set((s) => ({
      pulses: [
        ...s.pulses.filter((p) => kind !== "packet" || p.kind !== "packet").slice(-11),
        { id: pulseId++, from, to, kind, startedAt: performance.now(), duration },
      ],
    })),
  removePulse: (id) => set((s) => ({ pulses: s.pulses.filter((p) => p.id !== id) })),
  startTour: () =>
    set((s) => ({
      tour: { active: true, playing: true, index: 0, nonce: s.tour.nonce + 1 },
      panel: null,
      selectedAgentId: null,
    })),
  stopTour: () =>
    set((s) => ({
      tour: { active: false, playing: false, index: 0, nonce: s.tour.nonce + 1 },
      selectedDivisionId: null,
      selectedAgentId: null,
      cameraMode: "overview",
      roofOpenId: null,
      overviewNonce: s.overviewNonce + 1,
      pulses: s.pulses.filter((p) => p.kind !== "packet"),
    })),
  setTourPlaying: (playing) => set((s) => ({ tour: { ...s.tour, playing } })),
  gotoTourStep: (index) => set((s) => ({ tour: { ...s.tour, index, nonce: s.tour.nonce + 1 } })),
  setRoofOpen: (roofOpenId) => set({ roofOpenId }),
}));

/* ---------- derived helpers ---------- */

export function ownerFeed(feed: Feed | null): OwnerFeed | null {
  return feed?.mode === "owner" ? feed : null;
}
export function publicFeed(feed: Feed | null): PublicFeed | null {
  return feed?.mode === "public" ? feed : null;
}
export function agentStateOf(feed: Feed | null, agentId: string): AgentState | undefined {
  return ownerFeed(feed)?.agents[agentId];
}

/**
 * Animation clock. Pausing stops this rather than the renderer, so the camera and
 * clicks still work while the water and people hold still.
 */
export const clock = { t: 0 };
