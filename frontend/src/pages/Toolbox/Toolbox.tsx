import React, { useState } from 'react'
import { Siren, KeyRound, Wrench, ShieldCheck, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'

type Tab = 'troubleshoot' | 'secrets'

interface Match { id: string; tool: string; title: string; cause: string; steps: string[] }
interface Finding { rule: string; name: string; severity: 'critical' | 'high' | 'medium'; line: number; preview: string; fix: string }

const SEVERITY: Record<Finding['severity'], string> = {
  critical: 'bg-red-500/15 text-red-300 border-red-500/30',
  high: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
  medium: 'bg-yellow-500/15 text-yellow-200 border-yellow-500/30',
}

const EXAMPLES: Record<Tab, string> = {
  troubleshoot: 'NAME           READY   STATUS             RESTARTS\napi-7d9f8c6b5   0/1     CrashLoopBackOff   6',
  secrets: 'AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE\ndb: mongodb://admin:Sup3rSecret@db:27017/app',
}

const Toolbox: React.FC = () => {
  const [tab, setTab] = useState<Tab>('troubleshoot')
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [matches, setMatches] = useState<Match[] | null>(null)
  const [scan, setScan] = useState<{ clean: boolean; findings: Finding[] } | null>(null)

  const switchTab = (t: Tab) => { setTab(t); setText(''); setMatches(null); setScan(null) }

  const run = async () => {
    if (!text.trim()) return toast.error('Paste something first')
    setBusy(true)
    try {
      if (tab === 'troubleshoot') {
        const res = await api.post('/tools/troubleshoot', { text })
        setMatches(res.data.data.matches)
      } else {
        const res = await api.post('/tools/scan-secrets', { text })
        setScan(res.data.data)
      }
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Request failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-3">
        <span className="p-2.5 rounded-xl hero-gradient shadow-lg shadow-cyan-500/20"><Wrench className="w-6 h-6 text-white" /></span>
        <div>
          <h1 className="font-display text-3xl font-bold">DevOps toolbox</h1>
          <p className="text-gray-500 dark:text-gray-400">Fix errors faster and catch leaked secrets — nothing you paste is stored.</p>
        </div>
      </div>

      <div className="mt-6 inline-flex p-1 rounded-xl border border-gray-200 dark:border-white/10" role="tablist">
        {([['troubleshoot', 'Error troubleshooter', Siren], ['secrets', 'Secret scanner', KeyRound]] as const).map(([id, label, Icon]) => (
          <button key={id} role="tab" aria-selected={tab === id} onClick={() => switchTab(id)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${tab === id ? 'bg-gradient-to-r from-cyan-500 to-violet-600 text-white shadow' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}>
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      <div className="mt-5 card p-5">
        <label htmlFor="input" className="block text-sm font-medium mb-2">
          {tab === 'troubleshoot' ? 'Paste the error, log or kubectl output' : 'Paste a config, .env, Dockerfile or code snippet'}
        </label>
        <textarea id="input" rows={9} className="input font-mono text-sm" spellCheck={false} value={text} onChange={(e) => setText(e.target.value)} placeholder={EXAMPLES[tab]} />
        <div className="mt-4 flex flex-wrap gap-3">
          <button onClick={run} disabled={busy} className="btn-primary disabled:opacity-60">{busy ? 'Analyzing…' : tab === 'troubleshoot' ? 'Diagnose' : 'Scan for secrets'}</button>
          <button onClick={() => setText(EXAMPLES[tab])} className="px-5 py-3 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 text-sm font-medium">Try an example</button>
        </div>
      </div>

      <div aria-live="polite" className="mt-6 space-y-4">
        {tab === 'troubleshoot' && matches && (matches.length === 0 ? (
          <div className="card p-5 text-gray-500 dark:text-gray-400">No known pattern matched. Include the full error line (and `kubectl describe` Events if it is Kubernetes) and try again.</div>
        ) : matches.map((m) => (
          <div key={m.id} className="card p-5 glow-border">
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-500">{m.tool}</div>
            <h2 className="font-display text-xl font-semibold mt-1">{m.title}</h2>
            <p className="mt-2 text-gray-600 dark:text-gray-300">{m.cause}</p>
            <ol className="mt-4 space-y-2 list-decimal list-inside text-sm">
              {m.steps.map((s, i) => <li key={i} className="font-mono bg-black/20 rounded-lg px-3 py-2 list-item">{s}</li>)}
            </ol>
          </div>
        )))}

        {tab === 'secrets' && scan && (scan.clean ? (
          <div className="card p-5 flex items-center gap-3 text-emerald-400"><ShieldCheck className="w-6 h-6" /> No secrets detected.</div>
        ) : (
          <>
            <div className="card p-4 flex items-center gap-2 text-red-300"><AlertTriangle className="w-5 h-5" /> {scan.findings.length} possible secret(s) found. Rotate anything that was ever committed or shared.</div>
            {scan.findings.map((f, i) => (
              <div key={i} className="card p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-md border text-xs font-semibold uppercase ${SEVERITY[f.severity]}`}>{f.severity}</span>
                  <span className="font-semibold">{f.name}</span>
                  <span className="text-sm text-gray-500">line {f.line}</span>
                  <code className="ml-auto text-sm">{f.preview}</code>
                </div>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{f.fix}</p>
              </div>
            ))}
          </>
        ))}
      </div>
    </div>
  )
}

export default Toolbox
