# Agent Instructions

## Session Startup Ritual (MANDATORY)
EVERY single session MUST start with the following sequence before any other action:
1. Check pwd and run `git log --oneline -20` to establish ground truth of recent commits.
2. Read `.agents/CURRENT_SESSION.md` (if it exists) to understand the current session's goal.
3. Read `.agents/progress-log.json` to see what was just completed.
4. Read `.agents/tasks.json` to find the highest-priority incomplete task (`"passes": false`). Do NOT edit or remove tasks, only update `passes` to `true` when verified.
5. If `.agents/CURRENT_SESSION.md` does not exist or is empty, the initializer agent must wipe it and write the immediate focus for the current session based on the highest priority task.

## Mission
- Build `Komorebie` as a premium deep-work product.
- Optimize for calm, convenience, and focus.
- Focus mode is a hard constraint: no unnecessary UI, motion, or social noise.

## Core Directives for Hallucination Reduction
1. **Git as Ground Truth:** Commit after every meaningful change. If a commit doesn't exist for a task, the feature wasn't done.
2. **Test Before Marking Done:** Never claim success without verification. Test the feature end-to-end (e.g., hit the actual Supabase endpoint and check the response, or verify the UI component renders without errors) before marking a task as done.
3. **Narrow Task Scope:** Focus on ONE feature or task per session.
4. **Structured Output:** Update `.agents/tasks.json` (set `"passes": true`) and append to `.agents/progress-log.json` instead of writing free-form progress text. DO NOT alter the JSON schema or remove tasks.

## Project Reality
- Real app lives in `komorebie-app/`
- Stack is `Vite + React 19 + React Router + TypeScript + Tailwind v4 + Framer Motion + R3F`
- Do **not** plan or scaffold against Next.js unless the user explicitly approves a migration
- Main route backbone is `komorebie-app/src/App.tsx`

## Where To Look First
- Routes: `komorebie-app/src/App.tsx`
- App shell: `komorebie-app/src/components/layout/AppLayout.tsx`
- Marketing page: `komorebie-app/src/pages/LandingPage.tsx`
- Main app entry: `komorebie-app/src/pages/TaskCapture.tsx`
- Focus mode: `komorebie-app/src/pages/FocusSession.tsx`
- Analytics prototype: `komorebie-app/src/pages/FlowAnalytics.tsx`

## Source Of Truth
- High Level Goals: `PLAN.md`
- Active Tasks: `.agents/tasks.json`
- Progress Log: `.agents/progress-log.json`
- Product/Design/IA: `.agents/context/` directory files

## Commit Attribution
- AI commits MUST include:
```text
Co-Authored-By: Codex <noreply@openai.com>
```