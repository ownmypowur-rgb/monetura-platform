# Monetura HQ

An interactive 3D headquarters island that shows what Monetura's AI team is doing. Darryl uses it to watch work and approve it; prospects see a filtered public tour on Zoom calls.

**The island is a window onto the business. It never runs the business.** Real work happens in agents and the database. The island displays events and sends approvals.

- App: `apps/hq` (Next.js 14 App Router, TypeScript strict, three.js via React Three Fiber)
- `/` is the owner view, login required. `/tour` is the public tour, no login.
- Decisions, blockers and to-dos: [HQ-DECISIONS.md](HQ-DECISIONS.md). Assets and licenses: [ASSETS.md](ASSETS.md).

## Run it locally

```bash
pnpm install
cp apps/hq/.env.local.example apps/hq/.env.local   # then fill it in
pnpm --filter @monetura/hq dev                     # http://localhost:3003
```

| Variable | What it does |
|---|---|
| `DATABASE_URL` | Same MySQL as the other Monetura apps. Without it, HQ runs on an in-memory demo feed and approvals aren't saved. |
| `HQ_OWNER_PASSWORD` | The password for `/`. |
| `HQ_SESSION_SECRET` | Signs the owner cookie. Without it, nobody can sign in (it fails closed). |
| `HQ_DEMO_MODE` | `on` (default) lets owner polling add demo events. `off` stops new ones. |

Useful commands, run from `apps/hq`:

| Command | What it does |
|---|---|
| `pnpm seed:demo` | Adds a realistic history of `is_demo = true` events. |
| `pnpm check:public` | Fails if private data appears in `/tour`, its bundles or the public feed, or if `/` and owner APIs answer without a session. Set `HQ_BASE_URL` to test a deployment. |
| `pnpm exec tsx scripts/verify.ts` | Functional test: login, feed, approvals, all roofs, walking, agent card, panels, the full tour. |
| `pnpm shots` | Captures the review screenshots into `screenshots/`. |
| `pnpm exec tsx scripts/hero.ts out name=px,py,pz,tx,ty,tz` | Clean hero stills from any camera. |

For clean marketing captures, add `?hud=0` to hide the interface and `?cam=px,py,pz,tx,ty,tz` to set the camera. `?quality=high|medium|low` forces a quality tier.

## Add a division or an agent

Everything comes from one file: **`apps/hq/src/registry.ts`**. Adding an entry there puts it on the island, in the HUD, in the panels and in the API, with no other code change.

**Add an agent:** add an `agent(...)` line to the division's `agents` list: id, name, role, specialty, model, tools, appearance and home desk. If there are more agents than desks, the extras stand and work in the room.

**Add a division:** add an object to `DIVISIONS`:

```ts
{
  id: "guest-experience",
  name: "Guest Experience",
  subtitle: "Member Events",
  icon: "people",
  status: "planned",
  description: "What this team does.",
  nextUp: "What's coming next.",
  building: { x: 40, z: -150, elevation: 16, rotation: 0, scale: 1, footprint: "round", interior: "office" },
  agents: [],
}
```

The terrain flattens a terrace under the new building and a path connects it to the nearest junction automatically. Footprints are `round`, `twin`, `tiered`, `angular`, `district` and `small`.

Other things you can edit without touching 3D code:

| To change | Edit |
|---|---|
| The orchestrator's name (one value) | `src/config/brand.ts` |
| Guided tour stops, captions, timings, packet hops | `src/config/tour.ts` |
| Live Operations counters and department stats | `src/config/counters.ts` |

Character names are placeholders. Change them in the registry at any time.

## How statuses work

Each division has a `status` in the registry. It controls what the building looks like, so the island is also the roadmap:

| Status | On the island | In the panel |
|---|---|---|
| `live` | Fully lit, fully staffed, activity pips pulsing | Team and activity |
| `building` | Scaffolding, a crane and barriers, partly lit, half staffed | "In build" and the `nextUp` text |
| `planned` | The building exists, lights off, glass dimmed, no staff | "Planned" and the description |

