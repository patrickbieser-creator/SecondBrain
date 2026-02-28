CODEX BUILD SPEC — FocusOS (Web App)
Owner: Patrick
Goal: Build a web app that captures tasks fast, triages into structured work, computes a transparent priority score, and generates a daily plan + single-thread focus mode.

===========================================================
0) STACK + ASSUMPTIONS
===========================================================
- Framework: Next.js 14+ (App Router) + TypeScript
- UI: TailwindCSS + shadcn/ui + lucide-react
- Auth: NextAuth (Auth.js) with Email magic link (SMTP) + optional Google provider
- DB: Postgres
- ORM: Prisma
- Validation: zod
- Testing: Playwright (smoke tests)
- Hosting: Vercel + Neon (Postgres)
- NOTE: Keep AI optional for MVP. Scoring is deterministic code. AI suggestion fields are stored but not required.

===========================================================
1) PROJECT STRUCTURE
===========================================================
Create a new Next.js app:
- `npx create-next-app@latest focusos --ts --eslint --tailwind --app`
- Install deps:
  - prisma, @prisma/client
  - next-auth
  - zod
  - date-fns
  - @radix-ui/react-* (via shadcn)
  - lucide-react
  - playwright

Folder layout:

/app
  /api
    /auth/[...nextauth]/route.ts
    /domains/route.ts
    /projects/route.ts
    /inbox/route.ts
    /inbox/[id]/triage/route.ts
    /tasks/route.ts
    /tasks/[id]/route.ts
    /tasks/[id]/complete/route.ts
    /tasks/[id]/snooze/route.ts
    /tasks/[id]/split/route.ts
    /scoring/recompute/route.ts
    /plans/today/route.ts
    /plans/generate/route.ts
    /focus/start/route.ts
    /focus/stop/route.ts

  /(app)
    /today/page.tsx
    /inbox/page.tsx
    /inbox/[id]/page.tsx
    /tasks/[id]/page.tsx
    /projects/page.tsx
    /projects/[id]/page.tsx
    /domains/[id]/page.tsx
    /focus/page.tsx
    /settings/page.tsx
  /layout.tsx
  /page.tsx   (redirect to /today if authed)
  /login/page.tsx

/components
  /nav/AppNav.tsx
  /today/NowList.tsx
  /today/NextList.tsx
  /today/InboxPreview.tsx
  /today/DailyPlanPanel.tsx
  /inbox/InboxList.tsx
  /inbox/TriageForm.tsx
  /tasks/TaskCard.tsx
  /tasks/TaskDetail.tsx
  /focus/FocusTask.tsx
  /common/ScoreBadge.tsx
  /common/WhyPopover.tsx
  /common/DomainPill.tsx

/lib
  /auth.ts
  /db.ts
  /zod.ts
  /scoring/scoreTask.ts
  /scoring/explainScore.ts
  /scoring/recompute.ts
  /plans/generatePlan.ts
  /utils/time.ts
  /utils/constants.ts

/prisma
  schema.prisma
  seed.ts

/tests
  today.spec.ts
  inbox.spec.ts
  focus.spec.ts

===========================================================
2) ENV VARS
===========================================================
Create .env.local:

DATABASE_URL="postgresql://..."
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="..."

# Email provider for magic link
EMAIL_SERVER_HOST="smtp.example.com"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="user"
EMAIL_SERVER_PASSWORD="pass"
EMAIL_FROM="FocusOS <noreply@example.com>"

# Optional Google
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

===========================================================
3) PRISMA SCHEMA (AUTHORITATIVE)
===========================================================
Implement this as prisma/schema.prisma (use uuid ids; timestamptz via DateTime):

- Enums:
  DomainStatus: ACTIVE, ARCHIVED
  ProjectStatus: ACTIVE, PAUSED, DONE
  InboxStatus: UNPROCESSED, TRIAGED, DISCARDED
  InboxSource: MANUAL, EMAIL, VOICE, IMPORT
  TaskStatus: NEXT, IN_PROGRESS, WAITING, SOMEDAY, DONE
  Energy: LOW, MED, HIGH
  FocusMode: SINGLE_THREAD, POMODORO, OPEN

- Models (all scoped by userId):

User
  id uuid pk
  email unique
  name?
  createdAt

UserSettings
  id uuid pk
  userId unique fk
  currentDomainId? fk -> Domain
  deepWorkEnabled boolean default false
  defaultAvailableMinutes int default 240
  createdAt, updatedAt

