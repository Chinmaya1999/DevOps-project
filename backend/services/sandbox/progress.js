const LabProgress = require('../../models/LabProgress');
const { LABS, LEVELS } = require('./labs');

const utcDay = () => new Date().toISOString().slice(0, 10);

/** Atomically count one new sandbox session against today's plan limit. Returns false when the limit is used up. */
async function consumeSession(userId, perDay) {
  const today = utcDay();
  await LabProgress.updateOne({ user: userId }, { $setOnInsert: { user: userId } }, { upsert: true });
  await LabProgress.updateOne({ user: userId, 'usage.day': { $ne: today } }, { $set: { 'usage.day': today, 'usage.sessions': 0 } });
  const r = await LabProgress.updateOne(
    { user: userId, 'usage.day': today, 'usage.sessions': { $lt: perDay } },
    { $inc: { 'usage.sessions': 1, totalSessions: 1 } });
  return r.modifiedCount === 1;
}

const refundSession = (userId) =>
  LabProgress.updateOne({ user: userId, 'usage.sessions': { $gt: 0 } }, { $inc: { 'usage.sessions': -1, totalSessions: -1 } });

/** XP shrinks a little for every hint used, but never below half. Returns the XP awarded (0 if already completed). */
async function completeLab(userId, lab, hintsUsed = 0) {
  const xp = Math.max(Math.ceil(lab.xp / 2), lab.xp - 3 * hintsUsed);
  const r = await LabProgress.updateOne(
    { user: userId, 'completed.labId': { $ne: lab.id } },
    { $push: { completed: { labId: lab.id, xp, hintsUsed, completedAt: new Date() } }, $inc: { xp } });
  return r.modifiedCount === 1 ? xp : 0;
}

async function getProgress(userId) {
  const doc = await LabProgress.findOne({ user: userId }).lean();
  const completed = (doc && doc.completed) || [];
  const done = new Set(completed.map((c) => c.labId));
  const levels = {};
  for (const level of LEVELS) {
    const all = LABS.filter((l) => l.level === level);
    const n = all.filter((l) => done.has(l.id)).length;
    levels[level] = { done: n, total: all.length, certified: all.length > 0 && n === all.length };
  }
  const today = utcDay();
  return {
    xp: (doc && doc.xp) || 0,
    completed,
    levels,
    sessionsToday: doc && doc.usage && doc.usage.day === today ? doc.usage.sessions : 0,
  };
}

module.exports = { consumeSession, refundSession, completeLab, getProgress };
