# SPRINT BACKLOG — Production Hardening

Six sprints executed strictly in order. Source of truth for defects: PLATFORM-AUDIT.md.
Statuses: PENDING / IN PROGRESS / COMPLETE / BLOCKED.

---

## SPRINT 1 — REAL PASSWORD SYSTEM
STATUS: COMPLETE
> Summary: `monetura_password_tokens` created (schema + migration 0004 + applied to live DB via idempotent DDL — see DECISIONS.md for why not drizzle-kit).
> `createPasswordToken`/`consumePasswordToken` in packages/db. Activation now issues a 7-day set-password token and sends a branded HTML welcome
> email with a gold "Choose Your Password" button; payment-instructions email upgraded to the same template. forgot-password really sends a
> 24h reset link (always returns success). New `/api/auth/set-password` + `/set-password` + `/reset-password` pages share one login-styled form.
> Middleware allowlist extended; NEXT_PUBLIC_APP_URL documented. Typecheck: 6/6 green.

Goal: activated founders receive a set-password email, can set a password, can log in; forgot-password really sends.
- New table monetura_password_tokens: id PK, userId int notNull, token varchar(128) notNull unique, purpose enum("set_password","reset_password") notNull, expiresAt timestamp notNull, usedAt timestamp nullable, createdAt timestamp defaultNow. Push via the project's drizzle workflow.
- packages/db/src/password-tokens.ts: createPasswordToken(userId, purpose) → crypto.randomBytes(32).toString("hex"), expiry 7 days set / 24h reset, insert, return token. consumePasswordToken(token) → valid+unused+unexpired → mark used, return {userId}, else null. Export from package index.
- activate route: after success, create set_password token; welcome email gains a prominent branded button linking to ${NEXT_PUBLIC_APP_URL}/set-password?token=... replacing the bare "sign in" instruction. Upgrade activation + instruction emails to simple branded HTML (dark charcoal #2C2420 background, champagne gold #D4A853 button, cream #FBF5ED text).
- Rewrite api/auth/forgot-password: zod validate; lookup users by lowercase email; ALWAYS return {success:true}; if found create reset_password token and send branded email from noreply@monetura.com via existing resend singleton, button to /reset-password?token=... Remove the TODO and the email console.log.
- New api/auth/set-password: POST {token,newPassword}, zod min 8 chars, consume token or 400 "This link has expired or already been used.", bcrypt 12 rounds, update users.passwordHash.
- New pages (auth)/set-password and (auth)/reset-password sharing one client form component styled like the login page: token from search params, password+confirm with inline validation, success state with gold "Sign In" button to /login, expired state linking to /forgot-password. Headlines: "Choose your password" / "Choose a new password".
- Middleware: add /set-password, /reset-password, /api/auth/set-password to the public allowlist.
- Add NEXT_PUBLIC_APP_URL to .env.local.example (https://monetura-platform-app.vercel.app).

---

## SPRINT 2 — DATABASE UNDER CONTROL
STATUS: COMPLETE
> Summary: drizzle/migrations un-gitignored and committed (0000-0003 + meta). Hand-written snapshot-less 0003/0004 consolidated into a single
> drizzle-kit-generated `0003_small_millenium_guard.sql` (bundle_teams + password_tokens + media_uploads.status/index) with a real snapshot —
> `drizzle-kit generate` now reports "No schema changes". ApexCRM `./drizzle/schema.ts` removed from drizzle.config.ts sources. Both seed
> scripts' raw `INSERT INTO users` converted to Drizzle. Live DB verified to already contain every object in the migration (nothing was run
> against production). Live migration-bookkeeping mismatch documented in DECISIONS.md. Typecheck: 6/6 green.

Goal: migrations in git, schema and migrations agree. See audit §4 "Migrations vs schema" and Recommendation 2.
- Remove drizzle/migrations from .gitignore and commit all migration files including meta/.
- Fix the 0003 snapshot problem so the next drizzle-kit generate produces a correct diff (regenerate snapshots per drizzle-kit's documented repair path; log the approach taken in DECISIONS.md).
- Add a proper migration for monetura_media_uploads.status (it exists in TS schema + live DB only).
- Remove ./drizzle/schema.ts from drizzle.config.ts schema sources so ApexCRM tables can never be diffed.
- Convert both seed scripts' raw SQL INSERT INTO users statements to Drizzle queries against the local users stub.
- Do NOT run destructive migrations against the live DB; additive only.

---

## SPRINT 3 — AFFILIATE TRACKING REACHABLE + AUTH HARDENING
STATUS: COMPLETE
> Summary: middleware rewritten as explicit public allowlist (pages + /api/affiliate/track + /api/auth/*), with JWT-verified admin-tier gate on
> /admin* and /api/admin/* (fails closed; Edge-safe getToken, no DB import). Attribution: click now recorded for logged-out visitors; platform-
> domain mtr_ref cookie + register route complete the loop (cross-domain marketing forwarding deferred — DECISIONS.md). All AUTH:/debug
> console.logs stripped from auth.ts, presign, confirm. In-memory rate limiter added to @monetura/db and applied to forgot-password (5/15m),
> set-password (10/15m), register (5/h), founders/apply (5/h), concierge (30/5m/member). Session maxAge 7 days. Typecheck: 6/6 green.

Goal: public affiliate clicks record; auth endpoints hardened. See audit §1.1 middleware, §5.3, §7 weaknesses, Tech Debt 1-3, 8.
- Middleware: restructure to an explicit public allowlist that includes /api/affiliate/track plus everything already public; keep everything else protected. Add tier check for /admin paths in middleware as defense-in-depth (pages keep their own checks).
- Fix attribution path: affiliate/track currently sets the mtr_ref cookie on the platform domain then redirects to monetura.com where nothing reads ?ref. Decide and implement a working path (judgment call — log it): simplest acceptable outcome is that a click is recorded AND a future signup on the platform can attribute the referrer.
- Strip all AUTH: console.logs from auth.ts and all debug console.logs from presign/confirm routes.
- Add basic in-memory rate limiting (no new deps) on POST /api/auth/forgot-password, /api/auth/set-password, /api/auth/register, marketing /api/founders/apply, and /api/concierge: sensible per-IP limits, 429 on excess. Log limits chosen in DECISIONS.md.
- Set NextAuth session maxAge to 7 days.

---

## SPRINT 4 — PUBLISH BECOMES REAL
STATUS: COMPLETE
> Summary: publish route now calls bundle.social directly via new publishBundlePost() in packages/db/src/social.ts (POST /api/v1/post/ with
> teamId/title/postDate/status:SCHEDULED/socialAccountTypes/data blocks; scheduleAt honoured via postDate). Status flow draft → publishing →
> published / failed with publish_error stored (enum + column added additively, live DB altered, migration 0004 generated). Blog/magazine
> publish on-platform without an external call. PostDetail Publish button wired with loading/failed/retry states; posts list shows the new
> statuses. n8n fire-and-forget removed from the route. Contract caveats needing a live-key test are in DECISIONS.md. Typecheck: 6/6 green.

Goal: clicking Publish actually posts via bundle.social. See audit §6 bundle.social row and Recommendation 4.
- In api/content/publish: replace the n8n fire-and-forget with a direct bundle.social call using the existing client in packages/db/src/social.ts (extend it with a createPost/upload function per bundle.social API docs, base https://api.bundle.social/api/v1, x-api-key header).
- Status flow: publishing → published on confirmed success, → failed with error message stored on failure. Add status value "publishing" and an error text column to monetura_content_posts if not present (additive migration).
- Honour scheduleAt by passing bundle.social's scheduling parameter when set.
- Wire the inert Publish button in PostDetail.tsx to the publish endpoint with loading/success/failed states.
- If the bundle.social API contract cannot be fully verified from code/docs available, implement to the documented best understanding, mark clearly in DECISIONS.md what needs a live-key test, and make failure states graceful (member sees "Publishing failed — we're on it", post returns to draft).
- Remove the now-dead N8N_WEBHOOK_URL call path from this route.

---

## SPRINT 5 — HONEST NUMBERS EVERYWHERE
STATUS: PENDING

Goal: no fabricated figures anywhere a member or prospect can see. See audit §5.2, §5.4, Recommendation 5, 8.
- StatsBar: Total Reach → sum of follower counts from connected bundle.social accounts if available else "—"; Commissions → getTotalCommissionsThisMonth(); Posts → real count of member's published posts this month. Remove +12% claim.
- RecentPostsCard: query member's 3 most recent posts; empty state "Your first post will appear here" with CTA to /create. Remove Santorini/Tokyo/Whistler fakes.
- ContentCreatorCard: replace fake averages with real ones when data exists, else aspirational copy with no numbers.
- CommunityCard: read active challenge from monetura_challenges/_entries (seed one real challenge: "Kill Them With Kindness", real dates); entries count real; CTA links to /create until /community exists.
- Login page social proof: replace fabricated "200 Founding Members / 62 Countries / $4,200" with real founder count from DB and non-numeric brand copy. NO invented earnings figures anywhere.
- Marketing UrgencySection + /founders page: "spots remaining" = 200 − count(active founders) via a small API route or build-time fetch with revalidation (judgment call — log it).
- One canonical tier definition: create packages/config/src/tiers.ts exporting the four founder tiers (name, price, tier_interest value, key tier, credits) and consume it in TiersSection, TierSelector, apply form, admin, concierge prompt. Fix founders/apply to persist province, tierInterest, heardAbout correctly (add columns if needed, additive migration). founderNumber reads from members.founder_number only (fix auth.ts line ~79).
- Fix the concierge system prompt credit numbers to match packages/db/src/credits.ts.

---

## SPRINT 6 — EVENTS, MARKETPLACE, CHALLENGE GET A BACKEND
STATUS: PENDING

Goal: content areas run from the database; inert CTAs work. See audit Recommendation 6 and §1.1 inert-button list.
- New tables (additive migration): monetura_events (all fields currently in lib/events-data.ts + isPublished, sortDate), monetura_event_registrations (eventId, memberId, status, createdAt, unique member+event), monetura_marketplace_products (fields from lib/marketplace-data.ts + isPublished), monetura_marketplace_submissions (form fields + status pending/approved/rejected + memberId).
- Seed scripts moving the current 5 events and 15 products into the DB unchanged.
- Events pages + EventsWidget read from DB, filter to upcoming (sortDate >= today), ordered ascending. "Reserve Your Spot" / "Express Interest" CTA → POST /api/events/register (session required) → inserts registration → button becomes "You're on the list ✦". Widget "View All Events" links to /events.
- Marketplace pages read from DB (published only). /marketplace/submit POSTs to /api/marketplace/submit → inserts submission (member linked) → real success state.
- Admin: extend the existing /admin area with a simple Submissions review screen (list pending marketplace submissions, Approve → creates product row unpublished, Reject → status rejected).
- BottomNav (mobile): replace the dead Home/Community state-button pattern with real links and add a "More" sheet or fifth tab so Events, Marketplace, Posts, Settings are reachable on mobile (judgment call on pattern — log it).
- TopBar bell: remove the always-on dot (leave the bell inert for now).
