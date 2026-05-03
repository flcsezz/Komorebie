# Agent Tickets

## IA-01 Marketing Sitemap Finalization
- Goal: lock the public marketing information architecture
- Scope:
  - define page inventory
  - define section order for `/`
  - define CTA strategy
- Verify:
  - sitemap is complete
  - each marketing page has a purpose

## IA-02 Authenticated App Route Design
- Goal: define the app shell and focus-mode route structure
- Scope:
  - primary app nav
  - focus-mode isolation
  - deep-link policy for notes, decks, analytics
- Verify:
  - route map exists
  - focus mode has explicit visibility rules

## UX-01 First Session And Quick Start
- Goal: make onboarding and repeat use low-friction
- Scope:
  - first-session flow
  - returning-user quick-start flow
  - defaults and persistence assumptions
- Verify:
  - both flows are documented step by step

## UX-02 Core Study Workflow
- Goal: define task capture, focus session, and completion loop
- Scope:
  - task capture
  - focus setup
  - active session
  - completion summary
- Verify:
  - transition points and CTA hierarchy are documented

## SOCIAL-01: Social Features & Analytics
**Status:** `DONE`
**Assignee:** `Codex`
**Epic:** Phase 6

**Objective:**
Implement friend system, profile viewing, and basic analytics sharing.

**Tasks:**
1.  **Friend System:**
    *   Implement friend request flow (send, accept, reject).
    *   Create friends list view.
2.  **Profile Viewing:**
    *   Create a public profile view for friends.
    *   Display basic stats (total focus time, streaks).
3.  **Real-time Presence:**
    *   Subscribe to `active_timers` via Supabase Realtime to show "Focusing Now" indicators.
    *   Create `AmbientPresence` widget for the dashboard.
4.  **Database:**
    *   Ensure RLS policies secure social data (e.g., `are_friends` function).

**Acceptance Criteria:**
*   Users can send, accept, and reject friend requests.
*   Users can view friends' profiles and basic stats.
*   "Focusing Now" indicator appears when a friend has an active timer.
*   RLS policies restrict data access to friends only.
*   UI matches Zen System aesthetics.

## UI-01 Zen System Translation
- Goal: turn the chosen design language into implementation rules
- Scope:
  - color tokens
  - typography scale
  - glass surfaces
  - motion constraints
- Verify:
  - component inventory exists
  - focus mode styling rules exist

## UI-02 Current UI Audit
- Goal: find mismatches between existing UI and product direction
- Scope:
  - landing page
  - task capture
  - focus session
  - analytics
- Verify:
  - issue list is prioritized
  - fixes are scoped into tickets

## FE-01 Router Refactor
- Goal: make the current app match the approved route plan
- Scope:
  - route additions
  - route naming cleanup
  - layout separation
- Verify:
  - router file matches route plan

## FE-02 Current Bug Fix Pass
- Goal: stabilize the existing prototype
- Scope:
  - lint issues
  - broken flows
  - layout/interaction defects
- Verify:
  - `npm run lint` passes
  - major flow regressions are fixed

## FE-03 Bundle And Loading Strategy
- Goal: reduce initial load cost
- Scope:
  - lazy-load route pages
  - lazy-load 3D environment
  - separate marketing and app costs
- Verify:
  - build warning is reduced or intentionally documented

## BE-01 Supabase Domain Model
- Goal: define the initial backend model
- Scope:
  - users
  - tasks
  - sessions
  - notes
  - flashcard decks
  - progression
- Verify:
  - domain entities and relationships are documented

## AI-01 Study Sidekick Contract
- Goal: define AI interfaces before implementation
- Scope:
  - note summary input/output
  - flashcard generation contract
  - focus coaching triggers
- Verify:
  - edge function contract exists
