const express = require('express');
const path = require('path');
const archiver = require('archiver');
const rateLimit = require('express-rate-limit');
const { auth } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();
const STARTERS_DIR = path.join(__dirname, '..', 'starters');
const STARTERS = new Set(['static-site', 'node-api', 'mern-tasks']);
const LESSON_ID = /^[a-z0-9][a-z0-9.:-]{1,80}$/;
const MAX_LESSONS = 1000;

const downloadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, max: 40, standardHeaders: true, legacyHeaders: false,
  message: { error: 'Too many downloads. Please try again later.' },
});

// Tested starter projects as a ZIP. Public: learners can try the guides before signing up.
router.get('/starter/:name', downloadLimiter, (req, res) => {
  const name = req.params.name;
  if (!STARTERS.has(name)) return res.status(404).json({ error: 'Unknown starter project' });

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${name}.zip"`);
  const zip = archiver('zip', { zlib: { level: 9 } });
  zip.on('error', () => res.destroy());
  zip.pipe(res);
  zip.directory(path.join(STARTERS_DIR, name), name); // dotfiles (.gitignore, .github/) are included
  zip.finalize();
});

// Learning progress (signed-in users only)
router.get('/progress', auth, (req, res) => {
  res.json({ success: true, data: { completed: req.user.learningProgress || [] } });
});

router.post('/progress', auth, async (req, res) => {
  const { lessonId, done } = req.body || {};
  if (typeof lessonId !== 'string' || !LESSON_ID.test(lessonId) || typeof done !== 'boolean') {
    return res.status(400).json({ error: 'Invalid lesson' });
  }
  const user = req.user;
  const set = new Set(user.learningProgress || []);
  if (done) {
    if (set.size >= MAX_LESSONS && !set.has(lessonId)) return res.status(400).json({ error: 'Too many items' });
    set.add(lessonId);
  } else {
    set.delete(lessonId);
  }
  user.learningProgress = [...set];
  await User.updateOne({ _id: user._id }, { $set: { learningProgress: user.learningProgress } });
  res.json({ success: true, data: { completed: user.learningProgress } });
});

module.exports = router;
