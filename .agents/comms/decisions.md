# Decisions

## 2026-04-28 | Design Direction Finalized
- **Decision:** Adopted "Zen System" (Concept 1) as the primary visual and UX direction.
- **Rationale:** Aligns best with the "Deep Work Sanctuary" mission, prioritizing calm and focus over high-tech complexity.
- **Implications:** Update all component designs and 3D environment strategies to match this aesthetic.

## 2026-04-28 | Tech Stack Confirmation
- **Decision:** Using React + Vite + TypeScript + TailwindCSS + Framer Motion + R3F.
- **Rationale:** Speed of development and high-fidelity animation capabilities.

## 2026-04-28 | Route Planning Must Follow Vite + React Router
- **Decision:** All new routing, sitemap, and implementation plans must target the current Vite + React Router codebase, not Next.js App Router.
- **Rationale:** The existing prototype already lives in `komorebie-app` and agents were at risk of scaffolding the wrong architecture.
- **Implications:** Use `src/App.tsx` and page components as the route backbone until a deliberate migration is approved.

## 2026-04-29 | Production Surface Consolidation
- **Decision:** Consolidate placeholder sidebar features into a smaller production feature stack centered on Sanctuary, Focus, Tasks, Notes, Flashcards, Analytics, Room, Social, and Settings.
- **Rationale:** The prototype currently exposes scheduling, customization, music, background, leaderboard, and friends as if they were full products, but the core value proposition is premium deep work with optional supporting layers.
- **Implications:** `Calendar` becomes a lightweight schedule system, `Customize`/`Music`/`Background` merge into `Room`, and `Leaderboard`/`Friends` merge into `Social`. Focus mode remains isolated from all of them.

## 2026-04-29 | Gamification Must Stay Post-Focus And Ambient
- **Decision:** Komorebie's gamification loop will center on mana, sanctuary progression, companion growth, and soft streaks, with rewards shown mainly before or after sessions rather than during focus mode.
- **Rationale:** Retention matters, but the product promise is calm deep work. Interruptive streaks, feeds, and reward spam would directly damage the core experience.
- **Implications:** Focus mode stays visually sparse. Mana is earned from meaningful completion, spent on room and companion cosmetics, and supported by weekly reflection rather than aggressive engagement tactics.
