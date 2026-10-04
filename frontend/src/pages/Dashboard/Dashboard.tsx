import React from 'react'
import { Link } from 'react-router-dom'
import {
  FileCode,
  Layers,
  Crown,
  ArrowRight,
  Zap,
  Shield,
  Cloud,
  Container,
  Package,
  Workflow,
  Rocket,
  Server,
  Github,
  DollarSign,
  GraduationCap,
  Map,
  LifeBuoy,
  CheckCircle,
  Clock,
  Sparkles,
  Lock,
} from 'lucide-react'
import { useDashboardStats } from '../../hooks/useDashboardStats'
import { useAuth } from '../../context/AuthContext'
import { recommendationsFor } from '../../utils/profile'

const generators = [
  { name: 'Jenkins Pipeline', text: 'Multi-stage CI/CD Jenkinsfile', icon: Workflow, href: '/generator/jenkins', tint: 'from-blue-500 to-blue-600' },
  { name: 'GitHub Actions', text: 'Workflows with matrix builds', icon: Zap, href: '/generator/github-actions', tint: 'from-purple-500 to-fuchsia-600' },
  { name: 'Dockerfile', text: 'Optimised multi-stage images', icon: Container, href: '/generator/dockerfile', tint: 'from-indigo-500 to-indigo-600' },
  { name: 'Kubernetes YAML', text: 'Deployments, services, ingress', icon: Cloud, href: '/generator/kubernetes', tint: 'from-cyan-500 to-sky-600' },
  { name: 'Terraform IaC', text: 'Modular multi-cloud configs', icon: Package, href: '/generator/terraform', tint: 'from-orange-500 to-amber-600' },
  { name: 'Ansible Playbooks', text: 'Config management & roles', icon: Shield, href: '/generator/ansible', tint: 'from-emerald-500 to-green-600' },
]

const shipTools = [
  { name: 'One-Click Deploy', text: 'Push your app live on your own server', icon: Rocket, href: '/vision' },
  { name: 'Deployments', text: 'Track every release in one place', icon: Server, href: '/deployments' },
  { name: 'GitHub Integration', text: 'Connect repos and automate', icon: Github, href: '/github' },
  { name: 'Cloud Cost Analysis', text: 'See where your cloud money goes', icon: DollarSign, href: '/cloud-cost-analysis' },
]

const helpLinks = [
  { name: 'Learn DevOps', text: 'Guided path from zero to engineer', icon: GraduationCap, href: '/learn' },
  { name: 'Roadmap', text: '12 stages, one clear direction', icon: Map, href: '/roadmap' },
  { name: 'Validator', text: 'Catch config mistakes early', icon: CheckCircle, href: '/validator' },
  { name: 'Help Desk', text: 'Pick your problem, get the fix', icon: LifeBuoy, href: '/help' },
]

const greeting = () => {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}

