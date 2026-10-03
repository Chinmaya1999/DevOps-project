const Counter = require('../models/Counter');
const Payment = require('../models/Payment');
const { DURATION_DAYS } = require('./plans');

/** INV-2026-000042 — sequential per calendar year. Only call for a payment that just became verified. */
async function nextInvoiceNumber(date = new Date()) {
  const year = date.getUTCFullYear();
  const c = await Counter.findOneAndUpdate({ _id: `invoice-${year}` }, { $inc: { seq: 1 } }, { upsert: true, new: true });
  return `INV-${year}-${String(c.seq).padStart(6, '0')}`;
}

/** Idempotent: a payment keeps the first number it was given. */
async function ensureInvoiceNumber(paymentId) {
  const existing = await Payment.findById(paymentId).select('invoiceNumber');
  if (!existing || existing.invoiceNumber) return existing && existing.invoiceNumber;
  const number = await nextInvoiceNumber();
  const won = await Payment.findOneAndUpdate(
    { _id: paymentId, $or: [{ invoiceNumber: { $exists: false } }, { invoiceNumber: null }] },
    { $set: { invoiceNumber: number } },
    { new: true }
  );
  return won ? won.invoiceNumber : (await Payment.findById(paymentId).select('invoiceNumber')).invoiceNumber;
}

const seller = () => ({
  name: process.env.INVOICE_SELLER_NAME || 'DeployDojo',
  address: process.env.INVOICE_SELLER_ADDRESS || '',
  taxId: process.env.INVOICE_TAX_ID || '',
  email: process.env.INVOICE_SELLER_EMAIL || '',
});

/** Everything the invoice page needs. Never includes screenshots, admin identities, or gateway secrets. */
function buildInvoice(payment, user) {
  const days = DURATION_DAYS[payment.subscriptionType];
  const label = payment.subscriptionType === 'yearly' ? 'Yearly' : 'Monthly';
  return {
    invoiceNumber: payment.invoiceNumber,
    issuedAt: payment.verifiedAt || payment.createdAt,
    status: payment.status === 'refunded' ? 'refunded' : 'paid',
    seller: seller(),
    customer: { name: user.username, email: user.email },
    items: [{
      description: `DeployDojo Pro — ${label} plan (${days} days)`,
      periodStart: payment.periodStart || null,
      periodEnd: payment.periodEnd || null,
      amount: payment.amount,
    }],
    total: payment.amount,
    currency: payment.currency || 'INR',
    paymentMethod: payment.paymentMethod,
    reference: payment.gatewayOrderId || payment.transactionId,
    refund: payment.refund && payment.refund.status !== 'none'
      ? { status: payment.refund.status, amount: payment.refund.amount || payment.amount, processedAt: payment.refund.processedAt || null }
      : null,
    note: 'Amount shown is the total charged, inclusive of any applicable taxes.',
  };
}

module.exports = { nextInvoiceNumber, ensureInvoiceNumber, buildInvoice };
