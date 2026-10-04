require('dotenv').config();
for (const k of ['DATABASE_URL', 'JWT_SECRET', 'CLIENT_ORIGIN'])
  if (!process.env[k]) throw new Error(`Missing env var ${k}`);
if (process.env.JWT_SECRET.length < 32) throw new Error('JWT_SECRET is too short');

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: +process.env.PORT || 5000,
  clientOrigin: process.env.CLIENT_ORIGIN,
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  sessionMinutes: +process.env.SESSION_MINUTES || 30,
  cookieSecure: process.env.COOKIE_SECURE === 'true',
  maxAttempts: +process.env.LOGIN_MAX_ATTEMPTS || 5,
  lockMinutes: +process.env.LOCK_MINUTES || 15,

  resetCodeMinutes: +process.env.RESET_CODE_MINUTES || 10,
  resetMaxAttempts: +process.env.RESET_MAX_ATTEMPTS || 5,
  resetSessionMinutes: +process.env.RESET_SESSION_MINUTES || 10,
  resendCooldownSeconds: +process.env.RESET_RESEND_COOLDOWN_SECONDS || 60,
  resetMaxPerHour: +process.env.RESET_MAX_PER_HOUR || 5,
  smtp: {
    host: process.env.SMTP_HOST,
    port: +process.env.SMTP_PORT || 587,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.MAIL_FROM || 'Xenosys Security <no-reply@xenosys.lk>',
  },
};