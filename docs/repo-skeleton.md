# Proposed repository skeleton

This skeleton follows the Next.js + TypeScript stack defined in `Plans.md` and keeps MVP concerns separated for iterative implementation.

```text
.
├── docs/
│   ├── architecture.md
│   └── repo-skeleton.md
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── health/route.ts
│   │   ├── login/page.tsx
│   │   ├── today/page.tsx
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   └── common/ScoreBadge.tsx
│   ├── lib/
│   │   ├── constants.ts
│   │   └── scoring.ts
│   └── styles/
│       └── tokens.css
├── package.json
├── tsconfig.json
├── next.config.mjs
├── postcss.config.mjs
└── .gitignore
```

## Why this shape

- `src/app`: App Router pages and route handlers.
- `src/components`: reusable UI components.
- `src/lib`: business logic, constants, and scoring helpers.
- `docs`: living architecture and planning notes.

This gives a minimal but production-aligned starting point before adding Prisma, Auth.js, and full route/page coverage from the plan.
