const router = require('express').Router();
const { authenticate } = require('../../shared/middleware/authenticate');
const { requireRole } = require('../../shared/middleware/requireRole');
const { validate } = require('../../shared/middleware/validate');
const { createUserSchema } = require('../auth/auth.schemas');
const c = require('./users.controller');

router.use(authenticate, requireRole('admin'));
router.post('/', validate(createUserSchema), c.createUser);
router.get('/', c.listUsers);
module.exports = router;