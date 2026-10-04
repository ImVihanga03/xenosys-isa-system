const nodemailer = require('nodemailer');
const cfg = require('../../config/env');

let transporter;
function getTransporter() {
  if (!cfg.smtp.host) return null;
  transporter ??= nodemailer.createTransport({
    host: cfg.smtp.host,
    port: cfg.smtp.port,
    secure: cfg.smtp.port === 465,
    auth: cfg.smtp.user ? { user: cfg.smtp.user, pass: cfg.smtp.pass } : undefined,
  });
  return transporter;
}

exports.sendMail = async ({ to, subject, text }) => {
  const t = getTransporter();
  if (!t) {
    if (cfg.nodeEnv === 'production') throw new Error('SMTP is not configured');
    console.log(`\n[DEV MAIL - SMTP not configured]\nTo: ${to}\nSubject: ${subject}\n${text}\n`);
    return;
  }
  await t.sendMail({ from: cfg.smtp.from, to, subject, text });
};