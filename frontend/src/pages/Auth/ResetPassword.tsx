import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle2, Loader2, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '../../services/api'
import AuthShell from '../../components/Auth/AuthShell'
import { PasswordField } from '../../components/Auth/fields'
import { passwordProblem } from '../../utils/password'

const ResetPassword: React.FC = () => {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const token = params.get('token')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({})
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [failure, setFailure] = useState('')

  useEffect(() => {
    if (!done) return
    const t = setTimeout(() => navigate('/login', { state: { message: 'Password updated. Please sign in.' } }), 2500)
    return () => clearTimeout(t)
  }, [done, navigate])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const next: typeof errors = {}
    const pw = passwordProblem(password)
    if (pw) next.password = pw
    if (confirm !== password) next.confirm = 'Passwords do not match'
    setErrors(next)
    if (Object.keys(next).length) return
    setLoading(true)
    try {
      await api.post('/auth/reset-password', { token, password, confirmPassword: confirm })
      setDone(true)
    } catch (err: any) {
      const data = err.response?.data
      // a bad/expired token can't be fixed by retrying: show the dead-end state with a way out
      if (data?.error === 'Invalid or expired reset token') setFailure(data.message || 'This link has expired.')
      else toast.error(data?.error || 'Could not reset the password')
    } finally {
      setLoading(false)
    }
  }

  if (!token || failure) {
    return (
      <AuthShell title="Link not valid" subtitle={failure || 'This reset link is missing or incomplete.'}
        footer={<Link to="/login" className="font-semibold text-cyan-700 dark:text-cyan-300 hover:underline">Back to sign in</Link>}>
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 text-sm"><AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-300 shrink-0" /><p>Reset links expire after 1 hour and can only be used once.</p></div>
          <Link to="/forgot-password" className="btn-primary block text-center">Request a new link</Link>
        </div>
      </AuthShell>
    )
  }

  if (done) {
    return (
      <AuthShell title="Password updated" subtitle="You’ll be redirected to sign in…">
        <div className="text-center"><CheckCircle2 className="w-16 h-16 mx-auto text-emerald-500" /><p className="mt-4 text-slate-600 dark:text-gray-300">All other sessions were signed out for your security.</p></div>
      </AuthShell>
    )
  }

  return (
    <AuthShell title="Set a new password" subtitle="Choose something long and unique.">
      <form onSubmit={submit} className="space-y-5" noValidate>
        <PasswordField label="New password" meter autoComplete="new-password" autoFocus value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} />
        <PasswordField label="Confirm new password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} error={errors.confirm} />
        <button disabled={loading} className="btn-primary w-full inline-flex items-center justify-center disabled:opacity-60">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Update password'}
        </button>
      </form>
    </AuthShell>
  )
}

export default ResetPassword
