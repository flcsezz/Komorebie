# Tech Stack Context

## Product Stack
- Frontend: Next.js 15 App Router
- UI: React 19, Framer Motion
- 3D: React Three Fiber, Drei, optionally Spline for authored scenes
- Backend: Supabase Auth, Postgres, Realtime
- AI: Gemini via Supabase Edge Functions
- Storage: Supabase Storage and/or Cloudinary for media and 3D assets

## Proposed Initial Architecture
### Web App
- Marketing and app shell in Next.js
- Protected app routes for dashboard, sanctuary, flashcards, social

### Data Domains
- Users and profiles
- Focus sessions
- Tasks and study artifacts
- Notes and uploads
- Flashcards
- Companion progression and room inventory
- Presence and leaderboard events

### AI Surfaces
- Note ingestion and parsing
- Summary generation
- Focus task extraction
- Flashcard generation
- Coaching suggestions

## Architecture Principles
- Keep focus session state resilient to reloads and reconnects
- Treat 3D assets as progressive enhancement, not hard blockers
- Separate focus-critical UI from luxury rendering paths
- Design mobile fallbacks early

## Open Decisions
- Spline-authored scenes vs fully programmatic R3F environments
- Supabase Storage vs Cloudinary split by asset class
- Real-time presence granularity for social silhouettes
