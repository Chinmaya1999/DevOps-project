import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Loader2, Printer } from 'lucide-react'
import api from '../../services/api'

interface InvoiceData {
  invoiceNumber: string
  issuedAt: string
  status: 'paid' | 'refunded'
  seller: { name: string; address: string; taxId: string; email: string }
  customer: { name: string; email: string }
  items: { description: string; periodStart: string | null; periodEnd: string | null; amount: number }[]
  total: number
  currency: string
  paymentMethod: string
  reference: string
  refund: { status: string; amount: number; processedAt: string | null } | null
  note: string
}

const fmt = (d: string | null) => (d ? new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }) : '')
const money = (n: number, cur: string) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: cur, minimumFractionDigits: 2 }).format(n)

/** Printable invoice: "Print / Save as PDF" uses the browser; print CSS hides the app chrome. */
const Invoice: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [inv, setInv] = useState<InvoiceData | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get(`/payment/invoice/${id}`).then((r) => setInv(r.data.data)).catch(() => setError('Invoice not found.'))
  }, [id])

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6 print:hidden">
        <Link to="/billing" className="inline-flex items-center text-sm text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white"><ArrowLeft className="w-4 h-4 mr-1" /> Billing</Link>
        {inv && <button onClick={() => window.print()} className="btn-primary inline-flex items-center gap-2"><Printer className="w-4 h-4" /> Print / Save as PDF</button>}
      </div>

      {error && <div className="card p-8 text-center text-slate-600 dark:text-gray-300">{error}</div>}
      {!inv && !error && <div className="p-10 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-cyan-500" /></div>}

      {inv && (
        <article className="print-area bg-white text-slate-900 rounded-2xl shadow-xl border border-slate-200 p-8 sm:p-10">
          <header className="flex flex-wrap justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Invoice</h1>
              <p className="mt-1 font-mono text-sm text-slate-500">{inv.invoiceNumber}</p>
            </div>
            <div className="text-right text-sm">
              <div className="font-semibold text-lg">{inv.seller.name}</div>
              {inv.seller.address && <div className="whitespace-pre-line text-slate-600">{inv.seller.address}</div>}
              {inv.seller.taxId && <div className="text-slate-600">Tax ID: {inv.seller.taxId}</div>}
              {inv.seller.email && <div className="text-slate-600">{inv.seller.email}</div>}
            </div>
          </header>

          <section className="mt-8 grid sm:grid-cols-2 gap-6 text-sm">
            <div><h2 className="text-xs uppercase tracking-wide text-slate-500">Billed to</h2><div className="mt-1 font-medium">{inv.customer.name}</div><div className="text-slate-600">{inv.customer.email}</div></div>
            <div className="sm:text-right">
              <div><span className="text-slate-500">Date: </span>{fmt(inv.issuedAt)}</div>
              <div><span className="text-slate-500">Payment: </span>{inv.paymentMethod === 'cashfree' ? 'Online (UPI / card / net banking)' : inv.paymentMethod}</div>
              <div><span className="text-slate-500">Reference: </span><span className="font-mono">{inv.reference}</span></div>
              <div className="mt-2"><span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${inv.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>{inv.status === 'paid' ? 'PAID' : 'REFUNDED'}</span></div>
            </div>
          </section>

          <table className="mt-8 w-full text-sm">
            <thead><tr className="border-b border-slate-300 text-left text-slate-500"><th scope="col" className="py-2 font-medium">Description</th><th scope="col" className="py-2 font-medium text-right">Amount</th></tr></thead>
            <tbody>
              {inv.items.map((it, i) => (
                <tr key={i} className="border-b border-slate-200 align-top">
                  <td className="py-3">{it.description}{it.periodStart && <div className="text-xs text-slate-500">{fmt(it.periodStart)} – {fmt(it.periodEnd)}</div>}</td>
                  <td className="py-3 text-right">{money(it.amount, inv.currency)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr><th scope="row" className="pt-4 text-right pr-4 font-semibold">Total</th><td className="pt-4 text-right text-lg font-bold">{money(inv.total, inv.currency)}</td></tr>
              {inv.refund && <tr><th scope="row" className="pt-2 text-right pr-4 font-medium text-slate-600">Refunded{inv.refund.processedAt ? ` (${fmt(inv.refund.processedAt)})` : ''}</th><td className="pt-2 text-right text-slate-600">− {money(inv.refund.amount, inv.currency)}</td></tr>}
            </tfoot>
          </table>
          <p className="mt-8 text-xs text-slate-500">{inv.note}</p>
        </article>
      )}
    </div>
  )
}

export default Invoice
