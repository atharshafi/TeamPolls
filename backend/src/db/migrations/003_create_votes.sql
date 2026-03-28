-- Votes table
-- Stores who voted for what on which poll

CREATE TABLE IF NOT EXISTS votes (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id    UUID        NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  option_idx INTEGER     NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- This is the magic line — one vote per user per poll!
  UNIQUE(poll_id, user_id)
);

-- Indexes for faster vote counting
CREATE INDEX IF NOT EXISTS idx_votes_poll_id ON votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_votes_user_id ON votes(user_id);