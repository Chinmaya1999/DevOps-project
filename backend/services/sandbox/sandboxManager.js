/**
 * Runs each learner's terminal inside its own locked-down, throw-away Docker container.
 *
 * Isolation (every container, no exceptions):
 *   - unprivileged user, ALL capabilities dropped, no-new-privileges, read-only root filesystem
 *   - only /home/learner (64 MB) and /tmp (32 MB) are writable, both RAM-backed tmpfs
 *   - hard CPU / memory / PID / file-descriptor limits, swap disabled
 *   - NO network (loopback only) unless SANDBOX_NETWORK names a dedicated egress-filtered network
 *   - no host mounts, no docker socket, auto-removed when it stops
 *   - hard session limit from the user's plan + idle timeout; orphans are reaped at boot and every few minutes
 *
 * Configuration (all optional except SANDBOX_ENABLED):
 *   SANDBOX_ENABLED=true            turn the feature on
 *   SANDBOX_IMAGE                   default cmdevops-sandbox:latest (build from /sandbox)
 *   SANDBOX_DOCKER_HOST             tcp://host:2376 of a DEDICATED sandbox host (strongly recommended), with
 *   SANDBOX_DOCKER_TLS_DIR          directory holding ca.pem, cert.pem, key.pem. Without it only loopback is allowed.
 *   SANDBOX_DOCKER_SOCKET           local socket path (default /var/run/docker.sock) when no host is set
 *   SANDBOX_RUNTIME                 e.g. runsc (gVisor) or kata-runtime for stronger isolation
 *   SANDBOX_NETWORK                 default none
 *   SANDBOX_MAX_SESSIONS            default 20 concurrent containers
 *   SANDBOX_MEMORY_MB / SANDBOX_CPUS / SANDBOX_PIDS   per-container limits (128 / 0.25 / 64)
 *   SANDBOX_IDLE_MINUTES            default 10
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const EventEmitter = require('events');
const { PassThrough } = require('stream');
const Docker = require('dockerode');
const { getLab } = require('./labs');

const HOME = '/home/learner';
const ENV = ['HOME=/home/learner', 'USER=learner', 'LANG=C.UTF-8', 'TERM=xterm-256color', 'SHELL=/bin/bash'];
const LABEL = 'cmdevops.sandbox';
const BACKLOG_BYTES = 16 * 1024;
const TAIL_CHARS = 2000;
const MAX_UPLOAD_BYTES = 64 * 1024;

const err = (code, message) => Object.assign(new Error(message || code), { code });
const num = (v, d) => (Number.isFinite(Number(v)) && Number(v) > 0 ? Number(v) : d);

const cfg = () => ({
  enabled: process.env.SANDBOX_ENABLED === 'true',
  image: process.env.SANDBOX_IMAGE || 'cmdevops-sandbox:latest',
  runtime: process.env.SANDBOX_RUNTIME || undefined,
  network: process.env.SANDBOX_NETWORK || 'none',
  maxSessions: num(process.env.SANDBOX_MAX_SESSIONS, 20),
  memoryMb: num(process.env.SANDBOX_MEMORY_MB, 128),
  cpus: num(process.env.SANDBOX_CPUS, 0.25),
  pids: num(process.env.SANDBOX_PIDS, 64),
  idleMs: num(process.env.SANDBOX_IDLE_MINUTES, 10) * 60 * 1000,
});

let docker = null;
const getDocker = () => {
  if (docker) return docker;
  const host = process.env.SANDBOX_DOCKER_HOST;
  if (host) {
    const u = new URL(host);
    const tlsDir = process.env.SANDBOX_DOCKER_TLS_DIR;
    const loopback = ['127.0.0.1', 'localhost', '::1'].includes(u.hostname);
    // An unauthenticated Docker TCP port is root on that machine, so never allow it over a real network.
    if (!tlsDir && !loopback) throw err('INSECURE_DOCKER_HOST', 'SANDBOX_DOCKER_HOST needs SANDBOX_DOCKER_TLS_DIR');
    const opts = { host: u.hostname, port: Number(u.port) || 2376, protocol: tlsDir ? 'https' : 'http' };
    if (tlsDir) {
      opts.ca = fs.readFileSync(path.join(tlsDir, 'ca.pem'));
      opts.cert = fs.readFileSync(path.join(tlsDir, 'cert.pem'));
      opts.key = fs.readFileSync(path.join(tlsDir, 'key.pem'));
    }
    docker = new Docker(opts);
  } else {
    docker = new Docker({ socketPath: process.env.SANDBOX_DOCKER_SOCKET || '/var/run/docker.sock' });
  }
  return docker;
};

const sessions = new Map(); // userId -> session
const shares = new Map(); // share code -> userId

const stripAnsi = (s) => s.replace(/\x1b\[[0-9;?]*[ -/]*[@-~]|\x1b\][^\x07]*\x07|\r/g, '');

/** Run a non-interactive command in the container as `learner`; returns { code, output }. */
async function execCapture(container, script, { timeoutSec = 10, args = [] } = {}) {
  const exec = await container.exec({
    Cmd: ['timeout', '-s', 'KILL', String(timeoutSec), 'bash', '-c', script, 'sandbox', ...args],
    AttachStdout: true, AttachStderr: true, User: 'learner', WorkingDir: HOME, Env: ENV,
  });
  const stream = await exec.start({});
  const sink = new PassThrough();
  let output = '';
  sink.on('data', (d) => { if (output.length < 16384) output += d.toString('utf8'); });
  container.modem.demuxStream(stream, sink, sink);
  await new Promise((resolve) => {
    const t = setTimeout(resolve, (timeoutSec + 3) * 1000);
    const done = () => { clearTimeout(t); resolve(); };
    stream.on('end', done); stream.on('close', done); stream.on('error', done);
  });
  const info = await exec.inspect().catch(() => ({}));
  return { code: typeof info.ExitCode === 'number' ? info.ExitCode : -1, output };
}

