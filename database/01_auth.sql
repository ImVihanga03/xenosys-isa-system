CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'employee'
       CHECK (role IN ('employee','admin','security_officer')),
  department VARCHAR(100),
  job_role VARCHAR(100),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  must_change_password BOOLEAN NOT NULL DEFAULT TRUE,
  failed_attempts INT NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  token_version INT NOT NULL DEFAULT 0,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- no FK on purpose: logs must survive user changes
CREATE TABLE audit_logs (
  id BIGSERIAL PRIMARY KEY,
  actor_id INT,                       
  actor_email VARCHAR(255),
  action VARCHAR(60) NOT NULL,
  resource VARCHAR(255),
  outcome VARCHAR(10) NOT NULL CHECK (outcome IN ('SUCCESS','FAILURE')),
  ip VARCHAR(64),
  user_agent VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX audit_logs_created_idx ON audit_logs (created_at DESC);

-- Append-only audit log (NFR 29)
CREATE FUNCTION audit_logs_block_change() RETURNS trigger AS $$
BEGIN RAISE EXCEPTION 'audit_logs is append-only'; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER audit_logs_no_update_delete
  BEFORE UPDATE OR DELETE ON audit_logs
  FOR EACH ROW EXECUTE FUNCTION audit_logs_block_change();

-- Least-privilege app account (NFR 06).
CREATE ROLE xenosys_app LOGIN PASSWORD 'CHANGE_ME';
GRANT CONNECT ON DATABASE xenosys_isa TO xenosys_app;
GRANT USAGE ON SCHEMA public TO xenosys_app;
GRANT SELECT, INSERT, UPDATE ON users TO xenosys_app;
GRANT SELECT, INSERT ON audit_logs TO xenosys_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO xenosys_app;