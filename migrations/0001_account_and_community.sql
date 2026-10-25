CREATE TABLE IF NOT EXISTS users (
  google_sub TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL DEFAULT '',
  picture_url TEXT NOT NULL DEFAULT '',
  username TEXT COLLATE NOCASE UNIQUE,
  profile_public INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS users_username_unique ON users(username COLLATE NOCASE);

CREATE TABLE IF NOT EXISTS published_items (
  id TEXT PRIMARY KEY,
  author_sub TEXT NOT NULL,
  author_username TEXT COLLATE NOCASE NOT NULL,
  author_display_name TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('study_set', 'note')),
  source_id TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  card_count INTEGER NOT NULL DEFAULT 0,
  question_count INTEGER NOT NULL DEFAULT 0,
  feynman_count INTEGER NOT NULL DEFAULT 0,
  payload_json TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(author_sub, kind, source_id)
);

CREATE INDEX IF NOT EXISTS published_items_updated_idx ON published_items(updated_at DESC);
CREATE INDEX IF NOT EXISTS published_items_kind_idx ON published_items(kind, updated_at DESC);

CREATE TABLE IF NOT EXISTS published_ratings (
  item_id TEXT NOT NULL,
  user_sub TEXT NOT NULL,
  reviewer_username TEXT COLLATE NOCASE NOT NULL,
  reviewer_display_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY(item_id, user_sub)
);

CREATE INDEX IF NOT EXISTS published_ratings_item_idx ON published_ratings(item_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS published_add_counts (
  item_id TEXT PRIMARY KEY,
  add_count INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS published_add_counts_popular_idx ON published_add_counts(add_count DESC);

CREATE TABLE IF NOT EXISTS published_saves (
  item_id TEXT NOT NULL,
  user_sub TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY(item_id, user_sub)
);

CREATE INDEX IF NOT EXISTS published_saves_user_idx ON published_saves(user_sub, created_at DESC);

CREATE TABLE IF NOT EXISTS published_reports (
  item_id TEXT NOT NULL,
  reporter_sub TEXT NOT NULL,
  reason TEXT NOT NULL,
  details TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'open',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY(item_id, reporter_sub)
);

CREATE INDEX IF NOT EXISTS published_reports_status_idx ON published_reports(status, updated_at DESC);

CREATE TABLE IF NOT EXISTS community_moderation (
  item_id TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'removed',
  trigger TEXT NOT NULL,
  report_count INTEGER NOT NULL DEFAULT 0,
  save_count INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS community_moderation_status_idx ON community_moderation(status, updated_at DESC);

CREATE TABLE IF NOT EXISTS user_progress (
  google_sub TEXT PRIMARY KEY,
  version INTEGER NOT NULL DEFAULT 0,
  data_json TEXT NOT NULL DEFAULT '{}',
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS auth_sessions (
  token_hash TEXT PRIMARY KEY,
  google_sub TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS auth_sessions_user_idx ON auth_sessions(google_sub);
CREATE INDEX IF NOT EXISTS auth_sessions_expiry_idx ON auth_sessions(expires_at);
