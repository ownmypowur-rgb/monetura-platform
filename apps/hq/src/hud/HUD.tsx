"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { BRAND } from "../config/brand";
import { plateElements } from "../scene/plates";
import { agentStateOf, ownerFeed, useHQ, type Panel } from "../store";
import type {
  AgentStatus,
  ClientAgent,
  ClientDivision,
  CounterValue,
  DivisionStatus,
  IconName,
  PendingApproval,
} from "../types";
import { Avatar, Icon, MMark } from "./Icon";

/* ---------- small shared pieces ---------- */

export function DemoBadge() {
  return <span className="demo-badge" title="From demo data, not real activity">Demo</span>;
}

function SourceBadge({ isDemo }: { isDemo: boolean }) {
  return isDemo ? <DemoBadge /> : <span className="live-badge"><span className="status-dot status-live" />Live</span>;
}

const STATUS_LABEL: Record<DivisionStatus, string> = { live: "Live", building: "In build", planned: "Planned" };
const AGENT_LABEL: Record<AgentStatus, string> = {
  working: "Working",
  meeting: "In a meeting",
  idle: "Idle",
  blocked: "Blocked",
  offline: "Offline",
};

function allAgents(divisions: ClientDivision[]) {
  return divisions.flatMap((d) => d.agents.map((a) => ({ agent: a, division: d })));
}

function useCounterValue(values: CounterValue[] | undefined, id: string) {
  return values?.find((v) => v.id === id);
}

/* ---------- Top bar ---------- */

const NAV: { id: Exclude<Panel, null | "approvals"> | "overview"; label: string; icon: IconName }[] = [
  { id: "overview", label: "Island Overview", icon: "island" },
  { id: "departments", label: "Departments", icon: "grid" },
  { id: "team", label: "Team", icon: "team" },
  { id: "projects", label: "Projects", icon: "projects" },
  { id: "performance", label: "Performance", icon: "chart" },
];

