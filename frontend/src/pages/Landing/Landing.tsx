import React, { Suspense, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  GitBranch, Zap, Shield, Cloud, ArrowRight, Code, Users, Rocket, Cpu,
  Send, Container, Boxes, Terminal, Activity, Lock, CheckCircle,
} from 'lucide-react'
import Header from '../../components/Header/Header'
import { Reveal, CountUp } from '../../components/Motion/Reveal'
import TerminalDemo from '../../components/Motion/TerminalDemo'
import DeployFlowStatic from '../../components/Motion/DeployFlowStatic'
import api from '../../services/api'
import { useTheme } from '../../context/ThemeContext'

const DeployFlowScene = React.lazy(() => import('../../components/Three/DeployFlowScene'))

const generators = [
  'Terraform', 'Kubernetes', 'Docker', 'Jenkins', 'GitHub Actions', 'GitLab CI',
  'Azure DevOps', 'Ansible', 'Monitoring', 'SSL / TLS', 'Bash', 'Python',
]

const features = [
  { icon: Zap, title: 'One-click deployment', text: 'Push a Docker stack to your own AWS server with generated compose files, nginx and SSL — no manual wiring.' },
  { icon: Cloud, title: 'Terraform templates', text: 'Production-ready modules for AWS, Azure, GCP and Kubernetes. Start from a template, not a blank file.' },
  { icon: GitBranch, title: 'CI/CD in seconds', text: 'Jenkins, GitHub Actions, GitLab CI and Azure DevOps pipelines with build, test, scan and deploy stages.' },
  { icon: Shield, title: 'Validate before you ship', text: 'Paste any config and catch mistakes and insecure defaults before they reach production.' },
  { icon: Activity, title: 'Cloud cost analysis', text: 'Connect AWS Cost Explorer and see where the money goes, by service and over time.' },
  { icon: Users, title: 'DevOps community', text: 'Realtime chat, blogs and a library of real production errors with fixes, written by engineers.' },
]

const steps = [
  { icon: Terminal, title: 'Describe', text: 'Pick a stack, cloud and options.' },
  { icon: Code, title: 'Generate', text: 'Get reviewed, best-practice config instantly.' },
  { icon: Shield, title: 'Validate', text: 'Security and syntax checks run automatically.' },
  { icon: Rocket, title: 'Deploy', text: 'Ship with one click, track every deployment.' },
]

