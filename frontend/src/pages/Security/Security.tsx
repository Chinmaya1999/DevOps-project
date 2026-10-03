import React, { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { Copy, Download, KeyRound, Loader2, ShieldCheck, ShieldOff } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { PasswordField } from '../../components/Auth/fields'

type Stage = 'loading' | 'off' | 'setup' | 'codes' | 'on'

const Security: React.FC = () => {
  const { refreshUser } = useAuth()
  const [stage, setStage] = useState<Stage>('loading')
  const [left, setLeft] = useState(0)
  const [setup, setSetup] = useState<{ secret: string; qr: string } | null>(null)
  const [code, setCode] = useState('')
  const [codes, setCodes] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [manage, setManage] = useState<null | 'disable' | 'regen'>(null)
  const [password, setPassword] = useState('')
  const [factor, setFactor] = useState('')

  const load = async () => {
    try {
      const r = await api.get('/auth/2fa')
      setLeft(r.data.data.recoveryCodesLeft)
      setStage(r.data.data.enabled ? 'on' : 'off')
    } catch { toast.error('Could not load security settings') }
  }
  useEffect(() => { load() }, [])

  const start = async () => {
    setBusy(true)
    try {
      const r = await api.post('/auth/2fa/setup')
      const qr = await QRCode.toDataURL(r.data.data.otpauthUrl, { margin: 1, width: 220 })
      setSetup({ secret: r.data.data.secret, qr })
      setCode('')
      setStage('setup')
    } catch (e: any) { toast.error(e.response?.data?.error || 'Could not start setup') }
    finally { setBusy(false) }
  }

  const enable = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      const r = await api.post('/auth/2fa/enable', { code })
      setCodes(r.data.data.recoveryCodes)
      setStage('codes')
      refreshUser()
    } catch (e: any) { toast.error(e.response?.data?.error || 'Invalid code') }
    finally { setBusy(false) }
  }

  const factorBody = () => (/^\d{6}$/.test(factor) ? { code: factor } : { recoveryCode: factor.trim() })

  const confirmManage = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      if (manage === 'disable') {
        await api.post('/auth/2fa/disable', { password, ...factorBody() })
        toast.success('Two-factor authentication turned off')
        refreshUser(); setManage(null); setStage('off')
      } else {
        const r = await api.post('/auth/2fa/recovery-codes', { password, ...factorBody() })
        setCodes(r.data.data.recoveryCodes); setManage(null); setStage('codes')
      }
      setPassword(''); setFactor('')
    } catch (e: any) { toast.error(e.response?.data?.error || 'That did not work') }
    finally { setBusy(false) }
  }

  const copy = async (text: string) => { try { await navigator.clipboard.writeText(text); toast.success('Copied') } catch { toast.error('Copy failed') } }
  const download = () => {
    const blob = new Blob([`AutoDevOps recovery codes\nEach code works once.\n\n${codes.join('\n')}\n`], { type: 'text/plain' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'autodevops-recovery-codes.txt'; a.click(); URL.revokeObjectURL(a.href)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <span className="p-2.5 rounded-xl hero-gradient shadow-lg shadow-cyan-500/20"><ShieldCheck className="w-6 h-6 text-white" /></span>
        <div><h1 className="font-display text-3xl font-bold">Security</h1><p className="text-slate-600 dark:text-gray-400">Protect your account with a second step at sign-in.</p></div>
      </div>

      <div className="mt-8 card p-6">
        {stage === 'loading' && <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />}

        {stage === 'off' && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
            <div><h2 className="font-semibold flex items-center gap-2"><ShieldOff className="w-5 h-5 text-amber-500" /> Two-factor authentication is off</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-gray-400">Use an authenticator app (Google Authenticator, Authy, 1Password…). Even if your password leaks, nobody can sign in without your phone.</p></div>
            <button onClick={start} disabled={busy} className="btn-primary shrink-0 disabled:opacity-60">{busy ? 'Starting…' : 'Turn on'}</button>
          </div>
        )}

        {stage === 'setup' && setup && (
          <form onSubmit={enable} className="space-y-5">
            <ol className="list-decimal list-inside space-y-1 text-sm text-slate-700 dark:text-gray-300">
              <li>Scan the QR code with your authenticator app.</li><li>Enter the 6-digit code it shows.</li>
            </ol>
            <div className="flex flex-col sm:flex-row gap-5 items-center">
              <img src={setup.qr} alt="QR code to add AutoDevOps to your authenticator app" width={176} height={176} className="rounded-xl bg-white p-2" />
              <div className="text-sm w-full">
                <p className="text-slate-600 dark:text-gray-400">Can’t scan? Enter this key manually:</p>
                <div className="mt-1 flex items-center gap-2"><code className="font-mono text-sm break-all bg-slate-100 dark:bg-black/30 rounded-lg px-3 py-2">{setup.secret}</code>
                  <button type="button" onClick={() => copy(setup.secret)} aria-label="Copy key" className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10"><Copy className="w-4 h-4" /></button></div>
              </div>
            </div>
            <div><label htmlFor="code" className="block text-sm font-medium mb-1.5">6-digit code</label>
              <input id="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} className="input text-center text-2xl tracking-[0.5em] font-mono max-w-xs" placeholder="••••••" /></div>
            <div className="flex gap-3">
              <button disabled={busy || code.length !== 6} className="btn-primary disabled:opacity-50">{busy ? 'Checking…' : 'Verify and turn on'}</button>
              <button type="button" onClick={() => setStage('off')} className="px-5 py-3 rounded-xl border border-slate-200 dark:border-white/10">Cancel</button>
            </div>
          </form>
        )}

        {stage === 'codes' && (
          <div className="space-y-4">
            <h2 className="font-semibold flex items-center gap-2 text-emerald-600 dark:text-emerald-400"><ShieldCheck className="w-5 h-5" /> Save your recovery codes</h2>
            <p className="text-sm text-slate-600 dark:text-gray-400">If you lose your phone, each of these signs you in once. <strong>They are shown only now</strong> — store them somewhere safe (a password manager).</p>
            <ul className="grid grid-cols-2 gap-2 font-mono text-sm">{codes.map((c) => <li key={c} className="bg-slate-100 dark:bg-black/30 rounded-lg px-3 py-2 text-center">{c}</li>)}</ul>
            <div className="flex gap-3">
              <button onClick={() => copy(codes.join('\n'))} className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 inline-flex items-center gap-2"><Copy className="w-4 h-4" /> Copy</button>
              <button onClick={download} className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 inline-flex items-center gap-2"><Download className="w-4 h-4" /> Download</button>
              <button onClick={() => { setCodes([]); load() }} className="btn-primary ml-auto">I’ve saved them</button>
            </div>
          </div>
        )}

        {stage === 'on' && !manage && (
          <div className="space-y-4">
            <h2 className="font-semibold flex items-center gap-2 text-emerald-600 dark:text-emerald-400"><ShieldCheck className="w-5 h-5" /> Two-factor authentication is on</h2>
            <p className="text-sm text-slate-600 dark:text-gray-400">{left} recovery code{left === 1 ? '' : 's'} left{left <= 2 ? ' — generate new ones soon.' : '.'}</p>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => setManage('regen')} className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 inline-flex items-center gap-2"><KeyRound className="w-4 h-4" /> New recovery codes</button>
              <button onClick={() => setManage('disable')} className="px-4 py-2.5 rounded-xl border border-red-500/40 text-red-600 dark:text-red-300">Turn off</button>
            </div>
          </div>
        )}

        {stage === 'on' && manage && (
          <form onSubmit={confirmManage} className="space-y-4">
            <h2 className="font-semibold">{manage === 'disable' ? 'Turn off two-factor authentication' : 'Generate new recovery codes'}</h2>
            <p className="text-sm text-slate-600 dark:text-gray-400">Confirm it’s you: your password and a current code (or a recovery code).{manage === 'regen' ? ' Your old codes stop working.' : ''}</p>
            <PasswordField label="Password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <div><label htmlFor="f" className="block text-sm font-medium mb-1.5">Authenticator or recovery code</label>
              <input id="f" autoComplete="one-time-code" value={factor} onChange={(e) => setFactor(e.target.value)} className="input font-mono" placeholder="123456 or a1b2c-d3e4f" /></div>
            <div className="flex gap-3">
              <button disabled={busy || !password || !factor} className="btn-primary disabled:opacity-50">{busy ? 'Working…' : 'Confirm'}</button>
              <button type="button" onClick={() => { setManage(null); setPassword(''); setFactor('') }} className="px-5 py-3 rounded-xl border border-slate-200 dark:border-white/10">Cancel</button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default Security
