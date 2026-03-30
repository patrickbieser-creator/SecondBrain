# Architecture Decisions

Decisions made, trade-offs considered, and paths explicitly rejected — with reasoning. Add new entries at the top.

---

## Prisma pinned to 5.22
**Decision:** Do not upgrade Prisma.
**Why:** Prisma 7 changed the SQLite URL syntax and broke the dev environment. Pinned at 5.22 until a migration path is validated.
**Rejected:** Auto-upgrading via `npm update`.

## SQLite for dev, Neon Postgres for prod
**Decision:** Use `file:./dev.db` locally; swap `DATABASE_URL` for Neon Postgres in production.
**Why:** Zero-setup local dev; Prisma schema is compatible with both. Enums are stored as strings in both.
**Rejected:** Running Postgres locally (adds Docker dependency for no benefit during solo dev).

## TEST_AUTH bypass instead of full NextAuth
**Decision:** `getSession()` returns `{ userId }` from env var when `TEST_AUTH=true`; NextAuth is installed but not wired.
**Why:** Speeds up local iteration; no OAuth credentials needed. Auth is a deployment concern, not a feature concern right now.
**Rejected:** Wiring NextAuth fully before core feature work is done.

## Tailwind v4 with `@import "tailwindcss"`
**Decision:** Use Tailwind v4 import syntax, not v3 `@tailwind` directives.
**Why:** Project bootstrapped with v4. Directives cause build errors.
**Rejected:** Downgrading to Tailwind v3.

## shadcn/ui via single `radix-ui` package
**Decision:** Use `radix-ui` (single package) not individual `@radix-ui/react-*` packages.
**Why:** shadcn@latest scaffolds this way; mixing import styles causes resolution errors.
**Rejected:** Installing individual Radix packages.

## Deterministic scoring (no AI)
**Decision:** Priority score 0–100 is fully deterministic: weighted inputs + deadline/effort/momentum modifiers.
**Why:** Predictable, auditable, fast. AI scoring adds latency and cost with no clear accuracy benefit for task prioritization.
**Rejected:** LLM-based scoring on each recompute.

---
