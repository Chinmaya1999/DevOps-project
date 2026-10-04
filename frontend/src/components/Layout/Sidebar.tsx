import React, { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Home,
  Rocket,
  DollarSign,
  Server,
  Github,
  Package,
  Zap,
  Shield,
  Cloud,
  Container,
  Terminal,
  FileText,
  Code,
  CheckCircle,
  History,
  BookOpen,
  GraduationCap,
  Map,
  MessageSquare,
  PenLine,
  LifeBuoy,
  Receipt,
  ShieldCheck,
  Settings,
  ChevronDown,
  Crown,
  Sparkles,
  Workflow,
} from 'lucide-react'
import Logo from '../UI/Logo'

interface NavItem {
  name: string
  href: string
  icon: React.ElementType
  pro?: boolean
  hint?: string
}

interface NavGroup {
  id: string
  label: string
  items: NavItem[]
}

// Ordered by the user's journey: create -> ship -> check -> learn -> manage account.
const GROUPS: NavGroup[] = [
  {
    id: 'build',
    label: 'Generate',
    items: [
      { name: 'Jenkins Pipeline', href: '/generator/jenkins', icon: Workflow },
      { name: 'GitHub Actions', href: '/generator/github-actions', icon: Zap },
      { name: 'Dockerfile', href: '/generator/dockerfile', icon: Container },
      { name: 'Kubernetes YAML', href: '/generator/kubernetes', icon: Cloud },
      { name: 'Terraform IaC', href: '/generator/terraform', icon: Package },
      { name: 'Ansible Playbooks', href: '/generator/ansible', icon: Shield },
      { name: 'Bash Script', href: '/generator/bash', icon: Terminal },
      { name: 'Python Script', href: '/generator/python', icon: Code },
    ],
  },
  {
    id: 'ship',
    label: 'Deploy & Ship',
    items: [
      { name: 'One-Click Deploy', href: '/vision', icon: Rocket, pro: true },
      { name: 'Deployments', href: '/deployments', icon: Server, pro: true },
      { name: 'GitHub Integration', href: '/github', icon: Github, pro: true },
      { name: 'Full-stack Bundle', href: '/bundle', icon: Package, pro: true },
      { name: 'Cloud Cost Analysis', href: '/cloud-cost-analysis', icon: DollarSign, pro: true },
    ],
  },
  {
    id: 'tools',
    label: 'Tools',
    items: [
      { name: 'Validator', href: '/validator', icon: CheckCircle },
      { name: 'DevOps Toolbox', href: '/toolbox', icon: Terminal },
      { name: 'History', href: '/history', icon: History },
    ],
  },
  {
    id: 'learn',
    label: 'Learn & Community',
    items: [
      { name: 'Learn DevOps', href: '/learn', icon: GraduationCap },
      { name: 'DevOps Docs', href: '/devops-docs', icon: BookOpen },
      { name: 'Roadmap', href: '/roadmap', icon: Map },
      { name: 'Blog', href: '/blogs', icon: FileText },
      { name: 'My Blogs', href: '/blogs/my-blogs', icon: PenLine },
      { name: 'Collaboration Hub', href: '/chat', icon: MessageSquare },
    ],
  },
  {
    id: 'account',
    label: 'Account & Support',
    items: [
      { name: 'Help Desk', href: '/help', icon: LifeBuoy },
      { name: 'Billing', href: '/billing', icon: Receipt },
      { name: 'Security', href: '/security', icon: ShieldCheck },
    ],
  },
]

const STORAGE_KEY = 'sidebarClosedGroups'

const readClosed = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

interface SidebarProps {
  isPro: boolean
  isAdmin: boolean
  /** called after any link is followed (used to close the mobile drawer) */
  onNavigate?: () => void
  /** called for Pro-gated items; the Layout decides whether to block the click */
  onProGate: (e: React.MouseEvent, item: { name: string; pro?: boolean }) => void
  planLabel?: string
}

