# Session Log

A running log of work sessions — what was worked on, what was decided, what changed. Append at the end of each session.

---

## 2026-03-28

**Focus:** Project memory pattern established.

- Created `memory/` structure: `session-log.md`, `decisions.md`, `current-state.md`, `scratchpad.md`
- Added `## Project Memory` section to `CLAUDE.md` with agent maintenance instructions
- Project is in active MVP state: FocusOS capture → triage → score → plan → focus loop is implemented and passing E2E tests

---

## 2026-03-29

**Focus:** Tooling, documentation, and brand infrastructure — no SecondBrain app code changed.

### Dictation App
- Added audio feedback tones to `dictation-app/recorder.html`: ascending two-tone (600→900 Hz) on mic open, descending two-tone (700→440 Hz) on stop; silent on discard
- Created `dictation-app/changelog.html` — full NWS Digital branded release history (v1.0.0, tray icons polish, audio feedback feature)

### Claude Configuration
- Created `C:/Users/pat/.claude/CLAUDE.md` (global user-level) — establishes NWS Digital brand standards for all internal HTML reports across every project (fonts, palette, layout patterns, badges, code snippets, HTML entities)
- Created `D:/Projects/SecondBrain/CLAUDE.md` (project-level) — documents commands, stack constraints, scoring engine, plan generation, API patterns, frontend conventions, and testing setup
- Noted: `~/.claude/` directory cannot be relocated natively; workaround is a Windows directory junction (`mklink /J`)

### northwoods-brand Skill
- Built and packaged `northwoods-brand.skill` — applies full NWS Digital brand system to HTML documents
- Skill installed as `anthropic-skills:northwoods-brand`; `.skill` file on Desktop at `D:/Users/pat/Desktop/northwoods-brand.skill`
- Evals: with-skill 8/8 brand assertions pass; without-skill 1/8
- Key finding: global CLAUDE.md causes even baseline Claude to attempt brand styling — skill's value is the complete CSS template, exact pixel values, and CSS custom property definitions

---
