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
| BE-01     | done   | Antigravity | Define Supabase schema for users, tasks, sessions, notes, decks, progression | IA-02        | schema doc                      |
| AI-01     | todo   | unassigned  | Specify AI note-summary and flashcard generation pipeline                    | BE-01        | edge-function contract          |
| FE-08     | done   | Antigravity | Implement Knowledge Grove (Notes) system with rich text and AI ready schema  | BE-01        | full notes page + hook          |
| GAME-01   | done   | Codex      | Define companion progression and reward economy                              | UX-02        | progression spec                |
| UI-03     | done   | Codex      | Redesign Dashboard (TaskCapture) as a Zen Sanctuary                          | none         | immersive dashboard page        |
| SOCIAL-01 | done   | Codex      | Define ambient presence and leaderboard behavior                             | IA-02        | social spec                     |
| FE-04     | done   | Codex      | Cloudflare Pages deployment and Scroll Video Landing Page                   | FE-02        | pass build + live site          |
| FE-05     | done   | Antigravity | Profile Picture (Avatar) system with resizing and Storage RLS               | BE-01        | pfp upload + persistent display |
| BE-02     | done   | Antigravity | Provision Cloudflare R2 bucket and link to web app                          | none         | komorebie-assets bucket + .env config |
| BE-03     | done   | Antigravity | Attach custom domain komorebie.flcsezz.sbs to the application               | none         | live custom domain              |
| UI-04     | done   | Antigravity | Robust Onboarding Flow Triggering (Domain/Session Resilience)               | none         | flicker-free onboarding flow    |
| FE-06     | done   | Antigravity | Fix Zen Clock sync issues and reset-on-start bug                            | none         | robust cross-device clock sync  |
| UI-05     | done   | Antigravity | Increase text sizes and contrast for Dashboard widgets and Analytics          | none         | High-legibility Zen Dashboard   |
| FE-07     | done   | Antigravity | Implement Leaderboard with 7-day/All-time views and Podium UI                | BE-01        | Premium Leaderboard Page        |
| FE-09     | done   | Antigravity | Profile Decoration System (35h lock, Premium BGM, Safe Fallbacks)            | BE-01, BE-02 | Unlocked profile customization  |
| FE-10     | done   | Antigravity | Refine Background Selection System (OptimizedImage, Granular Feedback)       | FE-09        | Production-ready BackgroundPage |
| BE-CF-01  | done   | Antigravity | Provision D1 & Configure Wrangler (Complexity: LOW)                           | none         | D1 binding in wrangler.jsonc    |
| BE-CF-02  | done   | Antigravity | Edge Timer Sync Worker (Complexity: MEDIUM)                                  | BE-CF-01     | /api/timer/sync endpoint        |
| FE-CF-01  | done   | Antigravity | Zen Clock Edge Integration (Complexity: MEDIUM)                              | BE-CF-02     | Heartbeats offloaded from SB    |
| BE-CF-03  | done   | Antigravity | Edge Analytics Cache Engine (Complexity: HIGH)                               | BE-CF-01     | /api/analytics/stats endpoint   |
| FE-CF-02  | done   | Antigravity | Edge-Aware Data Synchronization (Complexity: MEDIUM)                         | BE-CF-03     | Edge-fast dashboard load        |
| BE-CF-04  | done   | Antigravity | Configure Cloudflare Hyperdrive (Complexity: LOW)                             | none         | Pooled DB connections           |
| BE-CF-05  | done   | Antigravity | Expand D1 Schema for App Data (Complexity: LOW)                              | BE-CF-01     | data_cache table in D1         |
| BE-CF-06  | done   | Antigravity | Edge Unified Data Sync (Complexity: MEDIUM)                                  | BE-CF-05     | /api/data/all endpoint         |
| BE-CF-07  | done   | Antigravity | Cron Background Sync (Complexity: HIGH)                                      | BE-CF-06     | Hourly D1/Supabase refresh     |
| SEC-01    | done   | Antigravity | Hardening SQL Function Permissions                                           | none         | Restricted RPC access          |
| SEC-02    | done   | Antigravity | Revoke RPC Access for Internal Triggers                                      | none         | Trigger security               |
| SEC-03    | done   | Antigravity | SQL Function Search Path Security                                            | none         | Schema injection protection    |
| SEC-04    | done   | Antigravity | Worker Endpoint Input Validation                                             | none         | API data-type whitelist        |
| SEC-05    | done   | Antigravity | Storage Bucket Privacy Hardening                                             | none         | Restricted bucket listing      |
| STB-01    | done   | Antigravity | Fix Hyperdrive Connection Leak in Worker                                     | none         | Optimized edge connection pool |
| STB-02    | done   | Antigravity | Fix DataSyncContext Streak Approximation                                     | none         | Accurate dashboard heatmap     |
| STB-03    | done   | Antigravity | Fix Edge Cache Profile Sync & Remote D1 schema                               | none         | Consistent Onboarding states   |
| FE-11     | todo   | unassigned  | Implement App Settings Page                                                  | none         | Functional preferences UI      |

## Claim Rules

- Change one task to `doing`
- Add your agent name in `Owner`
- Add a handoff note when pausing or finishing
