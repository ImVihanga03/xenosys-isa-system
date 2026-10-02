const jwt = require('jsonwebtoken');
const cfg = require('../../config/env');
const { query } = require('../../db/pool');
const { audit } = require('../../shared/utils/audit');
const { checkPassword } = require('./passwordPolicy');
const svc = require('./auth.service');
const bcrypt = require('bcrypt');

const cookieOpts = () => ({ httpOnly: true, secure: cfg.cookieSecure, sameSite: 'strict',
  path: '/', maxAge: cfg.sessionMinutes * 60 * 1000 });

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const r = await svc.attemptLogin(email, password);
  if (!r.ok) {
    await audit(req, 'LOGIN_FAILED', `auth:${r.reason}`, 'FAILURE',
                { actorId: r.user?.id, actorEmail: email });
    if (r.reason === 'LOCKED_NOW')
      await audit(req, 'ACCOUNT_LOCKED', `user:${r.user.id}`, 'SUCCESS', { actorId: r.user.id, actorEmail: email });
    // same message for wrong email, wrong password, inactive or locked
    return res.status(401).json({ message: 'Invalid credentials, or the account is temporarily locked.' });
  }
  res.cookie('token', svc.signToken(r.user), cookieOpts());
  await audit(req, 'LOGIN_SUCCESS', 'auth', 'SUCCESS', { actorId: r.user.id, actorEmail: r.user.email });
  res.json({ user: svc.publicUser(r.user) });
};

exports.logout = async (req, res) => {
  try {
    const p = jwt.verify(req.cookies?.token, cfg.jwtSecret, { algorithms: ['HS256'] });
    // bumping token_version makes the old token useless even if someone copied it
    const { rows } = await query(
      `UPDATE users SET token_version = token_version + 1
       WHERE id = $1 AND token_version = $2 RETURNING id, email`, [p.sub, p.tv]);
    if (rows[0]) await audit(req, 'LOGOUT', 'auth', 'SUCCESS', { actorId: rows[0].id, actorEmail: rows[0].email });
  } catch { /* no valid session: just clear the cookie */ }
  const { maxAge, ...clearOpts } = cookieOpts();
  res.clearCookie('token', clearOpts);
  res.json({ message: 'Logged out' });
};

exports.me = (req, res) => res.json({ user: req.user });

exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const { rows } = await query('SELECT * FROM users WHERE id = $1', [req.user.id]);
  const user = rows[0];

  const errors = checkPassword(newPassword, { email: user.email });
  if (!(await bcrypt.compare(currentPassword, user.password_hash)) || errors.length
      || currentPassword === newPassword) {
    await audit(req, 'PASSWORD_CHANGE_FAILED', 'auth', 'FAILURE');
    return res.status(400).json({
      message: errors.length ? 'New password does not meet the policy'
             : 'Current password is wrong, or the new password is the same as the old one',
      errors });
  }
  const { rows: upd } = await query(
    `UPDATE users SET password_hash = $2, must_change_password = false,
            token_version = token_version + 1, updated_at = now()
     WHERE id = $1 RETURNING *`, [user.id, await svc.hashPassword(newPassword)]);
  res.cookie('token', svc.signToken(upd[0]), cookieOpts());   // new session; old tokens are dead
  await audit(req, 'PASSWORD_CHANGED', 'auth', 'SUCCESS');
  res.json({ user: svc.publicUser(upd[0]) });
};