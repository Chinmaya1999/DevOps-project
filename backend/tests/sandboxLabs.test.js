const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { LABS, LEVELS, publicLab } = require('../services/sandbox/labs');

// Processes the labs start in the background; killed after every lab so runs stay independent.
const BACKGROUND = ['sleep 4242', 'sleep 4243', 'sleep 9999', 'http.server 7300', 'http.server 7431', 'http.server 8081', 'http.server 8082', 'report-generator.sh', 'tail -f .*lab/var/log/app/app.log'];

const sh = (script, home, timeout = 20000) =>
  spawnSync('bash', ['-c', script], { env: { ...process.env, HOME: home }, cwd: home, timeout, stdio: 'ignore' });

const has = (req) => {
  if (req.startsWith('py:')) return spawnSync('python3', ['-c', `import ${req.slice(3)}`], { stdio: 'ignore' }).status === 0;
  return spawnSync('bash', ['-c', `command -v ${req}`], { stdio: 'ignore' }).status === 0;
};

test('lab catalogue is well formed', () => {
  const ids = new Set();
  for (const l of LABS) {
    assert.match(l.id, /^[a-z0-9-]{3,40}$/);
    assert.ok(!ids.has(l.id), `duplicate id ${l.id}`);
    ids.add(l.id);
    assert.ok(LEVELS.includes(l.level), `${l.id}: bad level`);
    assert.ok(l.title && l.goal && l.tasks.length && l.hints.length === 3 && l.setup && l.check && l.solution, `${l.id}: incomplete`);
    assert.ok(l.xp > 0);
  }
  for (const level of LEVELS) assert.ok(LABS.some((l) => l.level === level), `no ${level} labs`);
});

test('public lab never leaks setup, checks, solutions or hint text', () => {
  for (const l of LABS) {
    const p = publicLab(l);
    for (const k of ['setup', 'check', 'solution', 'hints', 'requires']) assert.ok(!(k in p), `${l.id} leaks ${k}`);
    assert.strictEqual(p.hintCount, 3);
  }
});

for (const l of LABS) {
  const missing = l.requires.filter((r) => !has(r));
  test(`lab ${l.id}: fails before the fix, passes after`, { skip: missing.length ? `host lacks: ${missing.join(', ')}` : false }, () => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'lab-'));
    try {
      assert.strictEqual(sh(l.setup, home).status, 0, 'setup failed');
      assert.notStrictEqual(sh(l.check, home).status, 0, 'check passes before the lab is solved');
      sh(l.solution, home);
      assert.strictEqual(sh(l.check, home).status, 0, 'check fails after the reference solution');
    } finally {
      for (const p of BACKGROUND) spawnSync('pkill', ['-f', p], { stdio: 'ignore' });
      spawnSync('chmod', ['-R', 'u+rwx', home], { stdio: 'ignore' });
      fs.rmSync(home, { recursive: true, force: true });
    }
  });
}
