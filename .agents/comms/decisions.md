# Decisions

## 2026-04-28 | Establish Agent Workspace Before App Scaffold
- Context: The repository is empty and the immediate need is coordinated planning, not code implementation.
- Decision: Create a dedicated `.agents/` workspace plus root instructions before scaffolding the product.
- Reason: Agents need stable shared context and coordination artifacts to avoid duplicate planning and contradictory assumptions.
- Impact: Future implementation agents can start with explicit product, UX, and workflow guidance.

## 2026-04-28 | Focus Mode Is A First-Class Product Constraint
- Context: The product must be aesthetically premium without becoming distracting.
- Decision: Treat focus mode as a primary product mode, not a late-stage UI toggle.
- Reason: This affects information architecture, motion design, social behavior, and performance from day one.
- Impact: All future design and implementation work must prove compatibility with low-distraction sessions.
