import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { GitBranch, Menu, X } from 'lucide-react'
import ThemeToggle from '../UI/ThemeToggle'

interface HeaderProps {
  showAuthButtons?: boolean
  transparent?: boolean
}

// Only routes that exist for signed-out visitors (see App.tsx)
const navigation = [
  { name: 'Features', href: '/features' },
  { name: 'Learn', href: '/learn' },
  { name: 'Pricing', href: '/pricing' },
  { name: 'About', href: '/about' },
  { name: 'Contact', href: '/contact' },
]

const Header: React.FC<HeaderProps> = ({ showAuthButtons = true, transparent = false }) => {
  const [open, setOpen] = React.useState(false)
  const [scrolled, setScrolled] = React.useState(false)
  const { pathname } = useLocation()

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const solid = !transparent || scrolled || open

  return (
    <>
    {!transparent && <div className="h-16" aria-hidden="true" />}
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        solid ? 'bg-white/80 dark:bg-ink-950/75 backdrop-blur-xl border-b border-slate-200 dark:border-white/10' : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-2.5 group">
          <span className="p-1.5 rounded-lg hero-gradient shadow-lg shadow-cyan-500/30 group-hover:rotate-6 transition-transform">
            <GitBranch className="w-5 h-5 text-white" />
          </span>
          <span className="font-display text-lg font-bold text-slate-900 dark:text-white tracking-tight">AutoDevOps</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1" aria-label="Main">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              aria-current={pathname === item.href ? 'page' : undefined}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === item.href ? 'text-slate-900 dark:text-white bg-slate-900/5 dark:bg-white/10' : 'text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-900/5 dark:hover:bg-white/5'
              }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />
          {showAuthButtons && (
            <>
              <Link to="/login" className="text-sm font-medium text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white transition-colors">
                Sign in
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 text-sm font-semibold text-white rounded-lg bg-gradient-to-r from-cyan-500 to-violet-600 shadow-lg shadow-cyan-500/25 hover:brightness-110 transition"
              >
                Get started
              </Link>
            </>
          )}
        </div>

        <ThemeToggle className="md:hidden ml-auto mr-2" />
        <button
          className="md:hidden p-2 rounded-lg text-slate-900 dark:text-white hover:bg-slate-900/10 dark:hover:bg-white/10"
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden px-4 pb-4 space-y-1">
          {navigation.map((item) => (
            <Link key={item.name} to={item.href} onClick={() => setOpen(false)} className="block px-3 py-2.5 rounded-lg text-slate-700 dark:text-gray-200 hover:bg-slate-900/5 dark:hover:bg-white/10">
              {item.name}
            </Link>
          ))}
          {showAuthButtons && (
            <div className="pt-2 flex gap-2">
              <Link to="/login" onClick={() => setOpen(false)} className="flex-1 text-center px-4 py-2.5 rounded-lg border border-slate-300 dark:border-white/15 text-slate-900 dark:text-white">Sign in</Link>
              <Link to="/register" onClick={() => setOpen(false)} className="flex-1 text-center px-4 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-violet-600 text-white font-semibold">Get started</Link>
            </div>
          )}
        </div>
      )}
    </header>
    </>
  )
}

export default Header
