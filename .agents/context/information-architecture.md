# Information Architecture

## Current Platform Reality
- Current app stack is `Vite + React 19 + React Router + TypeScript`
- Current implemented routes are `/`, `/app`, `/app/analytics`, and `/app/focus`
- Current docs that assume `Next.js App Router` are not implementation-ready for this repo

## Product Structure
### Marketing Surface
- Purpose: explain the product, establish premium tone, and convert to app entry
- Route group:
  - `/`
  - `/features`
  - `/pricing`
  - `/about`
  - `/legal/privacy`
  - `/legal/terms`

### Authenticated App Surface
- Purpose: daily study workflow, focus sessions, progress, and ambient social
- Route group:
  - `/app`
  - `/app/focus`
  - `/app/focus/session`
  - `/app/tasks`
  - `/app/notes`
  - `/app/notes/:noteId`
  - `/app/flashcards`
  - `/app/flashcards/:deckId`
  - `/app/analytics`
  - `/app/room`
  - `/app/social`
  - `/app/settings`

## Sitemap
```text
Komorebie
├── /
│   ├── Hero
│   ├── Value pillars
│   ├── Feature preview
│   ├── Focus-mode preview
│   ├── Social proof / manifesto
│   └── CTA
├── /features
├── /pricing
├── /about
├── /legal/privacy
├── /legal/terms
└── /app
    ├── /app                     Sanctuary dashboard / task capture
    ├── /app/focus              Focus setup
    ├── /app/focus/session      Active focus mode
    ├── /app/tasks              Task library / today
    ├── /app/notes              Note library
    ├── /app/notes/:noteId      Note detail + AI actions
    ├── /app/flashcards         Deck library
    ├── /app/flashcards/:deckId Deck detail / study launch
    ├── /app/analytics          Session and rhythm analytics
    ├── /app/room               Companion and room customization
    ├── /app/social             Ambient presence + leaderboard
    └── /app/settings           Preferences
```

## Route Map For This Repo
```text
src/
├── App.tsx
├── pages/
│   ├── LandingPage.tsx
│   ├── FeaturesPage.tsx
│   ├── PricingPage.tsx
│   ├── AboutPage.tsx
│   ├── LegalPrivacyPage.tsx
│   ├── LegalTermsPage.tsx
│   ├── TaskCapture.tsx
│   ├── FocusSetup.tsx
│   ├── FocusSession.tsx
│   ├── TaskLibrary.tsx
│   ├── NotesLibrary.tsx
│   ├── NoteDetail.tsx
│   ├── FlashcardLibrary.tsx
│   ├── FlashcardDeck.tsx
│   ├── FlowAnalytics.tsx
│   ├── RoomPage.tsx
│   ├── SocialPage.tsx
│   └── SettingsPage.tsx
└── components/
```

## Navigation Model
### Marketing
- Header nav: Features, Pricing, About
- Primary CTA: Enter Sanctuary
- Secondary CTA: See Focus Mode

### App
- Primary navigation:
  - Sanctuary
  - Focus
  - Notes
  - Flashcards
  - Analytics
  - Room
  - Social
- Settings stays secondary

### Focus Mode
- No primary nav
- Only:
  - timer
  - task label
  - pause / resume
  - exit
  - minimal ambience controls

## Convenience Constraints
- New session start in under 10 seconds
- Returning user can launch last-used flow in one action
- Notes and flashcards stay one step away from the main app shell
- Focus mode can be entered from sanctuary, tasks, or note detail
