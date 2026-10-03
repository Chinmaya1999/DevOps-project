const express = require('express');
const rateLimit = require('express-rate-limit');
const { auth } = require('../middleware/auth');
const SecretScanner = require('../services/secretScanner');
const Troubleshooter = require('../services/troubleshooter');

const router = express.Router();
router.use(auth);
router.use(rateLimit({ windowMs: 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many requests, slow down.' } }));

// Scan pasted text for leaked credentials. Input is processed in memory only — never stored or logged.
router.post('/scan-secrets', (req, res) => {
  try {
    res.json({ success: true, data: SecretScanner.scan(req.body.text) });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Explain an error/log and suggest fixes
router.post('/troubleshoot', (req, res) => {
  try {
    res.json({ success: true, data: Troubleshooter.diagnose(req.body.text) });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;