const isEnabled = () => cfg().enabled;

let pingCache = { at: 0, ok: false };
/** Is the Docker host reachable? Cached briefly so a status page cannot hammer it. */
async function isAvailable() {
  if (!isEnabled()) return false;
  if (Date.now() - pingCache.at < 15000) return pingCache.ok;
  let ok = false;
  try { await getDocker().ping(); ok = true; } catch { ok = false; }
  pingCache = { at: Date.now(), ok };
  return ok;
}

const activeCount = () => sessions.size;
const getSession = (userId) => sessions.get(String(userId)) || null;

/**
 * Start a sandbox for a user. `lab` is optional (free play when omitted).
 * Resolves to the session; its `events` emitter fires: 'data' (Buffer), 'warning' (secondsLeft), 'end' (reason).
 */
async function start({ userId, lab = null, minutes = 15, cols = 80, rows = 24 }) {
  const c = cfg();
  userId = String(userId);
  if (!c.enabled) throw err('DISABLED', 'The sandbox is not enabled on this server');
  if (sessions.has(userId)) throw err('ALREADY_ACTIVE', 'You already have a running sandbox');
  if (sessions.size >= c.maxSessions) throw err('CAPACITY', 'All sandboxes are busy right now. Please try again in a few minutes.');

  const s = {
    userId, labId: lab ? lab.id : null, hintsUsed: 0, checking: false, closed: false,
    startedAt: Date.now(), expiresAt: Date.now() + minutes * 60 * 1000, lastInput: Date.now(),
    events: new EventEmitter(), backlog: Buffer.alloc(0), tail: '', share: null, timers: [],
  };
  s.events.setMaxListeners(20);
  sessions.set(userId, s); // reserve the slot before any await

  try {
    const d = getDocker();
    const container = await d.createContainer({
      Image: c.image,
      name: `cmdsbx-${userId.slice(-8)}-${crypto.randomBytes(4).toString('hex')}`,
      Cmd: ['sleep', 'infinity'],
      User: 'learner', WorkingDir: HOME, Env: ENV,
      Labels: { [LABEL]: '1', 'cmdevops.user': userId },
      HostConfig: {
        AutoRemove: true, Init: true, Privileged: false, Runtime: c.runtime,
        NetworkMode: c.network,
        Memory: c.memoryMb * 1024 * 1024, MemorySwap: c.memoryMb * 1024 * 1024,
        NanoCpus: Math.round(c.cpus * 1e9), PidsLimit: c.pids,
        CapDrop: ['ALL'], SecurityOpt: ['no-new-privileges'],
        ReadonlyRootfs: true,
        Tmpfs: {
          [HOME]: 'rw,exec,nosuid,size=64m,uid=1000,gid=1000,mode=0755',
          '/tmp': 'rw,noexec,nosuid,size=32m,mode=1777',
        },
        Ulimits: [{ Name: 'nofile', Soft: 256, Hard: 256 }, { Name: 'core', Soft: 0, Hard: 0 }],
      },
    });
    s.container = container;
    await container.start();
    if (s.closed) throw err('CLOSED');

    await execCapture(container, '/opt/sandbox/init.sh', { timeoutSec: 10 });
    if (lab) {
      const r = await execCapture(container, lab.setup, { timeoutSec: 25 });
      if (r.code !== 0) throw err('SETUP_FAILED', 'Could not prepare the lab');
    }
    if (s.closed) throw err('CLOSED');

    const exec = await container.exec({
      Cmd: ['/bin/bash', '-l'], AttachStdin: true, AttachStdout: true, AttachStderr: true, Tty: true,
      User: 'learner', WorkingDir: HOME, Env: ENV,
    });
    s.exec = exec;
    s.stream = await exec.start({ hijack: true, stdin: true, Tty: true });
    exec.resize({ h: rows, w: cols }).catch(() => {});

    s.stream.on('data', (chunk) => {
      s.backlog = Buffer.concat([s.backlog, chunk]).subarray(-BACKLOG_BYTES);
      s.tail = (s.tail + stripAnsi(chunk.toString('utf8'))).slice(-TAIL_CHARS);
      s.events.emit('data', chunk);
    });
    s.stream.on('end', () => destroy(userId, 'shell-exited'));
    s.stream.on('close', () => destroy(userId, 'shell-exited'));
    s.stream.on('error', () => destroy(userId, 'error'));

    s.timers.push(setTimeout(() => destroy(userId, 'time-limit'), minutes * 60 * 1000));
    if (minutes > 3) s.timers.push(setTimeout(() => s.events.emit('warning', 120), (minutes * 60 - 120) * 1000));
    s.timers.push(setInterval(() => { if (Date.now() - s.lastInput > c.idleMs) destroy(userId, 'idle'); }, 30000));
    return s;
  } catch (e) {
    await destroy(userId, 'error');
    throw e.code ? e : err('START_FAILED', 'Could not start the sandbox');
  }
}

