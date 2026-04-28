# Workflow

## Operating Model
- Context first
- Plan before implementation
- Small parallel tasks with explicit ownership

## Agent Workflow
1. Read relevant files in `.agents/context/`
2. Claim a task in `.agents/tasks/task-board.md`
3. Record any new decision in `.agents/comms/decisions.md`
4. Leave a handoff in `.agents/comms/handoffs.md` when stopping

## Task Ownership
- One owner per task at a time
- Update status as `todo`, `doing`, `blocked`, or `done`
- If blocked, log the blocker and next required input

## Documentation Discipline
- Update context docs when requirements materially change
- Keep task notes short and operational
- Prefer append-only coordination logs

## Quality Gates
- No implementation should violate focus mode principles
- Design decisions must be tested against both premium feel and convenience
- New work should identify desktop and mobile implications
