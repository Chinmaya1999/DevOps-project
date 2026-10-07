const express = require('express');
const { auth } = require('../middleware/auth');
const { attachPlan } = require('../middleware/subscription');
const GeneratedFile = require('../models/GeneratedFile');
const manager = require('../services/sandbox/sandboxManager');
const aiHint = require('../services/sandbox/aiHint');
const { LABS, publicLab } = require('../services/sandbox/labs');
const { getProgress } = require('../services/sandbox/progress');

const router = express.Router();
router.use(auth, attachPlan);

// Is the sandbox on, reachable, and what may this user do with it?
router.get('/status', async (req, res) => {
  const limits = req.plan.sandbox;
  res.json({
    success: true,
    data: {
      enabled: manager.isEnabled(),
      available: await manager.isAvailable(),
      aiHints: aiHint.isEnabled(),
      plan: req.plan.plan,
      limits,
      active: Boolean(manager.getSession(req.user._id)),
    },
  });
});

// Lab catalogue. Setup scripts, validators and solutions never leave the server.
router.get('/labs', async (req, res) => {
  const progress = await getProgress(req.user._id);
  const done = new Set(progress.completed.map((c) => c.labId));
  const allowed = new Set(req.plan.sandbox.levels);
  res.json({
    success: true,
    data: {
      labs: LABS.map((l) => ({ ...publicLab(l), completed: done.has(l.id), locked: !allowed.has(l.level) })),
      progress,
    },
  });
});

router.get('/progress', async (req, res) => {
  res.json({ success: true, data: await getProgress(req.user._id) });
});

// The user's own generated files, so they can try one in the sandbox before deploying it.
router.get('/generated', async (req, res) => {
  const files = await GeneratedFile.find({ userId: req.user._id })
    .sort({ createdAt: -1 }).limit(30).select('name type fileName createdAt').lean();
  res.json({ success: true, data: files });
});

module.exports = router;
