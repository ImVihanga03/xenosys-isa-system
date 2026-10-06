const crypto = require('crypto');
const { query, tx } = require('../../db/pool');
const { hashPassword } = require('../auth/auth.service');

const ADMIN_LOCK = 748291;                      // arbitrary advisory-lock key
const LOCKED = '(locked_until IS NOT NULL AND locked_until > now())';

// Safe column list: never includes password_hash, token_version or reset data (FR-UAM-07)
const PUBLIC_COLS = `id, name, email, role, department, job_role, is_active,
  must_change_password, last_login_at, created_at,
  ${LOCKED} AS is_locked,
  CASE WHEN locked_until > now() THEN locked_until END AS lock_expires_at,
  CASE WHEN NOT is_active THEN 'disabled' WHEN ${LOCKED} THEN 'locked' ELSE 'active' END AS status`;

const fail = (status, reason, message) => ({ ok: false, status, reason, message });
const tempPassword = () => crypto.randomBytes(12).toString('base64url');   // 16 chars

async function lockTarget(c, id) {
  await c.query('SELECT pg_advisory_xact_lock($1)', [ADMIN_LOCK]);
  const { rows } = await c.query(
    `SELECT id, name, email, role, department, job_role, is_active, ${LOCKED} AS is_locked
     FROM users WHERE id = $1 FOR UPDATE`, [id]);
  return rows[0];
}

async function otherActiveAdmins(c, id) {
  const { rows } = await c.query(
    `SELECT COUNT(*)::int AS n FROM users WHERE role = 'admin' AND is_active AND id <> $1`, [id]);
  return rows[0].n;
}

// A pending "Forgot password" code/token must not outlive a disable, email change or admin reset
const killResets = (c, userId) => c.query(
  `UPDATE password_reset_requests
   SET used_at = now(), code_hash = NULL, reset_token_hash = NULL
   WHERE user_id = $1 AND used_at IS NULL`, [userId]);

// ---------- list (FR-UAM-02..06) ----------
exports.listUsers = async ({ q, role, status, page, limit }) => {
  const where = [], vals = [];
  const add = (v) => { vals.push(v); return `$${vals.length}`; };

  if (q) {
    const p = add(`%${q.replace(/[\\%_]/g, '\\$&')}%`);          // escape LIKE wildcards
    where.push(`(name ILIKE ${p} OR email ILIKE ${p})`);
  }
  if (role) where.push(`role = ${add(role)}`);
  if (status === 'disabled') where.push('NOT is_active');
  if (status === 'active')   where.push(`is_active AND NOT ${LOCKED}`);
  if (status === 'locked')   where.push(`is_active AND ${LOCKED}`);

  const lim = add(limit), off = add((page - 1) * limit);
  const { rows } = await query(
    `SELECT ${PUBLIC_COLS}, (COUNT(*) OVER())::int AS total
     FROM users ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
     ORDER BY id LIMIT ${lim} OFFSET ${off}`, vals);
  return { users: rows.map(({ total, ...u }) => u), total: rows[0]?.total ?? 0, page, limit };
};

// ---------- create (FR-UAM-08..14) ----------
exports.createUser = async ({ name, email, role, department, jobRole }) => {
  const temporaryPassword = tempPassword();
  const { rows } = await query(
    `INSERT INTO users (name, email, password_hash, role, department, job_role, must_change_password)
     VALUES ($1,$2,$3,$4,$5,$6,true) RETURNING ${PUBLIC_COLS}`,
    [name, email, await hashPassword(temporaryPassword), role, department, jobRole]);
  return { user: rows[0], temporaryPassword };
};

