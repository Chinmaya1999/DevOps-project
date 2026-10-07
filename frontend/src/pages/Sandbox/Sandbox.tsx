import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { io, Socket } from 'socket.io-client'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'
import toast from 'react-hot-toast'
import {
  Award, Bot, CheckCircle2, Circle, Clock, Copy, FlaskConical, Lightbulb, Lock, Play, Printer, Share2, Square,
  TerminalSquare, Trophy, Upload, Users, X,
} from 'lucide-react'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'

type Level = 'beginner' | 'intermediate' | 'advanced'

interface LabInfo {
  id: string
  title: string
  level: Level
  category: string
  minutes: number
  xp: number
  goal: string
  tasks: string[]
  concepts: string[]
  hintCount: number
  completed: boolean
  locked: boolean
}

interface Progress {
  xp: number
  completed: { labId: string; xp: number }[]
  levels: Record<Level, { done: number; total: number; certified: boolean }>
  sessionsToday: number
}

interface Status {
  enabled: boolean
  available: boolean
  aiHints: boolean
  plan: 'free' | 'pro'
  limits: { sessionMinutes: number; sessionsPerDay: number; levels: Level[] }
  active: boolean
}

type Phase = 'idle' | 'starting' | 'running' | 'guest' | 'ended'

const LEVELS: Level[] = ['beginner', 'intermediate', 'advanced']
const LEVEL_STYLE: Record<Level, string> = {
  beginner: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  intermediate: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  advanced: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
}
const CATEGORY_LABEL: Record<string, string> = { linux: 'Linux', devops: 'DevOps', git: 'Git', incident: 'Incident drill' }
const END_REASON: Record<string, string> = {
  stopped: 'Session stopped.',
  'shell-exited': 'The shell exited.',
  'time-limit': 'Time limit reached.',
  idle: 'Closed after 10 minutes without activity.',
  disconnected: 'Disconnected for too long.',
  'share-stopped': 'The owner stopped sharing.',
  error: 'The sandbox stopped unexpectedly.',
  'server-shutdown': 'The server restarted.',
}

const socketBase = () => {
  const apiUrl = import.meta.env.VITE_API_URL
  return apiUrl && /^https?:/.test(apiUrl) ? apiUrl.replace(/\/api\/?$/, '') : window.location.origin
}

const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

