# MONETURA PLATFORM — CODEBASE AUDIT

**Date:** 2026-09-01
**Scope:** Full monorepo at `origin/main` (`f7b6615`, "Polish mobile hero composition", 2026-05-13). Read-only analysis — no code was changed.
**Method:** Every source file was read; every claim below cites a file (and line where stable). Three parallel sweeps (routes/components, API/integrations/env, DB/hardcoded data) were reconciled against a direct review of auth, middleware, schema, migrations, and every API route.

> **Context that shapes everything below.** The platform was built in a single burst between 2026-04-05 and 2026-04-09 (66 commits), followed by nine marketing-only commits through 2026-05-13. Nothing in `apps/platform` has changed in almost five months. The local checkout was 9 commits behind `origin/main` at audit start and was fast-forwarded (marketing-only changes) so this report reflects the current remote.

---

## Executive summary

**What works end-to-end today**

- Credentials login (`auth.ts`) against the shared ApexCRM `users` table + `monetura_members` — for accounts created by the seed scripts.
- Admin founder pipeline: `/admin/founders` → send e-transfer instructions → activate (assigns founder number, creates founder key, sends welcome email via Resend).
- Content creation: S3 presigned upload → Claude generation (`claude-sonnet-4-6`) → per-platform previews → draft saved to `monetura_content_posts` → credit debited.
- Post history (`/posts`, `/posts/[id]`), earnings page (`/earnings`) and earnings widget — all real DB reads.
- Social account connection via bundle.social hosted portal (`/settings/social`).
- AI Concierge streaming chat.
- Marketing site: static pages + founder application form that writes `monetura_members` and emails the owner.

**The five things that would stop a real launch**

1. **No real founder can log in.** The apply → activate pipeline never sets a password (`founders/apply/route.ts:77-83` inserts an ApexCRM user with no `passwordHash`; `activate/route.ts` never sets one; `forgot-password` is a stub that only `console.log`s). The only accounts with passwords are the two seed users. The welcome email tells founders to "sign in at app.monetura.com" — they can't.
2. **Database migrations are not in git.** `.gitignore:16` ignores `drizzle/migrations`. The four migration files exist only on this machine. The TS schema has drifted from them (`monetura_media_uploads.status` is used by the upload routes but is defined in no migration), and `0003` was hand-written without a snapshot, so the next `drizzle-kit generate` will produce a wrong diff.
3. **Affiliate tracking is unreachable.** `middleware.ts:4` whitelists only `/login` and `/forgot-password`; a logged-out visitor clicking `/api/affiliate/track?code=…` is redirected to `/login` and the click is never recorded, the cookie never set.
4. **n8n is wired to nothing that matches.** Every code webhook path (`/webhook/founder-activated`, `/webhook/publish-content`) differs from the JSON workflow paths (`monetura/founder-activated`, `monetura/publish-content`); two different env var names are used; payload fields differ; WF-04 calls back to `/api/content/publish-status`, which doesn't exist. "Publish" therefore marks a post `published` and nothing is posted anywhere.
5. **Most of the dashboard is fake.** Total Reach 24,847, Commissions $1,240, Posts 8, the three "recent posts", the challenge card, the trip discounts, all five events, all 15 marketplace products, the login page's "200 founders / 62 countries / $4,200 avg" — all constants. Only AI credits, the earnings widget, and social-connection state are live.

---

## 1. Route Map

Status legend — **Complete**: real data/working actions. **Partial**: renders, but data is hardcoded or a key action is inert. **Placeholder**: stub.

### 1.1 `apps/platform` (app.monetura.com, port 3001)

**Middleware** — `apps/platform/src/middleware.ts`
- Matcher: everything except `_next/static`, `_next/image`, favicon, and image extensions — i.e. **all pages and all `/api/*`**.
- `/api/auth/*` always passes (line 11). Public pages: `/login`, `/forgot-password` only (line 4).
- Auth = *presence* of `__Secure-authjs.session-token` / `authjs.session-token` cookie (lines 14-18); the JWT is not verified here (pages call `auth()` themselves).
- Authenticated → `/login` redirects to `/dashboard`; unauthenticated → anything else redirects to `/login?callbackUrl=…`.
- **No role check** for `/admin/*` (done in the page/routes instead — see §7).

| URL | File | Kind | What it does | Data | Status |
|---|---|---|---|---|---|
| `/` | `src/app/page.tsx` | Server | Renders "Monetura Platform — Coming Soon". No redirect to `/dashboard`. | none | **Placeholder** |
| `/login` | `src/app/(auth)/login/page.tsx` | Client | Split-panel credentials login; `signIn("credentials")`, honours `?callbackUrl`. Social-proof panel shows "200 Founding Members / 62 Countries / $4,200 Avg monthly earnings" (fabricated). | NextAuth | Complete (copy is fake) |
| `/forgot-password` | `src/app/(auth)/forgot-password/page.tsx` | Client | Email form → `POST /api/auth/forgot-password`; shows success. | API stub | **Partial** — no email is ever sent |
| `/dashboard` | `src/app/dashboard/page.tsx` | Server | `auth()` gate; computes AI credits via `getRemainingCredits`; renders `DashboardShell` with 9 widgets. | DB (credits only) | **Partial** — 6 of 9 widgets hardcoded (§5) |
| `/create` | `src/app/create/page.tsx` | Server | `auth()` gate; passes credits to `CreateWizard` (4-step generate/preview/publish). | DB + APIs | Complete (publish is optimistic — §6) |
| `/posts` | `src/app/posts/page.tsx` | Server | Member's posts, status tabs, cursor pagination (20). Stats row "Reach — / Likes — / Earned —" is a placeholder. | `monetura_content_posts` | Complete |
| `/posts/[id]` | `src/app/posts/[id]/page.tsx` + `PostDetail.tsx` | Server+Client | Single post, per-platform tabs. **"Publish" button has no handler.** | DB | **Partial** |
| `/earnings` | `src/app/earnings/page.tsx` + `EarningsClient.tsx` | Server+Client | Commissions (month/all-time/pending), referral milestone, clicks, referred members, commissions table. | DB helpers | Complete (all real, but totals will always be $0 — §5.3) |
| `/travel` | `src/app/travel/page.tsx` | Client | Link-out to `https://members.monetura.com/` (Arrivia) + 3 hardcoded discount tiles. | hardcoded | **Partial** |
| `/events` | `src/app/events/page.tsx` | Server | 5 event cards from `lib/events-data.ts`. | hardcoded | **Partial** |
| `/events/[slug]` | `src/app/events/[slug]/page.tsx` | Server | Cinematic detail page. **CTA button has no handler** (server component, no form/link). | hardcoded | **Partial** |
| `/marketplace` | `src/app/marketplace/page.tsx` | Client | Catalogue with category filters; "save an average of 22%" is a hardcoded string. | `lib/marketplace-data.ts` | **Partial** |
| `/marketplace/[slug]` | `src/app/marketplace/[slug]/page.tsx` + `ProductDetailClient.tsx` | Server+Client | Gallery, pricing, external buy link / `mailto:`. | hardcoded | **Partial** |
| `/marketplace/submit` | `src/app/marketplace/submit/page.tsx` | Client | Product submission form. `handleSubmit` awaits `setTimeout(800)` then shows "Submission Received". **Nothing is sent or stored.** | none | **Placeholder** (UI only) |
| `/settings` | `src/app/settings/page.tsx` | Server | `redirect("/settings/social")`. | — | Complete |
| `/settings/social` | `src/app/settings/social/page.tsx` + `SocialSettingsClient.tsx` | Client | Lists bundle.social accounts; "Connect" opens hosted portal; handles `?connected=true`. | bundle.social | Complete (requires `BUNDLE_SOCIAL_API_KEY`) |
| `/admin/founders` | `src/app/admin/founders/page.tsx` + `FoundersClient.tsx` | Server+Client | Admin-only pipeline: Pending → Awaiting Payment → Active; tier override modal. | `monetura_members` | Complete |

