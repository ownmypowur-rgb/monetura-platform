# MONETURA PLATFORM — ROADMAP

**Date:** 2026-09-06
**Reconciles:** `PLATFORM-AUDIT.md` (2026-09-01, at `f7b6615`) and `DECISIONS.md` against `main` at `e07643b`.
**Method:** read-only. Every claim below was checked against the current source; no code was changed.

Since the audit, ten commits landed: seven sprints (`SPRINTS.md`, all marked COMPLETE) plus three fixes. `pnpm type-check` is green across all six workspaces. What follows separates what is genuinely done from what is still open.

---

## Current State — what is live and proven

**Authentication, end to end.** An admin activates a founder (`apps/platform/src/app/api/admin/founders/[id]/activate/route.ts`), the route mints a 7-day `set_password` token (`packages/db/src/password-tokens.ts`) and emails a branded "Choose Your Password" button; the founder sets a password at `/set-password` via `POST /api/auth/set-password`, then signs in. `/forgot-password` really sends a 24-hour reset link. This is the single biggest change since the audit — the platform went from "no real founder can log in" to a complete credential lifecycle.

**Middleware as an explicit allowlist.** `apps/platform/src/middleware.ts:6-16` lists public pages and `/api/affiliate/track`; everything else requires a session. `/admin*` and `/api/admin/*` additionally verify the session JWT with Edge-safe `getToken` and require `memberTier === "admin"`, failing closed when `NEXTAUTH_SECRET` is absent (lines 66-86).

**Rate limiting.** `packages/db/src/rate-limit.ts` (in-memory fixed window) is applied to forgot-password, set-password, register, marketing `founders/apply` (5/hour per IP), concierge (30/5min per member), and marketplace submit (10/hour per member).

**Publishing actually publishes.** `apps/platform/src/app/api/content/publish/route.ts` calls bundle.social directly through `publishBundlePost()` / `uploadMediaToBundle()` in `packages/db/src/social.ts` — no n8n in the path. Status flows `draft → publishing → published | failed`, with the error stored in `publish_error` and a Retry path in `PostDetail.tsx`. Blog/magazine-only posts publish on-platform without an external call. `scheduleAt` is honoured via `postDate`.

**Photos travel with the post.** `content/generate` re-validates `mediaUploadIds` against `uploader_id` + `status = 'uploaded'`, writes `cover_image_url` from the first upload, and links the rest through `monetura_post_media` (migration `0006_sharp_hemingway`). `/posts` renders covers; `/posts/[id]` renders the full strip; publish streams each image into bundle.social's upload endpoint.

**Honest numbers on every member- and prospect-facing surface.** `packages/db/src/stats.ts` supplies `getActiveFounderCount`, `getMemberTotalReach`, `getPublishedPostCountThisMonth`, `getRecentPosts`, `getActiveChallenge`. `StatsBar` shows "—" rather than a number it cannot source; `RecentPostsCard` shows the member's real last three posts; `ContentCreatorCard` carries no numbers at all; `CommunityCard` reads the seeded live challenge with a real entry count; the login page shows the real founder count; marketing `UrgencySection.tsx` and `/founders` compute `200 − active founders` under ISR with a numberless fallback. The fabricated 24,847 / $1,240 / 8 / "62 Countries" / "$4,200 avg" / "47 spots" strings are gone from the codebase.

**Events, marketplace, submissions run on the database.** Four tables added in migration `0005_cloudy_blur`. `/events`, `/events/[slug]`, `EventsWidget` read `monetura_events` filtered to upcoming; "Reserve Your Spot" POSTs `/api/events/register`. `/marketplace` reads published products with a *computed* average savings; `/marketplace/submit` really writes `monetura_marketplace_submissions`; `/admin/submissions` reviews them (Approve creates an unpublished product row).

**One tier vocabulary.** `packages/config/src/tiers.ts` is consumed by `TiersSection`, `TierSelector` (now four tiers), the apply form, the apply API, the admin console, and the concierge prompt. The apply route persists `province`, `tierInterest`, and `heardAbout` correctly.

**Migrations are in git.** `drizzle/migrations/0000`–`0006` plus `meta/` are tracked; `drizzle-kit generate` reports "no schema changes"; `drizzle.config.ts` no longer lists the ApexCRM schema, so drizzle-kit cannot diff production ApexCRM tables.

