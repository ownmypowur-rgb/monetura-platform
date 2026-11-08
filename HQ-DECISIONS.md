**Live URL: https://monetura-hq.vercel.app** (public tour at [/tour](https://monetura-hq.vercel.app/tour); `/` needs the owner password)

# Monetura HQ: decisions log

Notes from the HQ build. The existing `DECISIONS.md` was not modified.

## Blocked / needs Darryl

1. **`apps/corporate` does not build, and didn't before this work.** `next build` fails with `Configuring Next.js via 'next.config.ts' is not supported`. The file dates from April 2026, Next 14 rejects it, and `git diff 7d3dbec HEAD -- apps/corporate` is empty, so this build didn't cause it. I left it alone because the brief says not to change existing apps. The fix is probably renaming it to `next.config.mjs`. `moneturamedia.com` is a separate Vercel project (`monetura-media`, last deployed 81 days ago), so check whether it deploys from this folder at all. **Checklist item 9 is therefore only partly met:** `apps/marketing` and `apps/platform` build; `apps/corporate` fails exactly as it did before.
2. **Approvals don't trigger anything yet.** Approve and Reject are recorded in the database, but nothing is published or sent. See "Approvals downstream stub".
3. **No real agents report to the feed.** Every event is demo data until an agent writes `is_demo = false` rows.
4. **`docs/hq-concept-brief.pdf` isn't committed.** It's your file, it's untracked, and it's 14 MB and misspells the brand throughout, so I left that decision to you.

## Darryl to do later

- **Your owner password** is in `apps/hq/.env.local` as `HQ_OWNER_PASSWORD` (gitignored, on this computer only) and in Vercel. Change it in Vercel any time: `monetura-hq` → Settings → Environment Variables, then redeploy.
- **Custom domain:** in Vercel, `monetura-hq` → Settings → Domains → add `hq.monetura.com`. Vercel will show the record to use. Then in Bluehost DNS for `monetura.com`, add: type `CNAME`, host `hq`, value `cname.vercel-dns.com` (use the value Vercel shows if it differs). I didn't touch DNS.
- **Preview deployments have no env vars.** They were added to Production only, deliberately, so preview builds don't hold database credentials. Add them to Preview if you want working previews.

## Vercel setup (done)

- Project `monetura-hq`, team `monetura`, root directory `apps/hq`, Node 24, connected to the GitHub repo, so pushes to `main` deploy it.
- Env vars on Production: `DATABASE_URL` (copied from `apps/platform/.env.local`), `HQ_OWNER_PASSWORD` and `HQ_SESSION_SECRET` (newly generated), `HQ_DEMO_MODE=on`.
- No other Vercel project was changed. Pushing to `main` also redeploys `monetura-platform-marketing` and `monetura-platform-app`, as it always has; both reported Ready after the first push.

## Reused from the reference projects

**`monetura-travel-agent-hub` (read only):** read `prisma/seed-agents.ts` and `lib/agents.ts`. Reused the CEO → division → specialist shape as Atlas → departments → specialists, and these specialist roles:
- Facebook, Instagram and TikTok specialists; blog and long-form storyteller (Story Lab)
- Earnings and commission analyst (Finance); onboarding, member support and retention (Client Success)
- Analytics framing (Business Intelligence)

Left out: the LinkedIn specialist (not in the brief), its Prisma/raw SQL data layer, and its live `monetura_agents` table. HQ doesn't connect to it.

**`monetura-agent-hub` (read only):** read only the top of `src/lib/tasks.ts` and `src/lib/hooks/useTasks.ts` for the general pattern. Reused: task records with a status and progress, an aggregate stats shape, and client polling. Nothing was copied. I didn't open its agent lists, workspace files, constants or env files.

No `.env` file in either folder was opened.

## Decisions

### Owner login: a new env-var password rather than the platform's admin login
- **Options:** reuse `apps/platform`'s NextAuth login; or a separate owner password.
- **Choice:** separate password (`HQ_OWNER_PASSWORD`) with an HMAC-signed, httpOnly cookie, verified with Web Crypto in middleware. Pages and APIs re-check it.
- **Why:** the platform login reads password hashes from ApexCRM's `users` table, which your Monetura-only scope rules out. Its cookie is also scoped to a different domain. The brief names this fallback.
- **Worth reviewing:** there's one shared password and no per-user audit trail; `decided_by` is always `owner`.

### Applying the migration to the live database
- **Choice:** applied `0009_lucky_madame_hydra.sql` with `scripts/apply-migration-idempotent.mjs`, the process `DECISIONS.md` requires because `drizzle-kit migrate` must not run against this database. I confirmed first that it contained only the two new tables and their indexes.
- **Also on live:** about 90 seeded demo events, plus events added while verifying, including one test approval (row 1, note "Verification script"). All are in the two new tables and flagged demo. No existing table was touched.

