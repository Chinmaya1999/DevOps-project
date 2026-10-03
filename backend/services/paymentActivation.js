const Payment = require('../models/Payment');
const User = require('../models/User');
const cashfree = require('./cashfreeService');
const { extendSubscription, DURATION_DAYS } = require('./plans');
const { ensureInvoiceNumber } = require('./invoicing');

/** Add the paid period to the user exactly once, even if called concurrently or repeatedly. */
async function applySubscription(payment) {
  // atomic claim: only one caller flips false -> true
  const claimed = await Payment.findOneAndUpdate(
    { _id: payment._id, status: 'verified', subscriptionApplied: false },
    { $set: { subscriptionApplied: true } },
    { new: true }
  );
  if (!claimed) return false;
  try {
    const user = await User.findById(payment.user);
    if (!user) throw new Error('User not found');
    extendSubscription(user, payment.subscriptionType);
    await user.save();
    const periodEnd = user.subscription.endDate;
    await Payment.updateOne({ _id: payment._id }, { $set: { periodEnd, periodStart: new Date(periodEnd.getTime() - DURATION_DAYS[payment.subscriptionType] * 86400000) } });
    await ensureInvoiceNumber(payment._id);
    return true;
  } catch (e) {
    // allow a later retry rather than losing a paid period
    await Payment.updateOne({ _id: payment._id }, { $set: { subscriptionApplied: false } });
    throw e;
  }
}

/**
 * Ask Cashfree what really happened to an order and update our records to match.
 * Safe to call from the return page, the webhook, or a retry — all paths converge here.
 * @returns {Promise<{status: string, payment?: object}>}  status: verified | pending | cancelled | rejected | unknown
 */
async function reconcileOrder(orderId) {
  const payment = await Payment.findOne({ gatewayOrderId: orderId });
  if (!payment) return { status: 'unknown' };

  if (payment.status === 'verified') {
    if (!payment.subscriptionApplied) await applySubscription(payment);
    return { status: 'verified', payment };
  }
  if (payment.status === 'rejected') return { status: 'rejected', payment };
  if (payment.status === 'refunded') return { status: 'refunded', payment };

  const order = await cashfree.getOrder(orderId);
  const state = String(order.order_status || '').toUpperCase();

  if (state === 'PAID') {
    // The amount we charged must equal what Cashfree reports as paid
    if (Number(order.order_amount) !== Number(payment.amount) || (order.order_currency || 'INR') !== 'INR') {
      payment.status = 'rejected';
      payment.rejectionReason = 'Paid amount did not match the order amount; contact support';
      await payment.save();
      console.error(`Payment amount mismatch for order ${orderId}`);
      return { status: 'rejected', payment };
    }
    const claimed = await Payment.findOneAndUpdate(
      { _id: payment._id, status: { $in: ['pending', 'cancelled'] } },
      { $set: { status: 'verified', verifiedAt: new Date() } },
      { new: true }
    );
    const current = claimed || (await Payment.findById(payment._id));
    if (current.status === 'verified') await applySubscription(current);
    return { status: 'verified', payment: await Payment.findById(payment._id) };
  }

  if (['EXPIRED', 'TERMINATED', 'TERMINATION_REQUESTED'].includes(state)) {
    if (payment.status === 'pending') {
      payment.status = 'cancelled';
      await payment.save();
    }
    return { status: 'cancelled', payment };
  }
  return { status: 'pending', payment };
}

module.exports = { reconcileOrder, applySubscription };
