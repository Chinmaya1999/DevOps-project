import React, { useEffect, useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import AuthShell from '../../components/Auth/AuthShell'
import { PasswordField, TextField } from '../../components/Auth/fields'
import OtpForm from '../../components/Auth/OtpForm'
import TwoFactorForm from '../../components/Auth/TwoFactorForm'
import { isEmail } from '../../utils/password'

const Login: React.FC = () => {
  const location = useLocation()
  const { login, user } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({})
  const [needsVerification, setNeedsVerification] = useState(false)
  const [challenge, setChallenge] = useState<string | null>(null)

  // message passed from signup / password reset
  useEffect(() => {
    const state = location.state as { message?: string } | null
    if (state?.message) {
      toast.success(state.message)
      window.history.replaceState({}, document.title, '/login')
    }
  }, [location])

  if (user) return <Navigate to="/dashboard" replace />

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const next: typeof errors = {}
    if (!isEmail(email)) next.email = 'Enter a valid email address'
    if (!password) next.password = 'Enter your password'
    setErrors(next)
    if (Object.keys(next).length) return

    setLoading(true)
    try {
      const result = await login(email.trim().toLowerCase(), password)
      if (result.twoFactorRequired) setChallenge(result.challenge)
      else toast.success('Welcome back!')
    } catch (err: any) {
      const status = err.response?.status
      const data = err.response?.data
      if (status === 403 && data?.error === 'Email not verified') {
        setNeedsVerification(true)
      } else if (status === 401) {
        // the server deliberately doesn't say which of email/password was wrong
        setErrors({ form: 'Incorrect email or password.' })
      } else if (status === 429) {
        setErrors({ form: data?.error || 'Too many attempts. Please try again later.' })
      } else {
        setErrors({ form: data?.error || 'Could not sign in. Check your connection and try again.' })
      }
    } finally {
      setLoading(false)
    }
  }

  if (challenge) {
    return (
      <AuthShell title="Two-factor authentication" subtitle="One more step to confirm it’s you."
        footer={<button onClick={() => { setChallenge(null); setPassword('') }} className="underline">Back to sign in</button>}>
        <TwoFactorForm challenge={challenge} onExpired={() => { setChallenge(null); setPassword('') }} />
      </AuthShell>
    )
  }

  if (needsVerification) {
    return (
      <AuthShell title="Verify your email" subtitle="One quick step before you can sign in."
        footer={<button onClick={() => setNeedsVerification(false)} className="underline">Back to sign in</button>}>
        <OtpForm email={email.trim().toLowerCase()} sendOnMount onVerified={() => { setNeedsVerification(false); toast.success('Verified — you can sign in now.') }} />
      </AuthShell>
    )
  }

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to your DevOps workspace."
      footer={<>New here? <Link to="/register" className="font-semibold text-cyan-700 dark:text-cyan-300 hover:underline">Create a free account</Link></>}>
      <form onSubmit={submit} className="space-y-5" noValidate>
        {errors.form && <div role="alert" className="p-3 rounded-xl text-sm bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-300">{errors.form}</div>}
        <TextField label="Email" type="email" name="email" autoComplete="email" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} placeholder="you@company.com" />
        <PasswordField label="Password" name="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} placeholder="Your password" />
        <div className="flex justify-end -mt-2">
          <Link to="/forgot-password" className="text-sm text-cyan-700 dark:text-cyan-300 hover:underline">Forgot password?</Link>
        </div>
        <button disabled={loading} className="btn-primary w-full inline-flex items-center justify-center disabled:opacity-60">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign in'}
        </button>
      </form>
    </AuthShell>
  )
}

export default Login
