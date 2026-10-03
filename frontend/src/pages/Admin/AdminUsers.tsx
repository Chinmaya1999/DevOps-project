import React, { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Crown, KeyRound, LogOut, MailCheck, Plus, Search, ShieldCheck, Trash2, Unlock, UserCog } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { Badge, Modal, Pager, Spinner, TypeToConfirm, errMsg, fmtDate, fmtDateTime, money, useDebounced } from '../../components/Admin/ui'
import type { Pagination } from '../../components/Admin/ui'
import { PasswordField, TextField } from '../../components/Auth/fields'
import { passwordProblem } from '../../utils/password'

interface Plan { plan: 'free' | 'pro'; status: string; endsAt: string | null; daysLeft: number | null }
interface Row {
  _id: string; username: string; email: string; role: 'user' | 'admin'; isActive: boolean; isEmailVerified?: boolean
  twoFactor?: { enabled: boolean }; lastLogin?: string; createdAt: string; plan: Plan; workExperience?: string; domains?: string[]
  lockUntil?: string
}
interface Detail extends Row { payments?: { _id: string; amount: number; status: string; paymentMethod: string; subscriptionType: string; invoiceNumber?: string; createdAt: string }[] }

const planBadge = (p: Plan) =>
  p.status === 'admin' ? <Badge tone="violet">Admin</Badge> :
  p.plan === 'pro' ? <Badge tone="cyan">Pro{p.daysLeft !== null ? ` · ${p.daysLeft}d` : ''}</Badge> :
  p.status === 'expired' ? <Badge tone="amber">Expired</Badge> : <Badge>Free</Badge>

