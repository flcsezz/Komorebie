# Agent Tickets

## SEC-01: Hardening SQL Function Permissions
- **Complexity**: `LOW`
- **Goal**: Prevent unauthenticated access to SECURITY DEFINER functions.
- **Scope**:
  - Revoke EXECUTE on `get_leaderboard_weekly`, `get_leaderboard_monthly`, `get_previous_week_champions` from `anon`.
  - Ensure only `authenticated` users can access leaderboard data.
- **Verify**: RPC calls from unauthenticated client fail with 403.

## SEC-02: Revoke RPC Access for Internal Triggers
- **Complexity**: `LOW`
- **Goal**: Prevent manual triggering of system functions.
- **Scope**:
  - Revoke EXECUTE on `handle_new_user()`, `prevent_username_change()`, `enforce_display_name_cooldown()` from `authenticated` and `anon`.
- **Verify**: API calls to these functions return "permission denied".

## SEC-03: SQL Function Search Path Security
- **Complexity**: `LOW`
- **Goal**: Prevent schema injection attacks on custom RPCs.
- **Scope**:
  - Update all custom functions to `SET search_path = public`.
- **Verify**: Functions execute correctly with restricted path.

## SEC-04: Worker Endpoint Input Validation
- **Complexity**: `LOW`
- **Goal**: Secure the `/api/data/update` endpoint against arbitrary table writes.
- **Scope**:
  - Implement a whitelist of allowed `data_type` values in `worker.ts`.
  - Return 400 for unknown data types.
- **Verify**: Request with `data_type: 'profiles'` (unauthorized) fails.

## SEC-05: Storage Bucket Privacy Hardening
- **Complexity**: `LOW`
- **Goal**: Prevent listing of all user avatars.
- **Scope**:
  - Update RLS policy for `avatars` bucket to restrict `SELECT` (listing) or remove it.
- **Verify**: Authenticated users can see their own avatar but cannot list the entire bucket.

## STB-01: Fix Hyperdrive Connection Leak in Worker
- **Complexity**: `MEDIUM`
- **Goal**: Optimize database connection usage at the edge.
- **Scope**:
  - Refactor `worker.ts` to pass a single `sql` instance to `computeAndStoreStats`.
  - Ensure connections are properly reused or closed in the cron handler.
- **Verify**: Logs show reduced connection overhead during cron sync.

## STB-02: Fix DataSyncContext Streak Approximation
- **Complexity**: `LOW`
- **Goal**: Improve accuracy of streak visualization in the dashboard.
- **Scope**:
  - Refactor `DataSyncContext.tsx` to handle `streak_qualified` accurately when using edge stats.
- **Verify**: Heatmap accurately reflects daily qualification markers.

## FE-11: Implement App Settings Page
- **Complexity**: `MEDIUM`
- **Goal**: Replace settings placeholder with functional UI.
- **Scope**:
  - Build UI for theme selection, notification toggles, and account management.
  - Connect to `user_preferences` table in Supabase.
- **Verify**: Changes persist across sessions.

---

## 🏁 Completed Tickets (Archived)
- [x] **BE-CF-01**: Provision D1 & Configure Wrangler
- [x] **BE-CF-02**: Edge Timer Sync Worker
- [x] **BE-CF-03**: Edge Analytics Cache Engine
- [x] **BE-CF-04**: Configure Cloudflare Hyperdrive
- [x] **BE-CF-05**: Expand D1 Schema for App Data
- [x] **BE-CF-06**: Implement Edge Unified Data Sync
- [x] **BE-CF-07**: Implement Cron Background Sync
- [x] **FE-CF-01**: Zen Clock Edge Integration
- [x] **FE-CF-02**: Edge-Aware Data Synchronization

