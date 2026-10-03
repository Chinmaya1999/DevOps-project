const crypto = require('crypto');

/**
 * Field-level encryption (AES-256-GCM) for secrets stored in the database, e.g. users' SSH private keys.
 * Ciphertext format: enc:v1:<iv>:<tag>:<data> (all base64). Values without the prefix are treated as legacy
 * plaintext on read, so existing records keep working and are re-encrypted the next time they are saved.
 */
const PREFIX = 'enc:v1:';

function getKey() {
  const raw = process.env.DATA_ENCRYPTION_KEY;
  if (!raw) throw new Error('DATA_ENCRYPTION_KEY is not set');
  const key = Buffer.from(raw, 'hex');
  if (key.length !== 32) throw new Error('DATA_ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
  return key;
}

function encrypt(plain) {
  if (plain === null || plain === undefined || plain === '') return plain;
  if (String(plain).startsWith(PREFIX)) return plain; // already encrypted
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getKey(), iv);
  const data = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()]);
  return `${PREFIX}${iv.toString('base64')}:${cipher.getAuthTag().toString('base64')}:${data.toString('base64')}`;
}

function decrypt(value) {
  if (!value || !String(value).startsWith(PREFIX)) return value; // legacy plaintext
  const [iv, tag, data] = String(value).slice(PREFIX.length).split(':').map((p) => Buffer.from(p, 'base64'));
  const decipher = crypto.createDecipheriv('aes-256-gcm', getKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}

/** SHA-256 hex digest — used to store reset/verification tokens so a DB leak does not leak usable tokens. */
const sha256 = (v) => crypto.createHash('sha256').update(String(v)).digest('hex');

/** Cryptographically secure 6-digit code. */
const secureOTP = () => String(crypto.randomInt(100000, 1000000));

/** Constant-time string comparison. */
function safeEqual(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

module.exports = { encrypt, decrypt, sha256, secureOTP, safeEqual };