Domain
  id uuid pk
  userId fk
  name
  color?
  sortOrder int default 0
  status DomainStatus default ACTIVE
  createdAt, updatedAt
  unique(userId, name)

Project
  id uuid pk
  userId fk
  domainId fk
  name
  description?
  status ProjectStatus default ACTIVE
  deadlineAt?
  createdAt, updatedAt
  index(userId, domainId, status)

InboxItem
  id uuid pk
  userId fk
  source InboxSource
  rawText
  capturedAt default now
  status InboxStatus default UNPROCESSED
  aiSuggestedDomainId?
  aiSuggestedType? (string)
  aiSuggestionsJson? Json
  triagedToTaskId?
  triagedToProjectId?
  index(userId, status, capturedAt desc)

Task
  id uuid pk
  userId fk
  domainId fk
  projectId?
  parentTaskId?
  title
  description?
  status TaskStatus default NEXT
  deadlineAt?
  scheduledFor? Date
  snoozedUntil?
  effortMinutes? int
  energyRequired Energy default MED
  impact int default 3   # 1..5
  urgency int default 3  # 1..5
  strategicValue int default 0 # 0..5
  riskOfDelay int default 0 # 0..5
  isBlocker boolean default false
  lastTouchedAt?
  completedAt?
  createdAt, updatedAt
  index(userId, status, domainId)
  index(userId, projectId, status)
  index(userId, deadlineAt)
  index(userId, snoozedUntil)

TaskDependency
  id uuid pk
  userId fk
  taskId fk -> Task
  dependsOnTaskId fk -> Task
  unique(taskId, dependsOnTaskId)
  index(userId, taskId)

Tag
  id uuid pk
  userId fk
  name
  unique(userId, name)

TaskTag
  id uuid pk
  userId fk
  taskId fk
  tagId fk
  unique(taskId, tagId)

ScoringRun
  id uuid pk
  userId fk
  taskId fk
  scoredAt default now
  priorityScore float
  scoreComponents Json
  explanation string
  context Json
  index(userId, scoredAt desc)
  index(taskId, scoredAt desc)

DailyPlan
  id uuid pk
  userId fk
  planDate Date
  generatedAt default now
  inputsJson Json
  planJson Json
  notes?
  unique(userId, planDate)

FocusSession
  id uuid pk
  userId fk
  taskId?
  startedAt default now
  endedAt?
  durationSeconds?
  mode FocusMode default SINGLE_THREAD
  outcome?
  index(userId, startedAt desc)

ActivityLog
  id uuid pk
  userId fk
  occurredAt default now
  entityType string
  entityId string
  action string
  detailJson Json
  index(userId, occurredAt desc)

===========================================================
4) AUTH REQUIREMENTS
===========================================================
- Protect all /(app) routes with middleware or server-side check:
  - If no session -> redirect /login
- /login page:
  - email magic link form
  - optional Google button if configured
- After login:
  - ensure UserSettings row exists
  - if no Domains exist, seed standard domains (see seed section)

===========================================================
5) SCORING ALGORITHM (DETERMINISTIC)
===========================================================
Implement /lib/scoring/scoreTask.ts:
Input: task + context
Context fields:
  currentDomainId?: string
  deepWork?: boolean
  now: Date
Output:
  { priorityScore: number (0..100),
    components: {base, deadlinePressure, effortFit, momentum, staleness, switchPenalty, blockedCapApplied},
    explanation: string
  }

Rules:
- If task.status in WAITING, SOMEDAY, DONE => score=0
- If snoozedUntil exists and snoozedUntil > now => score=0
- If task has unresolved dependencies (any TaskDependency where dependsOnTask.status != DONE):
    apply cap: score *= 0.4 and flag blockedCapApplied=true

Compute (normalize):
I=impact/5, U=urgency/5, S=strategicValue/5, R=riskOfDelay/5, B=isBlocker?1:0
base = 0.30*I + 0.25*U + 0.20*S + 0.15*R + 0.10*B

Deadline pressure:
- if no deadline => 0
- else d = daysUntilDeadline (overdue => 0)
deadlinePressure = clamp(exp(-d/4), 0, 1)
If overdue, treat deadlinePressure=1

Effort fit:
t = effortMinutes ?? 60
effortFit = 1 / (1 + (t/90))

Momentum:
rt = daysSince(lastTouchedAt ?? createdAt)
momentum = clamp(1 - (rt/7), 0, 1)

Staleness:
age = daysSince(createdAt)
staleness = clamp(age/30, 0, 1) * 0.15

