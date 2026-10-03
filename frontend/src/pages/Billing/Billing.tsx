import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Loader2, Receipt, RotateCcw } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'

interface Row {
  id: string
  paymentNumber: string
  createdAt: string
  amount: number
  currency: string
  method: string
  status: 'pending' | 'verified' | 'rejected' | 'cancelled' | 'refunded'
  subscriptionType: 'monthly' | 'yearly'
  periodStart: string | null
  periodEnd: string | null
  invoiceNumber: string | null
  refund: { status: 'none' | 'requested' | 'processing' | 'refunded' | 'failed'; amount: number | null }
  canRequestRefund: boolean
  rejectionReason: string | null
}

const fmtDate = (d: string | null) => (d ? new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '—')
const money = (n: number, cur = 'INR') => new Intl.NumberFormat('en-IN', { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(n)

const chip = (r: Row) => {
  if (r.refund.status === 'refunded' || r.status === 'refunded') return ['Refunded', 'bg-slate-500/15 text-slate-600 dark:text-slate-300']
  if (r.refund.status === 'processing') return ['Refund processing', 'bg-amber-500/15 text-amber-700 dark:text-amber-300']
  if (r.refund.status === 'requested') return ['Refund requested', 'bg-amber-500/15 text-amber-700 dark:text-amber-300']
  if (r.status === 'verified') return ['Paid', 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300']
  if (r.status === 'pending') return ['Pending', 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300']
  return ['Failed', 'bg-red-500/15 text-red-600 dark:text-red-300']
}

const Billing: React.FC = () => {
  const [rows, setRows] = useState<Row[] | null>(null)
  const [windowDays, setWindowDays] = useState(7)
  const [refundFor, setRefundFor] = useState<Row | null>(null)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)

  const load = () =>
    api.get('/payment/my-payments')
      .then((r) => { setRows(r.data.data); setWindowDays(r.data.refundWindowDays) })
      .catch(() => { toast.error('Could not load your billing history'); setRows([]) })

  useEffect(() => { load() }, [])

  const requestRefund = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!refundFor) return
    setBusy(true)
    try {
      await api.post(`/payment/${refundFor.id}/refund-request`, { reason })
      toast.success('Refund requested. We’ll review it shortly.')
      setRefundFor(null); setReason('')
      load()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Could not request a refund')
    } finally { setBusy(false) }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-xl hero-gradient shadow-lg shadow-cyan-500/20"><Receipt className="w-6 h-6 text-white" /></span>
          <div><h1 className="font-display text-3xl font-bold">Billing</h1><p className="text-slate-600 dark:text-gray-400">Payments, invoices and refunds.</p></div>
        </div>
        <Link to="/payment" className="btn-primary">Manage plan</Link>
      </div>

      <div className="mt-8 card overflow-hidden">
        {rows === null ? (
          <div className="p-10 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-cyan-500" /></div>
        ) : rows.length === 0 ? (
          <div className="p-10 text-center text-slate-600 dark:text-gray-400">No payments yet. <Link to="/payment" className="underline text-cyan-700 dark:text-cyan-300">See plans</Link></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Payment history</caption>
              <thead><tr className="border-b border-slate-200 dark:border-white/10 text-slate-500 dark:text-gray-400">
                <th scope="col" className="p-4 font-medium">Date</th><th scope="col" className="p-4 font-medium">Plan</th>
                <th scope="col" className="p-4 font-medium">Period</th><th scope="col" className="p-4 font-medium text-right">Amount</th>
                <th scope="col" className="p-4 font-medium">Status</th><th scope="col" className="p-4 font-medium text-right">Actions</th>
              </tr></thead>
              <tbody>
                {rows.map((r) => {
                  const [label, cls] = chip(r)
                  return (
                    <tr key={r.id} className="border-b last:border-0 border-slate-200 dark:border-white/5">
                      <td className="p-4 whitespace-nowrap">{fmtDate(r.createdAt)}</td>
                      <td className="p-4">Pro · {r.subscriptionType === 'yearly' ? 'Yearly' : 'Monthly'}</td>
                      <td className="p-4 whitespace-nowrap text-slate-600 dark:text-gray-400">{r.periodStart ? `${fmtDate(r.periodStart)} – ${fmtDate(r.periodEnd)}` : '—'}</td>
                      <td className="p-4 text-right font-medium">{money(r.amount, r.currency)}</td>
                      <td className="p-4"><span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${cls}`}>{label}</span>
                        {r.rejectionReason && <div className="mt-1 text-xs text-red-500">{r.rejectionReason}</div>}</td>
                      <td className="p-4 text-right whitespace-nowrap">
                        {r.invoiceNumber && <Link to={`/billing/invoice/${r.id}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5"><FileText className="w-4 h-4" /> Invoice</Link>}
                        {r.canRequestRefund && <button onClick={() => setRefundFor(r)} className="ml-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5"><RotateCcw className="w-4 h-4" /> Refund</button>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <p className="mt-4 text-sm text-slate-500 dark:text-gray-400">Refunds can be requested within {windowDays} days of payment. A refund removes the Pro time it bought.</p>

      {refundFor && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="refund-title">
          <form onSubmit={requestRefund} className="bg-white dark:bg-ink-800 border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl max-w-md w-full p-7 space-y-4">
            <h2 id="refund-title" className="text-xl font-bold">Request a refund</h2>
            <p className="text-sm text-slate-600 dark:text-gray-300">{money(refundFor.amount, refundFor.currency)} for {refundFor.subscriptionType} Pro on {fmtDate(refundFor.createdAt)}. If approved, the money returns to your original payment method and the Pro time from this payment is removed.</p>
            <div><label htmlFor="why" className="block text-sm font-medium mb-1.5">Reason (optional)</label>
              <textarea id="why" rows={3} maxLength={500} className="input" value={reason} onChange={(e) => setReason(e.target.value)} /></div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setRefundFor(null)} className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10">Cancel</button>
              <button disabled={busy} className="flex-1 btn-primary disabled:opacity-60">{busy ? 'Sending…' : 'Request refund'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default Billing
