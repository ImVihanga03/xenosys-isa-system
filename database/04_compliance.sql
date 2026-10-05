-- Compliance related tables (Person 4)
-- Note: Real policy/training tables will come from Person 2 and 3.
-- This is a placeholder structure for compliance tracking.

CREATE TABLE IF NOT EXISTS compliance_snapshots (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  policy_acknowledged BOOLEAN DEFAULT FALSE,
  training_completed BOOLEAN DEFAULT FALSE,
  quiz_score INT,
  overall_status VARCHAR(20) DEFAULT 'Pending',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS compliance_snapshots_user_idx ON compliance_snapshots(user_id);