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

## [Sprint 6] Events seeded with their original (now past) dates → honest empty states
- Context: the spec says to move the 5 events into the DB "unchanged", but their dates are April–July 2026 and today is September 2026, so the required "upcoming only" filter shows none of them.
- Options considered: (a) shift the seeded dates forward so pages look populated (fabricates schedule data — exactly what Sprint 5 eliminated); (b) seed unchanged and give every surface a real empty state ("New events are being curated").
- Decision made: (b). The events remain reachable in the DB (and by direct slug URL) for when an admin re-dates them; EventsWidget, /events, and the dashboard all render honest empty states.
- Reversible? yes — an UPDATE on sort_date/date_label brings any event back.

## [Sprint 6] Mobile nav: four link tabs + a "More" sheet; sidebar's dead items fixed alongside
- Context: BottomNav's Home/Community were state buttons going nowhere, and Events/Marketplace/Posts/Settings were unreachable on mobile. A pattern had to be chosen (fifth tab vs. sheet).
- Decision made: Home/Create/Earnings/Travel as real links (pathname-driven highlighting, legacy props accepted and ignored so call sites didn't churn) plus a fifth "More" tab opening a bottom sheet with Events, Marketplace, Posts, Settings. Adjacent fix, logged here because it slightly exceeds the letter of the spec: SidebarNav's Home is now a /dashboard link and its dead "Community" item (no route exists) was removed — same inert-nav defect, same sprint goal.
- Reasoning: four sections don't fit as tabs on small screens; a sheet keeps the bar at five targets.
- Reversible? yes.

## [Sprint 6] Approve creates an UNPUBLISHED product; slug suffixed with submission id
- Context: member submissions carry no gallery images, tags, or long copy — publishing them straight to the storefront would produce visibly broken cards.
- Decision made: Approve inserts a `monetura_marketplace_products` row with `is_published = false` (admin polishes image/copy, then flips the flag — for now via DB, an edit screen is future work), `submitted_by_member = true`, savings % computed from the two prices, and slug `slugify(brand-name)-{submissionId}` so collisions are impossible. Marketplace pages filter to published only; the members' "$50 credit" reward promise is unchanged copy and its automation remains future work.
- Reversible? yes — flag flip / row delete.

## [Sprint 6] Marketplace "average savings" is computed, not claimed
- Context: the callout said "average of 22%" while the true catalogue mean was ~21%.
- Decision made: the server computes the real average of `savings_percent` across published products and passes it to the client; the callout hides entirely when there is nothing to average.
- Reversible? yes.

## [Sprint 7] Post ↔ media link is a join table; `cover_image_url` reused, not re-added
- Context: audit Recommendation 7 / Integrations §6 (S3 row): uploads reached S3 and `monetura_media_uploads` but were never linked to a post, `cover_image_url` was never written, and publishing sent text only. The spec allowed "set cover_image_url if the column exists, else add it".
- Decision made: new `monetura_post_media` (id, post_id, media_upload_id, sort_order, created_at; unique on post+upload, indexed both ways) via a proper `drizzle-kit generate` migration `0006_sharp_hemingway` (snapshot included), applied to the live DB with an idempotent `CREATE TABLE IF NOT EXISTS` + guarded `CREATE INDEX` script per the Sprint 2 rule. `cover_image_url` already existed on both the schema and the live table (varchar(500)), so no DDL was needed for it; `content/generate` now writes it from the first linked upload's public URL. No foreign keys, matching every other monetura_ table.
- Reversible? yes — additive only; dropping the table loses nothing that isn't in `monetura_media_uploads`.

## [Sprint 7] `content/generate` links only uploads the member owns and has confirmed; a failed link never fails the generation
- Context: `mediaUploadIds` comes from the browser and must not be trusted as-is.
- Decision made: the ids are re-selected with `uploader_id = memberId AND status = 'uploaded'`; unknown/foreign/pending ids are silently dropped, requested order is preserved (index → `sort_order`). The draft insert uses `$returningId()`; if the join-table insert then fails, the error is logged and the response is still success — the member has already spent a credit and the draft (with cover) is saved.
- Reversible? yes.

## [Sprint 7] Media goes to bundle.social through their upload endpoint, and a media failure fails the publish
- Context: bundle.social's create-post contract takes `uploadIds` (ids from `POST /api/v1/upload/`, their only multipart endpoint — form fields `teamId`, `file`), not external URLs. Per-platform shapes confirmed from the API reference: `INSTAGRAM { type: "POST", text, uploadIds }`, `FACEBOOK { text, uploadIds }`, `LINKEDIN { text, uploadIds }`, `TIKTOK { type: "IMAGE", text, uploadIds }` (TikTok's default type is VIDEO, so photo posts must say IMAGE).
- Options considered: (a) on an upload failure, still publish text-only (silently reproduces the exact defect the audit flagged, and Instagram/TikTok would reject it anyway); (b) treat any media upload failure as a publish failure with the reason stored in `publish_error` and the existing Retry path.
- Decision made: (b). The server streams each image from its S3 public URL into a `FormData` upload (`fetch` sets the multipart boundary; the JSON `Content-Type` header is deliberately not sent on that call). Posts with no linked media publish exactly as before.
- Reversible? yes — the contract lives in `uploadMediaToBundle` / `publishBundlePost`.

