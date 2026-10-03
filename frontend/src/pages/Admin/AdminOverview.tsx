import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, CreditCard, Crown, Inbox, MailWarning, ShieldAlert, ShieldCheck, TrendingUp, UserPlus, Users } from 'lucide-react'
import api from '../../services/api'
import { Badge, StatCard, Spinner, errMsg, fmtDate, fmtDateTime, money } from '../../components/Admin/ui'

interface Overview {
  users: { total: number; active: number; admins: number; verified: number; unverified: number; newThisMonth: number; newLast7Days: number; twoFactorEnabled: number }
  plans: { pro: number; premium: number; trial: number; free: number }
  revenue: { total: number; payments: number; thisMonth: number; currency: string }
  attention: { pendingPayments: number; refundRequests: number; unreadMessages: number; unverifiedUsers: number; singleAdmin: boolean }
  content: { blogs: number; docs: number; generations: number }
  recentUsers: { _id: string; username: string; email: string; role: string; isEmailVerified: boolean; createdAt: string }[]
  recentPayments: { _id: string; amount: number; status: string; paymentMethod: string; subscriptionType: string; createdAt: string; user?: { username: string; email: string } }[]
  recentAudit: { _id: string; actorEmail: string; action: string; targetLabel?: string; createdAt: string }[]
}