**Mobile navigation is complete.** `BottomNav` has four real links plus a "More" sheet reaching Events, Marketplace, Posts, Settings. `SidebarNav`'s Home is a `/dashboard` link and its dead Community item is gone. The always-on notification dot is removed.

**Also live and unchanged since the audit:** S3 presigned upload → confirm; affiliate link creation, click tracking, and the earnings page (all real DB reads); bundle.social account listing and the hosted connect portal; the Concierge streaming chat; the admin founder pipeline (pending → awaiting payment → active).

---

## Fixed Since Audit

| Audit finding | Resolved by |
|---|---|
| **Blocker #1** — no real founder can log in; no password is ever set; `forgot-password` is a `console.log` stub | `ad2bd56` sprint(1) |
| **Blocker #2** — `drizzle/migrations` git-ignored; `0003` has no snapshot; `media_uploads.status` unmigrated | `4a26bd9` sprint(2) — consolidated into `0003_small_millenium_guard` with a real snapshot |
| **Blocker #3** — middleware blocks `/api/affiliate/track` for logged-out visitors | `288a6e5` sprint(3) |
| **Blocker #5** — most of the dashboard is fabricated constants | `bcd0322` sprint(5) |
| Tech Debt 3 — `AUTH:` / presign / confirm debug logs leak PII on every login | `288a6e5` (verified: no `console.log` remains in `auth.ts`, `presign`, `confirm`) |
| Tech Debt 8 — no rate limiting anywhere | `288a6e5` |
| §7 — session tier baked into a 30-day JWT | `288a6e5` — `maxAge` now 7 days (`auth.ts:85`) |
| §7 — admin protection only per-handler | `288a6e5` — JWT tier gate in middleware as defence-in-depth |
| §6 / Rec. 4 — "Publish" is a lie; n8n contract mismatched; `N8N_WEBHOOK_URL` dead path | `ec34b1e` sprint(4) |
| §1.1 — `PostDetail` "Publish" button has no handler | `ec34b1e` |
| Tech Debt 6 — raw `JSON.parse` of model output, no fence stripping, no typed error handling | `5373d74` — `stripCodeFences`, typed `Anthropic.*Error` branches, `stop_reason === "refusal"` guard |
| Tech Debt 15 — `founderNumber` has two sources of truth | `bcd0322` — `auth.ts:70` reads `members.founder_number` only |
| Tech Debt 16 — apply maps `province → city`, drops `tierInterest`/`heardAbout` | `bcd0322` |
| §5.4 — three incompatible founder-tier vocabularies | `bcd0322` — `packages/config/src/tiers.ts` |
| §5.2 — concierge prompt credit numbers contradict `credits.ts` | `bcd0322` — imports `TIER_LIMITS` |
| §5.4 — hardcoded "47 spots remaining" on home and `/founders` | `bcd0322` |
| Rec. 6 / §1.1 — Events, Marketplace, Challenge have no backend; inert CTAs | `480b3c0` sprint(6) |
| §1.1 — `/marketplace/submit` is a `setTimeout` fake | `480b3c0` |
| §1.1 — marketplace "average 22%" claim vs. 20.7% actual | `480b3c0` — computed server-side |
| §1.1 — `BottomNav` cannot reach Events/Marketplace/Posts/Settings; dead Home/Community state buttons | `480b3c0` |
| §5.2 — TopBar notification dot always on | `480b3c0` |
| §1.1 — `/` renders "Coming Soon" instead of redirecting | `6418ef5` |
| §6 / Rec. 7 — uploaded media never linked to a post; `cover_image_url` never written; publish sends text only | `e07643b` sprint(7) |
| §4 — seed scripts insert into ApexCRM `users` with raw SQL | `4a26bd9` — converted to Drizzle |
| §4 — `drizzle.config.ts` lists `./drizzle/schema.ts` (ApexCRM) as a schema source | `4a26bd9` |
| §6 — `getBundleAccounts` hits an undocumented endpoint | `e07643b` — now `GET /team/{id}`, verified against a live key on 2026-09-02 |

---

## Still Outstanding From The Audit

Severity is my assessment as of today, not the audit's.

### High

