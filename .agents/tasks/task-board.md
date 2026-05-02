# Task Board

## Status Legend

- `todo`
- `doing`
- `blocked`
- `done`

## Active Workstreams

| ID    | Status | Owner      | Workstream             | Outcome                                                          |
| ----- | ------ | ---------- | ---------------------- | ---------------------------------------------------------------- |
| WS-01 | done   | Codex      | Product framing        | Direction aligned to Zen System and deep-work sanctuary          |
| WS-02 | done   | Codex      | UX architecture        | Sitemap, route map, user flows, focus-mode rules defined         |
| WS-03 | done   | user       | Visual system          | Zen System direction documented                                  |
| WS-04 | done   | Codex      | Technical architecture | Architecture docs corrected to Vite + React Router current stack |
| WS-05 | todo   | unassigned | 3D experience design   | Environment strategy, performance budgets, companion loop        |
| WS-06 | done   | Codex      | Gamification system    | Mana loop, progression, room economy                             |
| WS-07 | todo   | unassigned | Social systems         | Presence, silhouettes, leaderboard constraints                   |
| WS-08 | done   | Codex      | Delivery planning      | MVP slicing, milestones, risk register                           |

## Agent-Ready Tickets

| ID        | Status | Owner      | Ticket                                                                       | Depends On   | Deliverable                     |
| --------- | ------ | ---------- | ---------------------------------------------------------------------------- | ------------ | ------------------------------- |
| IA-01     | todo   | unassigned | Convert landing page IA into final marketing sitemap                         | none         | route list + page sections      |
| IA-02     | done   | Codex      | Define authenticated app navigation and focus-mode surface rules             | none         | app nav spec                    |
| UX-01     | todo   | unassigned | Design first-session onboarding and quick-start flows                        | IA-02        | user-flow doc + wire notes      |
| UX-02     | todo   | unassigned | Define task capture, active focus, and session summary flows                 | IA-02        | flow spec                       |
| UI-01     | todo   | unassigned | Turn Zen System into reusable tokens and component rules                     | WS-03        | token doc + component inventory |
| UI-02     | todo   | unassigned | Audit current pages against Zen System and focus constraints                 | UI-01        | bug list + remediation plan     |
| FE-01     | done   | Codex      | Refactor router structure to match approved route map                        | IA-01, IA-02 | route scaffolding               |
| FE-02     | done   | Codex      | Fix current UI bugs and lint issues in landing, capture, focus, analytics    | UI-02        | passing lint + issue fixes      |
| FE-03     | todo   | unassigned | Add lazy loading/code-splitting for 3D and route pages                       | FE-01        | reduced initial bundle          |
| BE-01     | todo   | unassigned | Define Supabase schema for users, tasks, sessions, notes, decks, progression | IA-02        | schema doc                      |
| AI-01     | todo   | unassigned | Specify AI note-summary and flashcard generation pipeline                    | BE-01        | edge-function contract          |
| GAME-01   | done   | Codex      | Define companion progression and reward economy                              | UX-02        | progression spec                |
| UI-03     | done   | Codex      | Redesign Dashboard (TaskCapture) as a Zen Sanctuary                          | none         | immersive dashboard page        |
| SOCIAL-01 | todo   | unassigned | Define ambient presence and leaderboard behavior                             | IA-02        | social spec                     |
| FE-04     | done   | Codex      | Cloudflare Pages deployment and Scroll Video Landing Page                   | FE-02        | pass build + live site          |
| FE-05     | done   | Antigravity | Profile Picture (Avatar) system with resizing and Storage RLS               | BE-01        | pfp upload + persistent display |

## Claim Rules

- Change one task to `doing`
- Add your agent name in `Owner`
- Add a handoff note when pausing or finishing
