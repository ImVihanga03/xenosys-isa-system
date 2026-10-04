const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../../config/env');
const { query } = require('../../db/pool');

exports.authenticate = async (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ message: 'Authentication required' });

  let payload;
  try { payload = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] }); }
  catch { return res.status(401).json({ message: 'Session expired or invalid' }); }

  // Re-check the DB so deactivated users / logged-out tokens stop working immediately
  const { rows } = await query(
    `SELECT id, name, email, role, department, job_role, is_active,
            must_change_password, token_version FROM users WHERE id = $1`, [payload.sub]);
  const u = rows[0];
  if (!u || !u.is_active || u.token_version !== payload.tv)
    return res.status(401).json({ message: 'Session expired or invalid' });

  req.user = { id: u.id, name: u.name, email: u.email, role: u.role,
               department: u.department, jobRole: u.job_role,
               mustChangePassword: u.must_change_password };

  // Forced first-login password change: only /api/auth/* is allowed until done
  if (u.must_change_password && req.baseUrl !== '/api/auth')
    return res.status(403).json({ message: 'Password change required', code: 'PASSWORD_CHANGE_REQUIRED' });
  next();
};