1. **Non-transactional multi-step writes** (Tech Debt 4). `activate/route.ts:74-108` still does `SELECT MAX(founder_number)` → `UPDATE` → `INSERT` with no transaction: two concurrent activations can assign the same founder number, and a mid-way failure leaves a member marked `active` with no founder key. `register/route.ts` and marketing `apply/route.ts` have the same shape.
2. **Credit deduction race** (Tech Debt 5). `packages/db/src/credits.ts:52-72` is still check-then-insert with no lock or conditional write; parallel `content/generate` calls can overspend a member's monthly allowance. The generation is also still paid for before the credit is debited (`generate/route.ts:141` vs `:211`) — a parse failure now costs API spend but no credit, which is the safer half of the audit's concern and the reason this is High rather than Critical.
3. **`rejectUnauthorized: false` on the production database** (Tech Debt 9). `packages/db/src/index.ts:23`. TLS is encrypted but unauthenticated. The `.env.local.example` line already documents `ssl={"rejectUnauthorized":true}`, so the code and the example contradict each other.
4. **Stripe webhook accepts anything** (Tech Debt 11). `apps/marketing/src/app/api/webhooks/stripe/route.ts:15` — still a scaffold: presence of a `stripe-signature` header, no verification, returns `{received:true}`. Harmless while no Stripe traffic exists; a forgery surface the moment subscriptions go live.
5. **Committed seed credentials** (Tech Debt 10). `scripts/seed-admin-user.ts:28` (`MoneturaAdmin2024!`) and `scripts/seed-demo-user.ts:34` (`Monetura2024!`) are in git history and printed to stdout. Both accounts exist on the live database.
6. **Commissions can never be non-zero** (§5.3). `getCommissionRate()` / `COMMISSION_RATES` in `packages/db/src/commissions.ts:26-40` are still never called. The only writer is `register/route.ts:120`, recording a `$0` milestone row — and it can never fire, because the member it just created is `pending` while `checkReferralMilestone` counts only `active` members. `/earnings` is honest, correct, and will read $0 forever.
7. **Environment variables still undocumented** (§8). `apps/platform/.env.local.example` gained `NEXT_PUBLIC_APP_URL` but still omits `RESEND_API_KEY`, `BUNDLE_SOCIAL_API_KEY`, `N8N_WEBHOOK_BASE_URL`, and `OWNER_EMAIL`. There is still no `.env.example` for `apps/marketing`.

### Medium

8. **n8n WF-01 is still mismatched.** `activate/route.ts:118` fires `{base}/webhook/founder-activated` with `memberTier`; `n8n-workflows/WF-01-founder-activated.json:13` listens on `monetura/founder-activated` and expects `founderTier`. If the paths were reconciled, WF-01 would send a *second* welcome email on top of the route's. `WF-11-welcome-email-sequence.json` (`monetura/start-onboarding`) is still fired by nothing, though `FoundersClient.tsx` tells the admin it fires automatically. `WF-04-content-publish.json` is now fully dead — sprint 4 replaced it, and its callback to `/api/content/publish-status` still points at a route that does not exist.
9. **No post analytics.** `/posts` (`page.tsx:356-358`) and `PostDetail.tsx:282-284` still render `Reach — / Likes — / Earned —`. Honest, but there is no `monetura_post_metrics` table and no bundle.social analytics ingestion, so these are permanently blank.
10. **Travel is entirely hardcoded** (§5.2). `TravelCard.tsx:63,80-82` ("Up to 60% off hotels", Santorini 52% / Kyoto 45% / Maldives 38%) and `travel/page.tsx:5-10` (same three tiles, portal URL as a literal). No Arrivia integration exists — no SDK, no API, no env var. `monetura_travel_bookings` remains unwritten. These are the last member-visible unsourced numbers on the platform.
11. **Trip calculator numbers and dead Save.** `TripSavingsCalculator.tsx:28` still hardcodes `USD_RATE = 0.74`; line 236 still `console.log`s "Save trip" instead of writing anything.
12. **Silent fallbacks that render as empty rather than broken** (§5.5). `/api/social/accounts/route.ts:21` returns `{accounts: []}` with HTTP 200 on any failure — a missing `BUNDLE_SOCIAL_API_KEY` is indistinguishable from "not connected". `EarningsHubCard.tsx:43-52` and `SocialAccountsCard.tsx:40,51` still swallow fetch errors. `concierge/route.ts:111-115` still streams an apology as a normal 200 response. Marketing `apply/route.ts:76,97` still logs and continues after a failed member insert, returning `{success:true}` to a prospect whose application was not stored.
13. **`monetura_challenge_entries` is read but never written.** `stats.ts:144` counts entries; nothing inserts one. `CommunityCard.tsx:113` sends "Submit Your Entry" to `/create`. There is still no `/community` route.
14. **Registration has no UI and no attribution path.** `POST /api/auth/register` has no caller anywhere in either app; `inviteCode` is still parsed and discarded. Cross-domain `?ref` forwarding from monetura.com is deferred by design (DECISIONS, Sprint 3) until the apps share a parent domain, so the referral cookie can only ever be set by a visitor who lands on the platform domain.
15. **`monetura_commissions` has no `type` column** (Tech Debt 14). `recordCommission()` (`commissions.ts:86-101`) still accepts `_type` and `_description` and discards both; `EarningsClient.tsx:97` therefore labels every row "Referral Signup". `referred_by` still stores a code string, not a member id. No table has foreign keys.
16. **Five tables remain entirely unused.** `monetura_milestones`, `monetura_credit_packages`, `monetura_travel_bookings`, `monetura_stripe_customers`, `monetura_email_sequences` — no reads, no writes anywhere. (Down from seven: challenges and challenge_entries are now read.)
17. **Live migration bookkeeping is still unreconciled** (DECISIONS, Sprint 2). The live `__drizzle_migrations` table holds nine entries from a checkout that is not in this repository; the repo journal has three. `drizzle-kit migrate` must not be run against production, and schema changes still require hand-written idempotent DDL. This is documented, not fixed.

