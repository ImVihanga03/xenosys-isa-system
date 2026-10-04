const cfg = require('../../config/env');
const { audit } = require('../../shared/utils/audit');
const { sendMail } = require('../../shared/utils/mailer');
const svc = require('./passwordReset.service');

const cookieOpts = () => ({ httpOnly: true, secure: cfg.cookieSecure, sameSite: 'strict',
  path: '/api/auth', maxAge: cfg.resetSessionMinutes * 60 * 1000 });
const clearOpts = () => { const { maxAge, ...o } = cookieOpts(); return o; };

const mailError = (e) => console.error('RESET_MAIL_FAILED:', e.message);

// FR-04: identical response whether or not the email is registered
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  const r = await svc.requestReset(email);
  if (r.status === 'SENT') {
    await audit(req, 'PASSWORD_RESET_REQUESTED', `user:${r.user.id}`, 'SUCCESS',
                { actorId: r.user.id, actorEmail: r.user.email });
    // not awaited: SMTP latency must not reveal that the account exists
    sendMail({
      to: r.user.email,
      subject: 'Your Xenosys password reset code',
      text: `Hello ${r.user.name},\n\nYour verification code is: ${r.code}\n\n` +
            `It expires in ${cfg.resetCodeMinutes} minutes. Do not share it with anyone.\n` +
            `If you did not request this, ignore this email; your password has not changed.`,
    }).catch(mailError);
  } else {
    await audit(req, 'PASSWORD_RESET_REQUESTED', `auth:${r.status}`, 'FAILURE',
                { actorId: r.user?.id, actorEmail: email });
  }
  res.json({ message: 'If that email is registered, a verification code has been sent.' });
};

exports.verifyCode = async (req, res) => {
  const { email, code } = req.body;
  const r = await svc.verifyCode(email, code);
  if (!r.ok) {
    await audit(req, 'PASSWORD_RESET_CODE_FAILED', `auth:${r.reason}`, 'FAILURE',
                { actorId: r.user?.id, actorEmail: email });
    // one message for wrong / expired / too many attempts / unknown email
    return res.status(400).json({
      message: 'Invalid or expired verification code. Check the code or request a new one.' });
  }
  res.cookie('reset_token', r.cookieValue, cookieOpts());
  await audit(req, 'PASSWORD_RESET_CODE_VERIFIED', `user:${r.user.id}`, 'SUCCESS',
              { actorId: r.user.id, actorEmail: r.user.email });
  res.json({ message: 'Code verified' });
};

exports.resetPassword = async (req, res) => {
  const r = await svc.resetPassword(req.cookies?.reset_token, req.body.newPassword);
  if (!r.ok) {
    await audit(req, 'PASSWORD_RESET_FAILED', `auth:${r.reason}`, 'FAILURE',
                { actorId: r.user?.id, actorEmail: r.user?.email });
    if (r.reason === 'POLICY')
      return res.status(400).json({ message: 'New password does not meet the policy', errors: r.errors });
    res.clearCookie('reset_token', clearOpts());
    return res.status(400).json({
      message: 'Your reset session is invalid or has expired. Please start again.',
      code: 'RESET_SESSION_INVALID' });
  }
  res.clearCookie('reset_token', clearOpts());
  await audit(req, 'PASSWORD_RESET_COMPLETED', `user:${r.user.id}`, 'SUCCESS',
              { actorId: r.user.id, actorEmail: r.user.email });
  sendMail({                                                       // FR-25
    to: r.user.email,
    subject: 'Your Xenosys password was changed',
    text: `Hello ${r.user.name},\n\nYour password was just reset and all active sessions were signed out.\n` +
          `If this was not you, contact your Security Officer immediately.`,
  }).catch(mailError);
  res.json({ message: 'Password reset successful' });
};