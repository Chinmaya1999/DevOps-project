import React, { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { Badge, Pager, Spinner, errMsg, fmtDateTime, useDebounced } from '../../components/Admin/ui'
import type { Pagination } from '../../components/Admin/ui'

interface Entry { _id: string; actorEmail: string; action: string; targetLabel?: string; targetType?: string; details?: Record<string, unknown>; ip?: string; createdAt: string }

const tone = (a: string) => (a.includes('delete') || a.includes('refund') || a.includes('revoke') || a.includes('reset') ? 'red' : a.includes('create') || a.includes('grant') || a.includes('approve') ? 'green' : 'cyan') as 'red' | 'green' | 'cyan'

const summary = (d?: Record<string, unknown>) => {
  if (!d) return ''
  return Object.entries(d).map(([k, v]) => {
    if (Array.isArray(v) && v.length === 2 && typeof v[0] !== 'object') return `${k}: ${String(v[0])} → ${String(v[1])}`
    if (v && typeof v === 'object') return `${k}: ${JSON.stringify(v)}`
    return `${k}: ${String(v)}`
  }).join(' · ')
}

/** Read-only history of admin actions. Entries cannot be edited or deleted from the app. */
const AdminAudit: React.FC = () => {
  const [rows, setRows] = useState<Entry[] | null>(null)
  const [pg, setPg] = useState<Pagination | null>(null)
  const [search, setSearch] = useState('')
  const [action, setAction] = useState('')
  const [page, setPage] = useState(1)
  const q = useDebounced(search)

  useEffect(() => { setPage(1) }, [q, action])
  useEffect(() => {
    setRows(null)
    const p = new URLSearchParams({ page: String(page), limit: '25' })
    if (q) p.set('search', q)
    if (action) p.set('action', action)
    api.get(`/admin/audit?${p}`).then((r) => { setRows(r.data.data); setPg(r.data.pagination) }).catch((e) => { toast.error(errMsg(e)); setRows([]) })
  }, [q, action, page])

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input className="input !pl-9 !py-2" placeholder="Search by admin or target" aria-label="Search audit log" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select aria-label="Action type" className="input !py-2 !px-3 !w-auto" value={action} onChange={(e) => setAction(e.target.value)}>
          <option value="">All actions</option><option value="user.">Users</option><option value="payment.">Payments</option><option value="message.">Messages</option><option value="settings.">Settings</option>
        </select>
      </div>
      <div className="mt-4 card overflow-hidden">
        {rows === null ? <Spinner /> : rows.length === 0 ? <div className="p-10 text-center text-slate-500 dark:text-gray-400">No activity recorded.</div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <caption className="sr-only">Admin activity</caption>
              <thead><tr className="text-slate-500 dark:text-gray-400 border-b border-slate-200 dark:border-white/10">{['When', 'Admin', 'Action', 'Target', 'Details'].map((h) => <th key={h} scope="col" className="px-4 py-3 font-medium whitespace-nowrap">{h}</th>)}</tr></thead>
              <tbody>
                {rows.map((e) => (
                  <tr key={e._id} className="border-b last:border-0 border-slate-200 dark:border-white/5 align-top">
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600 dark:text-gray-300">{fmtDateTime(e.createdAt)}</td>
                    <td className="px-4 py-3">{e.actorEmail}</td>
                    <td className="px-4 py-3"><Badge tone={tone(e.action)}>{e.action}</Badge></td>
                    <td className="px-4 py-3">{e.targetLabel || '—'}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 dark:text-gray-400 break-words max-w-xs">{summary(e.details)}{e.ip ? <span className="block">IP {e.ip}</span> : null}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pager p={pg} onPage={setPage} />
      </div>
    </div>
  )
}

export default AdminAudit
