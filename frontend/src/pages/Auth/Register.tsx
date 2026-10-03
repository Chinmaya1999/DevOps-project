import React, { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import AuthShell from '../../components/Auth/AuthShell'
import { PasswordField, TextField } from '../../components/Auth/fields'
import OtpForm from '../../components/Auth/OtpForm'
import { isEmail, passwordProblem } from '../../utils/password'

const EXPERIENCE = ['Less than 1 year', '1-2 years', '2-3 years', '3-5 years', '5-10 years', '10+ years']
const DOMAINS = [
  'DevOps', 'Cloud Computing (AWS/Azure/GCP)', 'CI/CD', 'Kubernetes', 'Docker', 'Terraform', 'Ansible', 'Jenkins',
  'GitHub Actions', 'Linux/Unix', 'Networking', 'Security', 'Monitoring & Observability', 'Database Administration', 'Machine Learning/MLOps',
]

type Errors = Partial<Record<'username' | 'email' | 'password' | 'confirm' | 'experience', string>>

const Register: React.FC = () => {
  const { register, user } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '', experience: '' })
  const [domains, setDomains] = useState<string[]>([])
  const [errors, setErrors] = useState<Errors>({})
  const [loading, setLoading] = useState(false)
  const [pendingEmail, setPendingEmail] = useState<string | null>(null)

  if (user) return <Navigate to="/dashboard" replace />

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const validate = (): Errors => {
    const e: Errors = {}
    if (form.username.length < 3) e.username = 'At least 3 characters'
    else if (!/^[a-zA-Z0-9_]+$/.test(form.username)) e.username = 'Letters, numbers and underscores only'
    if (!isEmail(form.email)) e.email = 'Enter a valid email address'
    const pw = passwordProblem(form.password)
    if (pw) e.password = pw
    if (form.confirm !== form.password) e.confirm = 'Passwords do not match'
    if (!form.experience) e.experience = 'Choose your experience level'
    return e
  }

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    const e = validate()
    setErrors(e)
    if (Object.keys(e).length) return
    setLoading(true)
    try {
      const email = form.email.trim().toLowerCase()
      await register(form.username.trim(), email, form.password, form.experience, domains)
      setPendingEmail(email)
      toast.success('Account created — check your email for the code.')
    } catch (err: any) {
      toast.error(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  if (pendingEmail) {
    return (
      <AuthShell title="Verify your email" subtitle="Enter the code we just sent you."
        footer={<>Wrong address? <button onClick={() => setPendingEmail(null)} className="underline">Go back</button></>}>
        <OtpForm email={pendingEmail} onVerified={() => navigate('/login', { state: { message: 'Email verified! Sign in to continue.' } })} />
      </AuthShell>
    )
  }

  return (
    <AuthShell wide title="Create your account" subtitle="Free to start. No credit card."
      footer={<>Already registered? <Link to="/login" className="font-semibold text-cyan-700 dark:text-cyan-300 hover:underline">Sign in</Link></>}>
      <form onSubmit={submit} className="space-y-5" noValidate>
        <div className="grid sm:grid-cols-2 gap-4">
          <TextField label="Username" name="username" autoComplete="username" value={form.username} onChange={set('username')} error={errors.username} placeholder="jane_ops" />
          <TextField label="Email" type="email" name="email" autoComplete="email" value={form.email} onChange={set('email')} error={errors.email} placeholder="you@company.com" />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <PasswordField label="Password" meter name="password" autoComplete="new-password" value={form.password} onChange={set('password')} error={errors.password} />
          <PasswordField label="Confirm password" name="confirm" autoComplete="new-password" value={form.confirm} onChange={set('confirm')} error={errors.confirm} />
        </div>

        <fieldset>
          <legend className="text-sm font-medium mb-2">Your DevOps experience</legend>
          <div className="flex flex-wrap gap-2" role="radiogroup">
            {EXPERIENCE.map((x) => (
              <button type="button" key={x} role="radio" aria-checked={form.experience === x} onClick={() => setForm((f) => ({ ...f, experience: x }))}
                className={`px-3 py-1.5 rounded-lg text-sm border transition ${form.experience === x ? 'border-cyan-500 bg-cyan-500/10 text-cyan-700 dark:text-cyan-200' : 'border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5'}`}>{x}</button>
            ))}
          </div>
          {errors.experience && <p role="alert" className="mt-1.5 text-sm text-red-500">{errors.experience}</p>}
          <p className="mt-1.5 text-xs text-slate-500 dark:text-gray-400">We use this to tailor explanations and recommendations.</p>
        </fieldset>

        <fieldset>
          <legend className="text-sm font-medium mb-2">What do you work with? <span className="font-normal text-slate-500">(optional)</span></legend>
          <div className="flex flex-wrap gap-2">
            {DOMAINS.map((d) => {
              const on = domains.includes(d)
              return (
                <button type="button" key={d} aria-pressed={on} onClick={() => setDomains((cur) => (on ? cur.filter((x) => x !== d) : [...cur, d]))}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition ${on ? 'border-violet-500 bg-violet-500/10 text-violet-700 dark:text-violet-200' : 'border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5'}`}>{d}</button>
              )
            })}
          </div>
        </fieldset>

        <button disabled={loading} className="btn-primary w-full inline-flex items-center justify-center disabled:opacity-60">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create account'}
        </button>
        <p className="text-xs text-center text-slate-500 dark:text-gray-400">By signing up you agree to use the platform responsibly.</p>
      </form>
    </AuthShell>
  )
}

export default Register