const timeAgo = (iso: string) => {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.round(hrs / 24)}d ago`
}

const SectionHeader: React.FC<{ title: string; hint?: string; action?: React.ReactNode }> = ({ title, hint, action }) => (
  <div className="mb-4 flex items-end justify-between gap-4">
    <div>
      <h2 className="text-lg font-semibold text-secondary-900 dark:text-white">{title}</h2>
      {hint && <p className="text-sm text-secondary-500 dark:text-secondary-400">{hint}</p>}
    </div>
    {action}
  </div>
)

const Dashboard: React.FC = () => {
  const { stats, loading, error } = useDashboardStats()
  const { user } = useAuth()
  const recommendations = recommendationsFor(user?.workExperience, user?.domains).slice(0, 3)
  const plan = user?.plan
  const isPro = plan?.plan === 'pro'

  const value = (n: number | undefined) => (loading ? '…' : error ? '–' : String(n ?? 0))
  const recent = stats?.recentFiles?.slice(0, 5) ?? []

  const statCards = [
    { label: 'Files generated', value: value(stats?.totalFiles), icon: FileCode, tint: 'text-cyan-500 bg-cyan-500/10' },
    { label: 'Config types used', value: value(Object.keys(stats?.filesByType || {}).length), icon: Layers, tint: 'text-violet-500 bg-violet-500/10' },
    {
      label: 'Your plan',
      value: isPro ? 'Pro' : 'Free',
      sub: isPro && plan?.daysLeft != null ? `${plan.daysLeft} days left` : undefined,
      icon: Crown,
      tint: 'text-amber-500 bg-amber-500/10',
    },
  ]

  return (
    <div className="mx-auto max-w-7xl space-y-10">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-cyan-500 via-blue-600 to-violet-600 p-6 text-white shadow-xl shadow-violet-500/20 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-56 w-56 rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-white/80">{greeting()}</p>
            <h1 className="mt-1 text-3xl font-bold sm:text-4xl">{user?.username || 'there'} 👋</h1>
            <p className="mt-2 max-w-xl text-white/85">
              Generate production-ready DevOps files, validate them, then ship. Pick a tool below, or jump straight into a Dockerfile.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/generator/dockerfile" className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-blue-700 shadow-lg transition hover:-translate-y-0.5">
              <Sparkles className="h-4 w-4" /> New generation
            </Link>
            {!isPro ? (
              <Link to="/payment" className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-5 py-3 text-sm font-semibold ring-1 ring-white/30 backdrop-blur transition hover:bg-white/25">
                <Crown className="h-4 w-4" /> Go Pro
              </Link>
            ) : (
              <Link to="/vision" className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-5 py-3 text-sm font-semibold ring-1 ring-white/30 backdrop-blur transition hover:bg-white/25">
                <Rocket className="h-4 w-4" /> One-click deploy
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {statCards.map((s) => {
          const Icon = s.icon
          return (
            <div key={s.label} className="card flex items-center gap-4 p-5">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${s.tint}`}>
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-secondary-500 dark:text-secondary-400">{s.label}</p>
                <p className="text-2xl font-bold text-secondary-900 dark:text-white">
                  {s.value}
                  {s.sub && <span className="ml-2 text-sm font-medium text-secondary-500">{s.sub}</span>}
                </p>
              </div>
            </div>
          )
        })}
      </section>

      {/* Start here + recent activity */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SectionHeader title="Start here" hint="Picked for your experience and interests" />
          <div className="grid gap-4 sm:grid-cols-3">
            {recommendations.map((r, i) => (
              <Link key={r.title} to={r.to} className="card group relative p-5 transition hover:-translate-y-0.5 hover:border-cyan-400/60">
                <span className="mb-3 flex h-7 w-7 items-center justify-center rounded-lg bg-primary-100 text-xs font-bold text-primary-700 dark:bg-cyan-400/15 dark:text-cyan-300">{i + 1}</span>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-secondary-900 dark:text-white">{r.title}</h3>
                  {r.pro && !isPro && <span className="rounded bg-amber-400/90 px-1.5 py-0.5 text-[10px] font-bold text-amber-950">PRO</span>}
                </div>
                <p className="mt-1 text-sm text-secondary-600 dark:text-secondary-400">{r.text}</p>
                <span className="mt-3 inline-flex items-center text-sm font-medium text-primary-600 dark:text-cyan-300">
                  Open <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div>
          <SectionHeader title="Recent activity" action={<Link to="/history" className="text-sm font-medium text-primary-600 dark:text-cyan-300">View all</Link>} />
          <div className="card divide-y divide-secondary-100 dark:divide-white/5">
            {recent.length === 0 ? (
              <div className="p-6 text-center text-sm text-secondary-500 dark:text-secondary-400">
                <Clock className="mx-auto mb-2 h-6 w-6 opacity-60" />
                {loading ? 'Loading…' : 'Nothing yet. Generate your first file and it shows up here.'}
              </div>
            ) : (
              recent.map((f, i) => (
                <div key={`${f.name}-${i}`} className="flex items-center gap-3 px-4 py-3">
                  <FileCode className="h-4 w-4 shrink-0 text-secondary-400" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-secondary-900 dark:text-white">{f.name}</p>
                    <p className="text-xs capitalize text-secondary-500">{f.type}</p>
                  </div>
                  <span className="text-xs text-secondary-400">{timeAgo(f.createdAt)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Generators */}
      <section>
        <SectionHeader title="Generate" hint="Production-ready files in seconds" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {generators.map((g) => {
            const Icon = g.icon
            return (
              <Link key={g.name} to={g.href} className="card group flex items-center gap-4 p-4 transition hover:-translate-y-0.5 hover:shadow-2xl">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${g.tint} shadow-lg transition-transform group-hover:scale-110`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-secondary-900 dark:text-white">{g.name}</h3>
                  <p className="truncate text-sm text-secondary-500 dark:text-secondary-400">{g.text}</p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-secondary-300 transition group-hover:translate-x-1 group-hover:text-primary-500" />
              </Link>
            )
          })}
        </div>
      </section>

      {/* Ship */}
      <section>
        <SectionHeader
          title="Deploy & ship"
          hint={isPro ? 'Take your work live' : 'Pro tools to take your work live'}
          action={!isPro && <Link to="/payment" className="text-sm font-medium text-primary-600 dark:text-cyan-300">Unlock with Pro</Link>}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {shipTools.map((t) => {
            const Icon = t.icon
            return (
              <Link key={t.name} to={isPro ? t.href : '/payment'} className="card group relative p-5 transition hover:-translate-y-0.5 hover:border-violet-400/60">
                {!isPro && <Lock className="absolute right-4 top-4 h-4 w-4 text-amber-500" />}
                <Icon className="mb-3 h-6 w-6 text-violet-500 dark:text-violet-300" />
                <h3 className="font-semibold text-secondary-900 dark:text-white">{t.name}</h3>
                <p className="mt-1 text-sm text-secondary-500 dark:text-secondary-400">{t.text}</p>
              </Link>
            )
          })}
        </div>
      </section>

      {/* Learn & help */}
      <section>
        <SectionHeader title="Learn & get help" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {helpLinks.map((t) => {
            const Icon = t.icon
            return (
              <Link key={t.name} to={t.href} className="group flex items-center gap-3 rounded-2xl border border-secondary-200 bg-white/60 p-4 transition hover:border-primary-400/60 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10">
                <Icon className="h-5 w-5 shrink-0 text-secondary-400 transition-colors group-hover:text-primary-500" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-secondary-900 dark:text-white">{t.name}</p>
                  <p className="truncate text-xs text-secondary-500 dark:text-secondary-400">{t.text}</p>
                </div>
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}

export default Dashboard