export function TopBar() {
  const world = useHQ((s) => s.world);
  const panel = useHQ((s) => s.panel);
  const setPanel = useHQ((s) => s.setPanel);
  const goOverview = useHQ((s) => s.goOverview);
  const selected = useHQ((s) => s.selectedDivisionId);
  const feed = useHQ((s) => s.feed);
  const stopTour = useHQ((s) => s.stopTour);
  const tourActive = useHQ((s) => s.tour.active);
  const [menuOpen, setMenuOpen] = useState(false);
  if (!world) return null;
  const owner = world.mode === "owner";
  const pending = ownerFeed(feed)?.pendingApprovals.length ?? 0;
  const atlas = world.divisions.flatMap((d) => d.agents)[0];

  const onNav = (id: (typeof NAV)[number]["id"]) => {
    setMenuOpen(false);
    if (id === "overview") {
      if (tourActive) stopTour();
      goOverview();
    } else {
      setPanel(panel === id ? null : id);
    }
  };

  return (
    <header className="absolute top-0 inset-x-0 glass !border-x-0 !border-t-0 flex items-center gap-2 lg:gap-5 px-3 lg:px-5 h-14 z-30">
      <div className="flex items-center gap-2.5 flex-none">
        <MMark size={32} />
        <div className="leading-none">
          <p className="font-display text-[1.32rem] tracking-[0.16em] uppercase">{BRAND.name}</p>
        </div>
      </div>
      <div className="hidden sm:block w-px h-8 bg-white/20" aria-hidden="true" />
      <div className="hidden sm:block leading-tight flex-none">
        <p className="text-[0.8125rem] font-medium">{BRAND.headquarters}</p>
        <p className="text-[0.6875rem] text-[#E8DCCB] flex items-center gap-1">
          <Icon name={owner ? "lock" : "globe"} size={11} />
          {owner ? BRAND.privateLabel : BRAND.publicLabel}
        </p>
      </div>

      <nav aria-label="Main" className="hidden xl:flex items-center gap-1 ml-2">
        {NAV.map((n) => {
          const on = n.id === "overview" ? !panel && !selected : panel === n.id;
          return (
            <button
              key={n.id}
              type="button"
              onClick={() => onNav(n.id)}
              aria-current={on ? "page" : undefined}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[0.8125rem] whitespace-nowrap border ${on ? "border-white/30 bg-white/10" : "border-transparent hover:bg-white/5"}`}
            >
              <Icon name={n.icon} size={16} />
              {n.label}
            </button>
          );
        })}
      </nav>

      <div className="ml-auto flex items-center gap-1.5 sm:gap-3 flex-none">
        <button
          type="button"
          className="xl:hidden rounded-full border border-white/25 px-3 py-1.5 text-xs"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-expanded={menuOpen}
          aria-controls="hq-mobile-nav"
        >
          Menu
        </button>
        {atlas ? (
          <div className="hidden md:flex items-center gap-2">
            <Avatar look={atlas.appearance} size={34} />
            <div className="leading-tight">
              <p className="text-[0.8125rem] font-medium">{world.orchestratorName}</p>
              <p className="text-[0.6875rem] text-[#E8DCCB]">Director</p>
            </div>
          </div>
        ) : null}
        {owner ? (
          <>
            <button
              type="button"
              className="relative w-9 h-9 grid place-items-center rounded-full hover:bg-white/10"
              onClick={() => setPanel(panel === "approvals" ? null : "approvals")}
              aria-label={`Approvals, ${pending} pending`}
            >
              <Icon name="bell" size={20} />
              {pending > 0 ? (
                <span className="absolute -top-0.5 -right-0.5 min-w-[1.05rem] h-[1.05rem] px-1 rounded-full bg-[#D4A853] text-[#2C2420] text-[0.625rem] font-bold grid place-items-center">
                  {pending}
                </span>
              ) : null}
            </button>
            <form method="post" action="/api/hq/logout" className="hidden sm:block">
              <button type="submit" className="text-[0.6875rem] text-[#E8DCCB] hover:text-white underline underline-offset-2">Sign out</button>
            </form>
          </>
        ) : null}
      </div>

      {menuOpen ? (
        <nav id="hq-mobile-nav" aria-label="Main" className="xl:hidden absolute top-14 right-2 glass rounded-xl p-2 flex flex-col min-w-[12rem] fade-in">
          {NAV.map((n) => (
            <button key={n.id} type="button" onClick={() => onNav(n.id)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-left hover:bg-white/10">
              <Icon name={n.icon} size={16} />
              {n.label}
            </button>
          ))}
        </nav>
      ) : null}
    </header>
  );
}

/* ---------- Live Operations ---------- */

export function LiveOps() {
  const world = useHQ((s) => s.world);
  const feed = useHQ((s) => s.feed);
  const setPanel = useHQ((s) => s.setPanel);
  const tourActive = useHQ((s) => s.tour.active);
  const [mobileOpen, setMobileOpen] = useState(false);
  if (!world) return null;
  const values = feed?.counters;
  const anyLive = values?.some((v) => !v.isDemo) ?? false;
  return (
    <section aria-label="Operations" className={`absolute left-3 top-[4.3rem] ${tourActive ? "hidden lg:block" : ""}`}>
      <button type="button" className="lg:hidden glass rounded-full px-3 py-1.5 text-xs flex items-center gap-1.5" onClick={() => setMobileOpen(!mobileOpen)} aria-expanded={mobileOpen}>
        <span className={`status-dot ${anyLive ? "status-live" : "status-building"}`} />
        Operations
      </button>
      <div className={`glass rounded-2xl w-56 p-3 mt-1 lg:mt-0 ${mobileOpen ? "block" : "hidden"} lg:block`}>
        <div className="flex items-center gap-2">
          <span className={`status-dot ${anyLive ? "status-live" : "status-building"}`} />
          <h2 className="text-sm font-semibold">{anyLive ? "Live Operations" : "Operations"}</h2>
          {anyLive ? null : <DemoBadge />}
        </div>
        <p className="text-[0.6875rem] text-[#E8DCCB] mb-1.5 ml-[1.05rem]">Today at {BRAND.name}</p>
        <ul>
          {world.counters.map((c) => {
            const v = values?.find((x) => x.id === c.id);
            return (
              <li key={c.id} className="border-t border-white/10">
                <button type="button" onClick={() => setPanel("performance")} className="w-full flex items-center gap-2.5 py-1.5 text-left rounded hover:bg-white/5">
                  <Icon name={c.icon} size={19} className="text-[#D4A853] flex-none" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[0.95rem] font-semibold leading-tight tabular-nums">{v ? v.value : "–"}</span>
                    <span className="block text-[0.6875rem] text-[#E8DCCB] leading-tight">{c.label}</span>
                  </span>
                  {v?.isDemo === false ? <span className="live-badge">Live</span> : <DemoBadge />}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

/* ---------- Department bar and stats ---------- */

export function DepartmentBar() {
  const world = useHQ((s) => s.world);
  const selected = useHQ((s) => s.selectedDivisionId);
  const focusDivision = useHQ((s) => s.focusDivision);
  const tourActive = useHQ((s) => s.tour.active);
  if (!world) return null;
  return (
    <nav aria-label="Departments" className="absolute bottom-2 left-1/2 -translate-x-1/2 max-w-[calc(100vw-1rem)]">
      <ul className="glass rounded-2xl flex gap-0.5 p-1.5 overflow-x-auto hq-scroll">
        {world.divisions.map((d) => {
          const on = selected === d.id;
          return (
            <li key={d.id} className="flex-none">
              <button
                type="button"
                onClick={() => focusDivision(d.id)}
                disabled={tourActive}
                aria-current={on ? "true" : undefined}
                aria-label={`${d.name}, ${STATUS_LABEL[d.status]}`}
                title={d.name}
                className={`relative w-[4.1rem] sm:w-[4.7rem] 2xl:w-[5.35rem] h-[3.6rem] rounded-xl flex flex-col items-center justify-center gap-0.5 border disabled:opacity-60 ${on ? "border-[#4FD8CF] bg-[#4FD8CF]/15" : "border-transparent hover:bg-white/10"}`}
              >
                <span className="relative">
                  <Icon name={d.icon} size={19} className={on ? "text-[#A9F0EA]" : "text-[#E8DCCB]"} />
                  <span className={`status-dot status-${d.status} absolute -top-0.5 -right-2 !w-2 !h-2`} />
                </span>
                <span className="text-[0.625rem] leading-[0.72rem] text-center px-0.5 line-clamp-2">{shortName(d.name)}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function shortName(name: string): string {
  return name.replace(" & E-commerce", "").replace(" & Concierge", "").replace(" & Compliance", "").replace(" & Integrations", "").replace("Business Intelligence", "Bus. Intelligence");
}

export function StatsStrip() {
  const world = useHQ((s) => s.world);
  const selected = useHQ((s) => s.selectedDivisionId);
  const feed = useHQ((s) => s.feed);
  const tourActive = useHQ((s) => s.tour.active);
  const division = world?.divisions.find((d) => d.id === selected);
  if (!world || !division || tourActive) return null;
  const config = world.divisionStats[division.id] ?? [];
  const values = feed?.divisionStats[division.id];
  const anyLive = values?.some((v) => !v.isDemo) ?? false;
  return (
    <section aria-label={`${division.name} stats`} className="absolute bottom-[5rem] left-1/2 -translate-x-1/2 w-[min(calc(100vw-1rem),66rem)] glass rounded-2xl px-4 py-2.5 flex items-center gap-4 fade-in overflow-x-auto hq-scroll">
      <div className="flex items-center gap-3 flex-none max-w-[17rem]">
        <span className="w-10 h-10 rounded-full border-2 border-[#D4A853] grid place-items-center text-[#D4A853] flex-none">
          <Icon name={division.icon} size={21} />
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-xl leading-tight truncate">{division.name}</h2>
          <p className="text-[0.6875rem] text-[#E8DCCB] leading-tight truncate">{division.subtitle}</p>
        </div>
      </div>
      <span className="flex-none">{anyLive ? <span className="live-badge">Live activity</span> : <span className="demo-badge">Demo activity</span>}</span>
      <div className="w-px h-9 bg-white/15 flex-none" aria-hidden="true" />
      <dl className="flex gap-5 flex-none">
        {config.map((c) => (
          <StatItem key={c.id} id={c.id} label={c.label} icon={c.icon} values={values} />
        ))}
      </dl>
    </section>
  );
}

function StatItem({ id, label, icon, values }: { id: string; label: string; icon: IconName; values: CounterValue[] | undefined }) {
  const v = useCounterValue(values, id);
  return (
    <div className="flex items-center gap-2">
      <Icon name={icon} size={20} className="text-[#E8DCCB]" />
      <div>
        <dd className="font-semibold text-[1.02rem] leading-tight tabular-nums">{v ? v.value : "–"}</dd>
        <dt className="text-[0.6875rem] text-[#E8DCCB] leading-tight whitespace-nowrap">{label}</dt>
      </div>
    </div>
  );
}

/* ---------- Roster ---------- */

function StatusNote({ division }: { division: ClientDivision }) {
  if (division.status === "live") return null;
  return (
    <div className="rounded-xl border border-white/15 p-2.5 mb-2">
      <p className="text-xs font-semibold flex items-center gap-1.5">
        <span className={`status-dot status-${division.status}`} />
        {STATUS_LABEL[division.status]}
      </p>
      <p className="text-xs text-[#E8DCCB] mt-1 leading-snug">{division.status === "building" && division.nextUp ? division.nextUp : division.description}</p>
    </div>
  );
}

export function Roster() {
  const world = useHQ((s) => s.world);
  const selected = useHQ((s) => s.selectedDivisionId);
  const open = useHQ((s) => s.rosterOpen);
  const setOpen = useHQ((s) => s.setRosterOpen);
  const selectAgent = useHQ((s) => s.selectAgent);
  const selectedAgent = useHQ((s) => s.selectedAgentId);
  const setPanel = useHQ((s) => s.setPanel);
  const feed = useHQ((s) => s.feed);
  const tourActive = useHQ((s) => s.tour.active);
  const division = world?.divisions.find((d) => d.id === selected);
  if (!world || !division) return null;
  if (tourActive && !open) return null;
  if (!open || selectedAgent) {
    if (selectedAgent) return null;
    return (
      <button type="button" className="absolute right-3 top-[4.3rem] glass rounded-full px-3 py-1.5 text-xs" onClick={() => setOpen(true)}>
        Show team
      </button>
    );
  }
  const owner = world.mode === "owner";
  const floor = division.agents.slice(0, division.staffed);
  const visible = owner ? division.agents : floor;
  return (
    <aside aria-label={`${division.name} team`} className="absolute right-3 top-[4.3rem] w-[min(21rem,calc(100vw-1.5rem))] max-h-[calc(100vh-14.5rem)] glass rounded-2xl flex flex-col fade-in max-sm:top-auto max-sm:bottom-[5rem] max-sm:max-h-[42vh]">
      <div className="flex items-center gap-2 px-3.5 pt-3 pb-2">
        <h2 className="text-[0.95rem] font-semibold flex-1 truncate">
          {division.name} Team <span className="text-[#E8DCCB] font-normal">({owner ? division.agents.length : floor.length})</span>
        </h2>
        <button type="button" className="w-7 h-7 grid place-items-center rounded-full hover:bg-white/10" onClick={() => setOpen(false)} aria-label="Hide team">
          <Icon name="x" size={15} />
        </button>
      </div>
      <div className="px-3.5 pb-3 overflow-y-auto hq-scroll">
        <StatusNote division={division} />
        {visible.length === 0 ? <p className="text-xs text-[#E8DCCB]">No team on the floor yet.</p> : null}
        <ul>
          {visible.map((a, i) => {
            const onFloor = i < division.staffed;
            const state = agentStateOf(feed, a.id);
            const status: AgentStatus = !onFloor ? "offline" : state?.status ?? a.status;
            return (
              <li key={a.id} className="border-t border-white/10 first:border-t-0">
                <button
                  type="button"
                  disabled={!onFloor && !owner}
                  onClick={() => selectAgent(a.id)}
                  className="w-full flex items-center gap-2.5 py-2 text-left rounded hover:bg-white/5"
                >
                  <span className="relative flex-none">
                    <Avatar look={a.appearance} size={38} />
                    <span className={`status-dot agent-${status} absolute bottom-0 right-0 border border-[#2C2420]`} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[0.8125rem] font-semibold leading-tight truncate">{a.name ?? a.role}</span>
                    {a.name ? <span className="block text-[0.6875rem] text-[#E8DCCB] leading-tight truncate">{a.role}</span> : null}
                    {owner ? (
                      <span className="block text-[0.6875rem] text-[#F1E6D2] leading-tight truncate">
                        {!onFloor ? "Planned role" : state?.taskTitle ?? AGENT_LABEL[status]}
                        {onFloor && state?.progress != null ? ` (${state.progress}%)` : ""}
                      </span>
                    ) : null}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <button type="button" onClick={() => setPanel("team")} className="mt-2 w-full rounded-lg border border-white/20 py-1.5 text-[0.8125rem] flex items-center justify-center gap-1.5 hover:bg-white/10">
          View Full Team <Icon name="arrow" size={14} />
        </button>
      </div>
    </aside>
  );
}

/* ---------- Agent card ---------- */

async function sendDecision(eventId: number, decision: "approved" | "rejected"): Promise<string | null> {
  try {
    const res = await fetch("/api/hq/approvals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId, decision }),
    });
    if (res.ok) return null;
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    return body?.error ?? "That didn't go through. Try again.";
  } catch {
    return "That didn't go through. Check your connection and try again.";
  }
}

function ApprovalRow({ approval, title }: { approval: PendingApproval; title?: string }) {
  const [state, setState] = useState<"idle" | "sending" | "approved" | "rejected">("idle");
  const [error, setError] = useState<string | null>(null);
  const decide = async (decision: "approved" | "rejected") => {
    setState("sending");
    setError(null);
    const failure = await sendDecision(approval.eventId, decision);
    if (failure) {
      setError(failure);
      setState("idle");
    } else {
      setState(decision);
    }
  };
  return (
    <li className="rounded-xl border border-white/15 p-2.5">
      <p className="text-[0.8125rem] font-semibold flex items-center gap-1.5 flex-wrap">
        {title ?? approval.taskTitle}
        {approval.isDemo ? <DemoBadge /> : null}
      </p>
      {approval.summary ? <p className="text-xs text-[#E8DCCB] mt-0.5">{approval.summary}</p> : null}
      {state === "approved" || state === "rejected" ? (
        <p className="text-xs mt-2 text-[#A9F0EA]" role="status">{state === "approved" ? "Approved and recorded." : "Rejected and recorded."}</p>
      ) : (
        <div className="flex gap-2 mt-2">
          <button type="button" disabled={state === "sending"} onClick={() => decide("approved")} className="flex-1 rounded-lg bg-[#D4A853] text-[#2C2420] font-semibold text-xs py-1.5 hover:bg-[#E0B968] disabled:opacity-60">Approve</button>
          <button type="button" disabled={state === "sending"} onClick={() => decide("rejected")} className="flex-1 rounded-lg border border-white/30 text-xs py-1.5 hover:bg-white/10 disabled:opacity-60">Reject</button>
        </div>
      )}
      {error ? <p role="alert" className="text-xs text-[#F0B48A] mt-1.5">{error}</p> : null}
    </li>
  );
}

function CardRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[0.6875rem] uppercase tracking-[0.1em] text-[#D4A853]">{label}</dt>
      <dd className="text-[0.8125rem] leading-snug mt-0.5">{children}</dd>
    </div>
  );
}

export function AgentCard() {
  const world = useHQ((s) => s.world);
  const agentId = useHQ((s) => s.selectedAgentId);
  const selectAgent = useHQ((s) => s.selectAgent);
  const feed = useHQ((s) => s.feed);
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (agentId) closeRef.current?.focus({ preventScroll: true });
  }, [agentId]);
  if (!world || !agentId) return null;
  const found = allAgents(world.divisions).find((x) => x.agent.id === agentId);
  if (!found) return null;
  const { agent, division } = found;
  const owner = world.mode === "owner";
  const index = division.agents.indexOf(agent);
  const onFloor = index < division.staffed;
  const state = agentStateOf(feed, agent.id);
  const status: AgentStatus = !onFloor ? "offline" : state?.status ?? agent.status;
  const approvals = ownerFeed(feed)?.pendingApprovals.filter((p) => p.agentId === agent.id) ?? [];
  return (
    <aside aria-label={`${agent.name ?? agent.role} details`} className="absolute right-3 top-[4.3rem] w-[min(23rem,calc(100vw-1.5rem))] max-h-[calc(100vh-14.5rem)] glass rounded-2xl overflow-y-auto hq-scroll p-4 fade-in max-sm:top-auto max-sm:bottom-[5rem] max-sm:max-h-[56vh]">
      <div className="flex items-start gap-3">
        <Avatar look={agent.appearance} size={54} />
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-2xl leading-tight">{agent.name ?? agent.role}</h2>
          {agent.name ? <p className="text-[0.8125rem] text-[#E8DCCB]">{agent.role}</p> : null}
          <p className="text-[0.6875rem] text-[#E8DCCB] mt-0.5">{division.name}</p>
        </div>
        <button ref={closeRef} type="button" className="w-7 h-7 grid place-items-center rounded-full hover:bg-white/10 flex-none" onClick={() => selectAgent(null)} aria-label="Close agent card">
          <Icon name="x" size={15} />
        </button>
      </div>
      <p className="flex items-center gap-1.5 text-[0.8125rem] mt-2.5">
        <span className={`status-dot agent-${status}`} />
        {onFloor ? AGENT_LABEL[status] : "Planned role"}
        {onFloor ? (state && !state.isDemo ? <span className="live-badge ml-1">Live</span> : <span className="ml-1"><DemoBadge /></span>) : null}
      </p>

      <dl className="mt-3 flex flex-col gap-2.5">
        {agent.specialty ? <CardRow label="Specialty">{agent.specialty}</CardRow> : null}
        {agent.model ? <CardRow label="Model">{agent.model}</CardRow> : null}
        {agent.tools?.length ? <CardRow label="Tools">{agent.tools.join(", ")}</CardRow> : null}
        {owner ? (
          <CardRow label="Current task">
            {state?.taskTitle ? (
              <>
                {state.taskTitle}
                {state.progress != null ? (
                  <span className="block mt-1">
                    <span className="progress-track block" role="progressbar" aria-valuenow={state.progress} aria-valuemin={0} aria-valuemax={100} aria-label="Task progress">
                      <span className="progress-fill block" style={{ width: `${state.progress}%` }} />
                    </span>
                    <span className="text-[0.6875rem] text-[#E8DCCB]">{state.progress}%</span>
                  </span>
                ) : null}
              </>
            ) : (
              <span className="text-[#E8DCCB]">Nothing assigned right now</span>
            )}
          </CardRow>
        ) : (
          <CardRow label="About this team">{division.description}</CardRow>
        )}
        {owner && state?.stage ? <CardRow label="Workflow stage">{state.stage}</CardRow> : null}
        {owner && state?.recentOutputs.length ? (
          <CardRow label="Recent outputs">
            <ul className="list-disc ml-4">
              {state.recentOutputs.map((o) => <li key={o}>{o}</li>)}
            </ul>
          </CardRow>
        ) : null}
        {owner ? (
          <CardRow label="Blockers">
            {state?.blocker ? <span className="text-[#F5C27A]">{state.blocker}</span> : <span className="text-[#E8DCCB]">None</span>}
          </CardRow>
        ) : null}
      </dl>
      {owner && approvals.length > 0 ? (
        <div className="mt-3">
          <h3 className="text-[0.6875rem] uppercase tracking-[0.1em] text-[#D4A853] mb-1.5">Pending approvals</h3>
          <ul className="flex flex-col gap-2">
            {approvals.map((a) => <ApprovalRow key={a.eventId} approval={a} />)}
          </ul>
        </div>
      ) : null}
    </aside>
  );
}

/* ---------- Overlay panels ---------- */

const PANEL_TITLES: Record<Exclude<Panel, null>, string> = {
  departments: "Departments",
  team: "Team",
  projects: "Projects",
  performance: "Performance",
  approvals: "Approvals",
};

export function OverlayPanel() {
  const panel = useHQ((s) => s.panel);
  const setPanel = useHQ((s) => s.setPanel);
  const world = useHQ((s) => s.world);
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (panel) closeRef.current?.focus({ preventScroll: true });
  }, [panel]);
  if (!panel || !world) return null;
  return (
    <div
      className="absolute inset-0 z-40 bg-[#1c1714]/40 flex items-start justify-center pt-[4.4rem] px-3 pb-3"
      onClick={(e) => {
        if (e.target === e.currentTarget) setPanel(null);
      }}
    >
      <div role="dialog" aria-modal="true" aria-label={PANEL_TITLES[panel]} className="glass rounded-2xl w-[min(52rem,100%)] max-h-full overflow-hidden flex flex-col fade-in">
        <div className="flex items-center px-5 pt-4 pb-3 border-b border-white/10">
          <h2 className="font-display text-2xl flex-1">{PANEL_TITLES[panel]}</h2>
          <button ref={closeRef} type="button" className="w-8 h-8 grid place-items-center rounded-full hover:bg-white/10" onClick={() => setPanel(null)} aria-label="Close">
            <Icon name="x" size={17} />
          </button>
        </div>
        <div className="overflow-y-auto hq-scroll p-5">
          {panel === "departments" ? <DepartmentsPanel /> : null}
          {panel === "team" ? <TeamPanel /> : null}
          {panel === "projects" ? <ProjectsPanel /> : null}
          {panel === "performance" ? <PerformancePanel /> : null}
          {panel === "approvals" ? <ApprovalsPanel /> : null}
        </div>
      </div>
    </div>
  );
}

