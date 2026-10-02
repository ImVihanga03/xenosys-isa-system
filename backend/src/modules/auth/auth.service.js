const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cfg = require('../../config/env');
const { query } = require('../../db/pool');

const COST = 12;
const DUMMY_HASH = bcrypt.hashSync('timing-equalizer', COST);  // same work for unknown emails

exports.hashPassword = (pw) => bcrypt.hash(pw, COST);

exports.signToken = (user) =>
  jwt.sign({ role: user.role, tv: user.token_version }, cfg.jwtSecret,
    { algorithm: 'HS256', subject: String(user.id), expiresIn: cfg.sessionMinutes * 60 });

exports.publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role,
  department: u.department, mustChangePassword: u.must_change_password });

exports.attemptLogin = async (email, password) => {
  const { rows } = await query('SELECT * FROM users WHERE email = $1', [email]);
  const user = rows[0];

  if (!user || !user.is_active) {
    await bcrypt.compare(password, DUMMY_HASH);
    return { ok: false, reason: user ? 'INACTIVE' : 'UNKNOWN_USER', user };
  }
  if (user.locked_until && user.locked_until > new Date())
    return { ok: false, reason: 'LOCKED', user };

  if (!(await bcrypt.compare(password, user.password_hash))) {
    // atomic increment; lock after N failures, then reset the counter
    const { rows: r } = await query(
      `UPDATE users SET
         failed_attempts = CASE WHEN failed_attempts + 1 >= $2 THEN 0 ELSE failed_attempts + 1 END,
         locked_until = CASE WHEN failed_attempts + 1 >= $2
                        THEN now() + make_interval(mins => $3) ELSE locked_until END,
         updated_at = now()
       WHERE id = $1
       RETURNING (locked_until IS NOT NULL AND locked_until > now()) AS locked`,
      [user.id, cfg.maxAttempts, cfg.lockMinutes]);
    return { ok: false, reason: r[0].locked ? 'LOCKED_NOW' : 'BAD_PASSWORD', user };
  }

  const { rows: ok } = await query(
    `UPDATE users SET failed_attempts = 0, locked_until = NULL, last_login_at = now()
     WHERE id = $1 RETURNING *`, [user.id]);
  return { ok: true, user: ok[0] };
};