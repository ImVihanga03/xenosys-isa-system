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
};