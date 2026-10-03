const crypto = require('crypto');
const axios = require('axios');

/**
 * Thin client for the Cashfree Payment Gateway (PG) API.
 * Credentials come only from the environment: CASHFREE_APP_ID, CASHFREE_SECRET_KEY, CASHFREE_ENV (production|sandbox).
 * The HTTP client is injectable so the payment flow can be tested without network access.
 */
const API_VERSION = '2023-08-01';

const environment = () => (process.env.CASHFREE_ENV === 'sandbox' ? 'sandbox' : 'production');
const baseUrl = () => (environment() === 'sandbox' ? 'https://sandbox.cashfree.com' : 'https://api.cashfree.com');

/**
 * Live and sandbox (test-mode) keys are different credentials. Keep both in .env and switch with CASHFREE_ENV:
 *   CASHFREE_APP_ID / CASHFREE_SECRET_KEY                  -> live keys
 *   CASHFREE_SANDBOX_APP_ID / CASHFREE_SANDBOX_SECRET_KEY  -> test keys (used when CASHFREE_ENV=sandbox)
 */
const credentials = () =>
  environment() === 'sandbox'
    ? {
        id: process.env.CASHFREE_SANDBOX_APP_ID || process.env.CASHFREE_APP_ID,
        secret: process.env.CASHFREE_SANDBOX_SECRET_KEY || process.env.CASHFREE_SECRET_KEY,
      }
    : { id: process.env.CASHFREE_APP_ID, secret: process.env.CASHFREE_SECRET_KEY };

const isConfigured = () => Boolean(credentials().id && credentials().secret);

const headers = () => ({
  'x-client-id': credentials().id,
  'x-client-secret': credentials().secret,
  'x-api-version': API_VERSION,
  'Content-Type': 'application/json',
});

const service = {
  http: axios, // replaced in tests

  isConfigured,
  environment,
  credentials,

  async createOrder({ orderId, amount, customer, returnUrl, notifyUrl }) {
    if (!isConfigured()) throw new Error('Payment gateway is not configured');
    const body = {
      order_id: orderId,
      order_amount: amount,
      order_currency: 'INR',
      customer_details: {
        customer_id: customer.id,
        customer_email: customer.email,
        customer_phone: customer.phone,
        ...(customer.name ? { customer_name: customer.name } : {}),
      },
      order_meta: { return_url: returnUrl, ...(notifyUrl ? { notify_url: notifyUrl } : {}) },
      order_note: 'DeployDojo Pro subscription',
    };
    const res = await service.http.post(`${baseUrl()}/pg/orders`, body, { headers: headers(), timeout: 15000 });
    return res.data; // { order_id, payment_session_id, order_status, ... }
  },

  /** Source of truth for payment state — never trust the browser or an unverified callback. */
  async getOrder(orderId) {
    if (!isConfigured()) throw new Error('Payment gateway is not configured');
    const res = await service.http.get(`${baseUrl()}/pg/orders/${encodeURIComponent(orderId)}`, { headers: headers(), timeout: 15000 });
    return res.data;
  },

  /** Full or partial refund. refundId must be unique per order and makes retries idempotent. */
  async createRefund(orderId, { refundId, amount, note }) {
    if (!isConfigured()) throw new Error('Payment gateway is not configured');
    const res = await service.http.post(
      `${baseUrl()}/pg/orders/${encodeURIComponent(orderId)}/refunds`,
      { refund_amount: amount, refund_id: refundId, refund_note: note || 'Refund', refund_speed: 'STANDARD' },
      { headers: headers(), timeout: 15000 }
    );
    return res.data; // { refund_id, refund_status, ... }
  },

  async getRefund(orderId, refundId) {
    if (!isConfigured()) throw new Error('Payment gateway is not configured');
    const res = await service.http.get(`${baseUrl()}/pg/orders/${encodeURIComponent(orderId)}/refunds/${encodeURIComponent(refundId)}`, { headers: headers(), timeout: 15000 });
    return res.data;
  },

  /** Webhook signature = base64( HMAC-SHA256( secretKey, timestamp + rawBody ) ). Constant-time compare. */
  verifyWebhookSignature(rawBody, signature, timestamp) {
    if (!isConfigured() || !rawBody || !signature || !timestamp) return false;
    const expected = crypto.createHmac('sha256', credentials().secret)
      .update(String(timestamp) + rawBody.toString('utf8'))
      .digest('base64');
    const a = Buffer.from(expected);
    const b = Buffer.from(String(signature));
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  },
};

module.exports = service;
