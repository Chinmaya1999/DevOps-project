/**
 * Verifies your Cashfree keys WITHOUT creating or charging anything: it asks for an order that does not exist.
 *   cd backend && node scripts/checkCashfree.js
 *
 *  404 order_not_found      -> keys are valid and allowed from this IP  (good)
 *  401 authentication_error -> App ID / Secret mismatch, or keys are for a different Cashfree product / environment
 *  403                      -> IP not whitelisted (Cashfree dashboard -> Developers -> API Keys -> Whitelist IP)
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const axios = require('axios');

const env = process.env.CASHFREE_ENV === 'sandbox' ? 'sandbox' : 'production';
const base = env === 'sandbox' ? 'https://sandbox.cashfree.com' : 'https://api.cashfree.com';

(async () => {
  if (!process.env.CASHFREE_APP_ID || !process.env.CASHFREE_SECRET_KEY) {
    console.error('CASHFREE_APP_ID / CASHFREE_SECRET_KEY missing in backend/.env');
    process.exit(1);
  }
  console.log(`Environment: ${env}  |  App ID: ${process.env.CASHFREE_APP_ID.slice(0, 4)}…  |  Secret: ${process.env.CASHFREE_SECRET_KEY.slice(0, 12)}…`);
  try {
    await axios.get(`${base}/pg/orders/credential_check_${Date.now()}`, {
      headers: { 'x-client-id': process.env.CASHFREE_APP_ID, 'x-client-secret': process.env.CASHFREE_SECRET_KEY, 'x-api-version': '2023-08-01' },
      timeout: 15000,
    });
  } catch (e) {
    const s = e.response?.status;
    const code = e.response?.data?.code || e.response?.data?.type;
    if (s === 404) return console.log('OK — credentials are valid (order_not_found is expected).');
    console.error(`FAILED — HTTP ${s || 'no response'} ${code || e.message}`);
    if (s === 401) console.error('The App ID / Secret pair was rejected. Re-copy BOTH from Cashfree -> Payment Gateway -> Developers -> API Keys (production), and make sure they are Payment Gateway keys.');
    if (s === 403) console.error('Whitelist this server\'s public IP in the Cashfree dashboard.');
    process.exit(2);
  }
})();
