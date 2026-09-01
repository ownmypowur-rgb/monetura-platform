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
