const jwt = require('jsonwebtoken');

/** Short-lived proof that the password step succeeded. Signed with a DIFFERENT key than sessions and carries `purpose`. */
const key = () => process.env.JWT_SECRET + ':2fa-challenge';

const signChallenge = (userId) => jwt.sign({ userId, purpose: '2fa' }, key(), { expiresIn: '5m', algorithm: 'HS256' });

function verifyChallenge(token) {
  const d = jwt.verify(token, key(), { algorithms: ['HS256'] });
  if (d.purpose !== '2fa') throw new Error('wrong purpose');
  return d.userId;
}

module.exports = { signChallenge, verifyChallenge };
