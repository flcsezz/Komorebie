## 2024-05-18 - Missing ARIA Labels on Global Navigation
**Learning:** Icon-only buttons used for global navigation toggles (like sidebar, notifications, admin menus) frequently lack both `aria-label` attributes and explicit `focus-visible` styles, relying solely on visual icons which screen readers ignore.
**Action:** Always verify icon-only buttons have descriptive `aria-label` attributes (and `aria-expanded` for toggle states) and ensure keyboard focus is visible (e.g. `focus-visible:ring-2`) for accessible navigation.