**Layouts:** `src/app/layout.tsx` (Cormorant Garamond as a stand-in for Garet — `TODO` line 6), `(auth)/layout.tsx` (metadata only), `settings/layout.tsx` (renders `SidebarNav`/`BottomNav` with `onTabChange={() => {}}` — Home/Community buttons are dead inside Settings).

**Navigation integrity**
- No nav `href` points at a missing route.
- "Home" and "Community" in `SidebarNav`/`BottomNav` are state buttons, not links. There is **no `/community` route** and `DashboardShell` never branches on `activeTab`; from `/settings/*` and `/admin/founders` the Home button does nothing.
- `BottomNav` (mobile) has 5 tabs; `/events`, `/marketplace`, `/posts`, `/settings/social`, `/admin/founders` are unreachable from mobile nav.
- Inert buttons: `TopBar` bell + avatar; `RecentPostsCard` "View all"; `EventsWidget` "View All Events"; `CommunityCard` "Submit Your Entry"; `PostDetail` "Publish"; `events/[slug]` CTA; `TripSavingsCalculator` "Save this trip" (`console.log` only, line 236).
- `params` typing is inconsistent: `posts/[id]` awaits a `Promise`, `events/[slug]` and `marketplace/[slug]` use a plain object (fine on Next 14.2, breaks on 15).

### 1.2 `apps/marketing` (monetura.com, port 3000) — no middleware, all public

| URL | File | What it does | Status |
|---|---|---|---|
| `/` | `src/app/page.tsx` (35 lines) | Composes 12 `components/home/*` sections: Hero (video bg), Story, Problem, Solution, TravelMoments, Platform, BlogTransform, Offer, Destinations, Tiers, Urgency, CTA. | Complete (static) |
| `/founders` | `src/app/founders/page.tsx` | Hero + `FounderBenefits` + `TierSelector` + CTA. "47 spots remaining." hardcoded (line 53). | Complete (static) |
| `/founders/apply` | `src/app/founders/apply/page.tsx` | Webinar/application form → `POST /api/founders/apply` → `/founders/apply/success`. Ignores `?tier=` param that `TierSelector` passes. | Complete |
| `/founders/apply/success` | `…/success/page.tsx` | Static confirmation. | Complete |
| `/how-it-works` | `src/app/how-it-works/page.tsx` | Static 4-step page; names 3 tiers (omits the $4,500 tier shown on home). | Complete (static) |
| `/story` | `src/app/story/page.tsx` | Static origin story. | Complete (static) |
| `/success` | `src/app/success/page.tsx` | Static "You're in the room" page that reads like a Stripe success page. **Linked from nowhere.** | Orphaned |

### 1.3 `apps/corporate` (moneturamedia.com, port 3002)

| URL | File | Status |
|---|---|---|
| `/` | `src/app/page.tsx` | **Placeholder** — "Monetura Media — Coming Soon" |

### 1.4 `packages/`

- `packages/db` — `getDb()` (lazy mysql2 pool, `connectionLimit: 10`, `ssl.rejectUnauthorized: false`) + re-exports of the Monetura schema and the credits/affiliates/social/commissions helpers. In use everywhere.
- `packages/config` — shared Tailwind brand tokens. In use by all three apps' `tailwind.config.ts`. Note: most platform components bypass the tokens with inline `style={{ color: "#D4A853" }}` hex values.
- `packages/ui` — `export {};` (3 lines). Declared as a dependency and in `transpilePackages` for all three apps, but **nothing imports it**.

---

## 2. Component Inventory

Import status was verified per component with a repo-wide grep. **ORPHANED** = never imported anywhere.

### Dashboard shell / navigation (`apps/platform/src/components/dashboard/`)

| Component | Lines | Purpose | Data | Notes |
|---|---|---|---|---|
| `DashboardShell.tsx` | 71 | Sidebar + TopBar + StatsBar + 9-card grid + BottomNav + ConciergeWidget | props | Holds `activeTab` but never renders different content |
| `SidebarNav.tsx` | 258 | Desktop nav (Create/Earnings/Travel/Events/Marketplace/Posts links; Home/Community state buttons; admin-only Founders; Settings; sign-out; tier badge) | props | Also used by `settings/layout.tsx`, `FoundersClient.tsx` |
| `BottomNav.tsx` | 104 | Mobile 5-tab bar | props | Missing Events/Marketplace/Posts/Settings |
| `TopBar.tsx` | 97 | Greeting, founder # badge, bell, avatar | props | Bell/avatar inert; dot always shown |
| `icons.tsx` | 217 | 21 SVG icons | — | All 21 used |
| `types.ts` | 9 | `MemberTier`, `DashboardUser` | — | `MemberTier` duplicated in `types/next-auth.d.ts` and `packages/db/src/credits.ts` |

### Dashboard widgets

