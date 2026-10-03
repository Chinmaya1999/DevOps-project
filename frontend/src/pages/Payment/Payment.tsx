import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, Crown, Lock, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '../../services/api'

interface PlansResponse {
  pricing: { monthly: number; yearly: number }
  current: { plan: 'free' | 'pro'; status: string; endsAt: string | null; daysLeft: number | null }
  gatewayEnabled: boolean
}

declare global {
  interface Window {
    Cashfree?: (opts: { mode: 'production' | 'sandbox' }) => { checkout: (o: { paymentSessionId: string; redirectTarget?: string }) => Promise<unknown> }
  }
}

const SDK_URL = 'https://sdk.cashfree.com/js/v3/cashfree.js'
const loadCashfree = () =>
  new Promise<void>((resolve, reject) => {
    if (window.Cashfree) return resolve()
    const existing = document.querySelector(`script[src="${SDK_URL}"]`)
    const s = (existing as HTMLScriptElement) || document.createElement('script')
    s.addEventListener('load', () => resolve())
    s.addEventListener('error', () => reject(new Error('Could not load the payment window')))
    if (!existing) { s.src = SDK_URL; s.async = true; document.head.appendChild(s) }
  })

const PRO_FEATURES = [
  'Unlimited config generation (Free: 10 / month)',
  'Full-stack bundle ZIP (Docker + CI/CD + Kubernetes)',
  'One-click AWS deployment & management',
  'AWS cloud cost analysis',
  'Vision deploy',
  'Priority support',
]

const Payment: React.FC = () => {
  const navigate = useNavigate()
  const [data, setData] = useState<PlansResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [plan, setPlan] = useState<'monthly' | 'yearly'>('yearly')
  const [phone, setPhone] = useState('')
  const [paying, setPaying] = useState(false)

  useEffect(() => {
    api.get('/payment/plans')
      .then((r) => setData(r.data.data))
      .catch(() => toast.error('Could not load plans'))
      .finally(() => setLoading(false))
  }, [])

  if (loading || !data) {
    return <div className="py-24 text-center text-slate-500 dark:text-gray-400">{loading ? 'Loading plans…' : 'Plans are unavailable right now.'}</div>
  }

  const { pricing, current } = data
  const savePct = Math.round((1 - pricing.yearly / (pricing.monthly * 12)) * 100)
  const phoneOk = /^[6-9]\d{9}$/.test(phone)
  const isPro = current.plan === 'pro' && current.status !== 'admin'

  const pay = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phoneOk) return toast.error('Enter a valid 10-digit Indian mobile number')
    setPaying(true)
    try {
      const res = await api.post('/payment/cashfree/order', { subscriptionType: plan, phone })
      await loadCashfree()
      const cf = window.Cashfree!({ mode: res.data.data.environment })
      await cf.checkout({ paymentSessionId: res.data.data.paymentSessionId, redirectTarget: '_self' })
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || 'Payment could not be started')
      setPaying(false)
    }
  }

  const card = (id: 'monthly' | 'yearly', title: string, price: number, suffix: string, badge?: string) => (
    <button
      type="button"
      onClick={() => setPlan(id)}
      aria-pressed={plan === id}
      className={`relative text-left p-6 rounded-2xl border-2 transition ${plan === id ? 'border-cyan-500 bg-cyan-500/5 shadow-lg shadow-cyan-500/10' : 'border-slate-200 dark:border-white/10 hover:border-cyan-400/60'}`}
    >
      {badge && <span className="absolute -top-3 right-4 px-3 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-cyan-500 to-violet-600 text-white">{badge}</span>}
      <div className="font-semibold">{title}</div>
      <div className="mt-2"><span className="font-display text-4xl font-bold">₹{price.toLocaleString('en-IN')}</span><span className="text-slate-500 dark:text-gray-400"> {suffix}</span></div>
    </button>
  )

  return (
    <div className="max-w-4xl mx-auto">
      <button onClick={() => navigate(-1)} className="inline-flex items-center text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back
      </button>

      <h1 className="font-display text-4xl font-bold flex items-center gap-3"><Crown className="w-8 h-8 text-amber-500" /> Upgrade to Pro</h1>
      <p className="mt-2 text-slate-600 dark:text-gray-300">Pay securely online. Your plan activates automatically the moment payment succeeds.</p>

      {isPro && (
        <div className="mt-6 card p-4 border-emerald-500/30 text-emerald-700 dark:text-emerald-300">
          You are on <strong>Pro</strong>{current.endsAt ? <> until {new Date(current.endsAt).toLocaleDateString()} ({current.daysLeft} days left)</> : null}.
          Paying again adds time on top of your current period — no days are lost.
        </div>
      )}
      {current.status === 'expired' && <div className="mt-6 card p-4 text-amber-700 dark:text-amber-300">Your Pro plan has expired. Renew to unlock Pro features again.</div>}
      {!data.gatewayEnabled && <div className="mt-6 card p-4 text-red-600 dark:text-red-300">Online payments are temporarily unavailable. Please try again later.</div>}

      <div className="mt-8 grid md:grid-cols-5 gap-6">
        <form onSubmit={pay} className="md:col-span-3 space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            {card('monthly', 'Monthly', pricing.monthly, '/ month')}
            {card('yearly', 'Yearly', pricing.yearly, '/ year', savePct > 0 ? `Save ${savePct}%` : undefined)}
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium mb-1.5">Mobile number (required by the payment provider)</label>
            <input id="phone" inputMode="numeric" autoComplete="tel-national" maxLength={10} className="input" placeholder="10-digit mobile number"
              value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} aria-invalid={phone.length > 0 && !phoneOk} />
            {phone.length > 0 && !phoneOk && <p className="mt-1 text-sm text-red-500">Enter a valid 10-digit Indian mobile number.</p>}
          </div>
          <button disabled={paying || !phoneOk || !data.gatewayEnabled} className="btn-primary w-full inline-flex items-center justify-center disabled:opacity-50">
            <Lock className="w-4 h-4 mr-2" />
            {paying ? 'Opening secure checkout…' : `Pay ₹${(plan === 'monthly' ? pricing.monthly : pricing.yearly).toLocaleString('en-IN')} securely`}
          </button>
          <p className="text-xs text-slate-500 dark:text-gray-400 flex items-start gap-2"><ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" /> UPI, cards and net banking via Cashfree. We never see or store your card or UPI details.</p>
        </form>

        <aside className="md:col-span-2 card p-5 h-fit" aria-label="Pro features">
          <h2 className="font-semibold mb-3">Everything in Pro</h2>
          <ul className="space-y-2.5 text-sm">
            {PRO_FEATURES.map((f) => <li key={f} className="flex gap-2"><Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />{f}</li>)}
          </ul>
        </aside>
      </div>
    </div>
  )
}

export default Payment
