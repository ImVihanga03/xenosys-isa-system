const router = require('express').Router();
const { authenticate } = require('../../shared/middleware/authenticate');
const { requireRole } = require('../../shared/middleware/requireRole');
const { validate } = require('../../shared/middleware/validate');
const { audit } = require('../../shared/utils/audit');
const { createUserSchema, updateUserSchema, deleteUserSchema } = require('../auth/auth.schemas');
const c = require('./users.controller');

// FR-UAM-66: unauthenticated hits (401) are audited too. requireRole already audits the 403s.
router.use((req, res, next) => {
  res.on('finish', () => {
    if (res.statusCode === 401)
      audit(req, 'ACCESS_DENIED', `${req.method} ${req.originalUrl}`, 'FAILURE');
  });
  next();
});

// FR-UAM-61..64: every endpoint below is admin-only, enforced on the backend
router.use(authenticate, requireRole('admin'));

router.param('id', (req, res, next, id) => {
  if (!/^\d{1,9}$/.test(id)) return res.status(400).json({ message: 'Invalid user id' });
  next();
});

router.get('/', c.listUsers);
router.post('/', validate(createUserSchema), c.createUser);
router.patch('/:id', validate(updateUserSchema), c.updateUser);
router.post('/:id/disable', c.disable);
router.post('/:id/enable', c.enable);
router.post('/:id/unlock', c.unlock);
router.post('/:id/reset-password', c.resetPassword);
router.delete('/:id', validate(deleteUserSchema), c.deleteUser);

module.exports = router;