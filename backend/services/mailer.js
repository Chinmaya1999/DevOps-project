const nodemailer = require('nodemailer');

/**
 * One shared mail transport. Credentials come ONLY from the environment (EMAIL_USER, EMAIL_PASSWORD).
 * Nothing is hard-coded: a password in source code is a password in git history.
 */
const user = () => process.env.EMAIL_USER;
const pass = () => process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS;

const configured = () => Boolean(user() && pass());

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: user(), pass: pass() },
});

/** Escape text before putting it into an HTML email (form input is untrusted). */
const escapeHtml = (v) => String(v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

module.exports = { transporter, configured, escapeHtml, from: user };
