const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

process.env.JWT_SECRET = 'x'.repeat(40);
process.env.DATA_ENCRYPTION_KEY = 'ab'.repeat(32);

const STARTERS = path.join(__dirname, '..', 'starters');
const NAMES = ['static-site', 'node-api', 'mern-tasks'];

const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) =>
  e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);

test('every starter has the files the guides refer to', () => {
  const expected = {
    'static-site': ['index.html', 'style.css', 'script.js', 'Dockerfile', '.github/workflows/deploy.yml', '.gitignore'],
    'node-api': ['server.js', 'package.json', 'Dockerfile', 'docker-compose.yml', '.github/workflows/deploy.yml', '.gitignore', '.dockerignore'],
    'mern-tasks': ['docker-compose.yml', 'api/server.js', 'api/package.json', 'api/Dockerfile', 'web/package.json', 'web/Dockerfile',
      'web/nginx.conf', 'web/vite.config.js', 'web/index.html', 'web/src/App.jsx', 'web/src/main.jsx', '.github/workflows/deploy.yml', '.gitignore'],
  };
  for (const name of NAMES) for (const f of expected[name]) assert.ok(fs.existsSync(path.join(STARTERS, name, f)), `${name}/${f} missing`);
});

test('all starter YAML and JSON parse; compose files do not publish databases to the internet', () => {
  for (const f of NAMES.flatMap((n) => walk(path.join(STARTERS, n)))) {
    if (/\.ya?ml$/.test(f)) yaml.load(fs.readFileSync(f, 'utf8'));
    if (/\.json$/.test(f)) JSON.parse(fs.readFileSync(f, 'utf8'));
  }
  for (const f of ['node-api/docker-compose.yml', 'mern-tasks/docker-compose.yml']) {
    const doc = yaml.load(fs.readFileSync(path.join(STARTERS, f), 'utf8'));
    for (const [svc, def] of Object.entries(doc.services)) {
      for (const p of def.ports || []) assert.match(String(p), /^127\.0\.0\.1:/, `${f}: ${svc} publishes ${p} publicly`);
    }
    assert.ok(!doc.services.mongo?.ports, 'MongoDB must never be published');
  }
});

test('starters contain no secrets, no node_modules and no build output', () => {
  for (const f of NAMES.flatMap((n) => walk(path.join(STARTERS, n)))) {
    assert.ok(!/node_modules|[\\/]dist[\\/]/.test(f), f);
    const text = fs.readFileSync(f, 'utf8');
    assert.ok(!/AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----|ghp_[A-Za-z0-9]{20,}/.test(text), 'secret-looking text in ' + f);
  }
});

test('deploy workflows use only plain ssh and reference the secrets the guides tell people to create', () => {
  for (const n of NAMES) {
    const wf = fs.readFileSync(path.join(STARTERS, n, '.github/workflows/deploy.yml'), 'utf8');
    const doc = yaml.load(wf);
    assert.deepStrictEqual(doc.on.push.branches, ['main']);
    for (const s of ['SSH_HOST', 'SSH_USER', 'SSH_KEY']) assert.match(wf, new RegExp(`secrets\\.${s}`));
    assert.ok(!/uses:/.test(wf), 'no third-party actions needed');
  }
});

// ---- HTTP: ZIP download + progress ----
let MongoMemoryServer;
try { ({ MongoMemoryServer } = require('mongodb-memory-server')); } catch { /* skipped */ }
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
let mongod, server, base;

// minimal ZIP reader: list file names from the central directory
const zipNames = (buf) => {
  const names = [];
  for (let i = 0; i < buf.length - 46; i++) {
    if (buf.readUInt32LE(i) === 0x02014b50) {
      const len = buf.readUInt16LE(i + 28);
      names.push(buf.toString('utf8', i + 46, i + 46 + len));
    }
  }
  return names;
};

test.before(async () => {
  if (!MongoMemoryServer) return;
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  const app = express();
  app.use(express.json());
  app.use('/api/learn', require('../routes/learn'));
  await new Promise((r) => { server = app.listen(0, r); });
  base = `http://127.0.0.1:${server.address().port}`;
});
test.after(async () => { if (server) server.close(); await mongoose.disconnect(); if (mongod) await mongod.stop(); });
const guard = (n, fn) => test(n, { skip: !MongoMemoryServer && 'mongodb-memory-server not installed' }, fn);

guard('starter ZIPs download without login and include dotfiles; unknown names and traversal are refused', async () => {
  for (const name of NAMES) {
    const res = await fetch(`${base}/api/learn/starter/${name}`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.headers.get('content-type'), 'application/zip');
    const names = zipNames(Buffer.from(await res.arrayBuffer()));
    assert.ok(names.includes(`${name}/.gitignore`), `${name}: .gitignore missing from zip`);
    assert.ok(names.includes(`${name}/.github/workflows/deploy.yml`), `${name}: workflow missing from zip`);
    assert.ok(names.every((n) => n.startsWith(`${name}/`)), 'everything is inside one folder');
  }
  assert.strictEqual((await fetch(`${base}/api/learn/starter/nope`)).status, 404);
  assert.strictEqual((await fetch(`${base}/api/learn/starter/..%2F..%2F.env`)).status, 404);
});

guard('progress needs login, validates ids, and is idempotent', async () => {
  const User = require('../models/User');
  const u = await User.create({ username: 'learner', email: 'learner@example.com', password: 'Passw0rd12345', isEmailVerified: true });
  const token = jwt.sign({ userId: u._id }, process.env.JWT_SECRET, { algorithm: 'HS256' });
  const h = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  const post = (body) => fetch(`${base}/api/learn/progress`, { method: 'POST', headers: h, body: JSON.stringify(body) }).then(async (r) => [r.status, await r.json()]);

  assert.strictEqual((await fetch(`${base}/api/learn/progress`)).status, 401);
  assert.strictEqual((await post({ lessonId: 'static-website:install-nginx', done: true }))[0], 200);
  await post({ lessonId: 'static-website:install-nginx', done: true });
  const got = await fetch(`${base}/api/learn/progress`, { headers: h }).then((r) => r.json());
  assert.deepStrictEqual(got.data.completed, ['static-website:install-nginx'], 'no duplicates');
  assert.strictEqual((await post({ lessonId: 'static-website:install-nginx', done: false }))[1].data.completed.length, 0);
  for (const bad of [{ lessonId: '../x', done: true }, { lessonId: 'A B', done: true }, { lessonId: 'ok-id', done: 'yes' }, { lessonId: { $gt: '' }, done: true }, {}]) {
    assert.strictEqual((await post(bad))[0], 400, JSON.stringify(bad));
  }
});