### Low

18. **`CreateWizard.tsx` is 1,710 lines** (Tech Debt 18) — one line longer than at audit time — and still re-implements the upload client that the 561-line **orphaned `components/create/UploadZone.tsx`** already provides.
19. **Orphans still present** (§2): `UploadZone.tsx`, `apps/marketing/src/components/founders/StripeCheckout.tsx`, `apps/marketing/src/app/success/page.tsx` (no inbound link), `packages/ui` (three lines, `export {}`, declared as a dependency by all three apps and imported by none).
20. **Duplication** (Tech Debt 19): `MemberTier` is declared three times (`components/dashboard/types.ts:1`, `types/next-auth.d.ts:6`, `packages/db/src/credits.ts:5`); `REFERRALS_FOR_FREE = 3` still appears in `EarningsClient.tsx:41`, `EarningsHubCard.tsx:20`, and as a string literal in `register/route.ts:125`; `apexcrm-users.ts` is duplicated in both apps.
21. **Repo bloat** (Tech Debt 28). All four hero MP4s are still tracked under `apps/marketing/public/videos/`; only `…-drifting.mp4` is referenced by `HeroSection.tsx:22`. ~44 MB of dead binary ships with every deploy.
22. **Build artifacts still tracked** (Tech Debt 27). `.gitignore` no longer ignores them and they are committed: `apps/{platform,marketing,corporate}/tsconfig.tsbuildinfo`, `apps/{platform,marketing}/next-env.d.ts`, and both `.vercel/project.json` files. `apps/platform/tsconfig.tsbuildinfo` shows as modified in a clean checkout, so every working tree is dirty by default.
23. **No tests, no CI, no lint config** (Tech Debt 26). There is no `.github/` directory and no test file in the repository. `pnpm type-check` is the only gate, and nothing runs it automatically.
24. **Every image bypasses `next/image`** (Tech Debt 22). Seven files carry `eslint-disable-next-line @next/next/no-img-element`; Unsplash URLs are hotlinked with no `remotePatterns` configuration.
25. **Brand tokens still bypassed** (Tech Debt 23). Platform components use inline `style={{ color: "#D4A853" }}` hex throughout instead of the `monetura-*` Tailwind classes from `packages/config`.
26. **Garet font TODO** (Tech Debt 25). `apps/platform/src/app/layout.tsx:6` and `packages/config/tailwind.config.ts:17` still stand in Cormorant Garamond.
27. **Scale ceilings unchanged.** `getRemainingCredits` still `SUM()`s the whole month per page load; the mysql2 pool is still `connectionLimit: 10` per serverless instance with no proxy; `/api/affiliate/track` still writes a click row per hit with no dedup; the middleware matcher still runs on fonts and videos.