/** Stop and remove a user's sandbox. Safe to call repeatedly. */
async function destroy(userId, reason = 'stopped') {
  userId = String(userId);
  const s = sessions.get(userId);
  if (!s || s.closed) return;
  s.closed = true;
  sessions.delete(userId);
  for (const t of s.timers) { clearTimeout(t); clearInterval(t); }
  if (s.share) shares.delete(s.share.code);
  try { s.stream && s.stream.destroy(); } catch { /* already closed */ }
  s.events.emit('end', reason);
  s.events.removeAllListeners();
  if (s.container) await s.container.remove({ force: true }).catch(() => {});
}

function write(userId, data) {
  const s = sessions.get(String(userId));
  if (!s || !s.stream || s.closed) return false;
  if (typeof data !== 'string' || data.length > 4096) return false;
  s.lastInput = Date.now();
  s.stream.write(data);
  return true;
}

function resize(userId, cols, rows) {
  const s = sessions.get(String(userId));
  if (!s || !s.exec) return;
  const w = Math.min(Math.max(parseInt(cols, 10) || 80, 20), 300);
  const h = Math.min(Math.max(parseInt(rows, 10) || 24, 5), 100);
  s.exec.resize({ w, h }).catch(() => {});
}

/** Run the lab's validator against the live container. Output is NOT returned (it could reveal the answer). */
async function check(userId) {
  const s = sessions.get(String(userId));
  if (!s || s.closed) throw err('NO_SESSION', 'Start a sandbox first');
  if (!s.labId) throw err('NO_LAB', 'This is a free-play session. Start a lab to be checked.');
  if (s.checking) throw err('BUSY', 'A check is already running');
  s.checking = true;
  try {
    const r = await execCapture(s.container, getLab(s.labId).check, { timeoutSec: 12 });
    s.lastInput = Date.now();
    return { passed: r.code === 0, hintsUsed: s.hintsUsed, labId: s.labId };
  } finally { s.checking = false; }
}

