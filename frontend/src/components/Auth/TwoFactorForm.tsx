import React, { useRef, useState } from 'react'
import { KeyRound, Loader2, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'

/** Second step of sign-in: authenticator code, or a one-time recovery code. */
const TwoFactorForm: React.FC<{ challenge: string; onExpired: () => void }> = ({ challenge, onExpired }) => {
  const { verifyTwoFactor } = useAuth()
  const [useRecovery, setUseRecovery] = useState(false)
  const [value, setValue] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const ready = useRecovery ? value.trim().length >= 11 : value.length === 6

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const r = await verifyTwoFactor(challenge, useRecovery ? { recoveryCode: value.trim() } : { code: value })
      if (useRecovery && r.recoveryCodesLeft !== undefined) toast(`Recovery code used. ${r.recoveryCodesLeft} left — consider generating new ones in Security.`, { icon: '⚠️' })
      else toast.success('Welcome back!')
    } catch (err: any) {
      const data = err.response?.data
      if (data?.code === 'CHALLENGE_EXPIRED') { toast.error(data.error); onExpired(); return }
      setError(data?.error || 'Could not verify the code')
      // a wrong code is never right on a retry: clear it so the user can type the next one immediately
      setValue('')
      inputRef.current?.focus()
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="flex items-start gap-3 p-4 rounded-xl bg-violet-500/10 border border-violet-500/25 text-sm">
        <ShieldCheck className="w-5 h-5 text-violet-600 dark:text-violet-300 shrink-0 mt-0.5" />
        <p>{useRecovery ? 'Enter one of your saved recovery codes. Each one works only once.' : 'Open your authenticator app and enter the 6-digit code for DeployDojo.'}</p>
      </div>
      {error && <div role="alert" className="p-3 rounded-xl text-sm bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-300">{error}</div>}
      <div>
        <label htmlFor="factor" className="block text-sm font-medium mb-1.5">{useRecovery ? 'Recovery code' : 'Authentication code'}</label>
        {useRecovery ? (
          <input ref={inputRef} id="factor" autoFocus autoComplete="off" spellCheck={false} value={value} onChange={(e) => setValue(e.target.value)} className="input font-mono text-center" placeholder="a1b2c-d3e4f" />
        ) : (
          <input ref={inputRef} id="factor" autoFocus inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={value} onChange={(e) => setValue(e.target.value.replace(/\D/g, ''))} className="input text-center text-2xl tracking-[0.5em] font-mono" placeholder="••••••" />
        )}
      </div>
      <button disabled={busy || !ready} className="btn-primary w-full inline-flex items-center justify-center disabled:opacity-50">
        {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify and sign in'}
      </button>
      <button type="button" onClick={() => { setUseRecovery(!useRecovery); setValue(''); setError('') }} className="w-full text-sm inline-flex items-center justify-center gap-2 text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white">
        <KeyRound className="w-4 h-4" /> {useRecovery ? 'Use my authenticator app' : 'Lost your phone? Use a recovery code'}
      </button>
    </form>
  )
}

export default TwoFactorForm
