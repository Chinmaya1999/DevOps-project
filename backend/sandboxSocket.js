/**
 * Socket.IO namespace /sandbox: the browser terminal <-> the user's sandbox container.
 *
 * Client -> server (all take an optional ack callback):
 *   attach                    re-join a running sandbox (page refresh)
 *   start {labId?, cols, rows}
 *   input <string>            keystrokes (owner, or a guest when the owner allowed writing)
 *   resize {cols, rows}
 *   stop
 *   check                     validate the current lab
 *   hint                      next static hint (costs a little XP)
 *   ai-hint {question}        optional AI tutor
 *   upload {name, content}    put a text file in the home directory
 *   load-generated {id}       put one of the user's generated files in the home directory
 *   share-start {allowWrite} / share-stop / share-join {code} / share-leave
 * Server -> client: output (binary), warning {secondsLeft}, ended {reason}, share-update {guests}
 */
const User = require('./models/User');
const GeneratedFile = require('./models/GeneratedFile');
const manager = require('./services/sandbox/sandboxManager');
const aiHint = require('./services/sandbox/aiHint');
const { getLab } = require('./services/sandbox/labs');
const { consumeSession, refundSession, completeLab } = require('./services/sandbox/progress');
const { getEffectivePlan } = require('./services/plans');

const GRACE_MS = 60 * 1000; // keep the sandbox alive this long after the browser disconnects (refresh / flaky wifi)
const MAX_GUESTS = 5;
const OUT_LIMIT_BYTES = 1.5 * 1024 * 1024; // per second; beyond this the terminal is paused briefly (e.g. `yes`)

const room = (userId) => `sbx:${userId}`;
const ERRORS = {
  DISABLED: 'The sandbox is not enabled on this server.',
  ALREADY_ACTIVE: 'You already have a running sandbox.',
  CAPACITY: 'All sandboxes are busy right now. Please try again in a few minutes.',
  SETUP_FAILED: 'Could not prepare this lab. Please try again.',
};

