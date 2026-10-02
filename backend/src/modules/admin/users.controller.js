const crypto = require('crypto');
const { query } = require('../../db/pool');
const { audit } = require('../../shared/utils/audit');
const { hashPassword } = require('../auth/auth.service');

exports.createUser = async (req, res) => {
  const { name, email, role, department, jobRole } = req.body;
  const temporaryPassword = crypto.randomBytes(12).toString('base64url');   // 16 chars, shown once
  try {
    const { rows } = await query(
      `INSERT INTO users (name, email, password_hash, role, department, job_role, must_change_password)
       VALUES ($1,$2,$3,$4,$5,$6,true)
       RETURNING id, name, email, role, department, job_role`,
      [name, email, await hashPassword(temporaryPassword), role, department ?? null, jobRole ?? null]);
    await audit(req, 'USER_CREATED', `user:${rows[0].id}`, 'SUCCESS');
    res.status(201).json({ user: rows[0], temporaryPassword });
  } catch (e) {
    if (e.code === '23505') {                       // unique violation
      await audit(req, 'USER_CREATED', `email:${email}`, 'FAILURE');
      return res.status(409).json({ message: 'A user with this email already exists' });
    }
    throw e;
  }
};

exports.listUsers = async (req, res) => {
  const { rows } = await query(
    `SELECT id, name, email, role, department, job_role, is_active, last_login_at, created_at
     FROM users ORDER BY id`);
  res.json({ users: rows });
};