# Komorebie Agent Workspace

## Purpose
- Keep agent collaboration structured, low-noise, and resumable.

## Core Rules for Hallucination Reduction
1. **Never guess the state:** Always run `git log` and read `.agents/progress-log.json` on session start.
2. **Never lie about completion:** Features MUST be tested end-to-end against the real application or Supabase before marking them done.
3. **Never break the schema:** `.agents/tasks.json` and `.agents/progress-log.json` are strict JSON files. Do not modify the structure, only append to the log or update the `passes` boolean on a task.
4. **Git is Ground Truth:** Every finished task must have an accompanying commit.

## Directories & Files
- `tasks.json`: The single source of truth for pending work.
- `progress-log.json`: The append-only log of completed work.
- `CURRENT_SESSION.md`: Wiped and rewritten at the start of every session to narrow focus.
- `context/`: stable source-of-truth docs
- `comms/`: decisions, handoffs, blockers, coordination notes

## Expected Loop
1. Establish Context: `git log --oneline -20`
2. Read `.agents/tasks.json` and find the highest priority task where `passes: false`.
3. Wipe and write `.agents/CURRENT_SESSION.md` to declare current focus.
4. Read the relevant files in `context/` for specific requirements.
5. Do the work and test it thoroughly.
6. Commit changes to Git.
7. Update `tasks.json` (`passes: true`) and append to `progress-log.json`.
8. Record decisions or blockers in `comms/` if needed.
