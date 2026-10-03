const Payment = require('../models/Payment');
const User = require('../models/User');
const cashfree = require('./cashfreeService');
const { revokePeriod } = require('./plans');

const WINDOW_DAYS = () => Number(process.env.REFUND_WINDOW_DAYS || 7);

/** Can the customer still ask for a refund on this payment? */
function refundEligibility(payment, now = new Date()) {
  if (payment.paymentMethod !== 'cashfree') return { ok: false, reason: 'Only online payments can be refunded here' };
  if (payment.status !== 'verified') return { ok: false, reason: payment.status === 'refunded' ? 'Already refunded' : 'Payment is not completed' };
  if (payment.refund && payment.refund.status !== 'none' && payment.refund.status !== 'failed') return { ok: false, reason: 'A refund is already in progress or done' };
  const ageDays = (now - new Date(payment.verifiedAt || payment.createdAt)) / 86400000;
  if (ageDays > WINDOW_DAYS()) return { ok: false, reason: `Refunds are available within ${WINDOW_DAYS()} days of payment` };
  return { ok: true };
}

async function requestRefund(paymentId, userId, reason) {
  const payment = await Payment.findOne({ _id: paymentId, user: userId });
  if (!payment) return { status: 404, error: 'Payment not found' };
  const el = refundEligibility(payment);
  if (!el.ok) return { status: 400, error: el.reason };
  payment.refund = { ...(payment.refund?.toObject?.() || {}), status: 'requested', requestedAt: new Date(), reason: String(reason || '').slice(0, 500) };
  await payment.save();
  return { status: 200, payment };
}

const mapRefundStatus = (s) => {
  const v = String(s || '').toUpperCase();
  if (v === 'SUCCESS') return 'refunded';
  if (v === 'CANCELLED' || v === 'FAILED') return 'failed';
  return 'processing'; // PENDING / ONHOLD
};

/**
 * Admin action: refund the full amount through Cashfree and take the purchased period back.
 * Atomic claim => cannot run twice; stable refund id => safe to retry after a crash.
 */
async function executeRefund(paymentId, adminId, note) {
  const payment = await Payment.findOneAndUpdate(
    { _id: paymentId, paymentMethod: 'cashfree', status: 'verified', 'refund.status': { $in: ['none', 'requested', 'failed'] } },
    { $set: { 'refund.status': 'processing', 'refund.processedBy': adminId } },
    { new: true }
  );
  if (!payment) return { status: 400, error: 'This payment cannot be refunded (not a completed online payment, or already refunded)' };

  const refundId = `rf_${payment._id}`;
  let result;
  try {
    result = await cashfree.createRefund(payment.gatewayOrderId, { refundId, amount: payment.amount, note: note || payment.refund.reason || 'Refund' });
  } catch (e) {
    await Payment.updateOne({ _id: payment._id }, { $set: { 'refund.status': 'failed' } });
    return { status: 502, error: e.response?.data?.message || 'The payment gateway rejected the refund' };
  }

  const refundStatus = mapRefundStatus(result.refund_status);
  const update = { 'refund.refundId': refundId, 'refund.amount': payment.amount, 'refund.status': refundStatus };
  if (refundStatus === 'refunded') update['refund.processedAt'] = new Date();
  if (refundStatus !== 'failed') update.status = 'refunded';
  else update['refund.status'] = 'failed';
  await Payment.updateOne({ _id: payment._id }, { $set: update });

  if (refundStatus !== 'failed') await revokeOnce(payment._id);
  return { status: 200, payment: await Payment.findById(payment._id) };
}

/** Takes the period back from the user exactly once. */
async function revokeOnce(paymentId) {
  const claimed = await Payment.findOneAndUpdate(
    { _id: paymentId, 'refund.subscriptionRevoked': { $ne: true } },
    { $set: { 'refund.subscriptionRevoked': true } },
    { new: true }
  );
  if (!claimed) return false;
  const user = await User.findById(claimed.user);
  if (user) { revokePeriod(user, claimed.subscriptionType); await user.save(); }
  return true;
}

/** Called from the webhook: re-read the refund from Cashfree and align our record. */
async function syncRefund(orderId) {
  const payment = await Payment.findOne({ gatewayOrderId: orderId });
  if (!payment || !payment.refund?.refundId) return null;
  const r = await cashfree.getRefund(orderId, payment.refund.refundId);
  const refundStatus = mapRefundStatus(r.refund_status);
  const set = { 'refund.status': refundStatus };
  if (refundStatus === 'refunded') set['refund.processedAt'] = new Date();
  if (refundStatus === 'failed') set.status = 'verified'; // money did not leave; payment stands
  await Payment.updateOne({ _id: payment._id }, { $set: set });
  if (refundStatus === 'failed') return payment; // (subscription was already revoked; admin can re-run the refund)
  return payment;
}

module.exports = { refundEligibility, requestRefund, executeRefund, syncRefund, WINDOW_DAYS };
