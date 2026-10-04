CREATE TABLE password_reset_requests (
  id BIGSERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code_hash CHAR(64),                 -- HMAC of the 6-digit code; NULL once used/invalidated
  expires_at TIMESTAMPTZ NOT NULL,    -- code expiry
  failed_attempts INT NOT NULL DEFAULT 0,
  verified_at TIMESTAMPTZ,
  reset_token_hash CHAR(64),          -- SHA-256 of the reset cookie secret
  reset_expires_at TIMESTAMPTZ,
  used_at TIMESTAMPTZ,                -- set when request is finished/invalidated
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX password_reset_user_idx ON password_reset_requests (user_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE ON password_reset_requests TO xenosys_app;
GRANT USAGE, SELECT ON SEQUENCE password_reset_requests_id_seq TO xenosys_app;