function register(io, authenticate) {
  const nsp = io.of('/sandbox');
  nsp.use(authenticate);
  manager.startHousekeeping();

  const owners = new Map(); // userId -> { socketId, timer }

  const bindSession = (userId, session) => {
    let win = { start: Date.now(), bytes: 0 };
    session.events.on('data', (chunk) => {
      nsp.to(room(userId)).emit('output', chunk);
      const now = Date.now();
      if (now - win.start > 1000) win = { start: now, bytes: 0 };
      win.bytes += chunk.length;
      if (win.bytes > OUT_LIMIT_BYTES && session.stream && !session.stream.isPaused()) {
        session.stream.pause();
        setTimeout(() => { try { session.stream.resume(); } catch { /* closed */ } }, 600);
      }
    });
    session.events.on('warning', (secondsLeft) => nsp.to(room(userId)).emit('warning', { secondsLeft }));
    session.events.on('end', (reason) => {
      nsp.to(room(userId)).emit('ended', { reason });
      nsp.in(room(userId)).socketsLeave(room(userId));
      const o = owners.get(userId);
      if (o) { clearTimeout(o.timer); owners.delete(userId); }
    });
  };

  const claimOwner = (socket) => {
    const prev = owners.get(socket.userId);
    if (prev) clearTimeout(prev.timer);
    owners.set(socket.userId, { socketId: socket.id, timer: null });
    socket.isOwner = true;
    socket.join(room(socket.userId));
  };

  const guestCount = (session) => (session.share ? session.share.guests.size : 0);
  const announceGuests = (session) =>
    nsp.to(room(session.userId)).emit('share-update', { guests: guestCount(session), allowWrite: Boolean(session.share && session.share.allowWrite) });

  nsp.on('connection', (socket) => {
    // per-socket flood protection (keystrokes are small but frequent)
    let budget = 200;
    const refill = setInterval(() => { budget = 200; }, 1000);
    socket.use((packet, next) => (budget-- > 0 ? next() : next(new Error('Rate limit exceeded'))));

    const ack = (cb, payload) => { if (typeof cb === 'function') cb(payload); };
    const fail = (cb, e, fallback = 'Something went wrong') =>
      ack(cb, { ok: false, code: typeof e.code === 'string' ? e.code : 'ERROR', error: ERRORS[e.code] || (typeof e.code === 'string' && e.message) || fallback });
    const own = () => (socket.isOwner ? manager.getSession(socket.userId) : null);

    socket.on('attach', (cb) => {
      const s = manager.getSession(socket.userId);
      if (!s) return ack(cb, { ok: false });
      claimOwner(socket);
      ack(cb, { ok: true, labId: s.labId, expiresAt: s.expiresAt, hintsUsed: s.hintsUsed });
      if (s.backlog.length) socket.emit('output', s.backlog);
    });

    socket.on('start', async (data, cb) => {
      try {
        const { labId, cols, rows } = data || {};
        const user = await User.findById(socket.userId);
        if (!user || !user.isActive) throw Object.assign(new Error('Not allowed'), { code: 'FORBIDDEN' });
        const plan = getEffectivePlan(user);
        const limits = plan.sandbox;

        let lab = null;
        if (labId) {
          lab = typeof labId === 'string' ? getLab(labId) : null;
          if (!lab) throw Object.assign(new Error('Unknown lab'), { code: 'BAD_LAB' });
          if (!limits.levels.includes(lab.level)) {
            throw Object.assign(new Error('This lab is part of the Pro plan.'), { code: 'UPGRADE_REQUIRED' });
          }
        }
        if (manager.getSession(socket.userId)) throw Object.assign(new Error('x'), { code: 'ALREADY_ACTIVE' });
        if (!(await consumeSession(user._id, limits.sessionsPerDay))) {
          throw Object.assign(new Error(`You have used today's ${limits.sessionsPerDay} sandbox sessions. Try again tomorrow${plan.plan === 'free' ? ' or upgrade to Pro.' : '.'}`), { code: 'DAILY_LIMIT' });
        }
        let session;
        try {
          session = await manager.start({ userId: socket.userId, lab, minutes: limits.sessionMinutes, cols, rows });
        } catch (e) {
          await refundSession(user._id).catch(() => {});
          throw e;
        }
        claimOwner(socket);
        bindSession(socket.userId, session);
        if (!socket.connected) { // the tab closed while the sandbox was starting
          const o = owners.get(socket.userId);
          if (o) o.timer = setTimeout(() => { owners.delete(socket.userId); manager.destroy(socket.userId, 'disconnected'); }, GRACE_MS);
        }
        ack(cb, { ok: true, labId: session.labId, expiresAt: session.expiresAt, minutes: limits.sessionMinutes });
      } catch (e) {
        if (!e.code || e.code === 'START_FAILED' || e.code === 'ERROR') console.error('Sandbox start failed:', e.message);
        fail(cb, e, 'Could not start the sandbox');
      }
    });

    socket.on('input', (data) => {
      if (typeof data !== 'string') return;
      if (socket.isOwner) return void manager.write(socket.userId, data);
      if (socket.guestOf) {
        const s = manager.getSession(socket.guestOf);
        if (s && s.share && s.share.allowWrite) manager.write(socket.guestOf, data);
      }
    });

    socket.on('resize', (data) => {
      if (!socket.isOwner) return;
      const { cols, rows } = data || {};
      manager.resize(socket.userId, cols, rows);
    });

    socket.on('stop', async (cb) => {
      if (socket.isOwner) await manager.destroy(socket.userId, 'stopped');
      ack(cb, { ok: true });
    });

    socket.on('check', async (cb) => {
      try {
        const s = own();
        if (!s) throw Object.assign(new Error('Start a sandbox first'), { code: 'NO_SESSION' });
        const r = await manager.check(socket.userId);
        if (!r.passed) return ack(cb, { ok: true, passed: false });
        const lab = getLab(r.labId);
        const xp = await completeLab(socket.userId, lab, r.hintsUsed);
        ack(cb, { ok: true, passed: true, xp, alreadyDone: xp === 0 });
      } catch (e) { fail(cb, e, 'Could not check the lab'); }
    });

    socket.on('hint', (cb) => {
      const s = own();
      if (!s || !s.labId) return ack(cb, { ok: false, error: 'Hints are available inside a lab.' });
      const lab = getLab(s.labId);
      if (s.hintsUsed >= lab.hints.length) return ack(cb, { ok: true, none: true, total: lab.hints.length });
      const index = s.hintsUsed++;
      ack(cb, { ok: true, hint: lab.hints[index], index, total: lab.hints.length });
    });

    socket.on('ai-hint', async (data, cb) => {
      try {
        const s = own();
        if (!s) throw Object.assign(new Error('Start a sandbox first'), { code: 'NO_SESSION' });
        const text = await aiHint.askTutor({
          userId: socket.userId, lab: s.labId ? getLab(s.labId) : null,
          question: data && data.question, terminalTail: s.tail,
        });
        s.hintsUsed += 1; // an AI nudge costs like a hint
        ack(cb, { ok: true, hint: text });
      } catch (e) {
        if (e.response) console.error('AI hint failed:', e.response.status);
        fail(cb, e.code && e.code.startsWith('AI_') ? e : { code: 'AI_ERROR', message: 'The AI tutor is unavailable right now.' });
      }
    });

    socket.on('upload', async (data, cb) => {
      try {
        if (!own()) throw Object.assign(new Error('Start a sandbox first'), { code: 'NO_SESSION' });
        const { name, content } = data || {};
        ack(cb, { ok: true, ...(await manager.putFile(socket.userId, name, content)) });
      } catch (e) { fail(cb, e, 'Upload failed'); }
    });

    socket.on('load-generated', async (data, cb) => {
      try {
        if (!own()) throw Object.assign(new Error('Start a sandbox first'), { code: 'NO_SESSION' });
        const id = data && data.id;
        if (typeof id !== 'string' || !/^[a-f0-9]{24}$/i.test(id)) throw Object.assign(new Error('Invalid file'), { code: 'BAD_FILE' });
        const file = await GeneratedFile.findOne({ _id: id, userId: socket.userId }).select('fileName content type');
        if (!file) throw Object.assign(new Error('File not found'), { code: 'BAD_FILE' });
        const safe = String(file.fileName || `${file.type}.txt`).replace(/[^A-Za-z0-9._-]/g, '_').replace(/^\.+/, '').slice(0, 64) || 'generated.txt';
        ack(cb, { ok: true, ...(await manager.putFile(socket.userId, safe, file.content)) });
      } catch (e) { fail(cb, e, 'Could not load the file'); }
    });

    // ── pair terminal ──
    socket.on('share-start', (data, cb) => {
      try {
        if (!own()) throw Object.assign(new Error('Start a sandbox first'), { code: 'NO_SESSION' });
        const info = manager.startShare(socket.userId, Boolean(data && data.allowWrite));
        announceGuests(manager.getSession(socket.userId));
        ack(cb, { ok: true, ...info });
      } catch (e) { fail(cb, e); }
    });

    socket.on('share-stop', (cb) => {
      const s = own();
      if (s) {
        for (const g of nsp.sockets.values()) {
          if (g.guestOf === socket.userId) { g.guestOf = null; g.leave(room(socket.userId)); g.emit('ended', { reason: 'share-stopped' }); }
        }
        manager.stopShare(socket.userId);
        announceGuests(s);
      }
      ack(cb, { ok: true });
    });

    socket.on('share-join', (data, cb) => {
      const code = data && data.code;
      const s = typeof code === 'string' ? manager.sessionByShare(code) : null;
      if (!s || !s.share || s.userId === socket.userId) return ack(cb, { ok: false, error: 'Invalid or expired share code.' });
      if (s.share.guests.size >= MAX_GUESTS) return ack(cb, { ok: false, error: 'This shared session is full.' });
      s.share.guests.add(socket.id);
      socket.guestOf = s.userId;
      socket.join(room(s.userId));
      ack(cb, { ok: true, allowWrite: s.share.allowWrite, labId: s.labId, expiresAt: s.expiresAt });
      if (s.backlog.length) socket.emit('output', s.backlog);
      announceGuests(s);
    });

    const leaveGuest = () => {
      if (!socket.guestOf) return;
      const s = manager.getSession(socket.guestOf);
      socket.leave(room(socket.guestOf));
      socket.guestOf = null;
      if (s && s.share) { s.share.guests.delete(socket.id); announceGuests(s); }
    };
    socket.on('share-leave', (cb) => { leaveGuest(); ack(cb, { ok: true }); });

    socket.on('disconnect', () => {
      clearInterval(refill);
      leaveGuest();
      const o = owners.get(socket.userId);
      if (socket.isOwner && o && o.socketId === socket.id) {
        // give a refresh / reconnect a minute to re-attach before throwing the sandbox away
        o.timer = setTimeout(() => { owners.delete(socket.userId); manager.destroy(socket.userId, 'disconnected'); }, GRACE_MS);
      }
    });
  });
}

module.exports = { register };
