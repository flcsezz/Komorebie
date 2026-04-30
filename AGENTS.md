# Agent Instructions

## Mission
- Build `Komorebie` as a premium deep-work product.
- Optimize for calm, convenience, and focus.
- Focus mode is a hard constraint: no unnecessary UI, motion, or social noise.

## First Read
1. `.agents/context/product.md`
2. `.agents/context/design-system.md`
3. `.agents/context/information-architecture.md`
4. `.agents/context/user-flows.md`
5. `.agents/tasks/task-board.md`
6. `.agents/comms/decisions.md`

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
- 3D environment: `komorebie-app/src/components/three/ZenEnvironment.tsx`
- Styling foundation: `komorebie-app/src/index.css`

## Source Of Truth
- Product: `.agents/context/product.md`
- Design system: `.agents/context/design-system.md`
- IA and routes: `.agents/context/information-architecture.md`
- User flows: `.agents/context/user-flows.md`
- Workflow: `.agents/context/workflow.md`
- Active tasks: `.agents/tasks/task-board.md`
- Detailed tickets: `.agents/tasks/agent-tickets.md`
- Known issues: `komorebie-bug-review.md`

## Working Rules
- Claim work in `.agents/tasks/task-board.md` before major changes
- Read the relevant context docs before editing code
- Match the `Zen System`: calm, minimalist, restorative
- Prefer low-friction flows over clever UI
- Keep focus mode isolated from navigation, analytics, companion, and social surfaces
- Do not introduce naming drift; use `Komorebie` unless the user renames the product

## Documents To Update
- Update `.agents/tasks/task-board.md` when claiming, blocking, or finishing work
- Update `.agents/comms/decisions.md` when architecture, UX, or scope decisions change
- Update `.agents/comms/handoffs.md` when you stop with incomplete work
- Update `.agents/context/information-architecture.md` if routes or page purpose change
- Update `.agents/context/user-flows.md` if user journeys change
- Update `komorebie-bug-review.md` when you find or fix important bugs

## Commands
- Install deps: `npm install` in `komorebie-app/`
- Dev server: `npm run dev`
- Build: `npm run build`
- Lint: `npm run lint`
- List files: `rg --files`
- Find text: `rg "pattern" komorebie-app/src`

## File-Scoped Commands
| Task | Command |
|------|---------|
| Lint repo app | `cd komorebie-app && npm run lint` |
| Build repo app | `cd komorebie-app && npm run build` |
| Read routes | `sed -n '1,220p' komorebie-app/src/App.tsx` |
| Find page references | `rg "LandingPage|TaskCapture|FocusSession|FlowAnalytics" komorebie-app/src` |

## Current Priorities
- Finish sitemap and route skeleton
- Audit current UI against Zen System and focus constraints
- Fix prototype bugs before adding many new surfaces
- Reduce initial bundle cost by lazy-loading routes and 3D where possible

## Commit Attribution
- AI commits MUST include:
```text
Co-Authored-By: Codex <noreply@openai.com>
```