| Component | Lines | Data source | Live? |
|---|---|---|---|
| `StatsBar.tsx` | 99 | Reach 24,847 / Commissions $1,240 / Posts 8 hardcoded; AI Credits from props | **1 of 4 tiles live** |
| `ContentCreatorCard.tsx` | 93 | "Avg reach 3,100 / $154 / Tuesday" hardcoded | No |
| `EarningsHubCard.tsx` | 215 | `GET /api/member/affiliate` + `/api/member/earnings` | **Yes** (errors swallowed → shows `MTR-—`, $0 silently) |
| `TravelCard.tsx` | 122 | Copy + 3 destination discounts hardcoded; link to Arrivia portal | No |
| `SocialAccountsCard.tsx` | 174 | `GET /api/social/accounts` | **Yes** (any failure renders as "Not connected") |
| `CommunityCard.tsx` | 129 | "Kill Them With Kindness Challenge", 47/100, $500, 24 days — hardcoded; CTA inert | No |
| `EventsWidget.tsx` | 152 | `lib/events-data.ts` | No |
| `TripSavingsCalculator.tsx` | 653 | Pure client math; `USD_RATE = 0.74` fixed; "Save" logs to console | n/a |
| `RecentPostsCard.tsx` | 183 | 3 fake posts (Santorini/Tokyo/Whistler) with reach/earned | No |

### Content creation

| Component | Lines | Notes |
|---|---|---|
| `app/create/CreateWizard.tsx` | **1,704** | Entire wizard in one file: 6 platform preview renderers, 4 steps, its own `uploadFile()` presign/PUT/confirm implementation, generate + publish calls. Largest file in the repo. Preview mock-ups show hardcoded "2,847 likes" / "12.4K" / "284 comments". |
| `components/create/UploadZone.tsx` | 561 | Drag-and-drop uploader with the same presign/confirm flow. **ORPHANED** — `CreateWizard` re-implements it inline. |
| `app/posts/[id]/PostDetail.tsx` | 298 | Platform tabs, read-only content. "Publish" button has no `onClick`. |

### Earnings

| Component | Lines | Notes |
|---|---|---|
| `app/earnings/EarningsClient.tsx` | 575 | All numbers from server props (live). `TypeBadge` always says "Referral Signup" (no type column). Payout policy copy ("30-day window", "1st of month", "$50 minimum") hardcoded. |

### Travel — no dedicated components (page + `TravelCard`).
### Community — `CommunityCard` only. No route, no components.
### Events — `EventsWidget` + `lib/events-data.ts` (158 lines, 5 events, Unsplash images).
### Marketplace — `app/marketplace/[slug]/ProductDetailClient.tsx` (297) + `lib/marketplace-data.ts` (404 lines, 15 products; brand misspelled "Monetaura" in every `longDescription`).
### Concierge / AI — `components/concierge/ConciergeWidget.tsx` (571): floating chat, 4 suggestion chips, streams `/api/concierge`. Mounted only on `/dashboard`. Redefines `SparkleIcon` rather than importing from `icons.tsx`.
### Admin — `app/admin/founders/FoundersClient.tsx` (760): tabs, `ApplicationCard`, `ConfirmModal`, `ActiveFoundersTable`, toasts; calls the three admin APIs.
### Auth — `src/auth.ts` (146), `src/lib/apexcrm-users.ts` (25, read-only stub of ApexCRM `users`), `app/settings/social/SocialSettingsClient.tsx` (300; redefines the four social icons).

### Marketing site (`apps/marketing/src/components/`)

| Component | Used by | Notes |
|---|---|---|
| `layout/Navbar.tsx`, `layout/Footer.tsx` | root layout | Footer: "Limited to 200 founders" hardcoded |
| `home/HeroSection.tsx` | `/` | `<video>` from `/videos/monetura-hero-preview-01-drifting.mp4` (16.8 MB); stats "200 / Lifetime" |
| `home/StorySection`, `ProblemSection`, `SolutionSection`, `TravelMomentsSection`, `PlatformSection`, `BlogTransformSection`, `OfferSection`, `DestinationsSection`, `TiersSection`, `UrgencySection`, `CTASection` | `/` | All static arrays. `TiersSection`: 4 tiers $2,500/$3,500/$4,500/$5,500. `UrgencySection.tsx:3-4`: `spotsRemaining = 47`, `totalSpots = 200` |
| `founders/FounderBenefits.tsx`, `founders/TierSelector.tsx` | `/founders` | `TierSelector`: **3** tiers (Explorer/Trailblazer/Luminary — no $4,500 tier), links to `/founders/apply?tier=…` which is ignored |
| `founders/StripeCheckout.tsx` | — | **ORPHANED** stub ("coming soon") |

### Orphaned / unused summary

- `apps/platform/src/components/create/UploadZone.tsx` — 561 lines, never imported.
- `apps/marketing/src/components/founders/StripeCheckout.tsx` — never imported.
- `apps/marketing/src/app/success/page.tsx` — route with no inbound link.
- `packages/ui` — empty package, declared everywhere, imported nowhere.
- `apps/marketing/public/videos/` — four hero MP4s (60.7 MB total) committed; only `…-drifting.mp4` is referenced. ~44 MB dead binary in git history.
- API with no caller: `POST /api/auth/register` (no registration UI exists), `GET /api/content` (the `/posts` page queries the DB directly).
- `packages/db` exports never called: `getCommissionRate`, `recordClick` (track route inserts directly instead), `getPendingCommissions`, `getMonthlyCredits`.

---

## 3. API Routes

All routes are `force-dynamic` unless noted. "Auth" = what the handler itself checks (middleware cookie-presence applies on top for platform routes).

### `apps/platform/src/app/api/`

