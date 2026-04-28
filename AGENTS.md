# Agent Instructions

## Mission
- Build AetherStudy as a premium deep-work product.
- Prioritize calm, high-end UX over feature noise.
- Protect focus mode: minimal UI, zero unnecessary motion, fast task access.

## Current State
- Repo is greenfield.
- Start with planning, architecture, design system, and task decomposition before app scaffolding.

## Source Of Truth
- Product: `.agents/context/product.md`
- UX rules: `.agents/context/ux-principles.md`
- Design system: `.agents/context/design-system.md`
- Tech decisions: `.agents/context/tech-stack.md`
- Workflow: `.agents/context/workflow.md`
- Active plan: `aetherstudy-website-plan.md`
- Task registry: `.agents/tasks/task-board.md`

## Communication
- New work: claim a task in `.agents/tasks/task-board.md`
- Decisions: log in `.agents/comms/decisions.md`
- Handoffs: log in `.agents/comms/handoffs.md`
- Blockers or requests: log in `.agents/comms/inbox.md`

## Working Rules
- Read relevant context files before editing.
- Update task status and handoff notes in the same change set as the work.
- Do not introduce distracting UI patterns that conflict with focus mode.
- Optimize for convenience: low friction navigation, fast capture, clear defaults.

## Package Manager
- Not initialized yet. Do not invent app commands until scaffold exists.

## File-Scoped Commands
| Task | Command |
|------|---------|
| List files | `rg --files` |
| Find text | `rg "pattern" .` |

## Commit Attribution
- AI commits MUST include:
```text
Co-Authored-By: Codex <noreply@openai.com>
```
