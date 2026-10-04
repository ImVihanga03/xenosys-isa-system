const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { validate } = require('../../shared/middleware/validate');
const { authenticate } = require('../../shared/middleware/authenticate');
const { loginSchema, changePasswordSchema, forgotPasswordSchema, verifyCodeSchema, resetPasswordSchema } = require('./auth.schemas');
const c = require('./auth.controller');
const pr = require('./passwordReset.controller');

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20,
  standardHeaders: true, legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: { message: 'Too many attempts, try again later.' } });

const resetLimiter = (limit) => rateLimit({
  windowMs: 15 * 60 * 1000, limit, standardHeaders: true, legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: { message: 'Too many attempts, try again later.' } });

router.post('/login', loginLimiter, validate(loginSchema), c.login);
router.post('/logout', c.logout);
router.get('/me', authenticate, c.me);
router.post('/change-password', authenticate, validate(changePasswordSchema), c.changePassword);
router.post('/forgot-password',   resetLimiter(10), validate(forgotPasswordSchema), pr.forgotPassword);
router.post('/verify-reset-code', resetLimiter(15), validate(verifyCodeSchema),     pr.verifyCode);
router.post('/reset-password',    resetLimiter(10), validate(resetPasswordSchema),  pr.resetPassword);

module.exports = router;