---

## Known Issues Not In The Audit

### Anthropic model names — the specific check requested

**No retired model ID appears anywhere in the repository.** A repo-wide scan (excluding `node_modules`, `.git`, `.next`) for `claude-[a-z0-9.-]+` returns exactly one distinct string, and none of `claude-opus-4-0`, `claude-opus-4-20250514`, `claude-sonnet-4-0`, or `claude-sonnet-4-20250514` is present.

The one model string in use, matching the `claude-*-4` pattern:

| File | Line | Value |
|---|---|---|
| `apps/platform/src/app/api/content/generate/route.ts` | 149 | `claude-sonnet-4-6` |
| `apps/platform/src/app/api/concierge/route.ts` | 98 | `claude-sonnet-4-6` |
| `PLATFORM-AUDIT.md` | 17, 325 | `claude-sonnet-4-6` (prose, not code) |

**`claude-sonnet-4-6` is not retired** — Claude Sonnet 4.6 is still served. But it is a generation behind and *more expensive* than its successor: Sonnet 4.6 is $3.00/$15.00 per MTok, Sonnet 5 is $2.00/$10.00. Moving both call sites to `claude-sonnet-5` is a two-line change that is cheaper and more capable simultaneously; `claude-opus-5` ($5/$25) is the better choice for `content/generate` if output quality matters more than per-call cost. There is no migration work beyond the string — neither call site uses `budget_tokens`, assistant prefill, or forced `tool_choice`.

### Other issues found now

1. **HTML injection into the owner notification email.** `apps/marketing/src/app/api/founders/apply/route.ts:116,120,122,129` interpolate `name`, `phone`, `province`, and `referral` straight into email HTML with no escaping. `name` accepts 255 characters and `referral` 500, both from an unauthenticated public form. The platform already has the fix in hand — `apps/platform/src/lib/email-templates.ts:26` has an `escapeHtml()` helper and `brandedEmailHtml()` escapes every paragraph — but the marketing route builds its HTML by hand and does not use it.

2. **`content/generate` still parses free-text JSON when structured output exists.** `generate/route.ts:186` does `JSON.parse` on model text and casts with `as`. Sprint fixes added fence-stripping and a `refusal` guard, which removed the common failure, but the response is still unvalidated — a model that returns valid JSON with a missing field produces `undefined` columns in `monetura_content_posts`. `output_config.format` with a schema (or zod validation of the parsed object) would make this structural rather than best-effort.

3. **No `usage` capture and no prompt caching on either Anthropic call.** Neither `generate` nor `concierge` reads `response.usage`, so there is no record of what AI spend a member generated — and the concierge is free to the member, unmetered, with a static per-tier system prompt that is a textbook caching candidate. Combined with outstanding item #6 above, the platform currently cannot answer "what did this member cost us".

4. **`params` typing is still split three ways and now in more places.** `posts/[id]/page.tsx:15` correctly awaits `Promise<{id}>`; `events/[slug]/page.tsx:17`, `marketplace/[slug]/page.tsx:11`, and all three admin API routes (`activate/route.ts:29`, `send-instructions/route.ts:17`, `admin/marketplace/submissions/[id]/route.ts:32`) use a plain object. Fine on Next 14.2; a hard break on Next 15. Sprint 6 added one new instance of the old pattern.

5. **Duplicate-detection by error-message string matching.** `api/events/register/route.ts:56` decides whether a failed insert was a benign re-registration by testing `message.includes("Duplicate entry")`. A driver upgrade or a localised MySQL error message turns a successful "you're already on the list" into a 500.

6. **The set-password link falls back to a Vercel preview domain.** `apps/platform/src/lib/email-templates.ts:36-42` — `appBaseUrl()` falls through to `https://monetura-platform-app.vercel.app` when neither `NEXT_PUBLIC_APP_URL` nor `NEXTAUTH_URL` is set. If production is deployed without that variable, every founder's password link points at a preview domain. Since `NEXT_PUBLIC_APP_URL` is not read by anything that would fail loudly, this is silent.

