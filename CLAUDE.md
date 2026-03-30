# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Dev
npm run dev               # Next.js dev server at :3000 (reads .env.local)
npm run build             # Production build
npm run lint              # ESLint

# Database
npm run db:migrate        # Run Prisma migrations
npm run db:seed           # Seed test user + 7 domains + 3 sample tasks
npm run db:studio         # Prisma Studio GUI

# Tests
npm test                  # Playwright E2E (auto-starts dev server)
npm run test:ui           # Playwright UI mode
npm run test:headed       # Headed browser
npx playwright test tests/today.spec.ts   # Run a single test file
```

`.env.local` for local dev:
```
DATABASE_URL="file:./dev.db"
TEST_AUTH=true
TEST_USER_ID="test-user-id-0000"
NEXTAUTH_SECRET="dev-secret"
NEXTAUTH_URL="http://localhost:3000"
```

## Architecture

**SecondBrain** implements a capture → triage → score → plan → focus workflow. The core loop: inbox items get triaged into tasks, tasks are scored by a deterministic algorithm, scored tasks populate a daily plan (Must/Should/Could buckets), and the user works through them in focus sessions.

### Stack Constraints
- **Tailwind v4**: Uses `@import "tailwindcss"` in CSS, not `@tailwind` directives
- **Prisma 5.22**: Pinned — do not upgrade (Prisma 7 broke SQLite URL syntax)
- **shadcn/ui**: Uses `radix-ui` (single package), not individual `@radix-ui/react-*` packages
- **npm**: `legacy-peer-deps=true` in `.npmrc` due to eslint version conflict — always use `npm install`, never `yarn` or `pnpm`
- **Auth**: `next-auth@beta` is installed but NOT wired up. `getSession()` in `src/lib/auth.ts` returns `{ userId }` via `TEST_AUTH` env bypass. Every API route must call `getSession()` and filter all DB queries by `userId`.

### Data Model Key Points
- **Enums are strings** (SQLite has no native enums): Task statuses (`NEXT`, `IN_PROGRESS`, `WAITING`, `SOMEDAY`, `DONE`), energy levels (`LOW`, `MED`, `HIGH`), etc.
- **JSON fields stored as text**: `InboxItem.aiSuggestionsJson`, `ScoringRun.scoreComponents`, `DailyPlan.planJson` — parse/stringify manually.
- **Soft deletes only**: No delete endpoints exist; status transitions (e.g., → `DONE`, → `ARCHIVED`) are preferred.
- **UUIDs everywhere**: All IDs via `@default(uuid())`.

### Scoring Engine (`src/lib/scoring/`)
The priority score (0–100) is fully deterministic — no AI involved. Inputs: `impact`, `urgency`, `strategicValue`, `riskOfDelay`, `isBlocker` (weighted 30/25/20/15/10). Modifiers: deadline pressure (exponential decay), effort fit (inverse logistics), momentum (linear decay from `lastTouchedAt`), staleness boost (+0.15 after 30 days), context penalties for domain switches, and a ×0.4 multiplier for unresolved dependencies. Tasks with status `WAITING`/`SOMEDAY`/`DONE` or active snooze always score 0.

`recompute()` scores all `NEXT`/`IN_PROGRESS` tasks, persists `ScoringRun` records (audit trail), and returns top-3 (NOW) and top-10 (NEXT).

### Plan Generation (`src/lib/plans/generatePlan.ts`)
Reuses scores within a 10-minute window to avoid redundant recomputes. Allocates tasks to buckets: Must = 60% of available minutes, Should = 30%, Could = remainder. Groups same-domain tasks together to minimize context switching. Upserts `DailyPlan` keyed on today's date (America/Chicago timezone).

### API Route Pattern
All routes in `src/app/api/` follow this pattern — always guard with session and scope by userId:
```typescript
export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return unauthorized();
  const data = await prisma.model.findMany({ where: { userId: session.userId } });
  return ok(data);
}
```
Response helpers (`ok`, `unauthorized`, `notFound`, `badRequest`) are in `src/lib/api.ts`. Validation failures return `badRequest()`; no Zod schemas on API layer yet.

### Frontend Conventions
- `src/lib/utils.ts` exports `cn()` (clsx + tailwind-merge) — always use for className construction
- `src/lib/utils/time.ts` exports `today()`, `daysSince()`, `daysUntil()` — use these instead of raw `Date` math
- Toasts via `sonner` — import `toast` from `"sonner"`
- Score display uses `<ScoreBadge>` and `<WhyPopover>` from `src/components/common/`
- Domain color labels use `<DomainPill>` from `src/components/common/`

### Testing
Playwright tests run sequentially (single worker), Chrome only, against `localhost:3000`. Tests use `TEST_AUTH=true` — no login flow required. When adding tests, follow the pattern in `tests/today.spec.ts`: navigate to page, interact via accessible roles/labels, assert visible outcomes.

## Project Memory

The `memory/` folder holds four living documents. Read them at the start of any session; update them as work progresses.

| File | Purpose | When to update |
|------|---------|---------------|
| `memory/session-log.md` | Running log of sessions — what was worked on, decided, changed | Append a dated entry at the end of every session |
| `memory/decisions.md` | Architecture decisions, trade-offs, paths rejected and why | When a non-obvious choice is made or reversed |
| `memory/current-state.md` | What's implemented, pending, and blocked | Whenever implementation state changes significantly |
| `memory/scratchpad.md` | Active working notes, explorations, hypotheses | Use freely during a session; clear when work wraps up |

**Rules:**
- Always read `current-state.md` and `session-log.md` before starting work so you have context without asking.
- Append to `session-log.md` — never overwrite prior entries.
- `scratchpad.md` is ephemeral; archive or clear it at session end.
- Keep entries concise — these files are scanned, not read cover-to-cover.
