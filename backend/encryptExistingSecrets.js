/**
 * One-off migration: encrypt SSH private keys that were stored in plaintext before field encryption existed.
 * Safe to re-run (already-encrypted values are skipped).
 *   DATA_ENCRYPTION_KEY=... MONGODB_URI=... node encryptExistingSecrets.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { encrypt } = require('./utils/crypto');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const col = mongoose.connection.collection('deployments');
  let done = 0;
  const cursor = col.find({ pemKey: { $type: 'string', $not: /^enc:v1:/ } });
  for await (const doc of cursor) {
    if (!doc.pemKey) continue;
    await col.updateOne({ _id: doc._id }, { $set: { pemKey: encrypt(doc.pemKey) } });
    done++;
  }
  console.log(`Encrypted ${done} deployment key(s).`);
  await mongoose.disconnect();
})().catch((e) => { console.error(e.message); process.exit(1); });
