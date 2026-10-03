const crypto = require('crypto');

/** RFC 6238 TOTP (SHA-1, 6 digits, 30 s) — compatible with Google Authenticator, Authy, 1Password, etc. No dependencies. */
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const STEP = 30;

function base32Encode(buf) {
  let bits = 0, value = 0, out = '';
  for (const byte of buf) {
    value = (value << 8) | byte; bits += 8;
    while (bits >= 5) { out += ALPHABET[(value >>> (bits - 5)) & 31]; bits -= 5; }
  }
  if (bits > 0) out += ALPHABET[(value << (5 - bits)) & 31];
  return out;
}

function base32Decode(str) {
  let bits = 0, value = 0;
  const out = [];
  for (const ch of String(str).replace(/=+$/, '').toUpperCase()) {
    const idx = ALPHABET.indexOf(ch);
    if (idx === -1) throw new Error('Invalid base32');
    value = (value << 5) | idx; bits += 5;
    if (bits >= 8) { out.push((value >>> (bits - 8)) & 255); bits -= 8; }
  }
  return Buffer.from(out);
}

const generateSecret = () => base32Encode(crypto.randomBytes(20));

function hotp(secretBase32, counter, digits = 6) {
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(counter));
  const h = crypto.createHmac('sha1', base32Decode(secretBase32)).update(msg).digest();
  const off = h[h.length - 1] & 15;
  const bin = ((h[off] & 0x7f) << 24) | (h[off + 1] << 16) | (h[off + 2] << 8) | h[off + 3];
  return String(bin % 10 ** digits).padStart(digits, '0');
}

const stepAt = (ms = Date.now()) => Math.floor(ms / 1000 / STEP);

/**
 * Check a code allowing ±1 step of clock drift. Returns the matched time-step (so the caller can reject replays
 * of an already-used step) or null.
 */
function verifyTotp(secretBase32, code, { now = Date.now(), window = 1, digits = 6 } = {}) {
  if (!/^\d{6}$/.test(String(code))) return null;
  const current = stepAt(now);
  let match = null;
  for (let w = -window; w <= window; w++) {
    const ok = crypto.timingSafeEqual(Buffer.from(hotp(secretBase32, current + w, digits)), Buffer.from(String(code)));
    if (ok) match = current + w; // no early exit: constant work per attempt
  }
  return match;
}

const otpauthUrl = (account, issuer, secret) =>
  `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(account)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=${STEP}`;

/** 8 single-use recovery codes like "a1b2c-d3e4f". */
const generateRecoveryCodes = (n = 8) =>
  Array.from({ length: n }, () => { const h = crypto.randomBytes(5).toString('hex'); return `${h.slice(0, 5)}-${h.slice(5)}`; });

module.exports = { generateSecret, verifyTotp, hotp, stepAt, otpauthUrl, generateRecoveryCodes, base32Encode, base32Decode, STEP };
