import React from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { Activity, BarChart3, CreditCard, FileText, Inbox, Users } from 'lucide-react'

const TABS = [
  { to: '/admin', label: 'Overview', icon: BarChart3, end: true },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/payments', label: 'Payments', icon: CreditCard },
  { to: '/admin/content', label: 'Content', icon: FileText },
  { to: '/admin/messages', label: 'Messages', icon: Inbox },
  { to: '/admin/audit', label: 'Audit log', icon: Activity },
]

/** Shared frame for every admin page: title + section tabs. */
const AdminShell: React.FC = () => (
  <div className="max-w-7xl mx-auto">
    <h1 className="font-display text-3xl font-bold">Admin</h1>
    <p className="text-slate-600 dark:text-gray-400">Manage users, payments, content and messages.</p>
    <nav aria-label="Admin sections" className="mt-5 flex gap-1 overflow-x-auto border-b border-slate-200 dark:border-white/10">
      {TABS.map((t) => (
        <NavLink key={t.to} to={t.to} end={t.end}
          className={({ isActive }) => `inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition ${isActive ? 'border-cyan-500 text-cyan-700 dark:text-cyan-300' : 'border-transparent text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'}`}>
          <t.icon className="w-4 h-4" /> {t.label}
        </NavLink>
      ))}
    </nav>
    <div className="mt-6"><Outlet /></div>
  </div>
)

export default AdminShell
