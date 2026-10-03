import React from 'react'
import { Link } from 'react-router-dom'
import { GitBranch } from 'lucide-react'
import Header from '../Header/Header'

/** Wraps pages that are readable by visitors who are not signed in (the app layout is for signed-in users). */
const PublicPage: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-screen bg-slate-50 dark:bg-ink-950 text-slate-900 dark:text-gray-100">
    <Header showAuthButtons />
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">{children}</main>
    <footer className="border-t border-slate-200 dark:border-white/10 py-8 text-center text-sm text-slate-500 dark:text-gray-400">
      <Link to="/" className="inline-flex items-center gap-2 font-display font-bold text-slate-800 dark:text-gray-200"><GitBranch className="w-4 h-4 text-cyan-500" /> AutoDevOps</Link>
      <div className="mt-2">Learn DevOps by deploying real projects.</div>
    </footer>
  </div>
)

export default PublicPage
