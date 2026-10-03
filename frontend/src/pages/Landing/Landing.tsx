import React, { Suspense, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Zap, Shield, ArrowRight, Users, Rocket, Cpu,
  Send, Container, Boxes, Terminal, Activity, Lock, CheckCircle,
  GraduationCap, Download, BookOpen, LifeBuoy, Globe, Clock, Server,
} from 'lucide-react'
import Header from '../../components/Header/Header'
import { Reveal, CountUp } from '../../components/Motion/Reveal'
import TerminalDemo from '../../components/Motion/TerminalDemo'
import DeployFlowStatic from '../../components/Motion/DeployFlowStatic'
import api from '../../services/api'
import { STAGES } from '../../content/learn/curriculum'
import { API_BASE } from '../../services/api'
import { useTheme } from '../../context/ThemeContext'
import Logo from '../../components/UI/Logo'

const DeployFlowScene = React.lazy(() => import('../../components/Three/DeployFlowScene'))

const generators = [
  'Terraform', 'Kubernetes', 'Docker', 'Jenkins', 'GitHub Actions', 'Ansible', 'Bash', 'Python',
  'Nginx', 'Linux', 'Git', 'AWS',
]

const features = [
  { icon: GraduationCap, tag: 'Free', title: 'Learn DevOps from zero', text: 'A 12-stage roadmap for college students and freshers, plus step-by-step guides that deploy real websites. Every risky step shows the expected output and the fix for common errors.' },
  { icon: Terminal, tag: 'Free · 10/month', title: '8 config generators', text: 'Create Dockerfiles, Kubernetes manifests, Terraform, Jenkinsfiles, GitHub Actions workflows, Ansible playbooks, Bash and Python scripts from a short form. Read the output to learn how experts write it.' },
  { icon: Shield, tag: 'Free', title: 'Validator and secret scanner', text: 'Paste a config to catch mistakes and insecure defaults before you deploy. Scan code and .env files for leaked passwords, keys and tokens. Nothing you paste is stored.' },
  { icon: LifeBuoy, tag: 'Free', title: 'Help desk and error troubleshooter', text: 'Pick your problem (Kubernetes, Docker, Terraform, AWS, Nginx, SSH…) or paste an error, and get the cause plus the exact commands to fix it. 29 common production errors covered.' },
  { icon: Zap, tag: 'Pro', title: 'Full-stack bundle and one-click deploy', text: 'Download Docker, CI/CD and Kubernetes files for your app as one ZIP, or deploy a Docker stack to your own AWS server and manage it from a dashboard.' },
  { icon: Activity, tag: 'Pro', title: 'Cloud cost analysis', text: 'Connect AWS Cost Explorer and see where the money goes, by service and over time, so a forgotten server never surprises you.' },
  { icon: Users, tag: 'Free', title: 'Community, blogs and docs', text: 'Chat with other learners, read and write blog posts, and use the DevOps documentation library.' },
]

