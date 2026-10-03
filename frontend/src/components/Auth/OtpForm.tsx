import React, { useEffect, useRef, useState } from 'react'
import { Loader2, MailCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'

/** 6-digit email verification. Used after signup and when an unverified user tries to log in. */
const OtpForm: React.FC<{ email: string; sendOnMount?: boolean; onVerified: () => void }> = ({ email, sendOnMount, onVerified }) => {
  const [otp, setOtp] = useState('')
  const [busy, setBusy] = useState(false)
  const [cooldown, setCooldown] = useState(sendOnMount ? 0 : 45)
  const sent = useRef(false)

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  const resend = async () => {
    try {
      await api.post('/auth/resend-otp', { email })
      toast.success('A new code is on its way')
      setCooldown(45)
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Could not send a new code')
    }
  }

  useEffect(() => {
    if (sendOnMount && !sent.current) { sent.current = true; resend() }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const verify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!/^\d{6}$/.test(otp)) return toast.error('Enter the 6-digit code')
    setBusy(true)
    try {
      await api.post('/auth/verify-otp', { email, otp })
      toast.success('Email verified!')
      onVerified()
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.response?.data?.error || 'Verification failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={verify} className="space-y-5">
      <div className="flex items-start gap-3 p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-sm">
        <MailCheck className="w-5 h-5 text-cyan-600 dark:text-cyan-300 shrink-0 mt-0.5" />
        <p>We sent a 6-digit code to <strong>{email}</strong>. It expires in 10 minutes.</p>
      </div>
      <div>
        <label htmlFor="otp" className="block text-sm font-medium mb-1.5">Verification code</label>
        <input id="otp" inputMode="numeric" autoComplete="one-time-code" maxLength={6} autoFocus value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
          className="input text-center text-2xl tracking-[0.5em] font-mono" placeholder="••••••" />
      </div>
      <button disabled={busy || otp.length !== 6} className="btn-primary w-full inline-flex items-center justify-center disabled:opacity-50">
        {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify email'}
      </button>
      <button type="button" onClick={resend} disabled={cooldown > 0} className="w-full text-sm text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-60">
        {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
      </button>
    </form>
  )
}

export default OtpForm