const AdminOverview: React.FC = () => {
  const [d, setD] = useState<Overview | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/admin/overview').then((r) => setD(r.data.data)).catch((e) => setError(errMsg(e, 'Could not load the overview')))
  }, [])

  if (error) return <div className="card p-6 text-red-600 dark:text-red-300">{error}</div>
  if (!d) return <Spinner />

  const a = d.attention
  const items = [
    a.refundRequests > 0 && { to: '/admin/payments', icon: CreditCard, tone: 'text-amber-500', text: `${a.refundRequests} refund request${a.refundRequests > 1 ? 's' : ''} waiting for you` },
    a.pendingPayments > 0 && { to: '/admin/payments', icon: CreditCard, tone: 'text-amber-500', text: `${a.pendingPayments} manual payment${a.pendingPayments > 1 ? 's' : ''} to verify` },
    a.unreadMessages > 0 && { to: '/admin/messages', icon: Inbox, tone: 'text-cyan-500', text: `${a.unreadMessages} unread contact message${a.unreadMessages > 1 ? 's' : ''}` },
    a.singleAdmin && { to: '/admin/users', icon: ShieldAlert, tone: 'text-red-500', text: 'Only one active admin. Add a second one so you can never be locked out.' },
    a.unverifiedUsers > 0 && { to: '/admin/users?verified=no', icon: MailWarning, tone: 'text-slate-500', text: `${a.unverifiedUsers} user${a.unverifiedUsers > 1 ? 's have' : ' has'} not verified their email` },
  ].filter(Boolean) as { to: string; icon: React.ElementType; tone: string; text: string }[]

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Users" icon={Users} value={d.users.total} hint={`${d.users.active} active · ${d.users.admins} admin${d.users.admins === 1 ? '' : 's'}`} />
        <StatCard label="New signups" icon={UserPlus} value={d.users.newThisMonth} hint={`this month · ${d.users.newLast7Days} in the last 7 days`} />
        <StatCard label="Pro subscribers" icon={Crown} value={d.plans.pro} hint={`${d.plans.premium} paid · ${d.plans.trial} trial · ${d.plans.free} free`} />
        <StatCard label="Revenue" icon={TrendingUp} value={money(d.revenue.thisMonth, d.revenue.currency)} hint={`this month · ${money(d.revenue.total, d.revenue.currency)} all time (${d.revenue.payments} payments)`} />
      </div>

      <section className="card p-5" aria-labelledby="att-h">
        <h2 id="att-h" className="font-display text-lg font-semibold flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-amber-500" /> Needs your attention</h2>
        {items.length === 0 ? (
          <p className="mt-3 flex items-center gap-2 text-emerald-600 dark:text-emerald-400"><CheckCircle2 className="w-5 h-5" /> Nothing is waiting. All clear.</p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-200 dark:divide-white/10">
            {items.map((it) => (
              <li key={it.text}><Link to={it.to} className="flex items-center gap-3 py-2.5 hover:text-cyan-700 dark:hover:text-cyan-300"><it.icon className={`w-5 h-5 shrink-0 ${it.tone}`} /> {it.text}</Link></li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid lg:grid-cols-3 gap-4">
        <section className="card p-5" aria-labelledby="ru-h">
          <h2 id="ru-h" className="font-semibold">Latest signups</h2>
          <ul className="mt-3 space-y-2.5 text-sm">
            {d.recentUsers.length === 0 && <li className="text-slate-500">No users yet.</li>}
            {d.recentUsers.map((u) => (
              <li key={u._id} className="flex items-center justify-between gap-2">
                <span className="min-w-0"><span className="block truncate font-medium">{u.username}</span><span className="block truncate text-xs text-slate-500 dark:text-gray-400">{u.email}</span></span>
                <span className="text-right shrink-0">{u.isEmailVerified ? <Badge tone="green">verified</Badge> : <Badge tone="amber">unverified</Badge>}<span className="block text-xs text-slate-500 mt-0.5">{fmtDate(u.createdAt)}</span></span>
              </li>
            ))}
          </ul>
        </section>

        <section className="card p-5" aria-labelledby="rp-h">
          <h2 id="rp-h" className="font-semibold">Latest payments</h2>
          <ul className="mt-3 space-y-2.5 text-sm">
            {d.recentPayments.length === 0 && <li className="text-slate-500">No payments yet.</li>}
            {d.recentPayments.map((p) => (
              <li key={p._id} className="flex items-center justify-between gap-2">
                <span className="min-w-0"><span className="block truncate font-medium">{p.user?.email || 'Deleted user'}</span><span className="block text-xs text-slate-500 dark:text-gray-400">{p.subscriptionType} · {fmtDate(p.createdAt)}</span></span>
                <span className="text-right shrink-0"><span className="block font-semibold">{money(p.amount)}</span><Badge tone={p.status === 'verified' ? 'green' : p.status === 'refunded' ? 'slate' : p.status === 'pending' ? 'amber' : 'red'}>{p.status}</Badge></span>
              </li>
            ))}
          </ul>
        </section>

        <section className="card p-5" aria-labelledby="ra-h">
          <h2 id="ra-h" className="font-semibold flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-500" /> Recent admin activity</h2>
          <ul className="mt-3 space-y-2.5 text-sm">
            {d.recentAudit.length === 0 && <li className="text-slate-500">Nothing recorded yet.</li>}
            {d.recentAudit.map((e) => (
              <li key={e._id}><span className="font-mono text-xs text-cyan-700 dark:text-cyan-300">{e.action}</span>{e.targetLabel && <span className="text-slate-600 dark:text-gray-300"> · {e.targetLabel}</span>}
                <span className="block text-xs text-slate-500 dark:text-gray-400">{e.actorEmail} · {fmtDateTime(e.createdAt)}</span></li>
            ))}
          </ul>
          <Link to="/admin/audit" className="mt-3 inline-block text-sm text-cyan-700 dark:text-cyan-300 underline">See the full audit log</Link>
        </section>
      </div>

      <section className="card p-5 grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm" aria-label="Platform health">
        <div><div className="text-slate-500 dark:text-gray-400">Verified emails</div><div className="font-semibold">{d.users.verified} of {d.users.total}</div></div>
        <div><div className="text-slate-500 dark:text-gray-400">Two-factor enabled</div><div className="font-semibold">{d.users.twoFactorEnabled} of {d.users.total}</div></div>
        <div><div className="text-slate-500 dark:text-gray-400">Blog posts · Docs</div><div className="font-semibold">{d.content.blogs} · {d.content.docs}</div></div>
        <div><div className="text-slate-500 dark:text-gray-400">Configs generated</div><div className="font-semibold">{d.content.generations}</div></div>
      </section>
    </div>
  )
}

export default AdminOverview
