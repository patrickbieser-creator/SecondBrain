# SecondBrain architecture (MVP bootstrap)

SecondBrain is a Next.js 14+ App Router web application for capture → triage → score → plan → focus workflows. The architecture prioritizes fast iteration, deterministic prioritization, and clear domain boundaries aligned with `Plans.md`.

## System overview

- **Frontend + backend in one app:** Next.js App Router provides UI routes and API route handlers.
- **Shared TypeScript domain logic:** scoring/planning logic lives in `src/lib` and is reused by API handlers and server components.
- **Data layer (planned):** Prisma + Postgres for user-scoped entities (domains, projects, inbox items, tasks, plans, focus sessions).
- **Auth (planned):** Auth.js (NextAuth) with email magic link and optional Google provider.

## High-level flow

1. **Capture**
   - User adds raw items to inbox.
   - API stores as `InboxItem` with `UNPROCESSED` status.
2. **Triage**
   - Inbox item is converted to Task/Project/Someday/Discard.
   - Triage writes normalized records and status transitions.
3. **Scoring**
   - Deterministic scoring computes `priorityScore` and explanation fields.
   - Recompute runs on demand (e.g., `/today` load, task edits).
4. **Planning**
   - Daily plan generator groups top work into Must / Should / Could based on available time and score.
5. **Focus**
   - Focus session endpoints start/stop sessions and persist durations/outcomes.

## Code organization

- `src/app`: pages, layouts, and API route handlers.
- `src/components`: composable UI blocks (lists, cards, badges, popovers).
- `src/lib`: domain logic (scoring, planning, utilities, constants).
- `docs`: architecture and ADR-style documentation.

## Design principles

- **User-scoped security:** every API query is filtered by authenticated `userId`.
- **Deterministic MVP logic:** no AI dependency for critical ranking behavior.
- **Traceable prioritization:** expose “why this score” explanations to users.
- **Incremental delivery:** scaffold first, then layer Prisma schema, auth, and endpoint coverage.
- **Operational simplicity:** avoid background workers initially; recompute during relevant requests.

## Bootstrap status

This bootstrap establishes:
- a runnable Next.js scaffold under `src/`,
- placeholder pages (`/`, `/login`, `/today`),
- a health API route,
- starter scoring helpers and UI primitives,
- core documentation and local run instructions.

Next implementation slices should add Prisma schema/migrations, Auth.js wiring, full route coverage from the plan, and Playwright smoke tests.
