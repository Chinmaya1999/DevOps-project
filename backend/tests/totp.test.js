const test = require('node:test');
const assert = require('node:assert');
const { hotp, verifyTotp, generateSecret, base32Encode, base32Decode, generateRecoveryCodes, otpauthUrl } = require('../utils/totp');

// RFC 6238 Appendix B (SHA-1), shared secret "12345678901234567890"
const RFC_SECRET = base32Encode(Buffer.from('12345678901234567890'));

test('matches the RFC 6238 test vectors', () => {
  const vectors = [[59, '94287082'], [1111111109, '07081804'], [1111111111, '14050471'], [1234567890, '89005924'], [2000000000, '69279037']];
  for (const [t, expected] of vectors) assert.strictEqual(hotp(RFC_SECRET, Math.floor(t / 30), 8), expected, `t=${t}`);
});

test('verifyTotp accepts the current code and ±1 step, rejects others, and reports the step', () => {
  const now = 1234567890 * 1000;
  const step = Math.floor(now / 30000);
  const code = hotp(RFC_SECRET, step);
  assert.strictEqual(verifyTotp(RFC_SECRET, code, { now }), step);
  assert.strictEqual(verifyTotp(RFC_SECRET, hotp(RFC_SECRET, step - 1), { now }), step - 1);
  assert.strictEqual(verifyTotp(RFC_SECRET, hotp(RFC_SECRET, step + 1), { now }), step + 1);
  assert.strictEqual(verifyTotp(RFC_SECRET, hotp(RFC_SECRET, step + 2), { now }), null);
  assert.strictEqual(verifyTotp(RFC_SECRET, '000000', { now }) === null || code === '000000', true);
  assert.strictEqual(verifyTotp(RFC_SECRET, 'abcdef', { now }), null);
  assert.strictEqual(verifyTotp(RFC_SECRET, '12345', { now }), null);
});

test('base32 round-trips and secrets are random 160-bit', () => {
  const s = generateSecret();
  assert.match(s, /^[A-Z2-7]{32}$/);
  assert.strictEqual(base32Encode(base32Decode(s)), s);
  assert.notStrictEqual(generateSecret(), s);
});

test('recovery codes and otpauth url', () => {
  const codes = generateRecoveryCodes();
  assert.strictEqual(new Set(codes).size, 8);
  codes.forEach((c) => assert.match(c, /^[a-f0-9]{5}-[a-f0-9]{5}$/));
  const url = otpauthUrl('jane@example.com', 'DeployDojo', 'ABC234');
  assert.match(url, /^otpauth:\/\/totp\/DeployDojo:jane%40example\.com\?secret=ABC234&issuer=DeployDojo/);
});
