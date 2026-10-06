const { audit } = require('../../shared/utils/audit');
const { listUsersQuerySchema } = require('../auth/auth.schemas');
const svc = require('./users.service');

const tgt = (u) => `user:${u.id} (${u.email})`;
const idOf = (req) => Number(req.params.id);

// FR-UAM-59: failed operations are audited too, with the reason in `resource`
async function deny(req, res, action, id, r) {
  await audit(req, action, `user:${id} ${r.reason}`, 'FAILURE');
  return res.status(r.status).json({ message: r.message, code: r.reason });
}

exports.listUsers = async (req, res) => {
  const p = listUsersQuerySchema.safeParse(req.query);
  if (!p.success) return res.status(400).json({
    message: 'Invalid query',
    errors: p.error.issues.map(i => ({ field: i.path.join('.'), message: i.message })) });
  res.json(await svc.listUsers(p.data));
};

exports.createUser = async (req, res) => {
  try {
    const r = await svc.createUser(req.body);
    await audit(req, 'USER_CREATED', `${tgt(r.user)} role=${r.user.role}`, 'SUCCESS');
    res.status(201).json(r);                              // { user, temporaryPassword } shown once
  } catch (e) {
    if (e.code === '23505') {
      await audit(req, 'USER_CREATED', `email:${req.body.email} EMAIL_EXISTS`, 'FAILURE');
      return res.status(409).json({ message: 'A user with this email already exists', code: 'EMAIL_EXISTS' });
    }
    throw e;
  }
};

exports.updateUser = async (req, res) => {
  const id = idOf(req);
  try {
    const r = await svc.updateUser(req.user.id, id, req.body);
    if (!r.ok) return deny(req, res, 'USER_UPDATED', id, r);
    if (r.changes.role)
      await audit(req, 'USER_ROLE_CHANGED', `${tgt(r.user)} ${r.changes.role.from}->${r.changes.role.to}`, 'SUCCESS');
    if (r.changes.fields.length)
      await audit(req, 'USER_UPDATED', `${tgt(r.user)} fields=${r.changes.fields.join(',')}`, 'SUCCESS');
    res.json({ user: r.user });
  } catch (e) {
    if (e.code === '23505') {
      await audit(req, 'USER_UPDATED', `user:${id} EMAIL_EXISTS`, 'FAILURE');
      return res.status(409).json({ message: 'A user with this email already exists', code: 'EMAIL_EXISTS' });
    }
    throw e;
  }
};

const toggle = (active) => async (req, res) => {
  const id = idOf(req), action = active ? 'USER_ENABLED' : 'USER_DISABLED';
  const r = await svc.setActive(req.user.id, id, active);
  if (!r.ok) return deny(req, res, action, id, r);
  await audit(req, action, tgt(r.user), 'SUCCESS');
  res.json({ user: r.user });
};
exports.disable = toggle(false);
exports.enable = toggle(true);

exports.unlock = async (req, res) => {
  const id = idOf(req);
  const r = await svc.unlock(id);
  if (!r.ok) return deny(req, res, 'USER_UNLOCKED', id, r);
  await audit(req, 'USER_UNLOCKED', tgt(r.user), 'SUCCESS');
  res.json({ user: r.user });
};

exports.resetPassword = async (req, res) => {
  const id = idOf(req);
  const r = await svc.adminResetPassword(req.user.id, id);
  if (!r.ok) return deny(req, res, 'ADMIN_PASSWORD_RESET', id, r);
  await audit(req, 'ADMIN_PASSWORD_RESET', tgt(r.user), 'SUCCESS');   // the password itself is never logged
  res.json({ user: r.user, temporaryPassword: r.temporaryPassword });
};

exports.deleteUser = async (req, res) => {
  const id = idOf(req);
  try {
    const r = await svc.deleteUser(req.user.id, id, req.body.confirmEmail,
      (t) => audit(req, 'USER_DELETE_INITIATED', tgt(t), 'SUCCESS'));
    if (!r.ok) return deny(req, res, 'USER_DELETED', id, r);
    await audit(req, 'USER_DELETED', tgt(r.user), 'SUCCESS');
    res.json({ message: 'User deleted' });
  } catch (e) {
    if (e.code === '23503') {                              // foreign-key violation from teammates' tables
      await audit(req, 'USER_DELETED', `user:${id} HAS_RECORDS`, 'FAILURE');
      return res.status(409).json({
        message: 'This account has policy, training or compliance records and cannot be deleted. Disable it instead.',
        code: 'HAS_RECORDS' });
    }
    throw e;
  }
};