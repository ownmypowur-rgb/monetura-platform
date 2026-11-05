import { COUNTERS, DIVISION_STATS } from "../config/counters";
import { ORCHESTRATOR_NAME } from "../config/brand";
import { TOUR_STEPS } from "../config/tour";
import { DIVISIONS, type RegistryDivision } from "../registry";
import type { ClientDivision, WorldData } from "../types";

/** How many of a division's agents are on the floor, from its status. */
export function staffedCount(division: RegistryDivision): number {
  if (division.fullyStaffed || division.status === "live") return division.agents.length;
  if (division.status === "building") return Math.ceil(division.agents.length / 2);
  return 0;
}

export function staffedAgents(division: RegistryDivision) {
  return division.agents.slice(0, staffedCount(division));
}

/** Full registry for the authenticated owner page. */
export function ownerWorld(): WorldData {
  const divisions: ClientDivision[] = DIVISIONS.map((d) => ({
    id: d.id,
    name: d.name,
    subtitle: d.subtitle,
    icon: d.icon,
    building: d.building,
    status: d.status,
    description: d.description,
    nextUp: d.nextUp,
    group: d.group,
    staffed: staffedCount(d),
    agents: d.agents.map((a) => ({ ...a })),
  }));
  return {
    mode: "owner",
    orchestratorName: ORCHESTRATOR_NAME,
    divisions,
    counters: COUNTERS,
    divisionStats: DIVISION_STATS,
    tour: TOUR_STEPS,
  };
}

/**
 * The server-side public projection. An explicit allowlist: new private fields on
 * the registry stay private by default. No agent names, ids, specialties, models,
 * tools or roadmap notes; only what's needed to draw staffed figures with a role.
 */
export function publicWorld(): WorldData {
  const divisions: ClientDivision[] = DIVISIONS.map((d) => ({
    id: d.id,
    name: d.name,
    subtitle: d.subtitle,
    icon: d.icon,
    building: d.building,
    status: d.status,
    description: d.description,
    group: d.group,
    staffed: staffedCount(d),
    agents: staffedAgents(d).map((a, i) => ({
      id: `${d.id}-${i}`,
      role: a.role,
      status: a.status,
      appearance: a.appearance,
      homeDesk: a.homeDesk,
    })),
  }));
  return {
    mode: "public",
    orchestratorName: ORCHESTRATOR_NAME,
    divisions,
    counters: COUNTERS,
    divisionStats: DIVISION_STATS,
    tour: TOUR_STEPS,
  };
}