const Sidebar: React.FC<SidebarProps> = ({ isPro, isAdmin, onNavigate, onProGate, planLabel }) => {
  const { pathname } = useLocation()
  const [closed, setClosed] = useState<string[]>(readClosed)

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === '/' || pathname === '/dashboard' : pathname.startsWith(href) &&
      // "/blogs" must not light up on "/blogs/my-blogs"
      !(href === '/blogs' && pathname.startsWith('/blogs/my-blogs'))

  // never hide the group that holds the page the user is on
  useEffect(() => {
    const owner = GROUPS.find((g) => g.items.some((i) => isActive(i.href)))
    if (owner && closed.includes(owner.id)) {
      setClosed((c) => c.filter((id) => id !== owner.id))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  const toggle = (id: string) => {
    setClosed((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        /* storage unavailable - state still works for this session */
      }
      return next
    })
  }

  const renderItem = (item: NavItem) => {
    const Icon = item.icon
    const active = isActive(item.href)
    return (
      <Link
        key={item.href}
        to={item.href}
        onClick={(e) => {
          onProGate(e, item)
          onNavigate?.()
        }}
        aria-current={active ? 'page' : undefined}
        className={`group relative flex items-center gap-3 rounded-xl px-3 py-2 text-[13.5px] font-medium transition-all duration-150 ${
          active
            ? 'bg-primary-50 text-primary-700 dark:bg-white/10 dark:text-white'
            : 'text-secondary-600 hover:bg-secondary-100 hover:text-secondary-900 dark:text-secondary-400 dark:hover:bg-white/5 dark:hover:text-white'
        }`}
      >
        {active && (
          <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-cyan-400 to-violet-500" />
        )}
        <Icon
          className={`h-[18px] w-[18px] shrink-0 transition-colors ${
            active ? 'text-primary-600 dark:text-cyan-300' : 'text-secondary-400 group-hover:text-primary-500 dark:text-secondary-500 dark:group-hover:text-cyan-300'
          }`}
        />
        <span className="truncate">{item.name}</span>
        {item.pro && !isPro && (
          <span className="ml-auto rounded-md bg-amber-400/90 px-1.5 py-0.5 text-[9px] font-bold leading-none text-amber-950">
            PRO
          </span>
        )}
      </Link>
    )
  }

  const dashboardActive = isActive('/dashboard')

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center px-5 py-5">
        <Logo size={36} />
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-4 [scrollbar-width:thin]">
        <Link
          to="/dashboard"
          onClick={() => onNavigate?.()}
          aria-current={dashboardActive ? 'page' : undefined}
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${
            dashboardActive
              ? 'bg-gradient-to-r from-cyan-500 to-violet-600 text-white shadow-lg shadow-cyan-500/20'
              : 'text-secondary-700 hover:bg-secondary-100 dark:text-secondary-200 dark:hover:bg-white/5'
          }`}
        >
          <Home className="h-[18px] w-[18px]" />
          Dashboard
        </Link>

        {GROUPS.map((group) => {
          const open = !closed.includes(group.id)
          return (
            <div key={group.id}>
              <button
                type="button"
                onClick={() => toggle(group.id)}
                aria-expanded={open}
                className="mb-1 flex w-full items-center justify-between px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-secondary-400 hover:text-secondary-600 dark:text-secondary-500 dark:hover:text-secondary-300"
              >
                {group.label}
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? '' : '-rotate-90'}`} />
              </button>
              {open && <div className="space-y-0.5">{group.items.map(renderItem)}</div>}
            </div>
          )
        })}

        {isAdmin && (
          <div>
            <div className="mb-1 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-secondary-400 dark:text-secondary-500">
              Admin
            </div>
            {renderItem({ name: 'Admin Panel', href: '/admin', icon: Settings })}
          </div>
        )}
      </nav>

      {/* Plan card: the one place that nudges upgrade, instead of a nav link among 20 */}
      <div className="shrink-0 p-3">
        {isPro ? (
          <div className="flex items-center gap-3 rounded-2xl border border-amber-300/40 bg-gradient-to-br from-amber-400/15 to-orange-500/10 p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow">
              <Crown className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-secondary-900 dark:text-white">Pro plan</p>
              <p className="truncate text-xs text-secondary-500 dark:text-secondary-400">{planLabel || 'All tools unlocked'}</p>
            </div>
          </div>
        ) : (
          <Link
            to="/payment"
            onClick={() => onNavigate?.()}
            className="block rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-600 p-4 text-white shadow-lg shadow-violet-500/20 transition-transform hover:-translate-y-0.5"
          >
            <div className="flex items-center gap-2 text-sm font-bold">
              <Sparkles className="h-4 w-4" /> Upgrade to Pro
            </div>
            <p className="mt-1 text-xs text-white/85">Unlock one-click deploy, deployments, GitHub and cost analysis.</p>
          </Link>
        )}
      </div>
    </div>
  )
}

export default Sidebar
