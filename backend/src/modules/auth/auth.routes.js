const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { validate } = require('../../shared/middleware/validate');
const { authenticate } = require('../../shared/middleware/authenticate');
const { loginSchema, changePasswordSchema } = require('./auth.schemas');
const c = require('./auth.controller');

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20,
  standardHeaders: true, legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: { message: 'Too many attempts, try again later.' } });

router.post('/login', loginLimiter, validate(loginSchema), c.login);
router.post('/logout', c.logout);
router.get('/me', authenticate, c.me);
router.post('/change-password', authenticate, validate(changePasswordSchema), c.changePassword);
module.exports = router;