| Route | Method | Purpose | Auth | Validation | Status |
|---|---|---|---|---|---|
| `auth/[...nextauth]` | GET/POST | NextAuth handlers | — | — | Implemented |
| `auth/register` | POST | Self-serve signup: bcrypt hash, **inserts ApexCRM `users`** (lines 71-77) + `monetura_members` (status `pending`), reads `mtr_ref` cookie, records $0 milestone commission, fires n8n `referral-milestone` | none | zod | **Partial** — no UI calls it; `inviteCode` parsed and discarded; new member is `pending` so cannot log in; milestone check counts only `active` referrals so can never trigger here; not transactional |
| `auth/forgot-password` | POST | Password reset request | none | zod | **Stub** — `// TODO: send password reset email via Resend when reset flow is implemented` (line 26); logs email, returns `{success:true}` |
| `admin/founders` | GET | Refresh founder pipeline data | admin | — | Implemented |
| `admin/founders/[id]/send-instructions` | POST | `pending → awaiting_payment`; emails e-transfer instructions (Resend) | admin | zod | Implemented (reference `MTR-0042` is derived from member id, not the unused `reference_code` column) |
| `admin/founders/[id]/activate` | POST | `awaiting_payment → active/founder`; assigns founder # (`max+1`, lines 71-75), inserts `monetura_founder_keys`, fires n8n WF-01, sends welcome email | admin | zod | Implemented — **but never sets a password**; founder-number assignment is non-transactional (race); WF-01 also sends a welcome email (duplicate) |
| `affiliate/track` | GET | Records click, sets `mtr_ref` cookie (30 d), 301 to link destination | none (by design) | manual | Implemented — **blocked by middleware for logged-out users** |
| `member/affiliate` | GET | Code, tracking URL, clicks this month, referral count | session | — | Implemented |
| `member/earnings` | GET | Commission totals, milestone, all commissions | session | — | Implemented |
| `concierge` | POST | Streams Claude reply with tier-personalised system prompt | session | zod (≤50 msgs, ≤4000 chars) | Implemented — no credit cost, no logging, no rate limit; on error streams a canned apology with HTTP 200 (lines 91-98) |
| `content/generate` | POST | Credit check → Claude `messages.create` → `JSON.parse` → insert draft → `deductCredit` | session | zod | Implemented — `mediaUploadIds` accepted but never linked to the post; raw `JSON.parse` of model text (line 110) with no schema validation; credit is deducted *after* the (paid) API call so a parse failure costs money but no credit |
| `content/publish` | POST | Ownership check → set `status = "published"` → fire n8n `publish-content` | session + owner | zod | **Partial** — status flipped before anything is posted; `scheduleAt` forwarded but never honoured; no bundle.social call in code |
| `content` | GET | Paginated post list | session | zod | Implemented, **no caller** |
| `upload/presign` | POST | S3 presigned PUT (5 min) + `monetura_media_uploads` row (`status: "pending"`) | session | zod (jpeg/png/webp/heic ≤20 MB) | Implemented — 6 debug `console.log`s; uses `status` column that no migration creates |
| `upload/confirm` | POST | Marks upload `uploaded` | session + owner | zod | Implemented — no S3 HEAD to verify the object exists; 4 debug logs |
| `social/connect` | POST | bundle.social portal URL (creates team on first use) | session | — | Implemented |
| `social/accounts` | GET | Connected accounts from bundle.social | session | — | Implemented — any error → `{accounts: []}` 200 |

### `apps/marketing/src/app/api/`

| Route | Method | Purpose | Auth | Status |
|---|---|---|---|---|
| `founders/apply` | POST | Upserts `monetura_members` (`founder`/`pending`), inserts ApexCRM `users` (no password), emails owner via Resend | none | Implemented — but stores `province` into `city` (line 60) and **never persists `tierInterest`, `heardAbout`, or `province`** although the admin screen reads them and `activate` uses `tierInterest` for key tier; every DB error is swallowed and the route still returns `{success:true}`; no rate limiting / CAPTCHA |
| `webhooks/stripe` | POST | Stripe webhook | header presence only | **Stub** — `// TODO: Implement when Stripe subscriptions go live` (line 15); no signature verification; returns `{received:true}` |

**Routes returning fake success:** `auth/forgot-password`, `webhooks/stripe`, and (client-side) `marketplace/submit`.

---

## 4. Database Tables In Use

Schema: `drizzle/monetura-schema.ts` — 17 tables, all `monetura_`-prefixed, relations declared but **no foreign-key constraints** (Drizzle `relations()` only). `drizzle/schema.ts` (the "ApexCRM schema") is a **one-line comment** — the ApexCRM schema is not actually in the repo; the `users` table is declared by two duplicate local stubs (`apps/platform/src/lib/apexcrm-users.ts`, `apps/marketing/src/lib/apexcrm-users.ts`).

