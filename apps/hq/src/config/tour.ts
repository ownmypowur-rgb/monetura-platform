import type { TourStep } from "../types";
import { ORCHESTRATOR_NAME } from "./brand";

/**
 * The guided tour script. Edit stops, captions, timings and packet hops here;
 * no scene code changes needed. Captions are public: keep them free of client
 * names and private detail.
 */
export const TOUR_STEPS: TourStep[] = [
  {
    id: "overview",
    divisionId: null,
    roofOff: false,
    stage: "Upload",
    caption: "A member comes home from a trip and uploads their photos and video. Every project starts here.",
    durationSec: 7,
    packet: { from: "client-success", to: "atlas-command" },
  },
  {
    id: "atlas",
    divisionId: "atlas-command",
    roofOff: true,
    stage: "Intake",
    caption: `${ORCHESTRATOR_NAME} opens the project, checks the upload and routes the work to the right team.`,
    durationSec: 8,
    packet: { from: "atlas-command", to: "content-studio" },
  },
  {
    id: "studio",
    divisionId: "content-studio",
    roofOff: true,
    stage: "Production",
    caption: "In the Content Studio, specialists tag the media, cut the reels, enhance the photos and draft the captions.",
    durationSec: 11,
    packet: { from: "content-studio", to: "research-centre" },
  },
  {
    id: "research",
    divisionId: "research-centre",
    roofOff: true,
    stage: "Research",
    caption: "The Research Centre adds destination facts and storytelling angles, each one sourced and checked.",
    durationSec: 8,
    packet: { from: "research-centre", to: "story-lab" },
  },
  {
    id: "story",
    divisionId: "story-lab",
    roofOff: true,
    stage: "Review & approval",
    caption: "The Story Lab shapes the narrative. Quality checks and human approval happen before anything leaves the island.",
    durationSec: 8,
    packet: { from: "story-lab", to: "publishing-hub" },
  },
  {
    id: "publishing",
    divisionId: "publishing-hub",
    roofOff: true,
    stage: "Publishing",
    caption: "Approved content is scheduled for each channel. Nothing posts without the approvals set for that workflow.",
    durationSec: 8,
    packet: { from: "publishing-hub", to: "strategy-growth" },
  },
  {
    id: "return",
    divisionId: null,
    roofOff: false,
    stage: "Performance",
    caption: "Performance data returns to Strategy & Growth, and the next trip's content starts smarter.",
    durationSec: 8,
  },
];