## [Sprint 7] `getBundleAccounts` reads `GET /team/{id}`.socialAccounts; "connected" is the only status it can report
- Context: the previous call hit `GET /social-accounts?teamId=` which is not a documented endpoint (the live-key diagnostic on 2026-09-02 confirmed the documented shapes: `GET /team/{id}` returns `socialAccounts[]`; `GET /social-account/by-type` is per-platform).
- Decision made: one `GET /team/{id}` call; accounts with `deletedAt` set are dropped. bundle.social's account object has no `status` field, so the existing `BundleAccount.status` (which the dashboard card never reads) is always `"connected"`. Display name falls back `username → first channel username → first channel name → displayName → userDisplayName`, because Facebook/LinkedIn Page connections carry a null top-level username and expose Pages as `channels[]`.
- Reversible? yes.

## [Sprint 7] Posts UI shows attached media from the join table, falling back to `cover_image_url`
- Context: posts created before this sprint have neither; posts created by an older client that sends no ids have neither; only new posts have both.
- Decision made: `/posts` cards render `cover_image_url` when present. `/posts/[id]` renders the join-table media (cover first, thumbnails strip for the rest) and falls back to the cover alone; plain `<img>` tags, matching the events/marketplace pages (no `next/image` remote-pattern config change).
- Reversible? yes.

## [Sprint 8] Concierge costs 1 credit per exchange
- Context: every concierge message is a paid model call with no member cost. A price had to be chosen, and `monetura_credit_usage.credits` is an `int` — fractional pricing is not representable without a schema change.
- Options considered: (a) 1 credit per exchange; (b) 1 credit per N messages, needing a counter column or a per-conversation row; (c) a separate cheaper currency for chat.
- Decision made: (a), `CONCIERGE_CREDIT_COST = 1` in `api/concierge/route.ts`. The concierge system prompt now states the cost, so members are told before they spend.
- Reasoning: the platform already teaches "1 credit per AI action" in the create flow, and matching that is the least surprising rule. (b) and (c) both need schema work, which exceeds a hardening sprint. Founders get 500/month, so 30 messages (the rate-limit ceiling per 5 min) is 6% of a month.
- Reversible? yes — one constant; deductCredit already takes a credit count.

## [Sprint 8] Running out of credits answers in the chat rather than erroring
- Context: the widget throws on any non-2xx and shows a generic failure. Exhaustion is a normal product state, not a fault.
- Decision made: on INSUFFICIENT_CREDITS the route returns HTTP 200 with a plain-text concierge-voice explanation (limit, reset date, reassurance that the rest of the dashboard is unaffected) plus an `X-Monetura-Credits: exhausted` header for any future client that wants to branch. Members on a 0-credit tier get an upgrade-shaped message instead.
- Reasoning: a friendly in-chat reply needs no widget change and reads as the concierge talking, not as a broken app. The header keeps the state machine-readable.
- Reversible? yes.

## [Sprint 8] deductCredit serializes on the member row; refunds are ledger rows
- Context: `deductCredit` was check-then-insert over a `SUM()`, so parallel generations could both pass a stale balance check and overspend. Credits also had to be debited *before* the paid call and returned if it failed.
- Options considered: (a) a cached `balance` column with a conditional `UPDATE … WHERE balance > 0` (fastest, but adds a column and a second source of truth against the ledger); (b) `INSERT … SELECT` with a guard subquery (MySQL permits it, but it does not lock against concurrent inserts, so the phantom remains); (c) a transaction that takes `SELECT … FOR UPDATE` on the member row before reading the balance.
- Decision made: (c). Contention is per-member, so different members never block each other, and the ledger stays the only source of truth. Refunds are `direction: "credit"` rows; `getMonthlyUsed` now nets debits against credits.
- Reasoning: (a) is the right answer at 20k members but is a schema change plus a backfill; (c) is correct today and does not preclude it. `refundCredit` deliberately never throws — a failed refund must not mask the error that caused it.
- Reversible? yes — the extra rows are additive; nothing else reads `direction` yet.

## [Sprint 8] Founder activation runs in one transaction with a locked read
- Context: `MAX(founder_number) + 1` → `UPDATE` → `INSERT` was three unguarded statements. Two simultaneous activations could issue the same founder number, which appears on the welcome email and the dashboard badge and cannot be quietly corrected.
- Decision made: the whole assignment runs inside `db.transaction` with `.for("update")` on the `MAX` read. `register` got the same treatment for its ApexCRM-user + member pair. Both roll back and return a 500 that states the member was not changed.
- Reasoning: an auto-increment column would be cleaner but founder numbers are business data already populated on live rows; locking the read is additive and needs no DDL.
- Reversible? yes.

## [Sprint 8] Email templates moved to @monetura/config, not duplicated
- Context: the marketing apply route hand-built email HTML and interpolated `name`, `phone`, `province` and `referral` — unauthenticated public input — with no escaping. The platform already had a correct escaping template the marketing app could not import across app boundaries.
- Options considered: (a) copy `escapeHtml` into the marketing app; (b) move the templates into a shared package.
- Decision made: (b) — `packages/config/src/email.ts`, following the existing `@monetura/config/src/tiers` deep-import pattern that marketing already uses. `apps/platform/src/lib/email-templates.ts` re-exports it so no platform call site changed. The owner notification is now a branded panel built from `panelLines`, which escapes every value.
- Reasoning: (a) is how the codebase acquired its duplicate `MemberTier` and `apexcrmUsers` stubs; a second copy of a security control is the worst kind to have. `@monetura/db` was rejected because these are pure string helpers with no database or `server-only` requirement.
- Reversible? yes.

## [Sprint 8] appBaseUrl throws; callers resolve it before mutating
- Context: `appBaseUrl()` fell back to a Vercel preview domain, so a production deploy without `NEXT_PUBLIC_APP_URL` would mail every founder a set-password link pointing at the wrong host, with nothing failing.
- Decision made: it now throws. `activate` resolves the URL immediately after the admin check — before any DB write — and returns a 500 saying the member was not changed, so a config error can never activate someone and then fail on the email. `forgot-password` must always answer `{success:true}` (it must not reveal whether an account exists), so it logs a loud `CONFIG ERROR` and skips the send rather than throwing.
- Reasoning: failing at the point of misconfiguration beats a silently wrong link; ordering the check before mutation keeps the failure clean.
- Reversible? yes.