// ---------- edit + role change (FR-UAM-35..46) ----------
exports.updateUser = (actorId, id, f) => tx(async (c) => {
  const t = await lockTarget(c, id);
  if (!t) return fail(404, 'NOT_FOUND', 'User not found');

  const cur = { name: t.name, email: t.email, role: t.role,
                department: t.department, jobRole: t.job_role };
  const changed = Object.keys(f).filter(k => f[k] !== cur[k]);
  if (!changed.length) {
    const { rows } = await c.query(`SELECT ${PUBLIC_COLS} FROM users WHERE id = $1`, [id]);
    return { ok: true, user: rows[0], changes: { role: null, fields: [] } };
  }

  const roleChanged = changed.includes('role');
  if (roleChanged) {
    if (actorId === id) return fail(409, 'SELF_ROLE_CHANGE', 'You cannot change your own role');
    if (t.role === 'admin' && t.is_active && (await otherActiveAdmins(c, id)) === 0)
      return fail(409, 'LAST_ADMIN', 'Cannot remove the role of the last active administrator');
  }

  const COL = { name: 'name', email: 'email', role: 'role', department: 'department', jobRole: 'job_role' };
  const vals = [id];
  const sets = changed.map(k => { vals.push(f[k]); return `${COL[k]} = $${vals.length}`; });
  if (roleChanged) sets.push('token_version = token_version + 1');      // FR-UAM-40
  sets.push('updated_at = now()');

  const { rows } = await c.query(
    `UPDATE users SET ${sets.join(', ')} WHERE id = $1 RETURNING ${PUBLIC_COLS}`, vals);
  if (roleChanged || changed.includes('email')) await killResets(c, id);

  return { ok: true, user: rows[0], changes: {
    role: roleChanged ? { from: t.role, to: f.role } : null,
    fields: changed.filter(k => k !== 'role') } };
});

// ---------- enable / disable (FR-UAM-16..21) ----------
exports.setActive = (actorId, id, active) => tx(async (c) => {
  if (!active && actorId === id) return fail(409, 'SELF_DISABLE', 'You cannot disable your own account');
  const t = await lockTarget(c, id);
  if (!t) return fail(404, 'NOT_FOUND', 'User not found');
  if (t.is_active === active)
    return fail(409, 'NO_CHANGE', active ? 'Account is already active' : 'Account is already disabled');
  if (!active && t.role === 'admin' && (await otherActiveAdmins(c, id)) === 0)
    return fail(409, 'LAST_ADMIN', 'Cannot disable the last active administrator');

  const { rows } = await c.query(
    `UPDATE users SET is_active = $2::boolean,
            token_version = token_version + CASE WHEN $2::boolean THEN 0 ELSE 1 END,
            updated_at = now()
     WHERE id = $1 RETURNING ${PUBLIC_COLS}`, [id, active]);        // disable kills sessions
  if (!active) await killResets(c, id);
  return { ok: true, user: rows[0] };
});

// ---------- unlock (FR-UAM-49) ----------
exports.unlock = (id) => tx(async (c) => {
  const t = await lockTarget(c, id);
  if (!t) return fail(404, 'NOT_FOUND', 'User not found');
  if (!t.is_locked) return fail(409, 'NOT_LOCKED', 'Account is not locked');
  const { rows } = await c.query(
    `UPDATE users SET failed_attempts = 0, locked_until = NULL, updated_at = now()
     WHERE id = $1 RETURNING ${PUBLIC_COLS}`, [id]);
  return { ok: true, user: rows[0] };
});

// ---------- admin password reset (FR-UAM-28..34) ----------
exports.adminResetPassword = async (actorId, id) => {
  if (actorId === id)
    return fail(409, 'SELF_RESET', 'Use the change-password page for your own account');
  const temporaryPassword = tempPassword();
  const hash = await hashPassword(temporaryPassword);               // hash before taking the lock
  return tx(async (c) => {
    const t = await lockTarget(c, id);
    if (!t) return fail(404, 'NOT_FOUND', 'User not found');
    const { rows } = await c.query(
      `UPDATE users SET password_hash = $2, must_change_password = true,
              token_version = token_version + 1,
              failed_attempts = 0, locked_until = NULL, updated_at = now()
       WHERE id = $1 RETURNING ${PUBLIC_COLS}`, [id, hash]);
    await killResets(c, id);
    return { ok: true, user: rows[0], temporaryPassword };
  });
};

// ---------- delete (FR-UAM-22..27) ----------
// beforeDelete(target) is awaited inside the transaction, so the audit row is
// committed BEFORE the user row is removed (FR-UAM-26).
exports.deleteUser = (actorId, id, confirmEmail, beforeDelete) => tx(async (c) => {
  if (actorId === id) return fail(409, 'SELF_DELETE', 'You cannot delete your own account');
  const t = await lockTarget(c, id);
  if (!t) return fail(404, 'NOT_FOUND', 'User not found');
  if (confirmEmail !== t.email)
    return fail(400, 'CONFIRM_MISMATCH', 'The confirmation email does not match this account');
  if (t.is_active)
    return fail(409, 'DISABLE_FIRST', 'Disable the account before deleting it');
  await beforeDelete(t);
  await c.query('DELETE FROM users WHERE id = $1', [id]);
  return { ok: true, user: t };
});