const Landing: React.FC = () => {
  const { theme } = useTheme()
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [sending, setSending] = useState(false)
  const [status, setStatus] = useState<'idle' | 'ok' | 'err'>('idle')
  const reduceMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  const [videoOk, setVideoOk] = useState(true)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    try {
      await api.post('/contact', form)
      setStatus('ok')
      setForm({ name: '', email: '', subject: '', message: '' })
    } catch {
      setStatus('err')
    } finally {
      setSending(false)
      setTimeout(() => setStatus('idle'), 5000)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-ink-950 text-slate-900 dark:text-gray-100 overflow-x-hidden">
      <Header transparent />

      {/* HERO */}
      <section className="relative min-h-screen flex items-center pt-24 pb-16" aria-labelledby="hero-heading">
        {!reduceMotion && videoOk && (
          <video
            className="absolute inset-0 w-full h-full object-cover opacity-25"
            src="/media/hero.mp4"
            poster="/media/hero-poster.jpg"
            autoPlay muted loop playsInline preload="none"
            onError={() => setVideoOk(false)}
            aria-hidden="true"
          />
        )}
        <div className="absolute inset-0 bg-grid" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50/40 via-transparent to-slate-50 dark:from-ink-950/40 dark:to-ink-950" aria-hidden="true" />

        {/* 3D deployment flow (desktop). Phones / reduced-motion get the plain flow list instead. */}
        <div className="absolute inset-y-0 right-0 hidden lg:block lg:w-[50%]" role="img" aria-label="Animated diagram: code is pushed to GitHub, built and tested by GitHub Actions, packaged by Docker, stored on Docker Hub, provisioned by Terraform, run by Kubernetes and served live from an AWS server with Nginx.">
          {reduceMotion ? (
            <div className="h-full flex items-center"><DeployFlowStatic className="flex-col items-start" /></div>
          ) : (
            <Suspense fallback={null}>
              <DeployFlowScene dark={theme === 'dark'} />
            </Suspense>
          )}
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pointer-events-none">
          <div className="max-w-3xl pointer-events-none">
            <Reveal>
              <span className="pointer-events-auto inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border border-cyan-500/40 dark:border-cyan-400/30 bg-cyan-500/10 dark:bg-cyan-400/10 text-cyan-800 dark:text-cyan-200">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 animate-pulse" /> Free DevOps toolkit — built for engineers
              </span>
            </Reveal>
            <Reveal delay={0.08}>
              <h1 id="hero-heading" className="font-display mt-6 text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05]">
                Ship infrastructure <span className="text-gradient">at the speed of thought.</span>
              </h1>
            </Reveal>
            <Reveal delay={0.16}>
              <p className="mt-6 text-lg sm:text-xl text-slate-600 dark:text-gray-300 max-w-2xl leading-relaxed">
                Generate, validate and deploy Terraform, Kubernetes, Docker and CI/CD pipelines — then learn why they work.
                Production-grade defaults, one platform, zero boilerplate.
              </p>
            </Reveal>
            <Reveal delay={0.24}>
              <div className="mt-9 flex flex-col sm:flex-row gap-4 pointer-events-auto">
                <Link to="/register" className="btn-primary inline-flex items-center justify-center text-base">
                  Start free <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
                <Link to="/features" className="inline-flex items-center justify-center px-6 py-3 rounded-xl font-semibold border border-slate-300 dark:border-white/15 bg-white/60 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 transition">
                  Explore features
                </Link>
              </div>
            </Reveal>
            <Reveal delay={0.32}><DeployFlowStatic className="mt-10 lg:hidden pointer-events-auto" /></Reveal>
          </div>
        </div>
      </section>

      {/* GENERATOR MARQUEE */}
      <section className="border-y border-slate-200 dark:border-white/10 bg-white/70 dark:bg-ink-900/60 py-5 overflow-hidden" aria-label="Supported generators">
        <div className="marquee gap-4">
          {[...generators, ...generators].map((g, i) => (
            <span key={i} className="mx-3 px-4 py-1.5 rounded-full border border-slate-300 dark:border-white/10 text-sm text-slate-600 dark:text-gray-300 whitespace-nowrap font-mono">
              {g}
            </span>
          ))}
        </div>
      </section>

      {/* STATS */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { n: 12, s: '', l: 'Config generators' },
            { n: 3, s: '', l: 'Clouds: AWS · Azure · GCP' },
            { n: 1, s: '-click', l: 'Deploy to your server' },
            { n: 0, s: '$', l: 'To get started' },
          ].map((x) => (
            <Reveal key={x.l}>
              <div className="font-display text-5xl font-bold text-gradient">
                {x.s === '$' ? '$' : ''}<CountUp to={x.n} suffix={x.s === '$' ? '' : x.s} />
              </div>
              <div className="mt-2 text-sm text-slate-600 dark:text-gray-400">{x.l}</div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-20" id="features" aria-labelledby="features-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="max-w-2xl">
            <h2 id="features-heading" className="font-display text-4xl md:text-5xl font-bold tracking-tight">
              One platform for the whole <span className="text-gradient">delivery path</span>
            </h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-gray-400">From the first Dockerfile to a monitored production deployment.</p>
          </Reveal>
          <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <Reveal key={f.title} delay={i * 0.06}>
                <div className="glass-panel glow-border h-full p-7 hover:-translate-y-1 transition-transform duration-300">
                  <div className="w-12 h-12 rounded-xl hero-gradient flex items-center justify-center shadow-lg shadow-cyan-500/20">
                    <f.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="mt-5 font-display text-xl font-semibold">{f.title}</h3>
                  <p className="mt-2 text-slate-600 dark:text-gray-400 leading-relaxed">{f.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* LIVE TERMINAL + STEPS */}
      <section className="py-20 bg-white/60 dark:bg-ink-900/50 border-y border-slate-200 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
          <Reveal>
            <h2 className="font-display text-4xl font-bold tracking-tight">From idea to deployed in four steps</h2>
            <ol className="mt-8 space-y-5">
              {steps.map((s, i) => (
                <li key={s.title} className="flex gap-4">
                  <span className="shrink-0 w-10 h-10 rounded-xl border border-cyan-500/40 dark:border-cyan-400/30 bg-cyan-500/10 dark:bg-cyan-400/10 text-cyan-800 dark:text-cyan-200 flex items-center justify-center font-mono text-sm">
                    {i + 1}
                  </span>
                  <div>
                    <div className="font-semibold flex items-center gap-2"><s.icon className="w-4 h-4 text-violet-600 dark:text-violet-300" />{s.title}</div>
                    <div className="text-slate-600 dark:text-gray-400">{s.text}</div>
                  </div>
                </li>
              ))}
            </ol>
          </Reveal>
          <Reveal delay={0.1}><TerminalDemo /></Reveal>
        </div>
      </section>

      {/* WHY */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-3 gap-5">
          {[
            { icon: Lock, t: 'Secure by default', d: 'Least-privilege IAM, private subnets, encrypted storage and secret handling baked into every template.' },
            { icon: Boxes, t: 'Learn as you build', d: 'Every output is readable, commented and backed by docs, a learning roadmap and real incident write-ups.' },
            { icon: Container, t: 'Yours to keep', d: 'Plain files — no lock-in. Download, commit and run them anywhere.' },
          ].map((x, i) => (
            <Reveal key={x.t} delay={i * 0.08}>
              <div className="glass-panel p-7 h-full">
                <x.icon className="w-7 h-7 text-cyan-600 dark:text-cyan-300" />
                <h3 className="mt-4 font-display text-xl font-semibold">{x.t}</h3>
                <p className="mt-2 text-slate-600 dark:text-gray-400">{x.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <Reveal className="max-w-4xl mx-auto px-4">
          <div className="relative overflow-hidden rounded-3xl p-10 md:p-14 text-center hero-gradient">
            <div className="absolute inset-0 bg-ink-950/40" aria-hidden="true" />
            <div className="relative">
              <Cpu className="w-10 h-10 mx-auto text-white/90" />
              <h2 className="mt-4 font-display text-3xl md:text-4xl font-bold text-white">Stop copy-pasting configs from Stack Overflow.</h2>
              <p className="mt-3 text-white/85">Create a free account and generate your first pipeline in under a minute.</p>
              <Link to="/register" className="mt-8 inline-flex items-center px-8 py-3.5 rounded-xl bg-white text-ink-950 font-semibold hover:bg-gray-100 transition">
                Create free account <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      {/* CONTACT */}
      <section className="py-20" id="contact">
        <div className="max-w-2xl mx-auto px-4">
          <Reveal>
            <h2 className="font-display text-3xl font-bold text-center">Questions or ideas?</h2>
            <p className="mt-2 text-center text-slate-600 dark:text-gray-400">Tell us what would make this more useful for your team.</p>
            <form onSubmit={submit} className="mt-8 glass-panel p-6 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <input className="input" required placeholder="Name" aria-label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <input className="input" required type="email" placeholder="Email" aria-label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <input className="input" required placeholder="Subject" aria-label="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
              <textarea className="input" required rows={4} placeholder="Message" aria-label="Message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
              <button disabled={sending} className="btn-primary w-full inline-flex items-center justify-center disabled:opacity-60">
                {sending ? 'Sending…' : <>Send message <Send className="ml-2 w-4 h-4" /></>}
              </button>
              <div role="status" aria-live="polite" className="text-sm text-center min-h-[1.25rem]">
                {status === 'ok' && <span className="text-emerald-600 dark:text-emerald-300 inline-flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Message sent — thank you!</span>}
                {status === 'err' && <span className="text-red-600 dark:text-red-300">Could not send. Please try again.</span>}
              </div>
            </form>
          </Reveal>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 dark:border-white/10 py-12 bg-slate-100 dark:bg-ink-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-4 gap-8 text-sm">
          <div>
            <div className="flex items-center gap-2 font-display font-bold text-lg"><GitBranch className="w-5 h-5 text-cyan-600 dark:text-cyan-300" /> AutoDevOps</div>
            <p className="mt-3 text-slate-600 dark:text-gray-400">Production-ready DevOps configurations, in seconds.</p>
          </div>
          <FooterCol title="Product" links={[['Features', '/features'], ['Pricing', '/pricing']]} />
          <FooterCol title="Company" links={[['About', '/about'], ['Contact', '/contact']]} />
          <FooterCol title="Account" links={[['Sign in', '/login'], ['Create account', '/register']]} />
        </div>
        <div className="mt-10 text-center text-slate-500 text-sm">
          © {new Date().getFullYear()} AutoDevOps · Built by{' '}
          <a href="https://github.com/Chinmaya1999" target="_blank" rel="noopener noreferrer" className="text-cyan-700 dark:text-cyan-300 hover:text-cyan-600 dark:hover:text-cyan-200">Chinmaya Kumar Mallick</a>
        </div>
      </footer>
    </div>
  )
}

const FooterCol: React.FC<{ title: string; links: [string, string][] }> = ({ title, links }) => (
  <div>
    <h3 className="font-semibold mb-3">{title}</h3>
    <ul className="space-y-2 text-slate-600 dark:text-gray-400">
      {links.map(([n, h]) => (
        <li key={n}><Link to={h} className="hover:text-slate-900 dark:hover:text-white transition-colors">{n}</Link></li>
      ))}
    </ul>
  </div>
)

export default Landing
