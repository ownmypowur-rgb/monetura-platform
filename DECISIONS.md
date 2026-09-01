# DECISIONS LOG
Judgment calls made autonomously during sprint execution. Reviewed by the architect (Claude Fable) after each batch.
Format per entry:
## [Sprint #] Short title
- Context: what question arose
- Options considered:
- Decision made:
- Reasoning:
- Reversible? yes/no + how

## [Sprint 1] monetura_password_tokens.user_id is bigint unsigned, not int
- Context: the spec says `userId int notNull`, but the token references the shared ApexCRM `users.id`, which is `bigint unsigned auto_increment`.
- Options considered: (a) `int` as literally specified; (b) `bigint unsigned` to match the referenced column.
- Decision made: `bigint unsigned` (Drizzle `bigint({ mode: "number", unsigned: true })`).
- Reasoning: a mismatched FK-style column invites silent truncation/overflow and blocks a real FK later; matching the referenced type is the standard correctness call. Everything else in the spec (name, uniqueness, enum, timestamps) is implemented exactly.
- Reversible? yes — a single additive `MODIFY COLUMN` migration.

## [Sprint 1] New table applied via direct additive DDL, not drizzle-kit generate/migrate
- Context: the spec says "push via the project's drizzle workflow", but the audit (§4) shows the workflow is broken: migration 0003 has no snapshot, and a live-DB check during this sprint found `__drizzle_migrations` has **9** applied rows vs 4 in the local journal — the live DB was migrated from a different checkout (entries dated ~June 2026, incl. one hashed as "0002_many_onslaught"). `drizzle-kit generate` would produce a wrong diff; `drizzle-kit migrate` could re-run already-applied SQL; `drizzle-kit push` diffs the whole DB against a schema that deliberately omits ApexCRM tables and can propose drops.
- Options considered: (a) drizzle-kit generate + migrate (wrong diff / re-run risk); (b) drizzle-kit push (drop-suggestion risk against production); (c) hand-written migration file 0004 + journal entry, applied to the live DB with an idempotent `CREATE TABLE IF NOT EXISTS` script.
- Decision made: (c). Table verified created on the live DB; `0004_password_tokens.sql` + journal entry written locally so the repo history stays coherent. Full snapshot repair is Sprint 2's job.
- Reasoning: guardrail "never delete or rewrite data; schema additions only" rules out anything that could emit drops; (c) is the only path that is provably additive.
- Reversible? yes — `DROP TABLE monetura_password_tokens` (no other table references it).

## [Sprint 1] Activation defensively creates the ApexCRM user if missing; token failure falls back to a login link
- Context: the set-password token must attach to a `users.id`. The application form normally creates that row, but members can exist without one (e.g. created manually).
- Options considered: (a) fail activation when no user row exists; (b) create the user row (no password) and continue.
- Decision made: (b); and if token creation itself fails, the welcome email still sends with a "Go to Your Dashboard" login-page button instead of blocking activation.
- Reasoning: activation is an admin-facing money-moment; it should not 500 on a missing auxiliary row. Creating a `users` row is already the established pattern (register, apply, seeds do it).
- Reversible? yes — behaviour is localized to the activate route.

## [Sprint 2] Snapshot repair: consolidated regeneration instead of drizzle-kit up
- Context: migration 0003 (bundle_teams) was hand-written with no `meta/0003_snapshot.json`, and Sprint 1's 0004 (password_tokens) was also hand-written, so `drizzle-kit generate` diffed against snapshot 0002 and would re-create existing tables.
- Options considered: (a) `drizzle-kit up` (only upgrades snapshot *format versions*, cannot fabricate missing snapshots); (b) hand-author the missing snapshot JSONs (error-prone, unverifiable); (c) delete the two hand-written migrations + their journal entries and run `drizzle-kit generate` once, letting it produce a single properly-snapshotted migration for the full delta from 0002 → current schema.
- Decision made: (c). Result: `0003_small_millenium_guard.sql` containing exactly CREATE monetura_bundle_teams, CREATE monetura_password_tokens, ADD monetura_media_uploads.status (+ its index). A second `drizzle-kit generate` now reports "No schema changes" — snapshots and schema agree. Verified every object in that migration already exists on the live DB (including `idx_media_uploads_status`, created additively where missing), so the migration must NOT be re-run against production; it is the source-of-truth DDL record.
- Reasoning: only (c) yields snapshots that drizzle-kit itself vouches for; the sprint's "media_uploads.status migration" requirement is satisfied inside the consolidated migration.
- Reversible? yes — migration files and journal are plain files in git from this sprint onward.

