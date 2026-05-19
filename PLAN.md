# PLAN: Komorebie

## Goal
Create a premium, low-distraction website and web app using the Zen System (Digital Zen Garden) aesthetic, featuring 3D scroll experiences and glassmorphic UI.

## High Level Objectives
- **Frontend**: Vite + React 19 + React Router + TypeScript + Tailwind v4 + Framer Motion + R3F.
- **Backend**: Supabase.
- **Aesthetic**: Zen System, calm, minimal UI. Focus mode is an absolute constraint (no distractions).

## Sitemap & Route Map
- **Marketing Site**: `/`, `/features`, `/pricing`, `/about`, `/legal/*`
- **Sanctuary App**: `/app` (Dashboard), `/app/focus` (Setup/Session), `/app/tasks`, `/app/notes`, `/app/flashcards`, `/app/analytics`, `/app/room`, `/app/social`, `/app/settings`.

## State & Data Sync
- Hybrid approach with Cloudflare Workers for edge-fast synchronization.
- Supabase for primary data store (Tasks, Focus Sessions, Tags, Notes, Flashcards).

*For detailed IA, Design System, and feature plans, check the `.agents/context/` directory.*
