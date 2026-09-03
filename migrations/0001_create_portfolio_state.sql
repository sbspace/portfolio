CREATE TABLE IF NOT EXISTS portfolio_state (
  id TEXT PRIMARY KEY,
  state_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