Content Studio and Atlas Command are `building` but marked `fullyStaffed`, as the build spec asks.

Each agent's status comes from its latest event and drives what the figure does:

| Agent status | The figure |
|---|---|
| `working` | Types at their desk (the YouTube specialist presents at the ring light) |
| `meeting` | Walks to the meeting table |
| `idle` | Walks to the lounge |
| `blocked` | Stands still with an amber indicator |

## How events and approvals flow

```
agents / workflows ──insert──▶ monetura_hq_events ──▶ GET /api/hq/events ──poll 4s──▶ island + HUD
                                       ▲
owner clicks Approve ──▶ POST /api/hq/approvals ──▶ monetura_hq_approvals + an approved/rejected event
```

- **Reporting real work:** insert a row into `monetura_hq_events` with `is_demo = false`. Set `public_safe = true` only if it could be seen in public aggregates. The island picks it up on the next poll.
- **Handoffs:** an event with `from_division_id` and `to_division_id` sends a light pulse along the paths.
- **Approvals:** an event of type `needs_approval` appears under the bell and on the agent's card. Approve or Reject writes an approval row and a new event. **The downstream action is a stub** (see `recordApproval` in `src/server/store.ts`): today a decision is recorded and nothing is published or sent.
- **Public feed:** `GET /api/hq/events?mode=public` filters to `public_safe = true` in the database query, then returns only aggregates built field by field. Unauthenticated requests can't cause writes.
- **Private by construction:** client code never imports the registry (ESLint enforces it). Pages pass a server-side projection as props. `publicWorld()` is an allowlist, so a new private field stays private by default.

## What's real and what's demo

| Real | Demo |
|---|---|
| The two tables, on the live database | Every event currently in them is `is_demo = true`, from the demo generator |
| Reading events from the database | The tasks, progress and handoffs those events describe |
| Approvals recorded to the database | The publishing or sending an approval would trigger: stubbed |
| Registry roles and departments | Counters: real counts replace them per counter once `is_demo = false` rows exist. Until then they show config baselines plus demo activity |
| Owner login, public/private separation | Character names (placeholders) |
| | Agents aren't connected: no agent writes to this feed yet |

Anything from demo data is labelled **Demo**. **Live** only appears on data from `is_demo = false` events. On `/tour`, staff behaviour is simulated in the browser, because the public feed deliberately carries no agent data.

## Improvements to get closer to the master render, in priority order

1. **Hand-modelled hero assets.** The largest gap. Replace the procedural Content Studio shell and pavilion details with modelled assets from a 3D artist, keeping the same footprints. The render's rich detail can't come from primitives.
2. **Real characters.** Rigged, skinned figures with authored animation clips. Today's are stylized procedural figures, clearly a step below the render's people, most visible in close-ups.
3. **Baked lighting.** Lightmaps for interiors and terrain would give the render's warm bounce light and soft contact shadows at far less GPU cost.
4. **A lit campus.** Most buildings are `planned`, so they're dark by design, while the render shows all of them glowing. This closes naturally as departments go live. A marketing-only "all lit" mode for stills is a small addition.
5. **Richer interiors.** Only Content Studio has a bespoke layout. Authored layouts for Atlas Command, Research and Story Lab would pay off most on tours.
6. **Real footage on screens.** Swap painted placeholders for approved Monetura travel media, compressed as KTX2.
7. **Terrain and rock detail.** Sculpted cliffs and tiled rock and sand textures for close views.
8. **Water.** Screen-space or planar reflections so buildings and boats reflect in the marina.
9. **Foliage.** More species, and impostors so density can rise without a frame-rate cost.
10. **Performance budget.** Measure on target laptops and phones, then tune tiers. Quality detection is heuristic today and hasn't been tested on a real phone.