const Sandbox: React.FC = () => {
  const { user } = useAuth()
  const [status, setStatus] = useState<Status | null>(null)
  const [labs, setLabs] = useState<LabInfo[]>([])
  const [progress, setProgress] = useState<Progress | null>(null)
  const [phase, setPhase] = useState<Phase>('idle')
  const [activeLab, setActiveLab] = useState<LabInfo | null>(null)
  const [expiresAt, setExpiresAt] = useState<number>(0)
  const [now, setNow] = useState(Date.now())
  const [hints, setHints] = useState<string[]>([])
  const [aiText, setAiText] = useState('')
  const [aiQuestion, setAiQuestion] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [endMsg, setEndMsg] = useState('')
  const [generated, setGenerated] = useState<{ _id: string; name: string; fileName: string; type: string }[]>([])
  const [share, setShare] = useState<{ code: string; allowWrite: boolean } | null>(null)
  const [guests, setGuests] = useState(0)
  const [joinCode, setJoinCode] = useState('')
  const [guestCanWrite, setGuestCanWrite] = useState(false)
  const [cert, setCert] = useState<Level | null>(null)
  const [filter, setFilter] = useState<'all' | Level>('all')

  const termHost = useRef<HTMLDivElement>(null)
  const term = useRef<Terminal | null>(null)
  const fit = useRef<FitAddon | null>(null)
  const sock = useRef<Socket | null>(null)
  const labsRef = useRef<LabInfo[]>([])
  const phaseRef = useRef<Phase>('idle')
  const fileInput = useRef<HTMLInputElement>(null)
  labsRef.current = labs
  phaseRef.current = phase

  const loadAll = useCallback(async () => {
    const [s, l] = await Promise.all([api.get('/sandbox/status'), api.get('/sandbox/labs')])
    setStatus(s.data.data)
    setLabs(l.data.data.labs)
    setProgress(l.data.data.progress)
  }, [])

  const refreshProgress = useCallback(async () => {
    const l = await api.get('/sandbox/labs')
    setLabs(l.data.data.labs)
    setProgress(l.data.data.progress)
  }, [])

  useEffect(() => { loadAll().catch(() => toast.error('Could not load the sandbox')) }, [loadAll])
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t) }, [])

  // ── terminal + socket, created once ──
  const enabled = Boolean(status?.enabled && status?.available)
  useEffect(() => {
    if (!enabled || !termHost.current) return
    const t = new Terminal({
      cursorBlink: true, fontSize: 14, scrollback: 3000, convertEol: false,
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
      theme: { background: '#0a0e1a', foreground: '#d7dde8', cursor: '#22d3ee', selectionBackground: '#334155' },
    })
    const f = new FitAddon()
    t.loadAddon(f)
    t.open(termHost.current)
    f.fit()
    term.current = t
    fit.current = f
    t.writeln('\x1b[36mPick a lab on the left, or press "Free practice" to open a terminal.\x1b[0m')

    const s = io(`${socketBase()}/sandbox`, { withCredentials: true })
    sock.current = s

    t.onData((d) => s.emit('input', d))
    s.on('output', (buf: ArrayBuffer | Uint8Array) => t.write(buf instanceof Uint8Array ? buf : new Uint8Array(buf)))
    s.on('warning', ({ secondsLeft }: { secondsLeft: number }) => toast(`Sandbox closes in ${Math.round(secondsLeft / 60)} min`, { icon: '⏳' }))
    s.on('share-update', (d: { guests: number }) => setGuests(d.guests))
    s.on('ended', ({ reason }: { reason: string }) => {
      setPhase('ended')
      setEndMsg(END_REASON[reason] || 'Session ended.')
      setShare(null)
      setGuests(0)
      t.writeln(`\r\n\x1b[33m— ${END_REASON[reason] || 'Session ended.'} —\x1b[0m`)
    })
    s.on('connect', () => {
      if (phaseRef.current === 'guest') return
      s.emit('attach', (r: { ok: boolean; labId?: string | null; expiresAt?: number }) => {
        if (!r?.ok) return
        t.reset()
        setPhase('running')
        setExpiresAt(r.expiresAt || 0)
        setActiveLab(labsRef.current.find((l) => l.id === r.labId) || null)
      })
    })

    const ro = new ResizeObserver(() => {
      try { f.fit() } catch { /* hidden */ }
      s.emit('resize', { cols: t.cols, rows: t.rows })
    })
    ro.observe(termHost.current)
    return () => { ro.disconnect(); s.disconnect(); t.dispose(); term.current = null; sock.current = null }
  }, [enabled])

  // when the lab list arrives after a refresh-reattach, resolve the active lab
  useEffect(() => {
    if (phase === 'running' && !activeLab && labs.length) {
      sock.current?.emit('attach', (r: { ok: boolean; labId?: string | null }) => r?.ok && setActiveLab(labs.find((l) => l.id === r.labId) || null))
    }
  }, [labs]) // eslint-disable-line react-hooks/exhaustive-deps

  const secondsLeft = Math.max(0, Math.round((expiresAt - now) / 1000))

  const stop = useCallback(() => new Promise<void>((resolve) => {
    if (!sock.current) return resolve()
    sock.current.emit('stop', () => resolve())
  }), [])

  const start = useCallback(async (lab: LabInfo | null) => {
    if (!sock.current || !term.current) return
    if (lab?.locked) { toast.error('This lab is part of the Pro plan.'); return }
    if (phase === 'running' || phase === 'starting') await stop()
    setPhase('starting')
    setEndMsg('')
    setHints([])
    setAiText('')
    setShare(null)
    setGuests(0)
    term.current.reset()
    term.current.writeln('\x1b[36mStarting your sandbox…\x1b[0m')
    sock.current.emit('start', { labId: lab?.id, cols: term.current.cols, rows: term.current.rows },
      (r: { ok: boolean; error?: string; code?: string; expiresAt?: number }) => {
        if (!r.ok) {
          setPhase('idle')
          term.current?.reset()
          term.current?.writeln(`\x1b[31m${r.error || 'Could not start the sandbox'}\x1b[0m`)
          toast.error(r.error || 'Could not start the sandbox')
          return
        }
        setActiveLab(lab)
        setExpiresAt(r.expiresAt || 0)
        setPhase('running')
        term.current?.reset()
        term.current?.focus()
        refreshProgress().catch(() => {})
      })
  }, [phase, refreshProgress, stop])

  const emitAck = <T,>(event: string, payload?: unknown) =>
    new Promise<T>((resolve) => {
      const s = sock.current
      if (!s) return resolve({ ok: false, error: 'Not connected' } as T)
      if (payload === undefined) s.emit(event, (r: T) => resolve(r))
      else s.emit(event, payload, (r: T) => resolve(r))
    })

  const check = async () => {
    setBusy('check')
    const r = await emitAck<{ ok: boolean; passed?: boolean; xp?: number; alreadyDone?: boolean; error?: string }>('check')
    setBusy(null)
    if (!r.ok) return toast.error(r.error || 'Could not check')
    if (!r.passed) return toast.error('Not quite yet — re-read the tasks and try again.')
    toast.success(r.alreadyDone ? 'Correct! (already completed)' : `Lab complete! +${r.xp} XP`, { icon: '🎉' })
    refreshProgress().catch(() => {})
  }

  const hint = async () => {
    setBusy('hint')
    const r = await emitAck<{ ok: boolean; hint?: string; none?: boolean; error?: string }>('hint')
    setBusy(null)
    if (!r.ok) return toast.error(r.error || 'No hint available')
    if (r.none) return toast('You have seen every hint for this lab.')
    setHints((h) => [...h, r.hint || ''])
  }

  const askAi = async () => {
    setBusy('ai')
    const r = await emitAck<{ ok: boolean; hint?: string; error?: string }>('ai-hint', { question: aiQuestion })
    setBusy(null)
    if (!r.ok) return toast.error(r.error || 'AI tutor unavailable')
    setAiText(r.hint || '')
    setAiQuestion('')
  }

  const upload = async (file: File) => {
    if (file.size > 64 * 1024) return toast.error('File is too large (64 KB max)')
    const text = await file.text()
    const r = await emitAck<{ ok: boolean; path?: string; error?: string }>('upload', { name: file.name.replace(/[^A-Za-z0-9._-]/g, '_'), content: text })
    if (!r.ok) return toast.error(r.error || 'Upload failed')
    toast.success(`Saved to ${r.path}`)
    term.current?.focus()
  }

  const openGenerated = async () => {
    try {
      const r = await api.get('/sandbox/generated')
      setGenerated(r.data.data)
      if (!r.data.data.length) toast('Generate something first, then try it here.')
    } catch { toast.error('Could not load your generated files') }
  }

  const loadGenerated = async (id: string) => {
    setGenerated([])
    const r = await emitAck<{ ok: boolean; path?: string; error?: string }>('load-generated', { id })
    if (!r.ok) return toast.error(r.error || 'Could not load the file')
    toast.success(`Saved to ${r.path} — run it with: bash ${r.path?.split('/').pop()}`)
    term.current?.focus()
  }

  const startShare = async (allowWrite: boolean) => {
    const r = await emitAck<{ ok: boolean; code?: string; allowWrite?: boolean; error?: string }>('share-start', { allowWrite })
    if (!r.ok) return toast.error(r.error || 'Could not share')
    setShare({ code: r.code!, allowWrite: Boolean(r.allowWrite) })
  }

  const stopShare = async () => { await emitAck('share-stop'); setShare(null); setGuests(0) }

  const joinShare = async () => {
    if (!sock.current || !term.current) return
    if (phase === 'running') await stop()
    term.current.reset()
    const r = await emitAck<{ ok: boolean; allowWrite?: boolean; expiresAt?: number; labId?: string; error?: string }>('share-join', { code: joinCode.trim() })
    if (!r.ok) return toast.error(r.error || 'Could not join')
    setPhase('guest')
    setGuestCanWrite(Boolean(r.allowWrite))
    setExpiresAt(r.expiresAt || 0)
    setActiveLab(labs.find((l) => l.id === r.labId) || null)
    setJoinCode('')
    toast.success(r.allowWrite ? 'Joined — you can type.' : 'Joined — view only.')
  }

  const leaveShare = async () => { await emitAck('share-leave'); setPhase('idle'); term.current?.reset() }

  const grouped = useMemo(() => LEVELS.map((lv) => ({ lv, items: labs.filter((l) => l.level === lv && (filter === 'all' || filter === lv)) })), [labs, filter])

  if (!status) return <div className="p-8 text-center text-slate-500">Loading sandbox…</div>

  if (!status.enabled || !status.available) {
    return (
      <div className="max-w-2xl mx-auto card p-8 text-center">
        <TerminalSquare className="w-10 h-10 mx-auto text-cyan-500" />
        <h1 className="mt-3 font-display text-2xl font-bold">Linux Sandbox</h1>
        <p className="mt-2 text-slate-600 dark:text-gray-300">
          {status.enabled
            ? 'The practice servers are not reachable right now. Please try again in a few minutes.'
            : 'The practice servers are not switched on for this deployment yet.'}
        </p>
        {user?.role === 'admin' && <p className="mt-3 text-sm text-slate-500">Admin: see <code>docs/sandbox.md</code> to enable it (SANDBOX_ENABLED=true and a Docker host).</p>}
      </div>
    )
  }

  const running = phase === 'running'
  const live = running || phase === 'guest'

  return (
    <div className="max-w-[1500px] mx-auto">
      <style>{`@media print { body * { visibility: hidden } #cert, #cert * { visibility: visible } #cert { position: fixed; inset: 0; background: #fff !important; color: #111 !important } }`}</style>

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-sm font-medium text-cyan-700 dark:text-cyan-300"><TerminalSquare className="w-5 h-5" /> Linux Sandbox</div>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">Practice on a real Linux server</h1>
          <p className="mt-1 text-slate-600 dark:text-gray-300 max-w-2xl">A private, throw-away machine for every session. Break things, fix incidents, and learn the commands DevOps engineers use daily.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="card px-4 py-2 flex items-center gap-2"><Trophy className="w-5 h-5 text-amber-500" /><span className="font-bold">{progress?.xp ?? 0}</span><span className="text-sm text-slate-500">XP</span></div>
          {LEVELS.filter((lv) => progress?.levels[lv]?.certified).map((lv) => (
            <button key={lv} onClick={() => setCert(lv)} className="btn-secondary !px-3 !py-2 !text-sm inline-flex items-center gap-1.5"><Award className="w-4 h-4 text-amber-500" /> {lv} certificate</button>
          ))}
        </div>
      </header>

      <div className="mt-6 grid lg:grid-cols-[360px_1fr] gap-5">
        {/* ── lab list ── */}
        <aside className="card p-4 lg:max-h-[78vh] overflow-y-auto" aria-label="Labs">
          <button className="btn-primary w-full !py-2.5 inline-flex items-center justify-center gap-2" onClick={() => start(null)} disabled={phase === 'starting'}>
            <Play className="w-4 h-4" /> Free practice
          </button>
          <p className="mt-2 text-xs text-slate-500 dark:text-gray-400">
            {status.plan === 'free'
              ? <>Free plan: beginner labs, {status.limits.sessionMinutes}-minute sessions, {status.limits.sessionsPerDay}/day. <Link to="/billing" className="underline">Upgrade</Link> for every lab.</>
              : <>Pro: all labs, {status.limits.sessionMinutes}-minute sessions.</>}
            {' '}Today: {progress?.sessionsToday ?? 0}/{status.limits.sessionsPerDay} sessions.
          </p>

          <div className="mt-4 flex gap-1.5 flex-wrap" role="tablist">
            {(['all', ...LEVELS] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize border ${filter === f ? 'bg-cyan-500 text-white border-cyan-500' : 'border-slate-300 dark:border-white/15 text-slate-600 dark:text-gray-300'}`}>{f}</button>
            ))}
          </div>

          {grouped.map(({ lv, items }) => items.length > 0 && (
            <section key={lv} className="mt-5">
              <h2 className="flex items-center justify-between text-sm font-bold capitalize">
                <span>{lv}</span>
                <span className="text-xs font-normal text-slate-500">{progress?.levels[lv]?.done ?? 0}/{progress?.levels[lv]?.total ?? items.length}</span>
              </h2>
              <ul className="mt-2 space-y-1.5">
                {items.map((l) => (
                  <li key={l.id}>
                    <button onClick={() => start(l)} disabled={phase === 'starting'}
                      className={`w-full text-left p-2.5 rounded-xl border transition ${activeLab?.id === l.id && live ? 'border-cyan-400 bg-cyan-500/10' : 'border-slate-200 dark:border-white/10 hover:border-cyan-400/60'} ${l.locked ? 'opacity-60' : ''}`}>
                      <div className="flex items-start gap-2">
                        {l.completed ? <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-500 shrink-0" /> : l.locked ? <Lock className="w-4 h-4 mt-0.5 text-slate-400 shrink-0" /> : <Circle className="w-4 h-4 mt-0.5 text-slate-400 shrink-0" />}
                        <div className="min-w-0">
                          <div className="text-sm font-semibold leading-snug">{l.title}</div>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px]">
                            <span className={`px-1.5 py-0.5 rounded-md font-semibold ${LEVEL_STYLE[l.level]}`}>{CATEGORY_LABEL[l.category] || l.category}</span>
                            <span className="text-slate-500">~{l.minutes} min · {l.xp} XP</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}

          <section className="mt-6 pt-4 border-t border-slate-200 dark:border-white/10">
            <h2 className="text-sm font-bold flex items-center gap-1.5"><Users className="w-4 h-4" /> Join a shared session</h2>
            <div className="mt-2 flex gap-2">
              <input className="input !py-2 !text-sm font-mono uppercase" placeholder="Share code" value={joinCode} maxLength={10} onChange={(e) => setJoinCode(e.target.value)} aria-label="Share code" />
              <button className="btn-secondary !px-3 !py-2 !text-sm" onClick={joinShare} disabled={joinCode.trim().length < 10}>Join</button>
            </div>
          </section>
        </aside>

        {/* ── terminal ── */}
        <main className="min-w-0">
          <div className="card p-3 flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 mr-auto min-w-0">
              <span className={`w-2.5 h-2.5 rounded-full ${live ? 'bg-emerald-500 animate-pulse' : phase === 'starting' ? 'bg-amber-500' : 'bg-slate-400'}`} />
              <span className="text-sm font-semibold truncate">{phase === 'guest' ? 'Shared session' : activeLab ? activeLab.title : live ? 'Free practice' : phase === 'starting' ? 'Starting…' : 'No session'}</span>
              {live && <span className="inline-flex items-center gap-1 text-xs text-slate-500"><Clock className="w-3.5 h-3.5" /> {fmt(secondsLeft)}</span>}
            </div>
            {running && activeLab && <button className="btn-success !px-3 !py-1.5 !text-sm inline-flex items-center gap-1.5" onClick={check} disabled={busy === 'check'}><CheckCircle2 className="w-4 h-4" /> Check my work</button>}
            {running && activeLab && <button className="btn-secondary !px-3 !py-1.5 !text-sm inline-flex items-center gap-1.5" onClick={hint} disabled={busy === 'hint'}><Lightbulb className="w-4 h-4 text-amber-500" /> Hint</button>}
            {running && status.aiHints && <button className="btn-secondary !px-3 !py-1.5 !text-sm inline-flex items-center gap-1.5" onClick={askAi} disabled={busy === 'ai'}><Bot className="w-4 h-4 text-violet-500" /> Ask AI</button>}
            {running && <button className="btn-secondary !px-3 !py-1.5 !text-sm inline-flex items-center gap-1.5" onClick={() => fileInput.current?.click()}><Upload className="w-4 h-4" /> Upload script</button>}
            {running && <button className="btn-secondary !px-3 !py-1.5 !text-sm" onClick={openGenerated}>Try a generated file</button>}
            {running && !share && <button className="btn-secondary !px-3 !py-1.5 !text-sm inline-flex items-center gap-1.5" onClick={() => startShare(false)}><Share2 className="w-4 h-4" /> Share</button>}
            {running && <button className="btn-error !px-3 !py-1.5 !text-sm inline-flex items-center gap-1.5" onClick={() => stop()}><Square className="w-4 h-4" /> End</button>}
            {phase === 'guest' && <button className="btn-secondary !px-3 !py-1.5 !text-sm" onClick={leaveShare}>Leave</button>}
            <input ref={fileInput} type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = '' }} />
          </div>

          {generated.length > 0 && (
            <div className="card mt-3 p-3">
              <div className="flex items-center justify-between"><span className="text-sm font-semibold">Pick a file to copy into the sandbox</span><button onClick={() => setGenerated([])} aria-label="Close"><X className="w-4 h-4" /></button></div>
              <ul className="mt-2 grid sm:grid-cols-2 gap-2">
                {generated.map((g) => (
                  <li key={g._id}><button className="w-full text-left p-2 rounded-lg border border-slate-200 dark:border-white/10 hover:border-cyan-400/60 text-sm" onClick={() => loadGenerated(g._id)}>
                    <span className="font-semibold">{g.name}</span> <span className="text-xs text-slate-500">· {g.type} · {g.fileName}</span></button></li>
                ))}
              </ul>
            </div>
          )}

          {share && (
            <div className="card mt-3 p-3 flex flex-wrap items-center gap-3 text-sm">
              <Share2 className="w-4 h-4 text-cyan-500" />
              <span>Share code <b className="font-mono tracking-wider">{share.code}</b></span>
              <button onClick={() => { navigator.clipboard?.writeText(share.code); toast.success('Copied') }} className="inline-flex items-center gap-1 underline"><Copy className="w-3.5 h-3.5" /> copy</button>
              <label className="inline-flex items-center gap-1.5"><input type="checkbox" checked={share.allowWrite} onChange={(e) => startShare(e.target.checked)} /> allow guests to type</label>
              <span className="text-slate-500">{guests} watching</span>
              <button className="ml-auto underline" onClick={stopShare}>Stop sharing</button>
            </div>
          )}

          {phase === 'guest' && <div className="mt-3 text-sm px-3 py-2 rounded-xl bg-cyan-500/10 text-cyan-800 dark:text-cyan-200">{guestCanWrite ? 'You can type in this shared terminal.' : 'View only — the owner has not allowed typing.'}</div>}
          {phase === 'ended' && (
            <div className="mt-3 flex items-center gap-3 px-3 py-2 rounded-xl bg-amber-500/10 text-amber-800 dark:text-amber-200 text-sm">
              <span>{endMsg}</span>
              <button className="underline font-semibold" onClick={() => start(activeLab)}>Restart {activeLab ? 'this lab' : ''}</button>
            </div>
          )}

          <div className="mt-3 rounded-2xl overflow-hidden border border-slate-800 bg-[#0a0e1a] p-2">
            <div ref={termHost} className="h-[52vh] min-h-[320px]" aria-label="Terminal" />
          </div>

          {/* ── lab brief ── */}
          {activeLab && live && (
            <section className="card mt-3 p-4" aria-label="Lab instructions">
              <div className="flex flex-wrap items-center gap-2">
                <FlaskConical className="w-5 h-5 text-cyan-500" />
                <h2 className="font-display text-lg font-bold">{activeLab.title}</h2>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${LEVEL_STYLE[activeLab.level]}`}>{activeLab.level}</span>
              </div>
              <p className="mt-1 text-sm text-slate-600 dark:text-gray-300">{activeLab.goal}</p>
              <ol className="mt-3 space-y-1.5 text-sm list-decimal list-inside">
                {activeLab.tasks.map((t, i) => <li key={i}>{t}</li>)}
              </ol>
              <div className="mt-3 flex flex-wrap gap-1.5">{activeLab.concepts.map((c) => <span key={c} className="px-2 py-0.5 rounded-md text-xs bg-slate-200/70 dark:bg-white/10 font-mono">{c}</span>)}</div>
              {hints.length > 0 && (
                <div className="mt-4 space-y-2">
                  {hints.map((h, i) => <div key={i} className="text-sm px-3 py-2 rounded-xl bg-amber-500/10"><b>Hint {i + 1}:</b> {h}</div>)}
                  <p className="text-xs text-slate-500">Each hint reduces the XP for this lab a little (never below half).</p>
                </div>
              )}
            </section>
          )}
          {running && status.aiHints && (
            <section className="card mt-3 p-4">
              <label className="text-sm font-semibold flex items-center gap-1.5" htmlFor="ai-q"><Bot className="w-4 h-4 text-violet-500" /> Stuck? Ask the AI tutor</label>
              <div className="mt-2 flex gap-2">
                <input id="ai-q" className="input !py-2 !text-sm" placeholder="e.g. why does my command say permission denied?" maxLength={400} value={aiQuestion} onChange={(e) => setAiQuestion(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && askAi()} />
                <button className="btn-primary !px-4 !py-2 !text-sm" onClick={askAi} disabled={busy === 'ai'}>Ask</button>
              </div>
              {aiText && <p className="mt-3 text-sm px-3 py-2 rounded-xl bg-violet-500/10 whitespace-pre-wrap">{aiText}</p>}
            </section>
          )}
        </main>
      </div>

      {/* ── certificate ── */}
      {cert && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Certificate">
          <div className="bg-white text-slate-900 rounded-2xl max-w-2xl w-full p-6">
            <div id="cert" className="border-4 border-double border-amber-500 rounded-xl p-8 text-center bg-white text-slate-900">
              <Award className="w-12 h-12 mx-auto text-amber-500" />
              <p className="mt-2 text-xs tracking-[0.3em] uppercase text-slate-500">Certificate of completion</p>
              <h2 className="mt-3 text-3xl font-bold">{user?.username}</h2>
              <p className="mt-3 text-slate-600">has completed every <b className="capitalize">{cert}</b> lab in the</p>
              <p className="mt-1 text-xl font-semibold">Linux &amp; DevOps Sandbox</p>
              <p className="mt-4 text-sm text-slate-500">{progress?.levels[cert].total} labs · {new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button className="btn-primary !px-4 !py-2 !text-sm inline-flex items-center gap-1.5" onClick={() => window.print()}><Printer className="w-4 h-4" /> Print / save as PDF</button>
              <button className="btn-secondary !px-4 !py-2 !text-sm" onClick={() => setCert(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Sandbox
