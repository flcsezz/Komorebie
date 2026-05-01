# Komorebie Production Plan

## Goal
- Turn the current prototype into a production-ready deep-work product without drifting into a generic productivity suite.
- Preserve the hard constraint: focus mode stays minimal and isolated.

## Current Reality
- The existing UI shows more product surface area than the product model supports.
- `Dashboard`, `Schedule`, `Deadlines`, `Calendar`, `Customize`, `Music`, `Background`, `Leaderboard`, and `Friends` are partly placeholders today.
- Production planning should consolidate these into a smaller set of coherent systems.

## Product Shape

### What Komorebie Is
- A premium focus sanctuary with fast task capture, calm session execution, useful review, and optional AI study support.

### What Komorebie Is Not
- Not a full project-management tool
- Not a heavy calendar platform
- Not a chat-centric social network
- Not a broad habit tracker

## Production Feature Stack

### 1. Sanctuary Home
- Route: `/app`
- Purpose: returning-user launchpad for starting work in under 10 seconds
- Contains:
  - quick start CTA
  - today's task queue
  - current streak and weekly focus summary
  - lightweight schedule preview
  - subtle room/ambience context
- Must not contain:
  - dense analytics
  - noisy community feed
  - deep settings panels

### 2. Task System
- Routes:
  - `/app/tasks`
- Purpose: define what the user is working on now, next, and later
- Entities:
  - inbox task
  - today task
  - active task
  - completed task
- Production rules:
  - tasks are lightweight and session-oriented
  - no complex dependencies, boards, or team workflows
  - one task can be attached to a focus session

### 3. Schedule System
- Routes:
  - MVP: embedded in `/app` and `/app/tasks`
  - Later: `/app/schedule`
- Purpose: help users place focus blocks, not manage their entire life
- Scope:
  - focus block planning
  - deadline reminders
  - upcoming commitments relevant to study/work
- Exclusions:
  - full calendar replacement
  - recurring rule engine at launch
  - external calendar sync at launch

### 4. Focus Setup
- Route: `/app/focus`
- Purpose: confirm task, duration, ambience, and start with one primary action
- Inputs:
  - selected task
  - session length presets
  - optional label
  - ambience preset
- Rule:
  - setup must stay faster than the active dashboard experience

### 5. Active Focus Session
- Route: `/app/focus/session`
- Purpose: full-screen deep-work state
- Visible:
  - timer
  - task label
  - pause/resume
  - end session
  - minimal ambience controls
- Hidden:
  - side nav
  - analytics widgets
  - leaderboards
  - friend details
  - customization panels

### 6. Session Summary And Analytics
- Routes:
  - `/app/analytics`
- Purpose: show reflection and rhythm, not vanity metrics
- MVP scope:
  - session completion summary
  - daily/weekly focus totals
  - consistency streaks
  - best focus windows
- Later scope:
  - deeper trend breakdowns
  - coaching recommendations

### 7. Notes And Flashcards
- Routes:
  - `/app/notes`
  - `/app/notes/:noteId`
  - `/app/flashcards`
  - `/app/flashcards/:deckId`
- Purpose: support study workflows that naturally lead into focus sessions
- Core loop:
  - upload or write notes
  - generate summary
  - generate flashcards
  - launch study or focus session
- Constraint:
  - these are secondary to focus, not the first-screen experience

### 8. Room And Ambience
- Routes:
  - `/app/room`
- Purpose: house customization, background selection, soundscape, and companion progression
- Consolidates:
  - `Customize`
  - `Music`
  - `Background`
- Production rule:
  - ambience controls are split between rich setup here and minimal controls in focus mode

### 9. Social Layer
- Routes:
  - `/app/social`
- Purpose: ambient motivation without interrupting focus
- Consolidates:
  - `Leaderboard`
  - `Friends`
- MVP scope:
  - leaderboard
  - presence status
  - quiet friend list
- Exclusions:
  - chat
  - public feed
  - notifications in focus mode

### 10. Settings
- Routes:
  - `/app/settings`
- Purpose: account, notifications, privacy, focus defaults, and accessibility
- Production rule:
  - settings absorb configuration that should not live in primary nav

## Navigation Decision

### Primary App Nav
- Sanctuary
- Focus
- Tasks
- Notes
- Flashcards
- Analytics
- Room
- Social

### Secondary Nav
- Settings
- Premium
- Support

### Remove From Primary Navigation
- Calendar
- Customize
- Music
- Background
- Leaderboard
- Friends

## MVP Scope

### Must Ship
- auth and profile basics
- sanctuary home
- task capture and task list
- focus setup
- active focus session
- session completion summary
- core analytics
- notes library
- flashcard library
- room page with ambience presets
- settings

### Should Ship If Stable
- lightweight schedule preview
- deadline reminders
- social page with passive leaderboard and friend presence
- premium upsell entry points

### Hold Until Post-MVP
- external calendar sync
- advanced recurrence
- rich companion economy
- live co-focus sessions
- real-time chat
- broad gamification overlays

## Data Model Outline

### Core Tables
- `users`
- `user_preferences`
- `tasks`
- `task_schedule_blocks`
- `sessions`
- `session_events`
- `notes`
- `note_summaries`
- `flashcard_decks`
- `flashcards`
- `rooms`
- `ambience_presets`
- `friendships`
- `presence_events`

### Key Relationships
- one user has many tasks
- one task has many sessions
- one session may reference one task
- one note may produce many flashcards through one or more decks
- one user has one room state and many ambience presets

## Service Boundaries

### Frontend
- route separation between sanctuary, focus, and supporting library pages
- strict layout split so focus mode never inherits app-shell clutter

### Backend
- auth
- CRUD for tasks, sessions, notes, decks
- presence and leaderboard service kept separate from focus timer logic

### AI
- note summary generation
- flashcard generation
- optional post-session coaching after analytics stabilizes

## Rollout Plan

### Phase 1: Product Backbone
- finalize route map
- consolidate nav labels
- remove placeholder-only surfaces
- define backend schema and API contracts

### Phase 2: Core Focus MVP
- ship task capture
- ship focus setup and active session
- persist sessions and summaries
- ship basic analytics

### Phase 3: Study Support
- notes library
- note detail
- flashcard generation and deck review

### Phase 4: Sanctuary Depth
- room customization
- ambience presets
- initial progression loop

### Phase 5: Ambient Social
- friend presence
- leaderboard
- premium social cosmetics if they remain quiet

## Production Risks
- route and nav sprawl can dilute the core value proposition
- social features can easily violate focus mode if not isolated
- scheduling can become a full calendar product unless scope is capped
- AI features can feel ornamental unless tied to clear user actions
- 3D and motion can damage performance if mounted by default everywhere

## Immediate Execution Priorities
1. Refactor the current sidebar and route language to match the production feature stack.
2. Define the backend schema for tasks, sessions, notes, flashcards, room state, and presence.
3. Design the exact task capture -> focus setup -> active session -> summary loop.
4. Convert schedule and deadlines into a lightweight focus-planning system instead of a full calendar.
5. Keep social and ambience as separate, optional layers outside the core focus loop.