Switch penalty:
if no currentDomainId => 0
else if task.domainId != currentDomainId:
  penalty = deepWork ? 0.25 : 0.15
  if effortMinutes != null && effortMinutes <= 10: penalty = deepWork ? 0.10 : 0.05
else penalty = 0

Final:
score01 =
  base
  + 0.35*deadlinePressure
  + 0.20*effortFit
  + 0.10*momentum
  + staleness
  - switchPenalty

priorityScore = round(100 * clamp(score01,0,1))

Explanation string:
Return a concise breakdown, e.g.
"92: deadline (+0.31), impact/urgency (+0.41), effort-fit (+0.12), momentum (+0.06), switch (0.00)"

===========================================================
6) ENDPOINTS (IMPLEMENT AS NEXT ROUTE HANDLERS)
===========================================================

6.1 Domains
GET /api/domains
- returns domains for user ordered by sortOrder, name

POST /api/domains
- body: { name, color?, sortOrder? }
- create; unique per user

6.2 Projects
GET /api/projects?domainId=
POST /api/projects
- body { domainId, name, description?, deadlineAt?, status? }

6.3 Inbox
GET /api/inbox?status=UNPROCESSED|TRIAGED|DISCARDED&limit=50
POST /api/inbox
- body { rawText, source="MANUAL" }
- create UNPROCESSED

6.4 Inbox triage
POST /api/inbox/:id/triage
Body:
{
  type: "TASK"|"PROJECT"|"NOTE"|"SOMEDAY",
  task?: {
    title, description?, domainId, projectId?, effortMinutes?, energyRequired?,
    deadlineAt?, impact?, urgency?, strategicValue?, riskOfDelay?, isBlocker?,
    tags?: string[]
  },
  project?: { domainId, name, description?, deadlineAt? }
}
Behavior:
- If TASK: create Task, create tags if needed, link TaskTag, set inbox status TRIAGED, triagedToTaskId
- If PROJECT: create Project, set inbox TRIAGED, triagedToProjectId
- If NOTE/SOMEDAY: For MVP store as Task with status SOMEDAY OR store as InboxItem with status TRIAGED and aiSuggestedType="NOTE" (choose SOMEDAY Task for usability)
- Write ActivityLog: action TRIAGE, detailJson includes created ids

6.5 Tasks
GET /api/tasks
Query:
  status?, domainId?, projectId?, limit?
- return tasks; default exclude DONE
POST /api/tasks
PATCH /api/tasks/:id
- update fields; set lastTouchedAt=now on meaningful edits

POST /api/tasks/:id/complete
- set status DONE, completedAt=now, lastTouchedAt=now

POST /api/tasks/:id/snooze
- body { until: ISO string }
- set snoozedUntil

POST /api/tasks/:id/split
- body { subtasks: [{title, effortMinutes?, energyRequired?, ...}] }
- create new tasks with parentTaskId = :id
- optional: set parent task status WAITING or keep NEXT (leave NEXT)

6.6 Scoring
POST /api/scoring/recompute
Body:
{
  scope: "ALL"|"DOMAIN"|"PROJECT",
  domainId?, projectId?,
  context: { currentDomainId?, deepWork? }
}
Behavior:
- Fetch eligible tasks: status in NEXT/IN_PROGRESS, not snoozed active, exclude DONE
- For each task compute score and write ScoringRun
- Return:
  {
    now: top 3 tasks,
    next: top 10 tasks,
    scoredAt
  }
- Include latest explanation per task

6.7 Plans
GET /api/plans/today
- return DailyPlan for planDate=today (user timezone assumed America/Chicago; use server date but store planDate as local date)
POST /api/plans/generate
Body:
{
  availableMinutes?: number (default from UserSettings),
  deepWork?: boolean,
  domainFocusId?: string|null
}
Behavior:
- Recompute scoring (or reuse latest scores from last 10 minutes)
- Select tasks into Must/Should/Could:
  - Must: until 60% of available time, prioritizing deadlinePressure and high scores
  - Should: next 30%
  - Could: final 10%
- Apply batching: prefer same domain consecutively when scores within 5 points
- Save DailyPlan(planDate=today) upsert
- Return planJson

6.8 Focus sessions
POST /api/focus/start
Body { taskId?: string, mode?: "SINGLE_THREAD"|"POMODORO"|"OPEN" }
- create FocusSession startedAt=now
POST /api/focus/stop
Body { sessionId: string, outcome?: string }
- set endedAt, durationSeconds, outcome

===========================================================
7) UI REQUIREMENTS (PAGES)
===========================================================