### Demo events are written to the production database
- **Options:** generate demo data in memory; or write `is_demo` rows.
- **Choice:** write rows, as the brief asks, so the real read path is what's exercised. Each owner poll adds at most one tick, only if the newest event is over 5 seconds old. Demo rows over 3 days old are pruned occasionally, and the prune can only match `is_demo = true`.
- **Why it's safe:** only an authenticated owner poll writes. The public endpoint is read-only. `HQ_DEMO_MODE=off` stops it. With no `DATABASE_URL`, an in-memory feed is used.

### "Live Operations" heading
- **Choice:** the panel reads "Operations" with a Demo badge until real data exists, and becomes "Live Operations" automatically once any counter has real rows.
- **Why:** your spec names it Live Operations and also says nothing may be labelled Live unless it comes from `is_demo = false` events. The second rule protects credibility on sales calls, so it wins. Same for the "Demo activity" pill on the stats strip.

### Registry never reaches client code
- **Choice:** server pages pass a projection as props. `publicWorld()` is an explicit allowlist with no agent names, specialties, models, tools or `nextUp`. ESLint blocks registry imports in `src/scene`, `src/hud`, `src/world`.
- **Why:** the brief requires that private data isn't in the bundle, not merely hidden. `pnpm check:public` tests this against every static chunk.

### Public tour staff behaviour runs in the browser
- **Choice:** on `/tour`, figures cycle through working, meeting and idle using a local timer.
- **Why:** the public feed must not carry agent data. This is decoration, not activity, and the public HUD doesn't present it as live.

### Characters built in code, no CC0 rigs
- **Options:** Quaternius or KayKit rigged characters; or procedural.
- **Choice:** procedural figures with joints, posed in code.
- **Why:** the CC0 packs are cartoon-proportioned and would need retargeting to get the diverse skin tones, hair and resort wear from registry config. The result is clean but well short of the render's people. It's #2 on the improvements list.

### No external assets at all
- **Why:** it removes license risk and download weight, and lets the registry drive everything. The first paint is also fast. "Compressed textures" is moot today because textures are painted at runtime; KTX2 applies once real media arrives.

### Own water shader rather than three.js `Water`
- **Why:** the render's look is mostly depth colour, from sand through turquoise to deep blue, which needs the terrain height. `Water` targets planar reflections, which cost a second scene render. The trade-off is that nothing reflects in the water.

### Merged geometry instead of instancing for furniture
- **Spec said:** instancing for repeated furniture.
- **Choice:** palms, foliage, rocks and path lights are instanced. Furniture and buildings are merged per room or building into one vertex-coloured mesh.
- **Why:** rooms hold dozens of different shapes, so merging gives fewer draw calls than one instanced mesh per shape.

### Static shadow map
- **Choice:** the sun's shadow map only re-renders when a roof moves, not every frame. Palm sway doesn't move shadows, and figures use small contact shadows.
- **Why:** re-rendering hundreds of thousands of leaf triangles each frame was the biggest avoidable cost.

### Nameplates are HTML outside the canvas
- **Why:** keyboard focus, screen readers and crisp text at every zoom. The scene writes their positions each frame without a React render, with greedy decluttering.

### Content Studio scale
- **Choice:** the shell is 1.3× and its furniture and people a further 1.35×. The room's layout was rebuilt to fit.
- **Why:** at true scale people were tiny, about 24:1 room to person. The render reads about 9:1.

### Polling rather than server-sent events
- **Why:** the spec allows either. Polling every 4 seconds is simpler and survives Vercel's serverless limits.

### Runtime quality step-down stops at Medium
- **Why:** tone mapping is fixed when the canvas is created, so dropping the effect chain mid-session would blow out the image. Sessions step down through effects and pixel ratio. Phones start on Low from load.

### Other small calls
- Port 3003 for `apps/hq` (3000 to 3002 are taken).
- Internal cluster sits back-left, behind Research and Partnerships. Internal plates are simplified at island zoom and hidden on phones.
- Legal & Compliance moved inward from the far left edge so the Operations panel doesn't cover it.
- Approvals bell opens a panel (not in the spec) so approvals are reachable without hunting for the right agent.
- Guided Tour pauses animation when paused, so the packet holds still.
- ApexCRM's `drizzle/schema.ts` wasn't touched. New tables are in `drizzle/monetura-schema.ts`, prefixed `monetura_`, with Drizzle only and no raw SQL. `Drizzle insertId` is read as `result[0].insertId`.