function DepartmentsPanel() {
  const world = useHQ((s) => s.world);
  const focusDivision = useHQ((s) => s.focusDivision);
  if (!world) return null;
  return (
    <ul className="grid sm:grid-cols-2 gap-3">
      {world.divisions.map((d) => (
        <li key={d.id}>
          <button type="button" onClick={() => focusDivision(d.id)} className="w-full h-full text-left rounded-xl border border-white/15 p-3 hover:bg-white/5">
            <span className="flex items-center gap-2">
              <Icon name={d.icon} size={19} className="text-[#D4A853]" />
              <span className="font-semibold text-sm flex-1">{d.name}</span>
              <span className={`status-dot status-${d.status}`} />
              <span className="text-[0.6875rem] text-[#E8DCCB]">{STATUS_LABEL[d.status]}</span>
            </span>
            <span className="block text-xs text-[#E8DCCB] mt-1.5 leading-snug">{d.description}</span>
            {d.nextUp ? <span className="block text-xs mt-1.5 leading-snug"><span className="text-[#D4A853]">Next up: </span>{d.nextUp}</span> : null}
          </button>
        </li>
      ))}
    </ul>
  );
}

function TeamPanel() {
  const world = useHQ((s) => s.world);
  const focusDivision = useHQ((s) => s.focusDivision);
  const selectAgent = useHQ((s) => s.selectAgent);
  const feed = useHQ((s) => s.feed);
  if (!world) return null;
  const owner = world.mode === "owner";
  return (
    <div className="flex flex-col gap-5">
      {world.divisions.map((d) => {
        const list = owner ? d.agents : d.agents.slice(0, d.staffed);
        if (list.length === 0) return null;
        return (
          <section key={d.id}>
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-1.5">
              <Icon name={d.icon} size={16} className="text-[#D4A853]" />
              {d.name}
              <span className="text-[0.6875rem] font-normal text-[#E8DCCB]">{STATUS_LABEL[d.status]}</span>
            </h3>
            <ul className="grid sm:grid-cols-2 gap-x-4">
              {list.map((a: ClientAgent, i) => {
                const onFloor = i < d.staffed;
                const state = agentStateOf(feed, a.id);
                const status = onFloor ? state?.status ?? a.status : "offline";
                return (
                  <li key={a.id} className="border-t border-white/10">
                    <button
                      type="button"
                      className="w-full flex items-center gap-2.5 py-1.5 text-left hover:bg-white/5 rounded"
                      onClick={() => {
                        focusDivision(d.id);
                        selectAgent(a.id);
                      }}
                    >
                      <Avatar look={a.appearance} size={32} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[0.8125rem] font-medium truncate">{a.name ?? a.role}</span>
                        {a.name ? <span className="block text-[0.6875rem] text-[#E8DCCB] truncate">{a.role}{a.model ? ` · ${a.model}` : ""}</span> : null}
                      </span>
                      <span className={`status-dot agent-${status}`} title={onFloor ? AGENT_LABEL[status] : "Planned role"} />
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function ProjectsPanel() {
  const world = useHQ((s) => s.world);
  const feed = useHQ((s) => s.feed);
  const owner = ownerFeed(feed);
  if (!world) return null;
  if (!owner) {
    return <p className="text-sm text-[#E8DCCB]">Project details stay inside the private headquarters view. The tour shows how a project moves across the island, using a staged example.</p>;
  }
  const latest = new Map<string, (typeof owner.events)[number]>();
  for (const e of [...owner.events].reverse()) if (e.taskId) latest.set(e.taskId, e);
  const rows = [...latest.values()].filter((e) => e.eventType !== "completed").reverse();
  const done = [...latest.values()].filter((e) => e.eventType === "completed").reverse();
  const nameOf = (id: string) => world.divisions.find((d) => d.id === id)?.name ?? id;
  const row = (e: (typeof rows)[number]) => (
    <li key={e.id} className="border-t border-white/10 py-2">
      <p className="text-[0.8125rem] font-medium flex items-center gap-2 flex-wrap">
        {e.taskTitle ?? "Untitled task"}
        {e.isDemo ? <DemoBadge /> : <span className="live-badge">Live</span>}
      </p>
      <p className="text-[0.6875rem] text-[#E8DCCB] mt-0.5">{nameOf(e.divisionId)} · {e.eventType.replace("_", " ")}</p>
      {e.progress != null ? (
        <span className="progress-track block mt-1"><span className="progress-fill block" style={{ width: `${e.progress}%` }} /></span>
      ) : null}
    </li>
  );
  return (
    <div className="flex flex-col gap-5">
      <section>
        <h3 className="text-sm font-semibold mb-1">In progress ({rows.length})</h3>
        <ul>{rows.map(row)}</ul>
      </section>
      <section>
        <h3 className="text-sm font-semibold mb-1">Recently completed ({done.length})</h3>
        <ul>{done.slice(0, 12).map(row)}</ul>
      </section>
    </div>
  );
}

function PerformancePanel() {
  const world = useHQ((s) => s.world);
  const feed = useHQ((s) => s.feed);
  if (!world) return null;
  const owner = ownerFeed(feed);
  const nameOf = (id: string) => world.divisions.find((d) => d.id === id)?.name ?? id;
  return (
    <div className="flex flex-col gap-5">
      <section>
        <h3 className="text-sm font-semibold mb-2">Totals</h3>
        <dl className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {world.counters.map((c) => {
            const v = feed?.counters.find((x) => x.id === c.id);
            return (
              <div key={c.id} className="rounded-xl border border-white/15 p-2.5">
                <dd className="text-xl font-semibold tabular-nums">{v?.value ?? "–"}</dd>
                <dt className="text-[0.6875rem] text-[#E8DCCB] leading-tight mt-0.5">{c.label}</dt>
                <div className="mt-1.5">{v ? <SourceBadge isDemo={v.isDemo} /> : null}</div>
              </div>
            );
          })}
        </dl>
      </section>
      <section>
        <h3 className="text-sm font-semibold mb-1">By department</h3>
        <table className="w-full text-[0.8125rem]">
          <caption className="sr-only">Stats per department</caption>
          <tbody>
            {world.divisions.map((d) => {
              const stats = world.divisionStats[d.id] ?? [];
              const values = feed?.divisionStats[d.id];
              return (
                <tr key={d.id} className="border-t border-white/10 align-top">
                  <th scope="row" className="text-left font-medium py-1.5 pr-3 whitespace-nowrap">{d.name}</th>
                  <td className="py-1.5 text-[#E8DCCB]">
                    {stats.map((s) => `${s.label}: ${values?.find((v) => v.id === s.id)?.value ?? "–"}`).join(" · ")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
      {owner ? (
        <section>
          <h3 className="text-sm font-semibold mb-1">Latest activity</h3>
          <ul>
            {owner.events.slice(0, 14).map((e) => (
              <li key={e.id} className="border-t border-white/10 py-1.5 text-xs flex items-center gap-2 flex-wrap">
                <span className="text-[#D4A853]">{e.eventType.replace("_", " ")}</span>
                <span>{e.taskTitle ?? nameOf(e.divisionId)}</span>
                {e.toDivisionId ? <span className="text-[#E8DCCB]">to {nameOf(e.toDivisionId)}</span> : null}
                {e.isDemo ? <DemoBadge /> : <span className="live-badge">Live</span>}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function ApprovalsPanel() {
  const feed = useHQ((s) => s.feed);
  const world = useHQ((s) => s.world);
  const owner = ownerFeed(feed);
  if (!owner || !world) return <p className="text-sm text-[#E8DCCB]">Loading approvals…</p>;
  if (owner.pendingApprovals.length === 0) return <p className="text-sm text-[#E8DCCB]">Nothing is waiting for you.</p>;
  const agents = allAgents(world.divisions);
  return (
    <ul className="flex flex-col gap-2.5">
      {owner.pendingApprovals.map((a) => {
        const who = agents.find((x) => x.agent.id === a.agentId)?.agent.name;
        return <ApprovalRow key={a.eventId} approval={a} title={who ? `${who}: ${a.taskTitle}` : a.taskTitle} />;
      })}
    </ul>
  );
}

/* ---------- Tools: back, tour start, legend, settings ---------- */

export function ToolBar() {
  const world = useHQ((s) => s.world);
  const startTour = useHQ((s) => s.startTour);
  const tourActive = useHQ((s) => s.tour.active);
  const selected = useHQ((s) => s.selectedDivisionId);
  const goBack = useHQ((s) => s.goBack);
  const paused = useHQ((s) => s.paused);
  const setPaused = useHQ((s) => s.setPaused);
  const reduced = useHQ((s) => s.reducedMotion);
  const setReduced = useHQ((s) => s.setReducedMotion);
  const legendOpen = useHQ((s) => s.legendOpen);
  const setLegendOpen = useHQ((s) => s.setLegendOpen);
  const roofOpenId = useHQ((s) => s.roofOpenId);
  const setRoofOpen = useHQ((s) => s.setRoofOpen);
  if (!world) return null;
  return (
    <div className={`absolute left-3 flex flex-col items-start gap-2 ${selected && !tourActive ? "bottom-[10rem] 2xl:bottom-[5.1rem]" : tourActive ? "bottom-[11.5rem] sm:bottom-[5.1rem]" : "bottom-[5.1rem]"}`}>
      {legendOpen ? (
        <div className="glass rounded-xl p-3 w-56 fade-in max-sm:mb-1">
          <h2 className="text-xs font-semibold mb-1.5">What the island shows</h2>
          <ul className="flex flex-col gap-1.5 text-xs">
            <li className="flex gap-2"><span className="status-dot status-live mt-1" /><span><b>Live.</b> Fully lit and staffed, real activity.</span></li>
            <li className="flex gap-2"><span className="status-dot status-building mt-1" /><span><b>In build.</b> Scaffolding, partly lit, partly staffed.</span></li>
            <li className="flex gap-2"><span className="status-dot status-planned mt-1" /><span><b>Planned.</b> Lights off, glass dimmed, no staff.</span></li>
          </ul>
          <p className="text-[0.6875rem] text-[#E8DCCB] mt-2 leading-snug">Figures marked Demo come from staged data. Light pulses on the paths show work moving between departments.</p>
          <div className="flex flex-col gap-1.5 mt-2.5">
            <button type="button" onClick={() => setPaused(!paused)} aria-pressed={paused} className="rounded-lg border border-white/20 px-2.5 py-1.5 text-xs text-left hover:bg-white/10">
              {paused ? "Resume animation" : "Pause animation"}
            </button>
            <button type="button" onClick={() => setReduced(!reduced)} aria-pressed={reduced} className="rounded-lg border border-white/20 px-2.5 py-1.5 text-xs text-left hover:bg-white/10">
              {reduced ? "Motion reduced: turn off" : "Reduce motion"}
            </button>
          </div>
        </div>
      ) : null}
      <div className="flex gap-1.5 flex-wrap max-w-[calc(100vw-1.5rem)]">
        {selected && !tourActive ? (
          <button type="button" onClick={goBack} className="glass rounded-full px-3.5 py-2 text-xs font-semibold flex items-center gap-1.5 hover:bg-white/10">
            <span className="rotate-180 inline-block"><Icon name="arrow" size={14} /></span> Back
          </button>
        ) : null}
        {selected && !tourActive ? (
          <button type="button" onClick={() => setRoofOpen(roofOpenId === selected ? null : selected)} aria-pressed={roofOpenId === selected} className="glass rounded-full px-3.5 py-2 text-xs hover:bg-white/10">
            {roofOpenId === selected ? "Close roof" : "Lift roof"}
          </button>
        ) : null}
        {tourActive || selected ? null : (
          <button type="button" onClick={startTour} className="rounded-full px-3.5 py-2 text-xs font-semibold bg-[#D4A853] text-[#2C2420] hover:bg-[#E0B968] flex items-center gap-1.5 shadow-lg">
            <Icon name="play" size={15} /> Guided Tour
          </button>
        )}
        <button type="button" onClick={() => setLegendOpen(!legendOpen)} aria-expanded={legendOpen} aria-label="Legend and motion settings" className="glass rounded-full px-3 py-2 text-xs hover:bg-white/10 flex items-center gap-1.5">
          <Icon name="settings" size={14} /> Legend
        </button>
      </div>
    </div>
  );
}

/* ---------- Nameplates ---------- */

function Plate({ division }: { division: ClientDivision }) {
  const ref = useRef<HTMLButtonElement>(null);
  const focusDivision = useHQ((s) => s.focusDivision);
  const tier = useHQ((s) => s.zoomTier);
  const selected = useHQ((s) => s.selectedDivisionId);
  const tourActive = useHQ((s) => s.tour.active);
  const isSelected = selected === division.id;
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    plateElements.set(division.id, el);
    return () => {
      plateElements.delete(division.id);
    };
  }, [division.id]);
  const important = division.building.footprint === "angular" || division.building.footprint === "tiered";
  const internal = division.group === "Internal";
  const compact = !isSelected && tier === 0 && internal;
  const showSub = !compact;
  const showPips = tier >= 1 && division.status !== "planned";
  const hidden = tier === 2 && !isSelected;
  return (
    <button
      ref={ref}
      type="button"
      tabIndex={hidden ? -1 : 0}
      disabled={tourActive}
      onClick={() => focusDivision(division.id)}
      aria-label={`${division.name}, ${division.subtitle}, ${STATUS_LABEL[division.status]}`}
      className={`plate ${isSelected ? "plate-selected" : ""} ${important ? "plate-important" : ""} ${compact ? "plate-compact" : ""} ${internal ? "plate-internal" : ""} ${division.status === "planned" ? "plate-planned" : ""}`}
      style={{ opacity: hidden ? 0 : 1, pointerEvents: hidden ? "none" : undefined }}
    >
      <Icon name={division.icon} size={compact ? 14 : important ? 26 : 20} className="plate-icon" />
      <span>
        <span className="plate-title block">{division.name}</span>
        {showSub ? <span className="plate-sub block">{division.subtitle}</span> : null}
      </span>
      {showPips ? (
        <span className="flex gap-0.5 ml-0.5" aria-hidden="true">
          <span className="pip" />
          <span className="pip" />
          <span className="pip" />
        </span>
      ) : null}
    </button>
  );
}

export function Nameplates() {
  const world = useHQ((s) => s.world);
  if (!world) return null;
  return (
    <div
      className="absolute inset-0 overflow-hidden hud-pass"
      aria-label="Buildings on the island"
      role="group"
      onWheel={(e) => {
        // Plates sit above the canvas; hand the wheel to the camera underneath.
        document.querySelector(".hq-canvas canvas")?.dispatchEvent(new WheelEvent("wheel", e.nativeEvent));
      }}
    >
      {world.divisions.map((d) => (
        <Plate key={d.id} division={d} />
      ))}
    </div>
  );
}

/* ---------- Loading ---------- */

export function LoadingScreen() {
  const ready = useHQ((s) => s.ready);
  const progress = useHQ((s) => s.loadProgress);
  const label = useHQ((s) => s.loadLabel);
  const [gone, setGone] = useState(false);
  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => setGone(true), 700);
    return () => clearTimeout(t);
  }, [ready]);
  if (gone) return null;
  return (
    <div
      className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#2C2420] transition-opacity duration-700"
      style={{ opacity: ready ? 0 : 1, pointerEvents: ready ? "none" : "auto" }}
      role="status"
      aria-live="polite"
    >
      <MMark size={62} />
      <p className="font-display text-3xl tracking-[0.18em] uppercase mt-4">{BRAND.name}</p>
      <p className="text-sm text-[#E8DCCB] mt-1">{BRAND.headquarters}</p>
      <div className="w-64 h-1 rounded-full bg-white/10 mt-7 overflow-hidden">
        <div className="load-bar h-full bg-[#D4A853]" style={{ width: `${ready ? 100 : progress}%` }} />
      </div>
      <p className="text-xs text-[#E8DCCB] mt-2">{label}</p>
    </div>
  );
}
