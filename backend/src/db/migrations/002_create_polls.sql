-- Polls table
-- Stores poll questions, options, and expiry time

CREATE TABLE IF NOT EXISTS polls (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  question   TEXT        NOT NULL,
  options    JSONB       NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster lookups when checking expiry
CREATE INDEX IF NOT EXISTS idx_polls_expires_at ON polls(expires_at);