const steps = [
  { icon: GraduationCap, title: 'Learn', text: 'Follow the roadmap and the guides. Download a tested starter project.' },
  { icon: Terminal, title: 'Generate', text: 'Create the Dockerfile, pipeline or Terraform your project needs.' },
  { icon: Shield, title: 'Check', text: 'Validate configs and scan for leaked secrets before you deploy.' },
  { icon: Rocket, title: 'Deploy', text: 'Put it on your own server, with HTTPS and automatic deploys.' },
  { icon: LifeBuoy, title: 'Fix', text: 'Hit an error? Help desk and troubleshooter show the cause and the fix.' },
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
            { n: 8, s: '', l: 'Config generators' },
            { n: 9, s: '', l: 'Step-by-step guides' },
            { n: 12, s: '', l: 'Roadmap stages, zero to job-ready' },
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
              What DeployDojo <span className="text-gradient">does for you</span>
            </h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-gray-400">
              DeployDojo is a <strong>learning platform and a toolbox</strong> for DevOps. Beginners learn by deploying real projects. Working engineers generate configs, check them, and fix production errors faster.
            </p>
          </Reveal>
          <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <Reveal key={f.title} delay={i * 0.06}>
                <div className="glass-panel glow-border h-full p-7 hover:-translate-y-1 transition-transform duration-300">
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-xl hero-gradient flex items-center justify-center shadow-lg shadow-cyan-500/20">
                      <f.icon className="w-6 h-6 text-white" />
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${f.tag === 'Pro' ? 'bg-amber-400/90 text-amber-950' : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'}`}>{f.tag}</span>
                  </div>
                  <h3 className="mt-5 font-display text-xl font-semibold">{f.title}</h3>
                  <p className="mt-2 text-slate-600 dark:text-gray-400 leading-relaxed">{f.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* DEPLOY ANYTHING, STEP BY STEP */}
      <section className="py-20" id="guides" aria-labelledby="guides-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="max-w-3xl">
            <h2 id="guides-heading" className="font-display text-4xl md:text-5xl font-bold tracking-tight">
              Deploy any app, <span className="text-gradient">step by step</span>
            </h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-gray-400">
              Static website, Node.js app or a full MERN stack: each guide takes you from your laptop to a live server using real DevOps tools. Every command is copy-paste ready, every risky step shows <strong>what you should see</strong>, and common errors come with their fix.
            </p>
          </Reveal>
          <div className="mt-10 grid md:grid-cols-3 gap-5">
            {[
              { icon: Globe, name: 'Static website', slug: 'deploy-static-website', starter: 'static-site', level: 'Beginner', time: '~1 hour', tools: ['HTML/CSS/JS', 'Nginx', 'Git', 'GitHub Actions'], text: 'Publish a portfolio on your own server with Nginx, then make every git push update it automatically.' },
              { icon: Server, name: 'Dynamic Node.js app', slug: 'deploy-nodejs-app', starter: 'node-api', level: 'Beginner', time: '~1.5 hours', tools: ['Node.js', 'Docker', 'Compose', 'Nginx'], text: 'Run a backend in a Docker container, put Nginx in front of it, and redeploy on every push.' },
              { icon: Boxes, name: 'MERN full stack', slug: 'deploy-mern-app', starter: 'mern-tasks', level: 'Intermediate', time: '~2 hours', tools: ['MongoDB', 'Express', 'React', 'Docker Compose'], text: 'Deploy React, an Express API and MongoDB with persistent data, plus a checklist for your own MERN project.' },
            ].map((g, i) => (
              <Reveal key={g.slug} delay={i * 0.08}>
                <div className="glass-panel glow-border h-full p-6 flex flex-col">
                  <div className="flex items-center justify-between">
                    <span className="w-11 h-11 rounded-xl hero-gradient flex items-center justify-center shadow-lg shadow-cyan-500/20"><g.icon className="w-5 h-5 text-white" /></span>
                    <span className="text-xs text-slate-500 dark:text-gray-400 inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {g.time} · {g.level}</span>
                  </div>
                  <h3 className="mt-4 font-display text-xl font-semibold">{g.name}</h3>
                  <p className="mt-2 text-slate-600 dark:text-gray-400 flex-1">{g.text}</p>
                  <div className="mt-4 flex flex-wrap gap-1.5">{g.tools.map((t) => <span key={t} className="px-2 py-0.5 rounded-md text-xs bg-slate-200/70 dark:bg-white/10">{t}</span>)}</div>
                  <div className="mt-5 flex gap-2">
                    <Link to={`/learn/${g.slug}`} className="btn-primary !px-4 !py-2.5 text-sm inline-flex items-center">Read the guide <ArrowRight className="ml-1.5 w-4 h-4" /></Link>
                    <a href={`${API_BASE}/learn/starter/${g.starter}`} className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-white/15 text-sm font-semibold inline-flex items-center gap-1.5 hover:bg-white dark:hover:bg-white/5"><Download className="w-4 h-4" /> Starter</a>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal className="mt-8">
            <div className="glass-panel p-5 flex flex-col md:flex-row md:items-center gap-4 justify-between">
              <p className="text-slate-700 dark:text-gray-300">Also included: preparing your computer, launching an AWS server, a free domain + HTTPS, CI/CD with GitHub Actions explained line by line, and a deployment error cheat sheet.</p>
              <Link to="/learn" className="shrink-0 font-semibold text-cyan-700 dark:text-cyan-300 hover:underline inline-flex items-center">See all 9 guides <ArrowRight className="ml-1 w-4 h-4" /></Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ROADMAP */}
      <section className="py-20 bg-white/60 dark:bg-ink-900/50 border-y border-slate-200 dark:border-white/5" id="roadmap" aria-labelledby="roadmap-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="max-w-3xl">
            <h2 id="roadmap-heading" className="font-display text-4xl md:text-5xl font-bold tracking-tight">
              A clear path from <span className="text-gradient">fresher to DevOps engineer</span>
            </h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-gray-400">
              No idea where to start? Sign up and follow 12 stages: what to learn, in what order, how to know you are ready to move on, and a project for each stage. About 6–9 months of part-time study. Progress is saved to your account.
            </p>
          </Reveal>
          <ol className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {STAGES.map((st, i) => (
              <Reveal key={st.id} delay={(i % 3) * 0.06}>
                <li className="glass-panel p-5 h-full list-none">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-gray-400">
                    <span className="font-mono">Stage {i + 1}</span><span>{st.weeks}</span>
                  </div>
                  <h3 className="mt-2 font-display font-semibold leading-snug">{st.title.replace(/^\d+\.\s*/, '')}</h3>
                  <p className="mt-2 text-sm text-slate-600 dark:text-gray-400">{st.goal}</p>
                </li>
              </Reveal>
            ))}
          </ol>
          <Reveal className="mt-8 flex flex-wrap gap-3">
            <Link to="/register" className="btn-primary inline-flex items-center">Start free <ArrowRight className="ml-2 w-5 h-5" /></Link>
            <Link to="/learn" className="inline-flex items-center px-6 py-3 rounded-xl font-semibold border border-slate-300 dark:border-white/15 hover:bg-white dark:hover:bg-white/5"><BookOpen className="w-5 h-5 mr-2" /> Preview the roadmap</Link>
          </Reveal>
        </div>
      </section>

      {/* LIVE TERMINAL + STEPS */}
      <section className="py-20 bg-white/60 dark:bg-ink-900/50 border-y border-slate-200 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
          <Reveal>
            <h2 className="font-display text-4xl font-bold tracking-tight">How it works: five steps, repeated for every project</h2>
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
            <Logo size={38} />
            <p className="mt-3 text-slate-600 dark:text-gray-400">Learn DevOps by deploying real projects. Generate, check and fix with confidence.</p>
          </div>
          <FooterCol title="Product" links={[['Features', '/features'], ['Pricing', '/pricing']]} />
          <FooterCol title="Company" links={[['About', '/about'], ['Contact', '/contact']]} />
          <FooterCol title="Account" links={[['Sign in', '/login'], ['Create account', '/register']]} />
        </div>
        <div className="mt-10 text-center text-slate-500 text-sm">
          © {new Date().getFullYear()} DeployDojo · Built by{' '}
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
