const ContactMessage = require('../models/ContactMessage');
const { transporter, configured, escapeHtml } = require('../services/mailer');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Public contact form. The message is SAVED FIRST (admins read it in the admin panel), and only then
 * emailed as a notification — so a mail outage never loses a message.
 */
const submitContact = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body || {};
    if ([name, email, subject, message].some((v) => typeof v !== 'string' || !v.trim())) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Invalid email address' });
    if (name.length > 120 || subject.length > 200 || message.length > 5000 || email.length > 200) {
      return res.status(400).json({ error: 'One of the fields is too long' });
    }

    await ContactMessage.create({ name, email, subject, message, ip: req.ip });

    if (configured()) {
      transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_USER,
        replyTo: email,
        subject: `Contact form: ${subject}`.replace(/[\r\n]+/g, ' ').slice(0, 200),
        html: `<div style="font-family:Arial,sans-serif;max-width:600px">
          <h2>New contact form message</h2>
          <p><strong>Name:</strong> ${escapeHtml(name)}<br><strong>Email:</strong> ${escapeHtml(email)}<br><strong>Subject:</strong> ${escapeHtml(subject)}</p>
          <p style="white-space:pre-wrap;background:#f5f5f5;padding:12px;border-radius:6px">${escapeHtml(message)}</p>
          <p style="color:#666;font-size:12px">Also available in the admin panel → Messages.</p></div>`,
      }).catch((e) => console.error('Contact notification email failed:', e.message));
    }

    res.status(200).json({ message: 'Contact form submitted successfully' });
  } catch (error) {
    console.error('Contact form submission error:', error.message);
    res.status(500).json({ error: 'Failed to submit contact form. Please try again later.' });
  }
};

module.exports = { submitContact };
