# Agent Tickets

## FE-11: Implement App Settings Page
- **Complexity**: `MEDIUM`
- **Goal**: Replace settings placeholder with functional UI.
- **Scope**:
  - Build UI for theme selection, notification toggles, and account management.
  - Connect to `user_preferences` table in Supabase.
- **Verify**: Changes persist across sessions.

---

## 🏷️ Tag-Based Focus Tracking Feature

## [x] TAG-01: Database Schema & RPC Support for Focus Session Tagging
- **Complexity**: `LOW`
- **Goal**: Expand focus_sessions database table and the secure session logger RPC to support an optional tag parameter.
- **Scope**:
  - Add nullable `tag` text column to the `focus_sessions` table in Supabase.
  - Create index `idx_focus_sessions_tag` on the tag column.
  - Update `secure_log_focus_session` RPC function to accept `p_tag text DEFAULT NULL` and insert it.
- **Verify**: RPC call with `p_tag` inserts a session with the correct tag successfully.

## TAG-02: Global ZenClock State and Edge Sync for Tags
- **Complexity**: `MEDIUM`
- **Goal**: Integrate tag state into the React Context and Cloudflare Edge sync interface.
- **Scope**:
  - Add `currentTag` and `setCurrentTag` state to `ZenClockContext.tsx` with `localStorage` persistence.
  - Update `logSessionIfQualified` in `ZenClockContext` to fetch the current tag and pass it down.
  - Expand `/api/timer/sync` endpoints to transmit and cache the `tag` parameter.
- **Verify**: Re-routing to a new page or reloading preserves the selected tag state.

## TAG-03: Dashboard Tag Entry UI and Active Display
- **Complexity**: `MEDIUM`
- **Goal**: Build a minimalist, beautiful tag input in the dashboard clock and show the active tag during focus sessions.
- **Scope**:
  - Add a sleek tag input matching the `glass`/`icy` design system in `ZenClock.tsx`.
  - Disable editing of the tag input when a session is active.
  - Update `FocusSession.tsx` to read and display the current tag elegantly.
- **Verify**: Tag can be entered before starting, and shows up styled appropriately on the active focus screen.

## TAG-04: Tag Aggregate Fetching and Personal Analytics Widget
- **Complexity**: `MEDIUM`
- **Goal**: Aggregate tag statistics and display them in a visually stunning card on the analytics dashboard.
- **Scope**:
  - Write `fetchTagAnalytics` in `src/lib/analytics.ts` that groups completed sessions by tag and calculates hours/sessions.
  - Create a glassmorphic `TagAnalyticsWidget` component with HSL colored bar representations.
  - Embed the widget inside `FlowAnalytics.tsx`.
- **Verify**: Analytics page reflects correct aggregated focus time and session counts per tag.

## TAG-05: Social Profile Tag Integration
- **Complexity**: `LOW`
- **Goal**: Allow public tag distribution metrics to be viewed on user profiles and friends' cards.
- **Scope**:
  - Integrate `TagAnalyticsWidget` inside the User Profile view.
  - Integrate `TagAnalyticsWidget` inside the Friends Profile details modal/panel.
- **Verify**: Opening a friend's profile details card shows their tag focus distribution metrics.

---

## 🏁 Completed Tickets (Archived)
- [x] **SEC-01**: Hardening SQL Function Permissions
- [x] **SEC-02**: Revoke RPC Access for Internal Triggers
- [x] **SEC-03**: SQL Function Search Path Security
- [x] **SEC-04**: Worker Endpoint Input Validation
- [x] **SEC-05**: Storage Bucket Privacy Hardening
- [x] **FE-CF-01**: Zen Clock Edge Integration
- [x] **FE-CF-02**: Edge-Aware Data Synchronization

