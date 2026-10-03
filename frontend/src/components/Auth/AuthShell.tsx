import React from 'react'
import { Link } from 'react-router-dom'
import { Boxes, Container, GitBranch, Server, Workflow, ShieldCheck, Zap, Lock } from 'lucide-react'
import ThemeToggle from '../UI/ThemeToggle'
import Logo from '../UI/Logo'

const FLOW = [
  { icon: GitBranch, label: 'git push', color: '#e2e8f0' },
  { icon: Workflow, label: 'build & test', color: '#a78bfa' },
  { icon: Container, label: 'docker image', color: '#38bdf8' },
  { icon: Boxes, label: 'kubernetes', color: '#60a5fa' },
  { icon: Server, label: 'live on your server', color: '#34d399' },
]

/** Split-screen layout shared by login, signup, forgot and reset password. */
const AuthShell: React.FC<{
  title: string
  subtitle?: string
  children: React.ReactNode
  footer?: React.ReactNode
  wide?: boolean
}> = ({ title, subtitle, children, footer, wide }) => (
  <div className="min-h-screen grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] bg-slate-50 dark:bg-ink-950 text-slate-900 dark:text-gray-100">
    {/* Brand panel — always dark, with a CSS-animated deploy pipeline */}
    <aside className="dark relative hidden lg:flex flex-col justify-between p-12 overflow-hidden text-white bg-gradient-to-br from-[#0a0e1a] via-[#0b1630] to-[#1b1147]" aria-hidden="true">
      <div className="absolute inset-0 bg-grid opacity-60" />
      <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-cyan-500/20 blur-3xl" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-violet-600/25 blur-3xl" />

      <Link to="/" className="relative w-fit" tabIndex={-1}><Logo size={40} tone="light" /></Link>

      <div className="relative">
        <h2 className="font-display text-4xl font-bold leading-tight">From commit to <span className="text-gradient">production</span>,<br />without the guesswork.</h2>
        <div className="mt-10 relative pl-6">
          <div className="absolute left-[27px] top-3 bottom-3 w-px bg-gradient-to-b from-cyan-400/60 via-violet-400/40 to-emerald-400/60" />
          <span className="auth-flow-dot" />
          <ul className="space-y-5">
            {FLOW.map((f, i) => (
              <li key={f.label} className="relative flex items-center gap-4">
                <span className="auth-flow-node w-9 h-9 rounded-xl flex items-center justify-center border border-white/15 bg-white/5 backdrop-blur" style={{ animationDelay: `${i * 0.9}s` }}>
                  <f.icon className="w-4 h-4" style={{ color: f.color }} />
                </span>
                <span className="font-mono text-sm text-gray-300">{f.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <ul className="relative grid gap-3 text-sm text-gray-300">
        <li className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-300" /> Passwords hashed, sessions expire, secrets encrypted</li>
        <li className="flex items-center gap-2"><Zap className="w-4 h-4 text-cyan-300" /> Generators, validator and troubleshooter built in</li>
        <li className="flex items-center gap-2"><Lock className="w-4 h-4 text-violet-300" /> Nothing you paste into the tools is stored</li>
      </ul>
    </aside>

    <main className="flex flex-col min-h-screen">
      <div className="flex items-center justify-between p-4 sm:p-6">
        <Link to="/" className="lg:invisible" aria-label="DeployDojo home"><Logo size={32} /></Link>
        <ThemeToggle />
      </div>
      <div className="flex-1 flex items-center justify-center px-4 pb-10">
        <div className={`w-full ${wide ? 'max-w-xl' : 'max-w-md'}`}>
          <h1 className="font-display text-3xl font-bold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-2 text-slate-600 dark:text-gray-400">{subtitle}</p>}
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-6 text-center text-sm text-slate-600 dark:text-gray-400">{footer}</div>}
        </div>
      </div>
    </main>
  </div>
)

export default AuthShell
