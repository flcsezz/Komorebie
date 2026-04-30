# Komorebie Bug Review

## Findings

### 1. Architecture docs pointed agents at the wrong stack

- Severity: high
- Problem: the main architecture plan described a `Next.js 15 App Router` app, but the repo is a `Vite + React Router` app.
- Impact: agents can scaffold the wrong file structure, routing model, and task order.
- Action taken: rewrote the architecture plan and added repo-aligned IA docs.

### 2. Focus timer violated React lint rules

- Severity: medium
- File: `komorebie-app/src/pages/FocusSession.tsx`
- Problem: `setIsActive(false)` was called directly inside an effect branch.
- Impact: lint failed and the effect pattern risks cascading renders.
- Action taken: moved the zero-state transition into a separate effect.

### 3. Prototype route coverage is too thin for the planned product

- Severity: medium
- File: `komorebie-app/src/App.tsx`
- Problem: only `/`, `/app`, `/app/analytics`, and `/app/focus` exist, while the product direction needs explicit routes for features, pricing, notes, flashcards, room, social, and settings.
- Impact: agents lack a trustworthy route backbone and keep improvising.
- Action taken: documented the full route skeleton and split it into tickets.

### 4. Bundle is oversized for the current prototype

- Severity: medium
- Evidence: build output produced a `1.3 MB` JS bundle and a Vite chunk warning.
- Likely causes:
  - route pages are eagerly loaded
  - 3D environment is always mounted
  - marketing and app surfaces share the same initial bundle
- Recommended fix: add lazy loading and separate 3D cost from the initial critical path.

### 5. Naming drift increases coordination errors

- Severity: low
- Problem: some docs still refer to AetherStudy while the app and design direction use Komorebie.
- Impact: agents can generate mismatched copy, page names, and product language.
- Recommended fix: lock a single canonical product name before broader implementation.
