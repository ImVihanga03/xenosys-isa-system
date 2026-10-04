const crypto = require('crypto');
const bcrypt = require('bcrypt');
const cfg = require('../../config/env');
const { query, pool } = require('../../db/pool');
const { hashPassword } = require('./auth.service');
const { checkPassword } = require('./passwordPolicy');

const codeHash = (userId, code) =>
  crypto.createHmac('sha256', cfg.jwtSecret).update(`pwreset:${userId}:${code}`).digest('hex');
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
const safeEqual = (a, b) => {
  const x = Buffer.from(a, 'hex'), y = Buffer.from(b, 'hex');
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

// FR-05..07: generate, store (hashed) and expire a 6-digit code
exports.requestReset = async (email) => {
  const { rows } = await query(
    'SELECT id, name, email, is_active FROM users WHERE email = $1', [email]);
  const user = rows[0];
  if (!user || !user.is_active) return { status: user ? 'INACTIVE' : 'UNKNOWN_USER', user };

  const { rows: s } = await query(
    `SELECT COUNT(*)::int AS n,
            COALESCE(MAX(created_at) > now() - make_interval(secs => $2), false) AS cooling
     FROM password_reset_requests
     WHERE user_id = $1 AND created_at > now() - interval '1 hour'`,
    [user.id, cfg.resendCooldownSeconds]);
  if (s[0].cooling) return { status: 'COOLDOWN', user };
  if (s[0].n >= cfg.resetMaxPerHour) return { status: 'HOURLY_LIMIT', user };

  const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
  // a new code replaces any earlier one (this is also what "Resend Code" does)
  await query(
    `UPDATE password_reset_requests
     SET used_at = now(), code_hash = NULL, reset_token_hash = NULL
     WHERE user_id = $1 AND used_at IS NULL`, [user.id]);
  await query(
    `INSERT INTO password_reset_requests (user_id, code_hash, expires_at)
     VALUES ($1, $2, now() + make_interval(mins => $3))`,
    [user.id, codeHash(user.id, code), cfg.resetCodeMinutes]);
  return { status: 'SENT', user, code };
};

// FR-10..14: verify the code
exports.verifyCode = async (email, code) => {
  const { rows: u } = await query(
    'SELECT id, email, is_active FROM users WHERE email = $1', [email]);
  const user = u[0];
  if (!user || !user.is_active) return { ok: false, reason: 'UNKNOWN_USER' };

  // Count the attempt FIRST, atomically, so parallel guesses cannot beat the limit
  const { rows } = await query(
    `UPDATE password_reset_requests SET failed_attempts = failed_attempts + 1
     WHERE id = (SELECT id FROM password_reset_requests
                 WHERE user_id = $1 AND used_at IS NULL AND code_hash IS NOT NULL
                 ORDER BY id DESC LIMIT 1)
       AND expires_at > now() AND failed_attempts < $2
     RETURNING id, code_hash, failed_attempts`,
    [user.id, cfg.resetMaxAttempts]);
  const r = rows[0];

  if (!r) {   // work out why, for the audit log only
    const { rows: s } = await query(
      `SELECT expires_at <= now() AS expired FROM password_reset_requests
       WHERE user_id = $1 AND used_at IS NULL AND code_hash IS NOT NULL
       ORDER BY id DESC LIMIT 1`, [user.id]);
    return { ok: false, user, reason: !s[0] ? 'NO_ACTIVE_CODE' : s[0].expired ? 'EXPIRED' : 'ATTEMPTS_EXCEEDED' };
  }

  if (!safeEqual(r.code_hash, codeHash(user.id, code))) {
    if (r.failed_attempts >= cfg.resetMaxAttempts)
      await query(`UPDATE password_reset_requests SET used_at = now(), code_hash = NULL WHERE id = $1`, [r.id]);
    return { ok: false, user, reason: 'WRONG_CODE' };
  }

  // FR-14: code is consumed (code_hash = NULL); a one-time reset token is issued
  const secret = crypto.randomBytes(32).toString('base64url');
  const { rows: v } = await query(
    `UPDATE password_reset_requests
     SET code_hash = NULL, verified_at = now(), reset_token_hash = $2,
         reset_expires_at = now() + make_interval(mins => $3)
     WHERE id = $1 AND code_hash IS NOT NULL AND used_at IS NULL RETURNING id`,
    [r.id, sha256(secret), cfg.resetSessionMinutes]);
  if (!v[0]) return { ok: false, user, reason: 'RACE' };
  return { ok: true, user, cookieValue: `${r.id}.${secret}` };
};

// FR-17..24: set the new password
exports.resetPassword = async (cookieValue, newPassword) => {
  const [id, secret] = String(cookieValue || '').split('.');
  if (!/^\d+$/.test(id || '') || !secret) return { ok: false, reason: 'NO_RESET_SESSION' };

  const { rows } = await query(
    `SELECT r.id, r.user_id, u.email, u.name, u.password_hash
     FROM password_reset_requests r JOIN users u ON u.id = r.user_id
     WHERE r.id = $1 AND r.reset_token_hash = $2 AND r.verified_at IS NOT NULL
       AND r.used_at IS NULL AND r.reset_expires_at > now() AND u.is_active`,
    [id, sha256(secret)]);
  const r = rows[0];
  if (!r) return { ok: false, reason: 'INVALID_OR_EXPIRED_SESSION' };
  const user = { id: r.user_id, email: r.email, name: r.name };

  const errors = checkPassword(newPassword, { email: r.email });   // FR-19
  if (await bcrypt.compare(newPassword, r.password_hash))
    errors.push('Must be different from your current password');
  if (errors.length) return { ok: false, reason: 'POLICY', errors, user };

  const hash = await hashPassword(newPassword);                    // FR-21
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const claim = await client.query(
      `UPDATE password_reset_requests
       SET used_at = now(), code_hash = NULL, reset_token_hash = NULL
       WHERE id = $1 AND used_at IS NULL RETURNING id`, [r.id]);   // FR-24
    if (!claim.rows[0]) { await client.query('ROLLBACK'); return { ok: false, reason: 'RACE', user }; }
    await client.query(
      `UPDATE password_reset_requests
       SET used_at = now(), code_hash = NULL, reset_token_hash = NULL
       WHERE user_id = $1 AND used_at IS NULL`, [r.user_id]);
    await client.query(
      `UPDATE users SET password_hash = $2, must_change_password = false,
              token_version = token_version + 1,                   -- FR-23: kills all sessions
              failed_attempts = 0, locked_until = NULL, updated_at = now()
       WHERE id = $1`, [r.user_id, hash]);                         // FR-22
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
  return { ok: true, user };
};