## [Sprint 8] Seed passwords read from env; live admin password still needs manual rotation
- Context: `MoneturaAdmin2024!` and `Monetura2024!` were literals in the seed scripts and were echoed to stdout on every run.
- Decision made: both read `SEED_ADMIN_PASSWORD` / `SEED_DEMO_PASSWORD` with no default, exit with instructions when unset, and no longer print the password. Documented in `.env.local.example`.
- **Not fixed by this change, and it needs the owner:** both literals remain in git history, and the `admin@monetura.com` account on the live database still has the old password — which grants the admin console, including founder activation. **The owner must rotate that password manually** (sign in and use "Forgot your password?", or re-run the seed against a fresh value). Removing them from history would require a force-push rewrite of a shared branch, which is out of scope for an autonomous sprint.
- Reversible? yes.

## [Sprint 9] Admin contrast: two AA-safe warm tones replace the failing browns
- Context: `#8B6E52` (Canyon Earth) and `#4A3728` (Deep Mocha) were used as *text* across `/admin/founders` and `/admin/submissions`. Measured against the four admin backgrounds (#130D0A, #1A0F0A, #2C2420, #3D2E26) they score 2.75–4.08 and 1.16–1.71 respectively — `#4A3728` field labels ("PHONE", "PROVINCE") were effectively invisible.
- Options considered: (a) lighten the backgrounds; (b) move everything to cream, flattening the type hierarchy; (c) introduce two new warm tones that clear AA on every admin surface.
- Decision made: (c). Secondary text `#8B6E52 → #C4A882` (min 5.73:1) and tertiary/label text `#4A3728 → #B99B74` (min 4.95:1); the "Pending Review" badge `#C17A4A → #D89A6A` (was 4.46:1 on #2C2420, just under AA). `#4A3728` is untouched where it is a border or background. Every remaining admin text colour was then re-measured: all ≥4.5:1.
- Reasoning: (c) keeps the brand's warm sand/champagne family and the three-level hierarchy while making small uppercase labels legible; (a) would have changed the whole admin look for a text problem.
- Reversible? yes — two hex values.
- Adjacent: the `/settings/social` subtitle used the same failing `#8B6E52`; it was raised in the same pass because the new explainer panel sits directly beneath it.

## [Sprint 9] Public pricing removed; the concierge is treated as a public surface
- Context: the brief named `/founders/apply`, TiersSection and TierSelector. `how-it-works` also carried hardcoded prices (and a stale three-tier list omitting Pioneer), and the concierge system prompt injected every tier price.
- Decision made: prices removed from all four. The concierge is behind login, but it is a generative surface that will restate anything in its prompt, so it now lists tier *names* only plus an explicit instruction never to quote prices and to offer to book a webinar instead. Tier cards now read "One-time founding investment / Pricing shared on the webinar"; the apply dropdown and tier cards show names and taglines.
- Kept: `priceCad` in `packages/config/src/tiers.ts` and the price in the internal owner-notification email — the brief's "internal/admin use only" carve-out.
- Reasoning: a member relaying a price the AI quoted is the same leak as publishing it; "webinar only" has to hold everywhere the number could surface.
- Reversible? yes — the canonical config is unchanged.

## [Sprint 9] Share step links to the member's profile, not to the post
- Context: the brief asked for the live post URL "where available". bundle.social's create-post response returns only an internal `id`, and posts are created as SCHEDULED, so no permalink exists at publish time.
- Decision made: `/api/content/publish` returns `shareTargets` built from the member's connected accounts via a new `bundleProfileUrl(platform, username)`; `PostDetail` renders "Share on <platform>" buttons after a successful publish. LinkedIn resolves to the member's feed rather than a guessed `/in/` vs `/company/` path, and an unusable handle yields no link rather than a URL that 404s. Building the targets is wrapped in try/catch — the post is already live, so this can never fail the publish.
- Reasoning: the whole point of the step is that the APIs cannot reach a personal profile, so the destination that matters is where the member goes to re-share. Storing the returned `bundlePostId` for a real permalink later is follow-up work.
- Reversible? yes — additive response field.

## [Sprint 9] "Save this trip" copies instead of pretending to save
- Context: the button called `console.log` and gave the member no feedback at all. A real save needs `monetura_travel_bookings` wiring, which is Tier 3 backlog, not a nav sanity check.
- Options considered: (a) leave it inert; (b) build the booking backend; (c) make it do something real and small.
- Decision made: (c) — it copies a formatted trip summary to the clipboard with "Copied to clipboard ✓" / failure states, and the label now reads "Copy trip summary" so it describes what it does. Persisting trips stays on the backlog.
- Reasoning: a button that silently does nothing is worse than either a working one or no button; this is honest, needs no schema, and does not pre-empt the real feature.
- Reversible? yes.

## [Sprint 9] Nav audit result: one knowingly-inert control remains
- Every internal `href` in the platform resolves to an existing route (checked static and template literals: /admin/founders, /admin/submissions, /create, /dashboard, /earnings, /events, /events/[slug], /forgot-password, /login, /marketplace, /marketplace/[slug], /marketplace/submit, /posts, /posts/[id], /settings/social, /travel). `/` correctly redirects to /dashboard or /login. No dead links found.
- The TopBar avatar was an inert button; it is now a link to `/settings/social`, the only account surface that exists.
- **Still inert by decision:** the TopBar notification bell. Sprint 6 deliberately kept it and removed only its always-on dot; there is no notifications table. Left as-is rather than churning a logged decision.
- The `onTabChange={() => {}}` props on SidebarNav/BottomNav are the vestigial props Sprint 6 kept so call sites did not churn — navigation is pathname-driven and these are ignored by design, not dead handlers.

## [Sprint 10] AI receipt reading costs 1 credit; refunded on every failure
- Context: the brief requires AI calls to use the credit system exactly like `content/generate` and to pick a cost.
- Options considered: (a) free (it saves the member typing, and they must confirm every field anyway); (b) 1 credit; (c) 2+ credits because vision input costs more than text.
- Decision made: (b), `RECEIPT_READ_CREDIT_COST = 1` in `lib/trips/constants.ts`. Debited with `deductCredit` before the Claude call; `refundCredit` on every failure path — API error, refusal, unparseable output, and "not a readable receipt". Storage and format problems (HEIC, >5 MB, S3 read failure) are checked *before* the debit, so they cost nothing. Verified live: without an API key the ledger shows a debit followed by a refund.
- Reasoning: matches the "1 credit per AI action" rule members already see in Create and the concierge. A downscaled receipt photo is ~1,500 input tokens — comparable to a content generation.
- Reversible? yes — one constant.

## [Sprint 10] AI never guesses: structured output, nulls for anything uncertain, every field confirmed by hand
- Context: "Read receipt with AI" must prefill vendor, date, amount, currency and description, and the member must confirm every field; AI values are never auto-saved.
- Decision made: Claude (`claude-sonnet-5`, same as the rest of the platform) is called with `output_config.format` (a JSON schema), then the result is re-validated with zod and each value checked for shape. The prompt says to return null rather than guess: dates only when day/month are unambiguous, currency only when printed or identified by symbol + address (a bare "$" is null), no category guess at all, and nothing about tax. In the form, every AI-filled field gets an amber border and a "tap to confirm" button; editing the field also counts as confirming. Save stays blocked ("Confirm 3 AI fields first") until none are pending. Expenses record `ai_assisted = true` so the accountant export can say which rows started from AI.
- Reasoning: "confirm every field" is enforced per field, not as one checkbox that is easy to tap without reading.
- Reversible? yes.

## [Sprint 10] CAD expenses use a fourth rate source, `not_required`
- Context: the brief lists three rate sources (bank_of_canada / member_entered / card_statement). A CAD expense has no conversion, and any of the three would misdescribe it in an export.
- Decision made: added `not_required` to the enum: rate 1.00000000, no rate date, CAD amount = amount. Labelled "CAD — no conversion".
- Reversible? yes — enum value plus a label.

## [Sprint 10] Bank of Canada lookup: 14-day window, latest observation on or before the date, looked up again on save
- Context: rates are published on business days only; weekends, holidays and "today before 16:30 ET" have no observation for that date.
- Decision made: `GET /valet/observations/FX{CUR}CAD/json?start_date=D-14&end_date=D` and take the latest observation ≤ D; its date is stored in `rate_date`. Checked live on 2026-09-22: a Saturday (09-19) resolves to Friday 09-18; an unknown series returns HTTP 404; a suspended series (RUB) returns an empty list. Both mean "not published" and make the member enter a rate or card-statement CAD amount. A network error or 5xx is reported separately ("rate service didn't respond") so a BoC outage is never shown as "not published". The browser gets a preview from `/api/trips/fx`, but the save routes look the rate up again on the server; a rate sent by the browser is never stored as a Bank of Canada rate. Past-date results are cached per serverless instance.
- Reasoning: stored rates must be reproducible from the public source and cannot be forged by the browser.
- Reversible? yes.

## [Sprint 10] Card-statement CAD amount is offered for every foreign currency, not only unpublished ones
- Context: the brief requires the card-statement option when BoC doesn't publish a currency. For card purchases, though, the statement shows what the member was actually charged in CAD, and that can differ from the BoC daily average.
- Decision made: all three options (BoC / card statement / enter rate) are available for any non-CAD currency. BoC is the default; for an unpublished currency the form switches to card statement (card payments) or entered rate (cash/other) and disables BoC. The implied rate is stored for card-statement entries (CAD ÷ amount, 8 decimals).
- Reasoning: the member records what happened, and the accountant sees which source was used on every row.
- Reversible? yes — UI only.

## [Sprint 10] Money is exact: scaled BigInt arithmetic, half-up to the cent
- Decision made: amounts are `decimal(15,3)` (3 decimals for KWD/BHD/OMR), rates `decimal(18,8)`, CAD `decimal(14,2)`. `lib/trips/money.ts` converts to scaled BigInts; CAD = amount × rate rounded half-up; totals are summed as integers. The browser's live "→ CA$…" preview uses floats and is display only; the server computes every stored value. Verified: 84.50 USD × 1.4002 = 118.32; 12.345 CAD → 12.35.
- Reversible? yes.

## [Sprint 10] Trip Records media is private: no public URLs, 5-minute presigned reads after an ownership check
- Context: the existing upload pattern gives every file a public URL (`NEXT_PUBLIC_S3_BASE_URL/...`), which is right for post photos. Receipts, vendor signatures and voice notes are financial and personal records.
- Decision made: same bucket (`AWS_S3_BUCKET` = monetura-platform-media), same presign → PUT → confirm flow, under `monetura/members/{userId}/trips/{tripId}/`. No public URL is stored. Every read goes through `GET /api/trips/attachments/{id}`, which checks `member_id` and redirects to a 5-minute presigned GET. Confirm runs `HeadObject` before marking a file uploaded. Verified live: another member's session gets a 404 for the file and the trip page.
- Caveat: if the bucket policy makes all objects public-read, these objects are public too for anyone who guesses the key (they are unguessable: timestamp + random). Making `trips/` private at the bucket-policy level is an owner action — see the Sprint 10 summary.
- Reversible? yes.

## [Sprint 10] Photos are re-encoded in the browser before upload
- Decision made: `prepareImage()` draws the photo to a canvas at 2400px or less on the long edge and uploads a JPEG at quality 0.85 (~0.5–1.5 MB). Benefits: iPhone HEIC becomes a format Claude accepts, uploads are quick on hotel wifi, the file fits Claude's 5 MB image limit, and EXIF (including GPS) is removed. Browsers apply EXIF orientation when drawing, so the image comes out upright. If the browser can't decode the file, the original is uploaded (AI reading then returns a friendly 415).
- Reversible? yes.

## [Sprint 10] "Add expense" opens the camera from the ledger
- Context: the brief says the add-expense flow opens the phone camera directly. Browsers only open a file picker from a user tap, so the form page can't open the camera by itself on load.
- Decision made: the ledger's primary button is the camera (`<input capture="environment">`). The photo uploads right away and the form opens with it attached and "Read with AI" one tap away. A secondary "No receipt" button opens the form on the cash path (self-declared, cash preselected). The form also has "Take receipt photo" and "Library" buttons.
- Known side effect: a photo taken and then abandoned leaves an unlinked attachment. It is invisible, removed if the trip is deleted, and costs cents. A cleanup job can come later.
- Reversible? yes.

## [Sprint 10] Evidence rules for the cash / no-receipt path
- Decision made: any evidence other than an official receipt requires a description and business purpose (enforced on the server) and shows the tip "Ask the vendor to write the date, item and amount, and sign." A **vendor signature** requires a signer name and a saved signature PNG. A **vendor note** requires a photo of the note. **Self-declared** needs only the description and purpose. An **official receipt** does not require a photo, because e-tickets and emailed hotel folios have no paper to photograph. When the signature is saved, the signer's name and the local date and time are stamped on the image, so the PNG still makes sense if it is ever separated from the record.
- Reversible? yes — `missingEvidence()` in `lib/trips/server.ts`.

## [Sprint 10] Edit audit: full pre-edit snapshot after 24 hours; rate kept unless its inputs change
- Decision made: a PATCH more than 24h after `created_at` writes `monetura_trip_expense_revisions` (full previous row as JSON + `edited_at`) in the same transaction as the update. Edits in the first 24h are free, for typos made at the table. The edit page shows the history ("Edited … — before this edit: …") and says which rule applies. An edit keeps the stored rate and CAD amount (`fx: keep`) unless amount, currency or date changed. In that case the server refuses `keep` and the member picks a conversion again. Verified live.
- Reversible? yes.

## [Sprint 10] Deletion is real but deliberate; saved files can't be removed one at a time; only empty trips can be deleted
- Decision made: deleting an expense takes two steps. The second step shows the retention warning ("Records should be kept for six years from the end of the tax year they relate to. Deleting this cannot be undone."). It hard-deletes the row, its revisions and its attachments (S3 delete is best effort, after the rows). An attachment linked to a saved expense can't be removed on its own; it goes only with its record. A trip can be deleted only when it has no expenses or journal entries, so one tap can never wipe a trip's records. Added a trip edit page, which the brief didn't list but members need.
- Reasoning: the member owns the data and may delete it, but it should never happen by accident.
- Reversible? no for deleted data (by design); yes for the rules.

## [Sprint 10] Totals are raw CAD sums; business-use % is displayed, never applied
- Context: the brief says the product never tells a member something is deductible, and the Meals flag is "label only, no calculation of deductibility".
- Decision made: category totals and the trip total add up the full CAD amounts. Business-use % is shown per expense and per trip but never multiplied in, because "business portion" totals are a step toward a deductibility figure. The ledger says so in one line. "50% rule may apply" is a label on Meals rows and the Meals total.
- Reversible? yes.

## [Sprint 10] Trip percentages: business 100, mixed required (1–99), personal 0
- Decision made: business trips default to 100% and personal trips to 0%, and both can be overridden. Mixed trips require a value from 1 to 99 (a mixed trip at 100% is a business trip). New expenses take the trip's % and can be changed per expense. Changing the trip's % doesn't rewrite expenses already recorded.
- Reversible? yes.

## [Sprint 10] Expense dates: outside the trip is allowed, the future is not
- Decision made: flights and hotels are often paid weeks before a trip, so dates outside the trip range are accepted with a hint. Dates after tomorrow in UTC are rejected. The one-day allowance covers members in time zones up to UTC+14.
- Reversible? yes.

## [Sprint 10] Nav placement, a committed idempotent migration script, and one contrast fix
- Nav: "Trips" sits after Travel in the desktop sidebar and at the top of the mobile "More" sheet. The bottom bar stays at five targets (Sprint 6 decision).
- Migration: `0007_clever_cyclops` was generated by drizzle-kit (snapshot included) and applied to the live DB with the new `scripts/apply-migration-idempotent.mjs`. The script turns CREATE TABLE into IF NOT EXISTS, skips indexes that already exist, and refuses to run anything that isn't additive. It is the Sprint 2 rule written as a reusable tool instead of a one-off.
- Contrast: every new text colour was measured against #1A0F0A / #2C2420 / #3D2E26 and passes AA (≥4.5:1). The first placeholder tone (#8F7A63, 3.72:1) was replaced with #A8916F (5.03:1).
- Local testing note: `next start` on localhost needs `AUTH_TRUST_HOST=true` (Auth.js rejects untrusted hosts outside Vercel). Nothing in the deployed configuration changes.

## [Sprint 11] Transcription uses OpenAI via fetch, defaults to gpt-4o-transcribe, costs 1 credit, and degrades to typing when unconfigured
- Context: the brief requires OpenAI transcription via `OPENAI_API_KEY`. When the key is missing, the audio must still be saved, the member must see "Transcription not yet enabled", and they must be able to type instead.
- Decision made: `lib/trips/transcribe.ts` calls `POST /v1/audio/transcriptions` with `fetch` + `FormData` (no SDK added for one endpoint). The model defaults to `gpt-4o-transcribe`; `OPENAI_TRANSCRIPTION_MODEL` can switch it (e.g. `whisper-1`). The file extension is set from the MIME type (`audio/mp4` → `.m4a`, `audio/webm` → `.webm`) because OpenAI infers the format from the filename. Without the key, the entry is marked `transcript_status = not_enabled`, **no credit is taken**, the UI shows "Transcription not yet enabled" and opens Typed notes, and a "Check again" button retries once the key exists. With the key, cost is `TRANSCRIPTION_CREDIT_COST = 1`: debited before the call and refunded on failure, and the status becomes `failed` with a Retry button while the recording stays saved. Audio is loaded from S3 before the debit, so a storage error costs nothing. Verified live without a key: status `not_enabled`, credit ledger unchanged.
- Env documentation: `OPENAI_API_KEY` and `OPENAI_TRANSCRIPTION_MODEL` added to `apps/platform/.env.local.example`.
- Reasoning: it is a paid AI call, and 1 credit matches every other AI action. Ten minutes of audio costs a few cents.
- Reversible? yes — constant plus env var.

## [Sprint 11] "Make it professional" costs 1 credit; prompt hardened; tax language is rejected, not shown
- Decision made: `SUMMARY_CREDIT_COST = 1`, debit before / refund on every failure (API error, refusal, empty, truncated at max_tokens). The system prompt carries the brief's rules: first person; what, where, who and why only as stated; every amount, name, time and place kept exactly; no added facts; no inferred purpose; `[unclear]` for anything unclear; nothing about deductibility or tax. Input is the verbatim transcript (only once transcription is `completed`), the typed notes, and that day's expenses for the same trip as the member recorded them (vendor, category, amounts, payment, evidence, description, recorded purpose). The trip-level business purpose is **deliberately not sent**: it would invite the model to attach a purpose to a day that the member didn't state. As a last line of defence, a summary matching `deductib*|write-off|claimable|tax-deduct*|tax-exempt` is discarded and refunded, and the member is asked to try again.
- Reasoning: the brief forbids implying deductibility "in UI copy or AI output". A prompt rule alone can't guarantee that; the output check can.
- Reversible? yes.

## [Sprint 11] Originals are never touched; the first AI version is kept separately
- Decision made: the summarize route's UPDATE writes only `ai_summary`, `summary_status`, `summary_generated_at`, and `ai_summary_first` (only if empty). It never writes `raw_text`, `transcript` or the audio link. Member edits go to `ai_summary` (status `edited`) and never to `ai_summary_first`. "Rewrite with AI" replaces `ai_summary`, including the member's edits, and the UI says so before they tap it; the first AI version stays and is shown under "First AI version" once the two differ. The member can still edit their own typed notes; that is their record, not the AI action. The verbatim transcript can't be edited, and an existing recording can't be replaced (a voice note can only be added to an entry that has none). Verified live: after a failed summary and after a member edit, `raw_text` was byte-identical and `ai_summary_first` unchanged.
- Display: original and summary sit side by side on tablet and desktop and stack on phones (original first). The summary card is titled exactly "AI summary of the member's original entry". The PDF uses the same label and adds "— edited by the member" when applicable.
- Reversible? yes.

## [Sprint 11] Voice recorder: MediaRecorder, mp4 first, no timeslice, 64 kbps, 10-minute hard stop
- Decision made: the MIME types tried, in order, are `audio/mp4` (iOS Safari only records mp4/AAC), `audio/webm;codecs=opus` (Chrome, Firefox), `audio/webm`, then `audio/ogg;codecs=opus`. Recording uses no timeslice: some iOS Safari versions emit fragmented MP4 chunks that don't join into a playable file, and one blob at stop() is at most ~5 MB. There is a visible elapsed timer plus a time-left counter, and recording stops automatically at 600 s. After stopping, the member can listen and re-record; nothing uploads until they save. A blocked microphone, or a browser without MediaRecorder, shows a clear message and points to typing. Codec parameters are stripped from the MIME type server-side (`audio/webm;codecs=opus` → `audio/webm`), and the upload limit is 25 MB (OpenAI's ceiling).
- Not verified: an actual recording on a physical iPhone. It can't be done from this environment. The phone test steps in the Sprint 11 summary cover it.
- Reversible? yes.

## [Sprint 11] Transcription starts automatically after saving a voice entry
- Decision made: saving an entry with audio goes to the entry page with `?transcribe=1`. The page removes the flag from the URL and starts transcription, showing "Transcribing your voice note…". If the member leaves, the entry keeps status `none` and shows a Transcribe button. The save itself never waits on OpenAI.
- Reasoning: the member at a restaurant table gets "saved" immediately, and a slow transcription can never lose their recording.
- Reversible? yes.

## [Sprint 11] Export formats and delivery: PDF and CSV direct, ZIP through S3
- PDF: `pdf-lib` (pure JS, no native binaries or font files on disk, safe in serverless). Pages: cover (member, trip or year, dates, destinations, business purpose, trip type, business-use %, counts, a "how to read" key), ledger by day (original amount and currency × rate, rate source and BoC rate date, CAD, payment, evidence with signer, business-use %, AI-assisted and edited-after-24h markers, description, purpose, attachment filenames), CAD totals by category with the Meals label, then the daily journal (AI summary, verbatim transcript beneath, typed notes, voice-file name). The disclaimer is on every page, with the member name and "Page X of Y".
- CSV: every expense column plus trip name, category label, Meals flag, edited-after-24h count, timestamps, and the ZIP filenames of its files. It starts with a UTF-8 BOM so Excel shows accented and non-Latin vendor names correctly. Text cells starting with `= + - @` get a leading `'` (spreadsheet formula-injection guard; verified).
- ZIP: `fflate`. Contains the PDF, the CSV, `attachments/{date}_{vendor}_{amount}{CUR}_{receipt|vendor-note|signature}.{ext}` and `journal/{date}_journal-{id}_voice-note.{ext}`, de-duplicated with `-2`, `-3`. Photos and audio are stored uncompressed (already compressed). A file that can't be fetched goes into `MISSING-FILES.txt` instead of failing the whole package. **Delivery:** Vercel functions cap responses at 4.5 MB, which a ZIP of receipts passes quickly, so the ZIP is written to `monetura/members/{userId}/exports/` and the browser is redirected to a 5-minute presigned download. Exports older than an hour are removed on the member's next export. PDF and CSV are small and stream directly.
- Tax year: calendar year (Jan 1 – Dec 31), every expense and journal entry dated in it across all trips. The cover lists every trip that overlaps the year or has records in it, e.g. December airfare for a January trip. `/trips` lists every year touched by a trip or an expense.
- Limits: the ZIP is built in memory (a year of ~300 receipt photos is roughly 300 MB of RAM and 15–25 s); `maxDuration = 60`. A very heavy year may need a background job later.
- Reversible? yes.

## [Sprint 11] PDF text outside WinAnsi becomes "[…]"; the CSV keeps everything
- Context: pdf-lib's standard fonts cover Western European text only. A vendor name in Japanese or Thai (which AI receipt reading returns as printed) can't be drawn and would throw.
- Options considered: (a) embed a Unicode font (a CJK-capable font is 5–16 MB per serverless bundle); (b) transliterate; (c) replace unrenderable runs with a visible marker and point to the CSV.
- Decision made: (c). Accented letters outside WinAnsi fall back to the unaccented letter; each run of anything else becomes one "[…]". The PDF's "how to read" key explains this, and the CSV and on-screen records keep the original text. Verified with "東京ラーメン Ichiran" → "[…] Ichiran" in the PDF and the full name in the CSV.
- Reversible? yes — embed a font later with `@pdf-lib/fontkit` if members travel mostly in non-Latin regions.

## [Sprint 11] Journal entries: text, voice, or both; dates follow the expense rules; delete matches expenses
- Decision made: an entry needs typed notes or a voice note. Its date can't be in the future (same UTC+1 ceiling as expenses) and may fall outside the trip. Deleting an entry uses the same two-step six-year retention warning and removes its recording. A trip with journal entries can't be deleted until they are.
- Reversible? yes.

## [Sprint 11 follow-up] S3 bucket policy: public read limited to post uploads; trip records and exports denied to anonymous requests
- Context: Sprint 10 flagged that trip records depend on the bucket policy. Inspected `monetura-platform-media` (ca-central-1) on 2026-09-22 with the platform's AWS credentials. The only statement was `PublicReadGetObject`: `Principal "*"`, `s3:GetObject` on `arn:aws:s3:::monetura-platform-media/*`, which covers the **whole bucket**, including `trips/` and `exports/`. Block Public Access was fully off, and ACLs are disabled (`BucketOwnerEnforced`), so the bucket policy is the only public path.
- What needs public read: only post media. `/api/upload/presign` writes `monetura/members/{userId}/uploads/…` and stores a plain `publicUrl`. `/posts`, `/posts/[id]` and cover images render that URL, and `uploadMediaToBundle()` in `packages/db/src/social.ts` fetches it to stream images to bundle.social. The bucket listing confirmed `uploads/` and `exports/` are the only prefixes in use. Trip Records never uses a plain URL (Sprint 10: presigned reads only).
- Options considered: (a) keep `/*` public and rely on unguessable keys (anyone with a link keeps permanent access to receipts and voice notes); (b) narrow the Allow to `uploads/` only; (c) (b) plus an explicit Deny.
- Decision made: (c), applied directly (the credentials had `s3:PutBucketPolicy`):
  1. `PublicReadPostMediaUploads`: Allow `s3:GetObject` to `*` on `monetura/members/*/uploads/*` only.
  2. `DenyAnonymousReadTripRecordsAndExports`: Deny `s3:GetObject` on `monetura/members/*/trips/*` and `monetura/members/*/exports/*` when `aws:PrincipalType = Anonymous`. The condition matters: an unconditioned Deny would also block the app's IAM user and break every presigned receipt, voice note and ZIP link. Scoping it to anonymous requests keeps those links working while guaranteeing that a future broadening of the Allow can't re-expose these prefixes.
- Verified with real anonymous requests: an existing post image returns **200**; a fresh `trips/` test object returns **403**; an existing `exports/` ZIP returns **403**; the same `trips/` object through a presigned URL returns **200**. Test objects and the three ZIPs left by the Sprint 11 smoke tests were deleted afterwards.
- Also corrected `.env.local.example`, which listed `us-east-1` for a bucket that lives in `ca-central-1`.
- Not changed: Block Public Access stays off, because turning on `BlockPublicPolicy`/`RestrictPublicBuckets` would also block the public `uploads/` read that bundle.social needs. Moving post media to its own bucket or behind CloudFront would allow full Block Public Access. That is future work.
- Rollback (the previous policy, verbatim): `{"Version":"2012-10-17","Statement":[{"Sid":"PublicReadGetObject","Effect":"Allow","Principal":"*","Action":"s3:GetObject","Resource":"arn:aws:s3:::monetura-platform-media/*"}]}`. Paste it in S3 → monetura-platform-media → Permissions → Bucket policy → Edit.
- Reversible? yes — see rollback.

## [Ops 2026-09-23] Forgot-password email to admin@monetura.com: hard bounce, then Resend suppression. Not a code or DNS fault
- Symptom: reset emails for admin@monetura.com never arrived, although the Bluehost mailbox receives internal mail.
- Code path (checked read-only): the ApexCRM `users` row exists (id 13323, has a password) and member #2 is `active`/`admin`. `forgot-password` has no role or status check. Its only early exits are the per-IP rate limit and a missing `NEXT_PUBLIC_APP_URL`. Production has `NEXT_PUBLIC_APP_URL=https://app.monetura.com` and `RESEND_API_KEY` set. Two `reset_password` tokens were minted (ids 2 and 3, four minutes apart), and the token is created immediately before the Resend call, so both requests reached `emails.send`.
- Resend (API, production key): both messages were accepted from the verified `monetura.com` domain. The first **bounced**: `Permanent/General`, Bluehost replied `smtp; 550 No Such User Here`. Resend then put the address on its suppression list (origin `bounce`), and it silently dropped the second message (`last_event: suppressed`). Every future send to that address will also be dropped until the suppression is removed.
- DNS: NS is Bluehost. MX is `0 mail.monetura.com` and `10 monetura.com`, both A → 67.222.38.91 (`box2049.bluehost.com`). SPF (`include:websitewelcome.com`), Resend's `send.monetura.com` MX/SPF, `resend._domainkey` DKIM and `_dmarc` (p=none) are all present. **MX is correct.**
- Most likely cause: the first email arrived before the mailbox existed ("just created"), or it was created under a different address. `550 No Such User Here` is Exim's standard reply for a missing local mailbox. It could not be re-tested directly because outbound port 25 is blocked from this workstation.
- Code change: **none**. Nothing in the route skipped the send. A bounce happens after the API call returns, so the route can't observe it. Whether to surface Resend bounces (webhook → admin alert) is a separate decision.
- Owner actions: (1) Resend dashboard → Suppressions → remove `admin@monetura.com`. (2) In Bluehost cPanel → Email Accounts, confirm the address is exactly `admin@monetura.com`, and under Email Routing confirm monetura.com is set to **Local Mail Exchanger**. (3) Request a reset again and check the Resend log shows `delivered`.
- Unblock: a one-time `reset_password` token (24h, single use) was created with the app's own `createPasswordToken()` and printed to the owner's terminal only. It was not written to any file, log or commit. The two earlier tokens (ids 2 and 3) were never delivered and expire on their own within 24h.

## [Ops 2026-09-23] admin@monetura.com: the reset saved correctly; the one failed login submitted a different password
- Symptom: after setting a password through the reset link, login with it failed.
- Evidence:
  - **The reset saved.** Token #4 (the one-time link from the previous diagnosis) was consumed at 22:20:58 UTC. That same second, ApexCRM `users.passwordHash` for id 13323 was rewritten with a fresh bcryptjs 12-round hash. Production log: `POST /api/auth/set-password` → 200 at 22:20:57.
  - **Same table and column.** Login (`auth.ts` `authorize()`) reads `users.passwordHash` by email, which is exactly what `set-password` writes. There is one `users` row for the address. It is stored lowercase, and `LoginForm` lowercases and trims the typed email. The member row (#2) is `active`/`admin`. Production `NEXTAUTH_URL` = `https://app.monetura.com` (matches the domain), `NEXTAUTH_SECRET` is set, and production uses the same database as `.env.local`.
  - **One login attempt, rejected by credential check.** Production logs show a single `POST /api/auth/callback/credentials` at 22:21:23 logging `CredentialsSignin`, i.e. `authorize()` returned null. A database or configuration fault would log a different Auth.js error. No rate limit applies to login (only forgot-password and set-password are rate limited), and that endpoint was hit once. Stale sessions don't affect a credentials POST (middleware only redirects already-signed-in users away from `/login`).
  - **The decisive check.** Before anything was overwritten, the hash saved by the reset was compared with the password the owner intended: **it matched**. So the reset stored the intended password, and the login attempt 26 seconds later submitted something else. Likely causes: a browser or password-manager autofill of the old saved password, or a typo or stray whitespace (the login form trims the email but not the password, and neither form trims passwords).
- Action: at the owner's request, the password was set again to the requested value through the reset flow's own hashing (`bcryptjs`, 12 rounds) and a Drizzle update on `users.passwordHash`. It was passed inline only, never written to a file. Then it was verified through the real production login path: CSRF → `/api/auth/callback/credentials` returned `/dashboard`, a session cookie was issued, `/api/auth/session` = admin@monetura.com / member 2 / admin, and `/admin/founders` returned 200. A wrong-password control still returns `CredentialsSignin`.
- Code change: none. Nothing in the reset or login path was at fault.
- Owner follow-ups: update or remove any old password saved for app.monetura.com in the browser or password manager, so autofill doesn't submit it again. Resend's suppression of admin@monetura.com (previous entry) still needs removing for future emails. The seeded admin password from Sprint 8 is now replaced.
- Tooling note for future diagnosis: the mysql2 client prints `timestamp` columns in the workstation's local zone (UTC−6 here), so DB times appeared 6 hours ahead of Resend and Vercel. Compare in UTC.
