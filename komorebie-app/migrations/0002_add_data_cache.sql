-- 0002_add_data_cache.sql
-- Table for caching app-wide data at the edge
CREATE TABLE IF NOT EXISTS data_cache (
  user_id TEXT NOT NULL,
  data_type TEXT NOT NULL,
  payload TEXT NOT NULL, -- JSON payload as string
  updated_at TEXT NOT NULL,
  PRIMARY KEY (user_id, data_type)
);

CREATE INDEX IF NOT EXISTS idx_data_cache_user_id ON data_cache(user_id);