7.1 /today
- Header: Domain dropdown (All + each domain), Deep Work toggle, Generate Plan button
- NOW list (Top 3):
  - title, score badge, effort minutes, domain pill
  - click -> /focus?taskId=...
  - hover/click “Why” -> popover explanation
- NEXT list (Top 10) similar
- Right panel:
  - Daily plan for today (Must/Should/Could)
  - Inbox preview (top 5 UNPROCESSED) with Triage links
- On page load:
  - call POST /api/scoring/recompute (scope based on domain filter)
  - call GET /api/plans/today

7.2 /inbox
- List UNPROCESSED by capturedAt desc
- “Add” box at top for quick capture -> POST /api/inbox
- Each item row: snippet + capturedAt + [Triage]
- Clicking item -> /inbox/[id]

7.3 /inbox/[id] (Triage)
- Show raw text at top
- Triage form with:
  - Convert to: Task/Project/Someday/Discard
  - For Task: fields with sensible defaults:
      title (required), domain (required), project (optional),
      effortMinutes, energy, deadline,
      impact, urgency, strategic, risk, isBlocker
      tags (comma-separated)
  - Buttons: Save, Save+Next, Discard
- Save triggers POST /api/inbox/:id/triage

7.4 /focus
- If taskId provided: load that task + latest score explanation
- Fullscreen task:
  - Start/Pause/Stop timer
  - “Mark done”
  - “Add note”
  - “Snooze”
  - “Split”
  - Minimal distractions

7.5 /projects and /projects/[id]
- Projects list grouped by domain
- Project detail shows:
  - tasks in project sorted by latest score desc
  - quick add task to project

7.6 /domains/[id]
- Domain workspace view:
  - Active projects
  - Top tasks
  - Quick capture that auto-assigns domain

7.7 /settings
- Set defaultAvailableMinutes
- Choose currentDomainId default (optional)
- Toggle deep work default

===========================================================
8) SEED DATA
===========================================================
Prisma seed script:
- On first login (or via seed):
Create standard domains for the user if none:
  - Northwoods
  - Scouts (Troop 79)
  - Running Group (OMG)
  - Family
  - Personal Admin
  - Finance / Investing
  - Property / Building
Also create UserSettings row.

Implement /prisma/seed.ts and optionally a runtime check in auth callback:
- if user has 0 domains => create these

===========================================================
9) ACCEPTANCE CRITERIA (MVP)
===========================================================
A) Capture:
- From /inbox, add raw text and see it appear immediately.

B) Triage:
- Convert an inbox item to a task with domain and effort.
- Task appears in /today lists after recompute.

C) Scoring:
- Changing deadline or impact changes priorityScore (visible) and explanation changes.
- Snoozed tasks do not appear in NOW/NEXT until snooze expires.

D) Daily plan:
- Generate plan and see Must/Should/Could; it saves and reloads on refresh.

E) Focus:
- Start focus session; stop it; duration persists.

===========================================================
10) TESTS (PLAYWRIGHT SMOKE)
===========================================================
Write 3 tests:
1) inbox.spec.ts
- login (use test auth bypass in dev OR seed a user + use a mock session cookie)
- create inbox item via UI
- assert it appears

2) today.spec.ts
- create a task with deadline tomorrow + high impact
- recompute scoring
- assert it appears in NOW

3) focus.spec.ts
- open /focus?taskId=...
- start timer, wait 1s, stop, assert session created (via UI or API)

(For MVP, allow a TEST_AUTH mode to bypass magic link.)

===========================================================
11) IMPLEMENTATION NOTES (DO NOT SKIP)
===========================================================
- Every route handler must:
  1) get session user
  2) enforce userId filter on all queries
- Any create/update that matters writes ActivityLog.
- Use server-side date helpers; treat "today" as America/Chicago local date:
  - store DailyPlan.planDate as local date string converted to Date (midnight local) or store as Date-only by convention.
- Avoid heavy background jobs: recompute scoring on /today load and on edits.

===========================================================
12) DELIVERABLES
===========================================================
Codex must output:
- Working Next.js app with above routes/pages
- Prisma migrations + seed
- Scoring engine and endpoints
- Basic UI with shadcn components
- Smoke tests + instructions to run locally

===========================================================
13) RUNBOOK
===========================================================
Local dev:
- pnpm install (or npm)
- npx prisma migrate dev
- npx prisma db seed
- npm run dev
- Visit /login -> sign in -> /today

===========================================================
END SPEC
===========================================================