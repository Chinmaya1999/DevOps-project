import React from 'react'
import PricingSettings from './PricingSettings'
import PaymentVerification from './PaymentVerification'

/** Payments tab: price settings on top, then the payment list with approvals and refunds. */
const AdminPayments: React.FC = () => (
  <div>
    <PricingSettings />
    <PaymentVerification />
  </div>
)

export default AdminPayments