| Table | Used? | Where |
|---|---|---|
| `monetura_members` | **Yes** | auth, register, apply, admin page + 3 admin routes, earnings page, affiliates/commissions helpers, seeds |
| `monetura_founder_keys` | **Yes** | auth (founder # lookup), activate, demo seed |
| `monetura_content_posts` | **Yes** | generate, publish, `GET /api/content`, `/posts`, `/posts/[id]` |
| `monetura_media_uploads` | **Yes** | presign, confirm — **`status` column exists in TS schema only, not in any migration** |
| `monetura_affiliate_links` | **Yes** | `packages/db/src/affiliates.ts`, auth (auto-create on login), track, register, earnings |
| `monetura_affiliate_clicks` | **Yes** | track (direct insert), earnings, affiliates helpers |
| `monetura_commissions` | **Yes** | `packages/db/src/commissions.ts`; only ever *written* by register's $0 milestone row |
| `monetura_credit_usage` | **Yes** | `packages/db/src/credits.ts`; dashboard, create, generate |
| `monetura_bundle_teams` | **Yes** | `packages/db/src/social.ts` |
| `monetura_social_accounts` | Seed only | `seed-demo-user.ts` inserts one Instagram row; app reads connections from bundle.social instead |
| `monetura_milestones` | **Unused** | — |
| `monetura_credit_packages` | **Unused** | (Stripe price id column) |
| `monetura_challenges` | **Unused** | `CommunityCard` should read this |
| `monetura_challenge_entries` | **Unused** | `CommunityCard` "Submit" should write this |
| `monetura_travel_bookings` | **Unused** | Calculator "Save this trip" could write this |
| `monetura_stripe_customers` | **Unused** | Stripe not implemented |
| `monetura_email_sequences` | **Unused** | WF-11 drip has no DB tracking |

**Tables that do not exist but the UI assumes:** events + event registrations, marketplace products + submissions, post analytics (reach/likes/earned), notifications, password-reset tokens, concierge conversation log, commission *type*.

**ApexCRM `users` (production, shared with ApexCRM):**
- Read: `auth.ts:40-44`.
- **Written** (contrary to the "READ ONLY — NEVER write" header in `apps/platform/src/lib/apexcrm-users.ts:1`): `register/route.ts:71-77`, `marketing …/founders/apply/route.ts:77-83`, and both seed scripts via **raw SQL** (`INSERT INTO users …` — a violation of the "Drizzle only" rule).
- `drizzle.config.ts:8` lists `./drizzle/schema.ts` as a schema source. It's empty today, but if the real ApexCRM schema were ever pasted in, `drizzle-kit generate` would start emitting migrations against production ApexCRM tables.

**Migrations vs schema**
- `drizzle/migrations/` is **git-ignored** (`.gitignore:16`) — `0000`–`0003` exist only locally; Vercel/production have no migration history in source control.
- `meta/_journal.json` lists four entries; `0003_bundle_social_teams` has a hand-typed `when: 1775620000000` and **no `meta/0003_snapshot.json`**. The next `drizzle-kit generate` will diff against snapshot 0002 and try to re-create `monetura_bundle_teams`.
- `monetura_media_uploads.status` (`monetura-schema.ts:194-196`) appears in no migration or snapshot; the upload flow only works if the live DB was altered by hand.
- Auth-relevant drift: `auth.ts:79` sets the session `founderNumber` from `monetura_founder_keys.id` (the row's auto-increment id), while `activate/route.ts:90-97` writes the real number to `monetura_members.founder_number` and the stale-JWT path (`auth.ts:118-131`) reads that column. Two sources of truth — a founder can see different numbers depending on login path.

**Seed scripts** (`apps/platform/scripts/`): `seed-admin-user.ts` creates `admin@monetura.com` / `MoneturaAdmin2024!` (line 28, committed); `seed-demo-user.ts` creates `demo@monetura.com` / `Monetura2024!` (line 34) as a gold founder with 24,847 Instagram followers — the same number hardcoded in `StatsBar`, so demos look consistent.

---

## 5. Hardcoded vs Live Data (CRITICAL)

### 5.1 What is genuinely live

| Surface | Source |
|---|---|
| Login, session name/tier/founder # | ApexCRM `users`, `monetura_members`, `monetura_founder_keys` |
| `StatsBar` → AI Credits tile only | `monetura_credit_usage` |
| `EarningsHubCard`, `/earnings` | `monetura_affiliate_links/_clicks/_commissions/_members` |
| `SocialAccountsCard`, `/settings/social` | bundle.social API |
| `/posts`, `/posts/[id]` (except stats row) | `monetura_content_posts` |
| `/create` pipeline | S3, `monetura_media_uploads`, Claude, `monetura_credit_usage`, `monetura_content_posts` |
| `/admin/founders` | `monetura_members` |
| Concierge replies | Claude (system prompt static) |
| Marketing `/founders/apply` submission | `monetura_members` + `users` + Resend |

### 5.2 Platform — everything hardcoded, with where it should come from

| Location | Hardcoded value(s) | Should come from | Table exists? |
|---|---|---|---|
| `components/dashboard/StatsBar.tsx` | Total Reach **24,847** "+12% this month"; Commissions **$1,240**; Posts **8** | bundle.social analytics / `monetura_social_accounts.follower_count`; `getTotalCommissionsThisMonth()`; `count(monetura_content_posts where published this month)` | partly |
| `components/dashboard/RecentPostsCard.tsx` | 3 posts (Santorini 4,200 reach/$180; Tokyo 8,100/$340; Whistler 12,547/$720) | `monetura_content_posts` + a post-analytics table | posts yes; analytics **no** |
| `components/dashboard/ContentCreatorCard.tsx` | Avg reach 3,100 / Avg earned $154 / Best day Tuesday | analytics + commissions | **no** |
| `components/dashboard/CommunityCard.tsx` | "Kill Them With Kindness Challenge", 47/100 entries, $500 prize, 24 days left | `monetura_challenges` + `monetura_challenge_entries` | yes (unused) |
| `components/dashboard/TravelCard.tsx` | "Up to 60% off hotels"; Santorini 52% / Kyoto 45% / Maldives 38% | Arrivia deals feed | **no** |
| `app/travel/page.tsx` | Same 3 destinations; portal URL `https://members.monetura.com/` | Arrivia / env | **no** |
| `components/dashboard/EventsWidget.tsx`, `app/events/*` | `lib/events-data.ts` — 5 events (Calgary meetup May 15 2026, Tulum "From $2,800", Santorini "$5,200", Botswana "$9,500", Banff "$1,200"), Unsplash images, no date filtering (past events keep showing) | `monetura_events` + `monetura_event_registrations` | **no** |
| `app/marketplace/*` | `lib/marketplace-data.ts` — 15 products with public/member prices and savings %, Unsplash images, fake `approvedAt`; "average 22%" claim (actual mean 20.7%); "$50 credit" reward | `monetura_marketplace_products` + `_submissions` | **no** |
| `app/marketplace/submit/page.tsx` | Submission simulated with `setTimeout` | API + submissions table | **no** |
| `components/dashboard/TripSavingsCalculator.tsx` | `USD_RATE = 0.74`; tax bracket cap 53%; "Business trips can deduct 100%" copy; Save → `console.log` | FX API; `monetura_travel_bookings` or new table | partial |
| `app/dashboard/page.tsx:9-15` | `TIER_TOTALS` credits per tier | single source with `packages/db/src/credits.ts:8-14` (duplicated) | n/a |
| `components/dashboard/TopBar.tsx` | Notification dot always on | notifications table | **no** |
| `app/(auth)/login/page.tsx` | "200 Founding Members / 62 Countries / $4,200 Avg monthly earnings" | `monetura_members` counts, `monetura_commissions` avg | yes |
| `app/posts/page.tsx`, `PostDetail.tsx` | Stats rows "Reach — / Likes — / Earned —" | post analytics | **no** |
| `app/create/CreateWizard.tsx` | Preview engagement "2,847 likes", "12.4K", "284 comments"; handle derived from member name (`sarah.mitchell`) not the connected social handle | bundle.social account username | n/a |
| `api/concierge/route.ts` system prompt | "Founders get 500 credits/month", "Early Adopter (100-300 credits)", "Member (50 credits)", "Submit via the Community tab" | must match `credits.ts` tiers (free 0 / community 50 / software 100 / founder 500) and real nav | n/a |
| `EarningsClient.tsx` | `REFERRALS_FOR_FREE = 3` (also in `EarningsHubCard`, `commissions.ts`, `register/route.ts`, concierge prompt); payout policy copy; "Referral Signup" badge for every row | config table / one constant; commission `type` column | **no** type column |
| Admin emails (`send-instructions`, `activate`) | `payments@monetura.com`, "$10,000 per transaction", "held for 7 days" | config / Resend templates | n/a |

### 5.3 Data-quality traps (live queries over data that can't exist yet)

- **Commissions are always $0.** The only writer is `register/route.ts:104-111`, which records a `$0` "milestone" row. `COMMISSION_RATES` (founder 0.25 / software 0.20 / free 0.15) exists in `commissions.ts` but `getCommissionRate()` is never called. No purchase, subscription, or Arrivia booking ever creates a commission.
- **Referral milestone can never fire from registration:** the new member is inserted `pending` and `checkReferralMilestone` counts only `active` members.
- **Referral cookie domain:** `track` sets `mtr_ref` on the platform domain and redirects to `https://monetura.com?ref=…`; the marketing site never reads `?ref`, and nothing on the platform calls `/api/auth/register`. Attribution has no working path today.

### 5.4 Marketing site

| Location | Hardcoded | Should come from |
|---|---|---|
| `home/UrgencySection.tsx:3-4` | `spotsRemaining = 47`, `totalSpots = 200` (comment: "In production this would be fetched from DB") | `200 − count(active founders)` |
| `app/founders/page.tsx:53` | "47 spots remaining." | same |
| `home/HeroSection.tsx`, `CTASection`, `Footer`, `story`, `how-it-works` | "200 founders", "Canada only", "5 business days" | config |
| `home/TiersSection.tsx` | 4 tiers: $2,500 / $3,500 / $4,500 / $5,500 | pricing config |
| `founders/TierSelector.tsx` | **3** tiers: Explorer $2,500 / Trailblazer $3,500 / Luminary $5,500 | same config — currently disagrees with home |
| `app/founders/apply/page.tsx` | "Entry / Core / Elite / Platinum Founder" — a **third** naming scheme; DB `tier_interest` uses `entry/core/elite/platinum`; `founder_keys.founder_tier` uses `bronze/silver/gold` | one canonical tier enum |

### 5.5 Silent-fallback / demo-mode logic

1. `EarningsHubCard` swallows API errors → shows `MTR-—` / `$0` / `0 of 3` as if real.
2. `social/accounts` route + `SocialAccountsCard` → any bundle.social failure (including a missing API key) renders as "Not connected".
3. `concierge` → Claude errors are streamed as a chat reply.
4. `founders/apply` → DB failures return `{success:true}`.
5. `forgot-password` → always success.
6. `marketplace/submit` → simulated success.
7. `auth.ts:140-142` → stale JWT falls back to `memberId: 0`, tier `free`.
8. Demo seed + `StatsBar` 24,847 are designed to match for sales demos.

---

## 6. Integrations Status

| Service | Status | Evidence |
|---|---|---|
| **Anthropic Claude** | **Fully wired** | `@anthropic-ai/sdk ^0.82.0`; `new Anthropic()` reads `ANTHROPIC_API_KEY` implicitly. `content/generate` (`messages.create`, `claude-sonnet-4-6`, `max_tokens: 2048`, non-streaming, raw `JSON.parse`) and `concierge` (`messages.stream`, `claude-sonnet-4-6`, `max_tokens: 1024`). No structured output / tool use, no retries, no usage logging, no prompt caching. The model ID is current but is a mid-tier model; newer Claude 5 family models exist. |
| **AWS S3** | **Fully wired** | presign (5-min PUT, key `monetura/members/{userId}/uploads/{ts}_{rand}_{name}`), browser PUT, confirm. `scripts/set-s3-cors.mjs` sets CORS. Confirm does not verify the object exists. Uploaded media is **never linked to a post** (`CreateWizard.tsx:1542-1550` omits `mediaUploadIds`; `cover_image_url` never written). |
| **bundle.social** | **Partially wired** | `packages/db/src/social.ts`: create team → `monetura_bundle_teams`, hosted portal link, list accounts. **No code path publishes a post to bundle.social** — that only exists in `n8n-workflows/WF-04`, whose expected payload doesn't match what `content/publish` sends. No inbound webhook for post status. `BUNDLE_SOCIAL_API_KEY` undocumented. |
| **Resend** | **Fully wired (3 emails)** | `apps/platform/src/lib/resend.ts` is only a singleton — **no templates**; bodies are inline plain-text strings in `send-instructions` and `activate`; HTML owner notification in marketing `founders/apply`. Password-reset email not implemented. n8n JSONs also call Resend directly (WF-01 welcome + admin notify; WF-11 drip) → **duplicate welcome email** if WF-01 is ever reached. |
| **Stripe** | **Referenced, not implemented** | No `stripe` package anywhere. `webhooks/stripe` is a scaffold with no signature check. `StripeCheckout.tsx` orphaned stub. `monetura_stripe_customers`, `members.stripe_customer_id`, `credit_packages.stripe_price_id` never touched. Founder purchases correctly **do not** use Stripe (e-transfer instructions email). |
| **Arrivia** | **Not present** | Marketing copy + a hardcoded link to `https://members.monetura.com/`. No SDK, API, env var, or booking sync. `monetura_travel_bookings` unused. |
| **n8n** | **Partially wired — every pairing mismatched** | See table below. |
| **ApexCRM `users`** | Wired, contract violated | Read for login; written by register, apply, and seeds (raw SQL). |
| **NextAuth v5** | Fully wired | Credentials provider, JWT sessions; see §7. |

**n8n — what the code fires vs what the JSON expects**

| Code | Env var | Fires | Payload keys | JSON workflow | Expects path | Expects keys |
|---|---|---|---|---|---|---|
| `admin/founders/[id]/activate/route.ts:108-119` | `N8N_WEBHOOK_BASE_URL` | `{base}/webhook/founder-activated` | `memberId, founderNumber, memberTier, email, name` | `WF-01-founder-activated.json` | `monetura/founder-activated` | `email, founderNumber, name, founderTier` — **path and `founderTier` mismatch** |
| `auth/register/route.ts:114-124` | `N8N_WEBHOOK_BASE_URL` | `{base}/webhook/referral-milestone` | `referrerMemberId, referralCount, newMemberId, newMemberEmail` | **none** | — | — |
| `content/publish/route.ts:56-67` | **`N8N_WEBHOOK_URL`** (different name) | `{url}/webhook/publish-content` | `postId, slug, platforms, scheduleAt, memberId` | `WF-04-content-publish.json` | `monetura/publish-content` | `bundleTeamId, selectedPlatforms, content.*, contentPostId` — **nothing matches**; WF-04 then POSTs to `https://app.monetura.com/api/content/publish-status` (line 54) which **does not exist** |
| — | — | — | — | `WF-11-welcome-email-sequence.json` | `monetura/start-onboarding` | `email, name` — **never fired by code** (though `FoundersClient.tsx:303` tells the admin it "will fire automatically") |

Other n8n notes: no shared secret is sent by the platform (WF-04 expects `x-n8n-secret` on the callback only); workflows log to an `n8n_webhook_log` table that isn't in the schema and isn't `monetura_`-prefixed; CLAUDE.md's build order names WF-01–WF-03 and WF-11, but WF-02/WF-03 don't exist and WF-04 does.

---

## 7. Auth & Roles

**Mechanism** — NextAuth v5 (`5.0.0-beta.30`), single Credentials provider, JWT session strategy (`auth.ts:94`), custom sign-in page `/login`.

`authorize()` (`auth.ts:27-90`):
1. Look up ApexCRM `users` by lower-cased email; require `passwordHash`.
2. `bcrypt.compare` (12 rounds at creation).
3. Require `monetura_members` row with `status === "active"` (line 64) — `pending`, `awaiting_payment`, `suspended`, `cancelled` all fail with the same "invalid credentials" message.
4. Fire-and-forget `getOrCreateAffiliateLink(member.id)`.
5. For `founder` tier, set `founderNumber = moneturaFounderKeys[0].id` (line 79 — the key row id, **not** `members.founder_number`).

JWT callback copies `memberId / memberTier / founderNumber` on sign-in and re-reads `membership_tier` from the DB for stale tokens (lines 116-131). Session callback defaults missing fields to `memberId: 0`, tier `"free"` (lines 140-142). Types in `src/types/next-auth.d.ts`.

**Roles** — there is no separate role model; the role *is* `monetura_members.membership_tier`: `free | community | software | founder | admin`. (`ApexCRM users.role` is written as `"admin"`/`"user"` by seeds/apply but never read.) Effects:
- `admin` → sees "Founders" in `SidebarNav`, can open `/admin/founders` and call the three `/api/admin/*` routes (each checks `session.user.memberTier !== "admin"` → 403/redirect).
- `founder` → founder # badge, 500 credits/month.
- `software` 100, `community` 50, `free` 0 credits. No other feature gating exists — every non-admin route is available to every active member regardless of tier.

**Admin protection** — done per-handler, not in middleware: `admin/founders/page.tsx:10-13` (redirect to `/dashboard`), `api/admin/founders/route.ts:9-12`, `activate:24-27`, `send-instructions:18-21`. Consistent and correct for the routes that exist; adding a new admin route requires remembering the check.

**Weaknesses**
- Middleware is cookie-*presence* only; a bogus cookie value passes middleware (pages/routes still verify via `auth()`, so this is defense-in-depth loss, not a bypass).
- Middleware default-denies every non-listed path, which breaks intentionally-public endpoints (`/api/affiliate/track`) and would break future webhooks/health checks.
- No rate limiting or lockout on `/login`, `/api/auth/register`, `/api/auth/forgot-password`, or marketing `/api/founders/apply`.
- `auth.ts:39-63` logs the email, whether the user was found, and bcrypt result on **every** login (`console.log("AUTH: …")`) — PII + oracle in production logs.
- Password reset does not exist; no way to set a password for admin-activated founders; no registration UI; no email verification.
- Session tier is baked into the JWT: demoting/suspending a member does not take effect until the token expires (no `maxAge` configured → NextAuth default 30 days).
- Seed credentials are committed in source.
- `packages/db/src/index.ts:23` — `ssl: { rejectUnauthorized: false }` disables certificate verification to the production DB.

---

## 8. Environment Variables

| Variable | Read by | Fallback | In `apps/platform/.env.local.example`? |
|---|---|---|---|
| `DATABASE_URL` | `packages/db/src/index.ts:16` (throws), `drizzle.config.ts`, both seed scripts | none | ✔ |
| `NEXTAUTH_SECRET` | next-auth internally | none | ✔ |
| `NEXTAUTH_URL` | next-auth internally | none | ✔ |
| `ANTHROPIC_API_KEY` | implicitly by `new Anthropic()` in `content/generate`, `concierge` | SDK throws | ✔ |
| `AWS_S3_BUCKET` | `upload/presign:55`, `scripts/set-s3-cors.mjs` | none (500) | ✔ |
| `AWS_REGION` | same | none | ✔ |
| `AWS_ACCESS_KEY_ID` | same | none | ✔ |
| `AWS_SECRET_ACCESS_KEY` | same | none | ✔ |
| `NEXT_PUBLIC_S3_BASE_URL` | `upload/presign:59` | none | ✔ |
| `RESEND_API_KEY` | `lib/resend.ts:8` (throws), marketing `founders/apply:91` (skips email), n8n JSONs | none | **✘** |
| `OWNER_EMAIL` | marketing `founders/apply:92` | `founders@monetura.com` | **✘** |
| `BUNDLE_SOCIAL_API_KEY` | `packages/db/src/social.ts:8` (throws), WF-04 | none | **✘** |
| `N8N_WEBHOOK_BASE_URL` | `activate:108`, `register:114` | webhook skipped | **✘** |
| `N8N_WEBHOOK_URL` | `content/publish:56` | webhook skipped | **✘** (inconsistent name) |
| `N8N_WEBHOOK_SECRET` | n8n side only (WF-04) | — | ✘ |
| `NODE_ENV` | `affiliate/track:36` (cookie `secure`) | runtime | n/a |

Local `apps/platform/.env.local` (keys only) has the 9 checked variables and **none** of the unchecked ones — so locally Resend, bundle.social, and n8n all throw or silently skip. There is no `.env.local.example` for `apps/marketing`. `.env.local` files are correctly git-ignored and have never been committed.

---

## 9. Tech Debt & Risks

### Security / correctness (fix before any real users)

1. **Founders cannot log in after activation** — no password is ever set (§Executive summary #1).
2. **Middleware blocks public affiliate tracking** (`middleware.ts:4`).
3. **Auth debug logging of PII** on every login (`auth.ts:39,47,52,63`).
4. **Non-transactional multi-step writes**: `activate` (max+1 founder number → update → insert key), `register` (ApexCRM insert → members insert → re-select), `apply` (two independent inserts, errors swallowed). Concurrent activations can produce duplicate founder numbers; a failure mid-way leaves orphaned ApexCRM users.
5. **Credit deduction race** — `deductCredit` (`credits.ts:52-72`) is check-then-insert with no lock; parallel generate calls can overspend. Credit is also deducted *after* the Claude call, so parse failures waste API spend.
6. **`JSON.parse` of raw model output** with an unvalidated `as` cast (`generate:110`); no fence-stripping, no schema — a single stray character fails the whole generation.
7. **Writes to production ApexCRM `users`** from three places despite the read-only contract; seeds use raw SQL; `drizzle.config.ts` includes the ApexCRM schema path.
8. **No rate limiting anywhere**; public POSTs (`apply`, `register`, `forgot-password`) and the concierge (paid API per message, no credit cost) are open to abuse.
9. **`rejectUnauthorized: false`** on the production DB connection.
10. **Committed credentials**: seed passwords in source; `apps/platform/.vercel/project.json` and `apps/marketing/.vercel/project.json` tracked (project/org IDs).
11. **Stripe webhook stub** accepts anything with a `stripe-signature` header and returns `{received:true}`.
12. **Publish is a lie**: status → `published` before any publishing; if n8n is misconfigured the member sees success and nothing happens.

### Data / schema

13. `drizzle/migrations` git-ignored; `0003` lacks a snapshot; `media_uploads.status` unmigrated (§4).
14. No foreign keys; `referred_by` stores a code string rather than a member id; `commissions` has no `type` column (`recordCommission` discards `_type`/`_description` args).
15. `founderNumber` has two sources of truth (`founder_keys.id` vs `members.founder_number`).
16. `founders/apply` maps `province → city` and drops `tierInterest`/`heardAbout`.
17. Seven tables (41%) are unused; three feature areas (events, marketplace, analytics) have no tables at all.

### Code quality

18. `CreateWizard.tsx` is 1,704 lines with 21 `useState`s; it duplicates the 561-line orphaned `UploadZone`. Six preview renderers, the upload client, and the wizard state machine should be separate modules.
19. **Duplicated logic**: `MemberTier` ×3, credit limits ×2 (+ a third, wrong, copy in the concierge prompt), `REFERRALS_FOR_FREE` ×5, `apexcrmUsers` stub ×2, social/sparkle icons ×3, four incompatible founder-tier vocabularies.
20. **`console.log` left in**: 40+ in app code (`presign` ×6, `confirm` ×4, `auth` ×4, `TripSavingsCalculator:236`, etc.); no logger abstraction.
21. **Swallowed errors** with only a comment: `founders/apply` ×3, `FoundersClient:476`, `SocialSettingsClient:79`, `CreateWizard:1586`, `EarningsHubCard`, `SocialAccountsCard` — UI shows fake-empty states instead of errors.
22. **TypeScript**: `strict` is on and there are no `any`/`@ts-ignore`; one `as unknown as` cast (`presign:114`) to read `insertId`; ten `eslint-disable-next-line @next/next/no-img-element` — every image on the platform bypasses `next/image` (Unsplash hotlinks, no optimisation, no `remotePatterns`).
23. **Brand tokens bypassed**: inline hex `style={{}}` throughout platform components instead of the `monetura-*` Tailwind classes from `packages/config`.
24. **Inconsistent `params` typing** across dynamic routes (Promise vs object) — will break on Next 15.
25. `TODO`s: Garet font (×2), Stripe webhook, forgot-password email.
26. **No tests of any kind**, no CI workflow, no ESLint config beyond `next lint` defaults, no `.env.example` for marketing.
27. Uncommitted local drift: `apps/platform/tsconfig.json` modified (Next.js auto-added `allowJs/noEmit/isolatedModules`), untracked `next-env.d.ts` and `*.tsbuildinfo` files (should be git-ignored).
28. **Repo bloat**: 60.7 MB of hero MP4s committed under `apps/marketing/public/videos/`, three of four unreferenced; Vercel deploys carry all of them.
29. Anthropic usage: no `usage` capture, no caching of the (static, cacheable) system prompt, no typed error handling (`RateLimitError` etc.), concierge history is unbounded except by the 50-message cap.

### Things that break at scale

- `getRemainingCredits` runs `SUM()` over `monetura_credit_usage` for every dashboard/create page load and every generation — fine at 200 members, expensive at 20k; no cached balance.
- `activate`'s `SELECT MAX(founder_number)` + insert — collision under concurrency.
- `/api/affiliate/track` writes a click row synchronously per hit with no dedup — bot traffic inflates "clicks".
- Middleware matcher runs on every asset-like request not covered by the regex (fonts, videos).
- mysql2 pool `connectionLimit: 10` per serverless instance × Vercel concurrency vs the DigitalOcean/TiDB connection cap — will exhaust connections under load; no pooler (PlanetScale-style HTTP driver or a proxy) in front.
- Events/marketplace as TS constants require a deploy per content change and can't be filtered by date/tier.

---

## 10. Recommendations — top 10, by impact

1. **Close the founder login gap.** On activation, generate a single-use set-password token (new `monetura_password_tokens` table), email a "Set your password" link, and build `/set-password` + `/reset-password` pages; implement the `forgot-password` route on the same mechanism. Until this ships, no real founder can use the product.
2. **Put the database under control.** Un-ignore `drizzle/migrations`, commit them, regenerate the `0003` snapshot, add a migration for `media_uploads.status`, remove `./drizzle/schema.ts` from `drizzle.config.ts`, and replace the raw-SQL seed inserts with Drizzle. Decide explicitly whether Monetura is allowed to *create* ApexCRM users (it does today) and document it in CLAUDE.md.
3. **Fix the middleware model.** Switch to an explicit public allowlist that includes `/api/affiliate/track` (and future webhooks), add the `/admin` tier check there as well, add rate limiting (Upstash/Vercel KV) on `/login`, `register`, `forgot-password`, `founders/apply`, and `concierge`, and strip the `AUTH:` debug logs.
4. **Make "Publish" real.** Either call bundle.social directly from `content/publish` (the client already exists in `packages/db/src/social.ts`) with a `publishing → published/failed` status and a status-callback route, or fix the n8n contract end-to-end: one env var, paths matching the JSON (`/webhook/monetura/…`), matching payloads, implement `/api/content/publish-status`, add a shared secret, and stop sending the welcome email from both the route and WF-01.
5. **Replace the fake dashboard with real numbers or honest empty states.** `StatsBar`, `RecentPostsCard`, `ContentCreatorCard`, the login social-proof, and the marketing "47 spots" should query `monetura_members`/`_content_posts`/`_commissions`; add a `monetura_post_metrics` table fed from bundle.social analytics for reach/likes. Where no data exists yet, show "—" rather than invented figures — the current numbers are a liability with paying founders.
6. **Give Events and Marketplace a backend.** `monetura_events` + `monetura_event_registrations`, `monetura_marketplace_products` + `monetura_marketplace_submissions`, an admin CRUD screen (extend `/admin`), and wire the three inert CTAs (`Reserve Your Spot`, `Submit a Product`, `Submit Your Entry`). Move the current constants into seed data.
7. **Finish the content pipeline.** Send `mediaUploadIds` from the wizard, store them (`cover_image_url` + a `monetura_post_media` join), show them on `/posts`; switch generation to structured output (`output_config.format` / tool schema) with zod validation instead of `JSON.parse`; deduct the credit atomically (transaction or conditional insert) before the API call and refund on failure; capture `usage`; cache the static system prompts; wire the `PostDetail` Publish button; enable `scheduleAt`.
8. **One tier vocabulary and correct application data.** Define the founder tiers once (name, price, `tier_interest` value, key tier, credits) and consume it from home, `/founders`, `/how-it-works`, the apply form, admin, and the concierge prompt; fix `founders/apply` to persist `province`, `tierInterest`, `heardAbout`; make `founderNumber` read from `members.founder_number` only.
9. **Harden and de-duplicate.** Wrap `activate`/`register` in transactions; `rejectUnauthorized: true` with the DO CA; rotate and remove committed seed passwords; untrack `.vercel/`, `*.tsbuildinfo`, `next-env.d.ts`; delete `UploadZone`, `StripeCheckout`, `/success`, `packages/ui`, and the three unused MP4s (consider Git LFS or a CDN for the fourth); split `CreateWizard.tsx`; collapse the duplicated constants/types into `packages/db`/`packages/config`; add a logger; add at least route-level tests for auth, credits, and activation plus a CI type-check/lint job.
10. **Then, per the build order: Stripe subscriptions and the Community tab.** Install `stripe`, verify webhook signatures, populate `monetura_stripe_customers`, gate `software`/`community` tiers on subscription status; build `/community` on `monetura_challenges`/`_entries`; implement Arrivia booking sync into `monetura_travel_bookings` so the earnings page can eventually show real commissions.
