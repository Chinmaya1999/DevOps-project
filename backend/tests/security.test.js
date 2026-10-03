const test = require('node:test');
const assert = require('node:assert');

process.env.DATA_ENCRYPTION_KEY = require('crypto').randomBytes(32).toString('hex');
const { encrypt, decrypt, sha256, secureOTP, safeEqual } = require('../utils/crypto');
const { sanitizeInput, escapeRegex, passwordProblem } = require('../middleware/security');

test('encryption round-trips, is randomised, and rejects tampering', () => {
  const secret = '-----BEGIN OPENSSH PRIVATE KEY-----\nabc';
  const a = encrypt(secret);
  const b = encrypt(secret);
  assert.notStrictEqual(a, b, 'IV must differ per encryption');
  assert.ok(a.startsWith('enc:v1:') && !a.includes('OPENSSH'));
  assert.strictEqual(decrypt(a), secret);
  assert.throws(() => decrypt(a.slice(0, -4) + 'AAAA'));
});

test('encrypt is idempotent and legacy plaintext still reads', () => {
  const once = encrypt('x');
  assert.strictEqual(encrypt(once), once);
  assert.strictEqual(decrypt('legacy-plaintext'), 'legacy-plaintext');
  assert.strictEqual(encrypt(null), null);
});

test('secureOTP is always 6 digits', () => {
  for (let i = 0; i < 500; i++) assert.match(secureOTP(), /^\d{6}$/);
});

test('safeEqual and sha256', () => {
  assert.ok(safeEqual(sha256('a'), sha256('a')));
  assert.ok(!safeEqual(sha256('a'), sha256('b')));
  assert.ok(!safeEqual('short', 'longer-string'));
});

test('sanitizeInput strips Mongo operators and dotted keys', () => {
  const req = { body: { email: { $gt: '' }, nested: { 'a.b': 1, $where: 'x', ok: 1 } }, query: { q: { $ne: 1 }, s: 'fine' }, params: {} };
  sanitizeInput(req, {}, () => {});
  assert.deepStrictEqual(req.body, { email: {}, nested: { ok: 1 } });
  assert.deepStrictEqual({ ...req.query }, { q: {}, s: 'fine' });
});

test('escapeRegex neutralises ReDoS / injection input', () => {
  const re = new RegExp(escapeRegex('(a+)+$'), 'i');
  assert.ok(re.test('(a+)+$'));
  assert.ok(!re.test('aaaa'));
  assert.ok(escapeRegex('x'.repeat(500)).length <= 100);
});

test('password policy', () => {
  assert.ok(passwordProblem('short1'));
  assert.ok(passwordProblem('onlylettersherexx'));
  assert.ok(passwordProblem('admin123'));
  assert.strictEqual(passwordProblem('Tr0ub4dor-and-3'), null);
});
