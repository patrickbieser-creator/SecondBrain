# Current State

The live status of in-progress work. Update whenever state changes significantly.

_Last updated: 2026-03-28_

---

## What's Implemented

### Core Loop
- [x] Inbox capture (POST /api/inbox)
- [x] Triage form (/inbox/[id]) → converts inbox item to task
- [x] Scoring engine (src/lib/scoring/) — deterministic, 0–100
- [x] Recompute endpoint (POST /api/scoring/recompute)
- [x] Plan generation (Must/Should/Could buckets, 10min cache)
- [x] /today page — NOW/NEXT lists, plan panel, inbox preview, "+ New Task" dialog
- [x] Focus timer (/focus?taskId=) — fullscreen, pause/resume, mark done
- [x] /tasks/[id] — full edit, live score card, snooze, complete
- [x] /projects and /projects/[id]
- [x] /settings — available minutes, deep work default

### Infrastructure
- [x] Prisma 5.22 + SQLite dev.db
- [x] 15-model schema (User, Domain, Project, Task, InboxItem, DailyPlan, FocusSession, ScoringRun, etc.)
- [x] TEST_AUTH bypass (no real auth in dev)
- [x] Playwright E2E — 3 suites passing (inbox, today, focus)

### Electron Apps
- [x] Dictation app (Whisper + Claude, system tray, dictation pill)
- [x] Capture app (voice capture → inbox)

---

## What's Pending / In Progress

- [ ] Real authentication (NextAuth wired up, OAuth provider)
- [ ] Production deployment (Neon Postgres, Vercel or similar)
- [ ] Recurring tasks
- [ ] Weekly review flow
- [ ] Notifications / reminders

---

## Blocked

_Nothing currently blocked._

---
