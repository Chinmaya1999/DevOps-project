import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Loader2, MailCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '../../services/api'
import AuthShell from '../../components/Auth/AuthShell'
import { TextField } from '../../components/Auth/fields'
import { isEmail } from '../../utils/password'

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  const send = async () => {
    if (!isEmail(email)) { setError('Enter a valid email address'); return }
    setError('')
    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email: email.trim().toLowerCase() })
      setSent(true)
      setCooldown(60)
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Could not send the reset link. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const back = <Link to="/login" className="inline-flex items-center gap-1.5 font-semibold text-cyan-700 dark:text-cyan-300 hover:underline"><ArrowLeft className="w-4 h-4" /> Back to sign in</Link>

  if (sent) {
    return (
      <AuthShell title="Check your inbox" subtitle="If an account exists for that address, a reset link is on its way." footer={back}>
        <div className="space-y-5">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-sm">
            <MailCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-300 shrink-0 mt-0.5" />
            <p>We sent instructions to <strong>{email}</strong>. The link is valid for 1 hour and works once. Check spam if you don’t see it.</p>
          </div>
          <button onClick={send} disabled={cooldown > 0 || loading} className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-white/15 font-medium hover:bg-white dark:hover:bg-white/5 disabled:opacity-60 transition">
            {cooldown > 0 ? `Send again in ${cooldown}s` : 'Send the link again'}
          </button>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell title="Forgot your password?" subtitle="Enter your email and we’ll send you a reset link." footer={back}>
      <form onSubmit={(e) => { e.preventDefault(); send() }} className="space-y-5" noValidate>
        <TextField label="Email" type="email" autoComplete="email" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} error={error} placeholder="you@company.com" />
        <button disabled={loading} className="btn-primary w-full inline-flex items-center justify-center disabled:opacity-60">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send reset link'}
        </button>
      </form>
    </AuthShell>
  )
}

export default ForgotPassword