7. **The bundle.social publish contract has never completed a real post.** DECISIONS (Sprint 4, Sprint 7) records that the contract was assembled from the SDK repo and marketing pages because the docs 404 publicly. A live-key diagnostic on 2026-09-02 confirmed the *account-listing* shapes; the create-post and media-upload paths — trailing slash on `/post/`, `status: "SCHEDULED"` as "publish now", Instagram's `type: "POST"`, TikTok's `type: "IMAGE"` — remain unverified against a real publish. Failure is graceful, but "Publish" has not yet been proven to work once.

8. **Marketing `founders/apply` has no CAPTCHA.** Rate limiting is per-IP, in-memory, and per-serverless-instance (documented limitation in `rate-limit.ts`), so the effective limit is a multiple of 5/hour across instances. This is the only public write path that creates rows in production ApexCRM `users`.

9. **`packages/db/src/rate-limit.ts` state does not survive a cold start.** Not a defect — DECISIONS accepted it for v1 — but worth stating plainly: on Vercel this means the login-adjacent limits are advisory, not enforced.

---

## Launch Blockers

What must be true before a real founder pays $2,500–$5,500 and uses this.

1. **Prove one end-to-end publish with a live `BUNDLE_SOCIAL_API_KEY`.** Post a real photo to a real Instagram account through `/create` → Publish. Every unverified assumption in DECISIONS Sprint 4 and Sprint 7 either holds or does not, and there is no way to find out except by doing it. Until this passes, the platform's headline feature is untested against its actual dependency.

2. **Set `NEXT_PUBLIC_APP_URL` in production and confirm a real welcome email.** Activate a test founder against production, receive the email, click "Choose Your Password", set it, sign in. The fallback in `email-templates.ts:40` makes a misconfiguration invisible until a founder reports a broken link.

3. **Make founder activation transactional.** Two admins activating simultaneously assign the same founder number. Founder numbers are the product — "You are Founder #14" is on the welcome email and the dashboard badge. A duplicate is not recoverable quietly.

4. **Rotate the seeded admin and demo passwords and remove them from source.** `admin@monetura.com` / `MoneturaAdmin2024!` grants the admin console — including founder activation — and the password is in git history and printed by any run of the seed script.

5. **Fill in the production environment variables and document them.** `RESEND_API_KEY`, `BUNDLE_SOCIAL_API_KEY`, `OWNER_EMAIL` are undocumented in `.env.local.example`. A missing `RESEND_API_KEY` makes `getResend()` throw inside activation; a missing `BUNDLE_SOCIAL_API_KEY` renders every member's social page as "Not connected" with no error anywhere.

6. **Fix the email HTML injection in `founders/apply`, and stop returning `{success:true}` after a failed insert.** Both are on the one public path a paying prospect touches first. An application that silently vanishes is a lost sale that no one can diagnose.

7. **Decide what "Commissions" means before showing anyone an earnings page.** Today it is structurally $0: no purchase, subscription, or booking writes a commission, and the referral milestone cannot fire. Either wire a real commission source or relabel the page so a founder is not watching a number that cannot move.

8. **Turn on `rejectUnauthorized: true` with the DigitalOcean CA.** The example env file already prescribes it; the pool overrides it.

Items 1, 2, and 4 are the ones that make the product unusable or unsafe if wrong. 3, 5, 6, 7, 8 are the ones that will produce a support ticket in the first week.

---

## Prioritized Backlog

Ordered by impact. Scope estimates assume one focused session each unless noted.

**Tier 1 — before founders**

| # | Item | Scope |
|---|---|---|
| 1 | Live-key end-to-end publish test; fix whatever the real bundle.social contract turns out to be | half a day, mostly waiting on a key and a test account |
| 2 | Production env vars set + documented in both `.env.local.example` files; real activation email verified | 1 hour |
| 3 | Wrap `activate` (and `register`, `apply`) in a transaction; make founder numbering collision-proof | 2 hours |
| 4 | Rotate seed credentials, remove literals from source, read from env | 1 hour |
| 5 | Escape HTML in the marketing apply email; return a real error when the member insert fails | 1 hour |
| 6 | `rejectUnauthorized: true` with the DO CA bundle | 1 hour, plus a deploy to confirm |
| 7 | Atomic credit deduction (conditional insert or `SELECT … FOR UPDATE`), debit before the Anthropic call, refund on failure | half a day |