/** Copy a text file into the learner's home (used to try generated scripts before deploying them). */
async function putFile(userId, name, content) {
  const s = sessions.get(String(userId));
  if (!s || s.closed) throw err('NO_SESSION', 'Start a sandbox first');
  if (typeof name !== 'string' || !/^[A-Za-z0-9._-]{1,64}$/.test(name) || name.startsWith('.')) throw err('BAD_NAME', 'Invalid file name');
  if (typeof content !== 'string' || Buffer.byteLength(content) > MAX_UPLOAD_BYTES) throw err('TOO_BIG', 'File is too large (64 KB max)');
  const b64 = Buffer.from(content, 'utf8').toString('base64');
  const r = await execCapture(s.container,
    'printf %s "$1" | base64 -d > "$HOME/$2" && case "$2" in *.sh) chmod 755 "$HOME/$2";; esac', { args: [b64, name] });
  if (r.code !== 0) throw err('WRITE_FAILED', 'Could not write the file');
  return { path: `${HOME}/${name}` };
}

// ── shared (pair) terminals ──────────────────────────────────────────────
function startShare(userId, allowWrite = false) {
  const s = sessions.get(String(userId));
  if (!s || s.closed) throw err('NO_SESSION', 'Start a sandbox first');
  if (s.share) shares.delete(s.share.code);
  const code = crypto.randomBytes(5).toString('hex').toUpperCase(); // 10 hex chars
  s.share = { code, allowWrite: Boolean(allowWrite), guests: new Set() };
  shares.set(code, String(userId));
  return { code, allowWrite: s.share.allowWrite };
}
const stopShare = (userId) => {
  const s = sessions.get(String(userId));
  if (s && s.share) { shares.delete(s.share.code); s.share = null; }
};
const sessionByShare = (code) => {
  const owner = shares.get(String(code || '').toUpperCase());
  return owner ? sessions.get(owner) || null : null;
};

// ── housekeeping ─────────────────────────────────────────────────────────
/** Remove every sandbox container (used at boot: after a crash nobody owns them). */
async function reapAll() {
  if (!isEnabled()) return 0;
  try {
    const list = await getDocker().listContainers({ all: true, filters: { label: [`${LABEL}=1`] } });
    await Promise.all(list.map((c) => getDocker().getContainer(c.Id).remove({ force: true }).catch(() => {})));
    return list.length;
  } catch { return 0; }
}

/** Remove containers that outlived their session (leaks from crashes / lost sockets). */
async function sweepOrphans(maxAgeMs = 3 * 60 * 60 * 1000) {
  if (!isEnabled()) return;
  try {
    const list = await getDocker().listContainers({ filters: { label: [`${LABEL}=1`] } });
    const known = new Set([...sessions.values()].map((s) => s.container && s.container.id).filter(Boolean));
    for (const c of list) {
      const old = Date.now() - c.Created * 1000 > maxAgeMs;
      if (!known.has(c.Id) && (old || sessions.size === 0)) await getDocker().getContainer(c.Id).remove({ force: true }).catch(() => {});
    }
  } catch { /* docker unavailable; nothing to sweep */ }
}

let sweeper = null;
function startHousekeeping() {
  if (!isEnabled() || sweeper) return;
  reapAll().then((n) => n && console.log(`Sandbox: removed ${n} leftover container(s)`));
  sweeper = setInterval(() => sweepOrphans(), 5 * 60 * 1000);
  sweeper.unref();
}

async function shutdown() {
  await Promise.all([...sessions.keys()].map((id) => destroy(id, 'server-shutdown')));
}

module.exports = {
  isEnabled, isAvailable, activeCount, getSession, start, destroy, write, resize, check, putFile,
  startShare, stopShare, sessionByShare, startHousekeeping, reapAll, shutdown,
  MAX_UPLOAD_BYTES,
};