const Select: React.FC<{ label: string; value: string; onChange: (v: string) => void; options: [string, string][] }> = ({ label, value, onChange, options }) => (
  <label className="text-sm"><span className="sr-only">{label}</span>
    <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={label} className="input !py-2 !px-3 !w-auto">{options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
)

const AdminUsers: React.FC = () => {
  const { user: me } = useAuth()
  const [params, setParams] = useSearchParams()
  const [rows, setRows] = useState<Row[] | null>(null)
  const [pg, setPg] = useState<Pagination | null>(null)
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [status, setStatus] = useState('')
  const [plan, setPlan] = useState('')
  const [verified, setVerified] = useState(params.get('verified') || '')
  const [page, setPage] = useState(1)
  const [openId, setOpenId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const debounced = useDebounced(search)

  const load = useCallback(() => {
    const q = new URLSearchParams({ page: String(page), limit: '20' })
    if (debounced) q.set('search', debounced)
    if (role) q.set('role', role)
    if (status) q.set('status', status)
    if (plan) q.set('plan', plan)
    if (verified) q.set('verified', verified)
    api.get(`/admin/users?${q}`).then((r) => { setRows(r.data.data); setPg(r.data.pagination) }).catch((e) => { toast.error(errMsg(e, 'Could not load users')); setRows([]) })
  }, [debounced, role, status, plan, verified, page])

  useEffect(() => { setRows(null); load() }, [load])
  useEffect(() => { setPage(1) }, [debounced, role, status, plan, verified])
  useEffect(() => { if (params.get('verified') !== null) { params.delete('verified'); setParams(params, { replace: true }) } }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input className="input !pl-9 !py-2" placeholder="Search name or email" aria-label="Search users" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select label="Role" value={role} onChange={setRole} options={[['', 'All roles'], ['user', 'Users'], ['admin', 'Admins']]} />
        <Select label="Status" value={status} onChange={setStatus} options={[['', 'Any status'], ['active', 'Active'], ['disabled', 'Disabled']]} />
        <Select label="Plan" value={plan} onChange={setPlan} options={[['', 'Any plan'], ['pro', 'Pro'], ['free', 'Free']]} />
        <Select label="Email" value={verified} onChange={setVerified} options={[['', 'Any email'], ['yes', 'Verified'], ['no', 'Not verified']]} />
        <button onClick={() => setCreating(true)} className="btn-primary !py-2 !px-4 inline-flex items-center gap-2"><Plus className="w-4 h-4" /> Add user</button>
      </div>

      <div className="mt-4 card overflow-hidden">
        {rows === null ? <Spinner /> : rows.length === 0 ? (
          <div className="p-10 text-center text-slate-500 dark:text-gray-400">No users match these filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <caption className="sr-only">Users</caption>
              <thead><tr className="text-slate-500 dark:text-gray-400 border-b border-slate-200 dark:border-white/10">
                {['User', 'Role', 'Plan', 'Status', 'Last login', 'Joined', ''].map((h) => <th key={h} scope="col" className="px-4 py-3 font-medium whitespace-nowrap">{h}</th>)}
              </tr></thead>
              <tbody>
                {rows.map((u) => (
                  <tr key={u._id} className="border-b last:border-0 border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/[0.03]">
                    <td className="px-4 py-3"><div className="font-medium">{u.username}{u._id === me?.id && <span className="ml-2 text-xs text-slate-400">(you)</span>}</div><div className="text-xs text-slate-500 dark:text-gray-400">{u.email}</div></td>
                    <td className="px-4 py-3">{u.role === 'admin' ? <Badge tone="violet">Admin</Badge> : <Badge>User</Badge>}</td>
                    <td className="px-4 py-3">{planBadge(u.plan)}</td>
                    <td className="px-4 py-3 space-x-1 whitespace-nowrap">
                      {!u.isActive ? <Badge tone="red">Disabled</Badge> : <Badge tone="green">Active</Badge>}
                      {!u.isEmailVerified && <Badge tone="amber">Unverified</Badge>}
                      {u.twoFactor?.enabled && <Badge tone="violet">2FA</Badge>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600 dark:text-gray-300">{fmtDate(u.lastLogin)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600 dark:text-gray-300">{fmtDate(u.createdAt)}</td>
                    <td className="px-4 py-3 text-right"><button onClick={() => setOpenId(u._id)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10"><UserCog className="w-4 h-4" /> Manage</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pager p={pg} onPage={setPage} />
      </div>

      {creating && <CreateUser onClose={() => setCreating(false)} onDone={() => { setCreating(false); load() }} />}
      {openId && <ManageUser id={openId} myId={me?.id} onClose={() => setOpenId(null)} onChanged={load} />}
    </div>
  )
}

const CreateUser: React.FC<{ onClose: () => void; onDone: () => void }> = ({ onClose, onDone }) => {
  const [f, setF] = useState({ username: '', email: '', password: '', role: 'user' })
  const [busy, setBusy] = useState(false)
  const pw = f.password ? passwordProblem(f.password) : null
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try { await api.post('/admin/users', f); toast.success('User created and verified. They can sign in now.'); onDone() }
    catch (err) { toast.error(errMsg(err)) } finally { setBusy(false) }
  }
  return (
    <Modal title="Add a user" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <TextField label="Username" value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} hint="3–30 letters, numbers or underscores" required />
        <TextField label="Email" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} required />
        <PasswordField label="Temporary password" meter value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} error={pw || undefined} autoComplete="new-password" />
        <label className="block text-sm"><span className="block font-medium mb-1.5">Role</span>
          <select className="input" value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}><option value="user">User</option><option value="admin">Admin (full access)</option></select></label>
        <p className="text-xs text-slate-500 dark:text-gray-400">The account is created already verified. Share the password securely and ask the person to change it.</p>
        <button disabled={busy || !!pw || !f.username || !f.email || !f.password} className="btn-primary w-full disabled:opacity-50">{busy ? 'Creating…' : 'Create user'}</button>
      </form>
    </Modal>
  )
}

const ManageUser: React.FC<{ id: string; myId?: string; onClose: () => void; onChanged: () => void }> = ({ id, myId, onClose, onChanged }) => {
  const [u, setU] = useState<Detail | null>(null)
  const [busy, setBusy] = useState('')
  const [edit, setEdit] = useState({ username: '', email: '' })
  const [days, setDays] = useState('30')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const self = id === myId

  const load = useCallback(() => api.get(`/admin/users/${id}`).then((r) => { setU(r.data.data); setEdit({ username: r.data.data.username, email: r.data.data.email }) }).catch((e) => { toast.error(errMsg(e)); onClose() }), [id, onClose])
  useEffect(() => { load() }, [load])

  const run = async (key: string, fn: () => Promise<unknown>, ok: string) => {
    setBusy(key)
    try { await fn(); toast.success(ok); await load(); onChanged() } catch (e) { toast.error(errMsg(e)) } finally { setBusy('') }
  }
  const put = (body: object) => api.put(`/admin/users/${id}`, body)
  const post = (path: string, body?: object) => api.post(`/admin/users/${id}/${path}`, body)

  if (!u) return <Modal title="User" onClose={onClose}><Spinner /></Modal>
  const dirty = edit.username !== u.username || edit.email !== u.email.toLowerCase()
  const btn = 'inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 text-sm hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-50'

  return (
    <>
      <Modal title={u.username} onClose={onClose} wide>
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            {u.role === 'admin' ? <Badge tone="violet">Admin</Badge> : <Badge>User</Badge>} {planBadge(u.plan)}
            {u.isActive ? <Badge tone="green">Active</Badge> : <Badge tone="red">Disabled</Badge>}
            {u.isEmailVerified ? <Badge tone="green">Email verified</Badge> : <Badge tone="amber">Email not verified</Badge>}
            {u.twoFactor?.enabled && <Badge tone="violet">2FA on</Badge>}
            <span className="text-xs text-slate-500 dark:text-gray-400 ml-auto">Joined {fmtDate(u.createdAt)} · last login {fmtDateTime(u.lastLogin)}</span>
          </div>

          <section aria-label="Profile">
            <h3 className="font-semibold mb-2">Profile</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <TextField label="Username" value={edit.username} onChange={(e) => setEdit({ ...edit, username: e.target.value })} />
              <TextField label="Email" value={edit.email} onChange={(e) => setEdit({ ...edit, email: e.target.value })} />
            </div>
            <button disabled={!dirty || !!busy} onClick={() => run('save', () => put(edit), 'Profile saved')} className="mt-3 btn-primary !py-2 !px-4 text-sm disabled:opacity-50">Save changes</button>
            {(u.workExperience || (u.domains && u.domains.length > 0)) && <p className="mt-3 text-xs text-slate-500 dark:text-gray-400">Experience: {u.workExperience || '—'} · Works with: {(u.domains || []).join(', ') || '—'}</p>}
          </section>

          <section aria-label="Access">
            <h3 className="font-semibold mb-2">Access</h3>
            {self && <p className="mb-2 text-xs text-slate-500 dark:text-gray-400">This is your own account. You can’t change your role, disable or delete yourself, so you can never lock yourself out.</p>}
            <div className="flex flex-wrap gap-2">
              {u.role === 'user'
                ? <button disabled={!!busy} className={btn} onClick={() => run('role', () => put({ role: 'admin' }), 'Now an admin')}><ShieldCheck className="w-4 h-4" /> Make admin</button>
                : <button disabled={!!busy || self} className={btn} onClick={() => run('role', () => put({ role: 'user' }), 'Admin rights removed')}><ShieldCheck className="w-4 h-4" /> Remove admin rights</button>}
              {u.isActive
                ? <button disabled={!!busy || self} className={btn} onClick={() => run('active', () => put({ isActive: false }), 'Account disabled')}>Disable account</button>
                : <button disabled={!!busy} className={btn} onClick={() => run('active', () => put({ isActive: true }), 'Account enabled')}>Enable account</button>}
              <button disabled={!!busy} className={btn} onClick={() => run('logout', () => post('force-logout'), 'Signed out everywhere')}><LogOut className="w-4 h-4" /> Sign out everywhere</button>
              <button disabled={!!busy} className={btn} onClick={() => run('unlock', () => post('unlock'), 'Login lock cleared')}><Unlock className="w-4 h-4" /> Clear login lock</button>
              {!u.isEmailVerified && <button disabled={!!busy} className={btn} onClick={() => run('verify', () => post('verify-email'), 'Email marked as verified')}><MailCheck className="w-4 h-4" /> Mark email verified</button>}
              {u.twoFactor?.enabled && <button disabled={!!busy} className={btn} onClick={() => { if (window.confirm('Turn off two-factor for this user? Only do this after you have verified who they are.')) run('2fa', () => post('reset-2fa'), 'Two-factor turned off') }}><KeyRound className="w-4 h-4" /> Reset two-factor</button>}
            </div>
          </section>

          <section aria-label="Subscription">
            <h3 className="font-semibold mb-2 flex items-center gap-2"><Crown className="w-4 h-4 text-amber-500" /> Subscription</h3>
            <p className="text-sm text-slate-600 dark:text-gray-300">{u.plan.plan === 'pro' ? `Pro${u.plan.endsAt ? ` until ${fmtDate(u.plan.endsAt)} (${u.plan.daysLeft} days left)` : ' (no end date)'}` : u.plan.status === 'expired' ? `Expired on ${fmtDate(u.plan.endsAt)}` : 'Free plan'}</p>
            <div className="mt-3 flex flex-wrap items-end gap-2">
              <label className="text-sm"><span className="block mb-1 text-slate-500 dark:text-gray-400">Give Pro for (days)</span>
                <input type="number" min={1} max={3650} className="input !w-28 !py-2" value={days} onChange={(e) => setDays(e.target.value)} /></label>
              <button disabled={!!busy} className="btn-primary !py-2 !px-4 text-sm" onClick={() => run('grant', () => post('plan', { action: 'grant', days: Number(days) }), `Pro granted for ${days} days`)}>Grant Pro</button>
              {u.plan.plan === 'pro' && u.role !== 'admin' && <button disabled={!!busy} className={btn} onClick={() => { if (window.confirm('Remove Pro access from this user now?')) run('revoke', () => post('plan', { action: 'revoke' }), 'Pro removed') }}>Remove Pro</button>}
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-gray-400">Paid subscriptions are refunded from the Payments tab. Granting Pro here is for support gestures and trials, and adds time on top of any current period.</p>
          </section>

          <section aria-label="Payments">
            <h3 className="font-semibold mb-2">Payments</h3>
            {!u.payments || u.payments.length === 0 ? <p className="text-sm text-slate-500">No payments.</p> : (
              <ul className="text-sm divide-y divide-slate-200 dark:divide-white/10">
                {u.payments.map((p) => <li key={p._id} className="py-2 flex justify-between gap-3"><span>{fmtDate(p.createdAt)} · {p.subscriptionType} · {p.paymentMethod}{p.invoiceNumber ? ` · ${p.invoiceNumber}` : ''}</span><span className="font-medium">{money(p.amount)} <Badge tone={p.status === 'verified' ? 'green' : p.status === 'refunded' ? 'slate' : 'amber'}>{p.status}</Badge></span></li>)}
              </ul>
            )}
          </section>

          <section aria-label="Danger zone" className="rounded-xl border border-red-500/30 p-4">
            <h3 className="font-semibold text-red-600 dark:text-red-300">Danger zone</h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-gray-300">Deleting an account permanently removes the person’s saved configs, deployments (including stored server keys), chats and blog posts. Payment records are kept for accounting.</p>
            <button disabled={!!busy || self} onClick={() => setConfirmDelete(true)} className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-40"><Trash2 className="w-4 h-4" /> Delete this user</button>
          </section>
        </div>
      </Modal>
      {confirmDelete && (
        <TypeToConfirm title="Delete user permanently" match={u.email} confirmLabel="Delete user" busy={busy === 'delete'}
          body={<p>This cannot be undone. All personal data for <strong>{u.email}</strong> will be removed.</p>}
          onClose={() => setConfirmDelete(false)}
          onConfirm={async () => { setBusy('delete'); try { await api.delete(`/admin/users/${id}`); toast.success('User deleted'); onChanged(); onClose() } catch (e) { toast.error(errMsg(e)); setBusy('') } }} />
      )}
    </>
  )
}

export default AdminUsers
