import React, { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle2, Loader2, XCircle } from 'lucide-react'
import { api } from '../../services/api'
import { useAuth } from '../../context/AuthContext'

type State = 'checking' | 'verified' | 'pending' | 'failed'

/** Landing page after Cashfree checkout. The server asks Cashfree for the real result — the URL alone proves nothing. */
const PaymentStatus: React.FC = () => {
  const [params] = useSearchParams()
  const orderId = params.get('order_id') || ''
  const { refreshUser } = useAuth()
  const [state, setState] = useState<State>('checking')
  const [message, setMessage] = useState('')
  const attempts = useRef(0)

  useEffect(() => {
    if (!/^ord_[a-f0-9]{24}$/.test(orderId)) { setState('failed'); setMessage('This payment link is not valid.'); return }
    let stop = false
    let timer: ReturnType<typeof setTimeout>

    const check = async () => {
      try {
        const res = await api.get(`/payment/cashfree/status/${orderId}`)
        if (stop) return
        const s = res.data.data.status as string
        if (s === 'verified') { await refreshUser(); setState('verified'); return }
        if (s === 'cancelled' || s === 'rejected') { setState('failed'); setMessage(res.data.data.message || ''); return }
      } catch { /* keep trying, then fall through to "pending" */ }
      if (stop) return
      attempts.current += 1
      if (attempts.current >= 10) { setState('pending'); return }
      timer = setTimeout(check, 3000)
    }
    check()
    return () => { stop = true; clearTimeout(timer) }
  }, [orderId]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="max-w-md mx-auto mt-16 card p-8 text-center" role="status" aria-live="polite">
      {state === 'checking' && (<><Loader2 className="w-14 h-14 mx-auto animate-spin text-cyan-500" /><h1 className="mt-5 text-xl font-bold">Confirming your payment…</h1><p className="mt-2 text-slate-500 dark:text-gray-400">This usually takes a few seconds. Please don’t close this page.</p></>)}
      {state === 'verified' && (<><CheckCircle2 className="w-16 h-16 mx-auto text-emerald-500" /><h1 className="mt-5 text-2xl font-bold">You’re on Pro 🎉</h1><p className="mt-2 text-slate-500 dark:text-gray-400">Payment confirmed. All Pro features are unlocked.</p><Link to="/dashboard" className="btn-primary inline-block mt-6">Go to dashboard</Link></>)}
      {state === 'pending' && (<><Loader2 className="w-14 h-14 mx-auto text-amber-500" /><h1 className="mt-5 text-xl font-bold">Still waiting for the bank</h1><p className="mt-2 text-slate-500 dark:text-gray-400">If money was deducted, your plan activates automatically as soon as the bank confirms — usually within minutes. Nothing more to do.</p><Link to="/dashboard" className="btn-primary inline-block mt-6">Back to dashboard</Link></>)}
      {state === 'failed' && (<><XCircle className="w-16 h-16 mx-auto text-red-500" /><h1 className="mt-5 text-xl font-bold">Payment not completed</h1><p className="mt-2 text-slate-500 dark:text-gray-400">{message || 'No money was charged, or it will be refunded by your bank.'}</p><Link to="/payment" className="btn-primary inline-block mt-6">Try again</Link></>)}
    </div>
  )
}

export default PaymentStatus
