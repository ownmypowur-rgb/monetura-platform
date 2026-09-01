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