**Tier 2 — makes the product honest and operable**

| # | Item | Scope |
|---|---|---|
| 8 | Commission engine: decide the source (subscription, marketplace, Arrivia), add the `type`/`description` columns, call `getCommissionRate`, fix the `pending`-member milestone bug | 2 days — needs a business decision first |
| 9 | Move both Anthropic calls to `claude-sonnet-5` (or `claude-opus-5` for generate); add `usage` capture and prompt caching on the static system prompts | 2 hours |
| 10 | Structured output + zod validation for `content/generate` instead of `JSON.parse` + `as` | 3 hours |
| 11 | Replace hardcoded Travel discounts with an Arrivia feed, or strip the numbers the way sprint 5 did everywhere else | 3 hours to strip; unknown to integrate |
| 12 | Surface real errors instead of empty states: `social/accounts`, `EarningsHubCard`, `SocialAccountsCard`, concierge stream failures | half a day |
| 13 | Reconcile or retire n8n: fix WF-01's path and payload and remove the duplicate welcome email, delete the dead WF-04, and either fire WF-11 or stop telling admins it fires | half a day |
| 14 | Stripe subscriptions: install the SDK, verify webhook signatures, populate `monetura_stripe_customers`, gate `software`/`community` on subscription status | 2 days |

**Tier 3 — completes the promised surface**

| # | Item | Scope |
|---|---|---|
| 15 | `monetura_post_metrics` fed from bundle.social analytics; fill the Reach/Likes/Earned rows and `StatsBar` reach | 1 day, blocked on analytics API access |
| 16 | `/community` route + challenge entry submission writing `monetura_challenge_entries` | 1 day |
| 17 | Admin CRUD for events and marketplace products (currently DB-only; approved submissions need a human to flip `is_published`) | 1 day |
| 18 | Registration UI, or delete `POST /api/auth/register` and its dead `inviteCode` handling | half a day either way |
| 19 | Cross-domain referral attribution once the apps share `.monetura.com` | 3 hours, blocked on DNS |
| 20 | Trip calculator: live FX rate, and "Save this trip" writes `monetura_travel_bookings` | half a day |

**Tier 4 — debt and hygiene**

| # | Item | Scope |
|---|---|---|
| 21 | CI: a GitHub Actions job running `pnpm type-check` and `pnpm lint` on every push | 1 hour |
| 22 | First tests: route-level coverage for auth, credit deduction, and activation | 1 day |
| 23 | Untrack `*.tsbuildinfo`, `next-env.d.ts`, `.vercel/`; add them to `.gitignore` | 15 minutes |
| 24 | Delete the three unreferenced hero MP4s (~44 MB); move the fourth to a CDN or Git LFS | 1 hour |
| 25 | Delete `UploadZone.tsx`, `StripeCheckout.tsx`, `/success`, `packages/ui` and its three dependency declarations | 1 hour |
| 26 | Split `CreateWizard.tsx` (1,710 lines) into preview renderers, upload client, and wizard state | 1 day |
| 27 | Collapse duplicated `MemberTier`, `REFERRALS_FOR_FREE`, and `apexcrm-users` into `packages/db` / `packages/config` | 2 hours |
| 28 | Normalise `params` typing to `Promise<…>` everywhere ahead of Next 15 | 1 hour |
| 29 | Replace the `"Duplicate entry"` string match in `events/register` with a driver error code check | 15 minutes |
| 30 | Reconcile the live `__drizzle_migrations` history with the repo journal so `drizzle-kit migrate` can be used again | half a day, needs the other checkout's migrations |
| 31 | Cached credit balance instead of a monthly `SUM()` per page load; connection pooling in front of TiDB | 1 day, at ~2k members |
| 32 | Adopt `next/image` with `remotePatterns`; replace inline hex with the `monetura-*` Tailwind tokens; resolve the Garet font TODO | 1 day |
| 33 | Drop or use the five dead tables (`milestones`, `credit_packages`, `travel_bookings`, `stripe_customers`, `email_sequences`) | decide alongside items 8, 11, 14 |