### Atlas ingest (Nov 8, 2026)
- **Auth:** a single bearer token in `HQ_INGEST_TOKEN`, compared as SHA-256 digests with `timingSafeEqual` so lengths never leak. Under 32 characters or unset means ingest is off (503).
- **Rate limit:** the shared in-memory limiter (30/min per IP per instance) plus a database count of real events in the last minute (60), because serverless instances don't share memory.
- **Live divisions get no demo activity.** "Real events take priority for Atlas Command" was generalized: any `live` division shows only real rows, so a Live label can never sit next to staged work. This also quietens IT & Integrations' demo tasks until it reports real build events.
- **Remy (atlas-ops)** stays in the registry, idle, with no real activity yet. Atlas does the coordination work itself for now.

## Approvals downstream stub

`recordApproval` in `apps/hq/src/server/store.ts` records the approval row and a decision event, then logs that the downstream action is stubbed, at `TODO(hq-downstream)`. When a publishing or sending workflow exists behind an approval gate, trigger it there. Nothing external happens today.

## Visual passes

Compared against the master render, extracted from page 1 of the PDF (`docs/hq-master-render.png` doesn't exist).

### Pass 1: first frame
- **Differences:** washed out and pale; no shadows; huge pale blocky rocks; palms burying everything; pavilions read as flat white discs; Content Studio far too small; striped cake-like mountain.
- **Causes found:** N8AO's default gamma correction double-corrected inside the effect chain. The shadow camera's projection was never refreshed, so shadows covered only about 5 units.
- **Fixed:** both bugs; colour and ACES grade; darker volcanic rock; smaller, greener palms with a keep-out margin around paths and glass; taller glass pavilions with less roof; Content Studio scaled up with a roof deck and glowing atrium; wider, lower camera.

### Pass 2: composition and cutaway
- **Differences:** paths invisible; hard edge in the sea where the height map ended; interior blown out; people tiny; toolbar colliding with the stats strip; spiky cone plants; sign hidden behind the rim.
- **Causes found:** path ribbons wound face-down, so they were culled.
- **Fixed:** winding; depth map edge fade; rebuilt studio layout at 1.35× content scale; stone floor; lower-backed chairs; leaf-blade plants; taller back wall lifting the sign and photo wall above the rim; lower focus camera; tools moved into a Legend popover.

### Pass 3: life and detail
- **Differences:** hollow, ribbed palm fronds; waterfalls hidden and without a real drop; green-ball planters; daytime rather than golden-hour light; phone view crowded with nameplates.
- **Fixed:** solid serrated frond texture, darker at the base; carved lips and plunge pools with planting kept clear, now visible at the island's centre; leafy planters; lower and warmer sun with weaker fill; simplified phone nameplates.

### Pass 4: checking every required view by eye
- **Differences:** the campus view screenshot was identical to the overview; packet invisible at island zoom; too many idle staff; selected plate clipped under the top bar; pendant ring hiding "Deliver" on the sign; phone framing slightly cut off.
- **Causes found:** nameplates swallowed wheel events, so scrolling over one didn't zoom. A real bug, and it meant orbit and zoom had never been tested at all.
- **Then:** fixing the wheel exposed zoom that was far too fast, plunging under the palms, with plates stacking against the top bar. Slowed the dolly, kept free flight above the canopy, and off-screen plates now hide.
- **Fixed:** wheel forwarding from plates; camera tests added to `verify.ts`; packet draws through foliage and scales with distance; demo generator keeps about three in four staff busy; plate clamped below the bar; pendant and alcove moved clear of the sign; wider phone framing.

### Remaining gap, honestly
The composition, palette, layout and HUD match the render's direction. The render's richness doesn't: it's a painting-level image with every building glowing and dense modelled detail. This is a real-time scene built from primitives, closer to a polished stylized game than to the render. See the improvements list in `HQ-README.md`.

## Verification

Run against a production build (`next start`):
- `scripts/check-public-bundle.ts`: **PASS**. 32 documents (the `/tour` page, every static JS chunk, the public feed) against 209 private strings from the registry. `/` redirects to login. Owner feed and approvals return 401 without a session.
- `scripts/verify.ts`: **66 checks pass.** Login; wheel zoom, including over plates; camera stays above ground and sea when zooming and orbiting; zoom-out clamped; returning restores the camera to within 0.00 units; feed from the database; approval round trip, including refusing a second decision; all 15 roofs and Escape; 12 staffed figures; walking; agent card; four nav panels; tour with 7 captions; unattended tour completion (58s); no page errors.
- The leak check also passes against the live deployment.

**Roofs:** `verify.ts` confirms the roof state changes for all 15 buildings, and I checked the cutaway picture of all 15 by eye. Screenshots are in `apps/hq/screenshots/`.

**Not tested:** a real phone (only a phone-sized viewport, on this laptop's GPU); touch gestures; frame rates, on any hardware; other browsers (Chromium only); a screen reader; "no clipping through buildings" beyond the camera height check above.

**Build status (real exit codes):** `apps/hq` typecheck, lint and build pass. `apps/marketing` and `apps/platform` build. `apps/corporate` fails, as it did before this work.