## [Sprint 2] Local `drizzle-kit migrate` must not run against the live DB (documented, not "fixed")
- Context: the live `__drizzle_migrations` table holds 9 applied entries (dated up to ~June 2026, e.g. hash "0002_many_onslaught") that do not correspond to this repo's 3-entry journal — the DB was migrated from a different checkout that is not in this repository.
- Options considered: (a) rewrite/truncate the live migrations bookkeeping table to match the local journal (violates the "never delete or rewrite data" guardrail); (b) leave live bookkeeping untouched, treat the repo journal as the forward-only DDL record, and apply future changes with idempotent additive scripts until the histories are reconciled by a human.
- Decision made: (b). Future sprints apply schema additions with `CREATE TABLE IF NOT EXISTS` / guarded `ALTER TABLE` scripts and commit the matching generated migration.
- Reasoning: reconciling migration bookkeeping requires knowing what the other checkout's migrations contained; guessing risks data loss. Additive idempotent DDL is safe either way.
- Reversible? yes — once the histories are reconciled, `drizzle-kit migrate` can take over.

## [Sprint 3] Admin defense-in-depth via JWT verification only on /admin paths
- Context: middleware was cookie-presence-only; adding a tier check needs the decoded JWT, but the repo history (commit 2212eb3) shows middleware was deliberately kept DB-free for Edge-runtime compatibility.
- Options considered: (a) import auth() into middleware (pulls mysql2 into Edge — the exact thing 2212eb3 reverted); (b) decode the session JWT with next-auth/jwt getToken (jose, Edge-safe), but on every request; (c) getToken only for /admin* paths, presence-check for everything else.
- Decision made: (c). Non-admin routes keep the cheap presence check (real verification still happens in every page/route via auth()); /admin and /api/admin/* verify the JWT and require memberTier === "admin", failing closed (403 for APIs, redirect for pages) including when NEXTAUTH_SECRET is missing.
- Reasoning: full verification everywhere doubles per-request work for no gain (handlers re-verify anyway); admin is where defense-in-depth pays.
- Reversible? yes — drop the isAdminPath block.

## [Sprint 3] Affiliate attribution path: platform-domain cookie is the mechanism; marketing ?ref forwarding deferred
- Context: /api/affiliate/track records the click, sets the 30-day mtr_ref cookie on the platform domain, then redirects to the link's destination (currently monetura.com?ref=CODE, which the marketing site ignores).
- Options considered: (a) move tracking to the marketing app and share cookies across domains (needs a common parent domain + cookie domain config — deploy-level work); (b) make the marketing site read ?ref and re-set its own cookie (still can't reach the platform domain's cookie jar); (c) keep tracking on the platform domain, where /api/auth/register already reads mtr_ref — un-blocking the route in middleware completes the required outcome: click recorded + future platform signup attributes the referrer.
- Decision made: (c). Middleware now allowlists /api/affiliate/track; no other change. Cross-domain attribution (marketing-site signups) is deferred until the apps share a parent domain (app.monetura.com + monetura.com can then use Domain=.monetura.com — the current Vercel preview domain cannot).
- Reasoning: (c) is the spec's stated minimum, needs no deploy-level changes, and doesn't preclude (a) later.
- Reversible? yes.

## [Sprint 3] Rate limiting: in-memory fixed window in @monetura/db; limits chosen
- Context: no new dependencies allowed; both apps need the limiter. Limits had to be picked.
- Options considered: per-app duplicate util vs. one implementation in the only shared server package (@monetura/db, despite the name); sliding vs. fixed window.
- Decision made: packages/db/src/rate-limit.ts, fixed-window per key. Limits (per IP unless noted): forgot-password 5/15min; set-password 10/15min; register 5/hour; founders/apply 5/hour; concierge 30/5min per member. 429 + Retry-After on excess.
- Reasoning: fixed window is a few lines and good enough against scripted abuse; the audit flagged duplication as debt, so one shared copy. Known limitation (documented in the file): per-serverless-instance state, so effective limits are a multiple of configured ones — acceptable for v1.
- Reversible? yes — limits are constants at each call site; the store can be swapped for Redis behind the same function signature.

## [Sprint 4] bundle.social publish contract — implemented to documented shape; NEEDS A LIVE-KEY TEST
- Context: the official docs pages 404 publicly (docs.bundle.social → info.bundle.social → 404), so the contract was assembled from bundle.social's own marketing/API pages and their Node SDK repo (github.com/bundleglobal/bundlesocial-node), which agree on: `POST https://api.bundle.social/api/v1/post/` with `x-api-key`, body `{ teamId, title, postDate (ISO), status: "SCHEDULED", socialAccountTypes: ["INSTAGRAM", …], data: { INSTAGRAM: { type: "POST", text }, FACEBOOK: { text }, LINKEDIN: { text }, TIKTOK: { text } } }`. (WF-04's n8n payload `{ teamId, platforms, content, mediaUrls }` matches NO documented shape and was discarded.)
- What needs verification with a live BUNDLE_SOCIAL_API_KEY (none is configured in this environment):
  1. trailing slash on `/post/` (team creation in this repo uses `/team/`; accounts fetch uses `/social-accounts`);
  2. whether "publish now" is `status: "SCHEDULED"` + `postDate: now` (implemented) or a distinct status value;
  3. exact per-platform `data` field names, esp. Instagram's `type: "POST"`;
  4. Instagram/TikTok almost certainly REQUIRE media (`uploadIds`) — this codebase never links uploads to posts (audit §6), so those two platforms may fail at bundle.social until media wiring lands; the failure path is graceful (status `failed`, member sees "Publishing failed — we're on it", Retry available).
- Decision made: implement to the documented best understanding with a hard, stored failure path rather than block the sprint.
- Reversible? yes — the contract lives in one function (`publishBundlePost`).

## [Sprint 4] Blog/magazine platforms publish on-platform, not via bundle.social
- Context: the publish endpoint accepts "blog" and "magazine", which are Monetura-native formats with no bundle.social equivalent.
- Decision made: a publish request whose only platforms are blog/magazine marks the post published directly (no external call); social platforms in the same request go through bundle.social and gate the final status.
- Reasoning: sending non-social formats to a social API can only fail; the member's mental model ("my blog post is live on Monetura") is served by the status flip.
- Reversible? yes.

## [Sprint 4] "failed" posts return to a retryable state, not literally to "draft"
- Context: the spec says "post returns to draft" on failure, but a distinct `failed` status (added to the enum alongside `publishing`) preserves the error (`publish_error` column), lets the UI show "Retry Publish", and keeps drafts semantically clean.
- Decision made: publishing → failed (with stored error) → retry; the post's content is untouched, exactly as a draft would be.
- Reversible? yes — statuses are data; a one-line UPDATE maps failed → draft.

## [Sprint 5] Marketing "spots remaining" via direct DB read in server components + ISR, not an API route
- Context: the spec allowed "a small API route or build-time fetch with revalidation".
- Options considered: (a) a public /api/stats endpoint on the platform, fetched client-side (needs a middleware allowlist entry, CORS across apps, loading flicker); (b) `getActiveFounderCount()` in @monetura/db called directly from the marketing server components (UrgencySection, /founders) with `export const revalidate = 600` and a `.catch(() => null)` fallback that renders numberless copy ("Limited to 200 founders. Reviewed personally.").
- Decision made: (b). The platform /login page does the same server-side (force-dynamic, so always fresh).
- Reasoning: marketing already depends on @monetura/db; a DB read at ISR time is simpler, has no public endpoint to abuse, and degrades gracefully when DATABASE_URL is absent at build.
- Reversible? yes.

## [Sprint 5] Canonical tiers = Explorer/Trailblazer/Pioneer/Luminary; challenge reward is AI credits, not cash
- Context: four incompatible tier vocabularies existed (home 4-tier, TierSelector 3-tier, apply form "Entry/Core/Elite/Platinum Founder", DB enums). A canonical set had to be picked. Separately, CommunityCard advertised a "$500 CAD" prize but `monetura_challenges` has only `credit_reward` (int) — no cash-prize column.
- Options considered: tiers — keep the apply form's names (they match the DB enum labels) vs. the marketing names (what prospects actually see, 4 tiers incl. the $4,500 Pioneer). Prize — add a cash-prize column vs. use the schema's credit reward.
- Decision made: marketing names are canonical (`packages/config/src/tiers.ts`), mapped to the immutable DB enum values entry/core/elite/platinum and key tiers bronze/silver/gold/gold (matching the activate route). The apply form now submits tier ids and the API persists `province`, `tierInterest`, `heardAbout` correctly (previously `city` ← province and the rest dropped). Challenge reward: 50 AI credits ("Kill Them With Kindness", 2026-09-01 → 2026-09-30, seeded live, idempotent) — no invented cash figure; a cash prize needs a schema addition and a real payout process first.
- Reversible? yes — names/prices are data in one file; DB enum values unchanged.

## [Sprint 5] "Total Reach" reads monetura_social_accounts follower counts; bundle.social analytics deferred
- Context: the spec asks for follower counts "from connected bundle.social accounts if available else '—'", but this repo's bundle.social accounts call doesn't return follower counts and the API contract can't be verified without a live key (see Sprint 4 entry).
- Decision made: `getMemberTotalReach()` sums `monetura_social_accounts.follower_count` (the table built for exactly this) and returns null → "—" when empty. Pulling live follower counts from bundle.social into that table is flagged as the follow-up requiring a live key.
- Reasoning: never show a fabricated number; the only truthful local source is that table.
- Reversible? yes — swap the data source inside one function.
