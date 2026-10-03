import React, { useCallback, useEffect, useState } from 'react'
import { Archive, Mail, MailOpen, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { Badge, Pager, Spinner, TypeToConfirm, errMsg, fmtDateTime } from '../../components/Admin/ui'
import type { Pagination } from '../../components/Admin/ui'

interface Msg { _id: string; name: string; email: string; subject: string; message: string; status: 'new' | 'read' | 'archived'; createdAt: string }

const AdminMessages: React.FC = () => {
  const [rows, setRows] = useState<Msg[] | null>(null)
  const [pg, setPg] = useState<Pagination | null>(null)
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState<string | null>(null)
  const [del, setDel] = useState<Msg | null>(null)

  const load = useCallback(() => {
    const q = new URLSearchParams({ page: String(page), limit: '15' })
    if (status) q.set('status', status)
    api.get(`/admin/messages?${q}`).then((r) => { setRows(r.data.data); setPg(r.data.pagination) }).catch((e) => { toast.error(errMsg(e)); setRows([]) })
  }, [status, page])
  useEffect(() => { setRows(null); load() }, [load])
  useEffect(() => { setPage(1) }, [status])

  const setSt = async (m: Msg, s: Msg['status']) => {
    try { await api.patch(`/admin/messages/${m._id}`, { status: s }); load() } catch (e) { toast.error(errMsg(e)) }
  }
  const toggle = (m: Msg) => {
    setOpen(open === m._id ? null : m._id)
    if (m.status === 'new') setSt(m, 'read')
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter messages">
        {[['', 'All'], ['new', 'New'], ['read', 'Read'], ['archived', 'Archived']].map(([v, l]) => (
          <button key={v} role="tab" aria-selected={status === v} onClick={() => setStatus(v)}
            className={`px-3 py-1.5 rounded-lg text-sm border ${status === v ? 'border-cyan-500 bg-cyan-500/10 text-cyan-700 dark:text-cyan-200' : 'border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5'}`}>{l}</button>
        ))}
      </div>

      <div className="mt-4 card overflow-hidden">
        {rows === null ? <Spinner /> : rows.length === 0 ? <div className="p-10 text-center text-slate-500 dark:text-gray-400">No messages here.</div> : (
          <ul className="divide-y divide-slate-200 dark:divide-white/10">
            {rows.map((m) => (
              <li key={m._id}>
                <button onClick={() => toggle(m)} aria-expanded={open === m._id} className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-white/[0.03]">
                  {m.status === 'new' ? <Mail className="w-5 h-5 mt-0.5 text-cyan-500 shrink-0" /> : <MailOpen className="w-5 h-5 mt-0.5 text-slate-400 shrink-0" />}
                  <span className="min-w-0 flex-1">
                    <span className={`block truncate ${m.status === 'new' ? 'font-semibold' : ''}`}>{m.subject}</span>
                    <span className="block truncate text-xs text-slate-500 dark:text-gray-400">{m.name} · {m.email}</span>
                  </span>
                  <span className="text-xs text-slate-500 dark:text-gray-400 whitespace-nowrap">{fmtDateTime(m.createdAt)}</span>
                  {m.status === 'new' && <Badge tone="cyan">new</Badge>}
                </button>
                {open === m._id && (
                  <div className="px-4 pb-4 pl-12">
                    {/* rendered as plain text: visitor input is never treated as HTML */}
                    <p className="whitespace-pre-wrap break-words text-sm bg-slate-100 dark:bg-black/25 rounded-lg p-3">{m.message}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <a href={`mailto:${encodeURIComponent(m.email).replace(/%40/g, '@')}?subject=${encodeURIComponent('Re: ' + m.subject)}`} className="btn-primary !py-2 !px-4 text-sm">Reply by email</a>
                      {m.status !== 'archived' ? <button onClick={() => setSt(m, 'archived')} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 text-sm"><Archive className="w-4 h-4" /> Archive</button>
                        : <button onClick={() => setSt(m, 'read')} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 text-sm">Restore</button>}
                      <button onClick={() => setSt(m, 'new')} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 text-sm">Mark unread</button>
                      <button onClick={() => setDel(m)} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-red-500/40 text-red-600 dark:text-red-300 text-sm"><Trash2 className="w-4 h-4" /> Delete</button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
        <Pager p={pg} onPage={setPage} />
      </div>

      {del && (
        <TypeToConfirm title="Delete message" match="delete" confirmLabel="Delete message"
          body={<p>Permanently delete “{del.subject}” from {del.email}?</p>} onClose={() => setDel(null)}
          onConfirm={async () => { try { await api.delete(`/admin/messages/${del._id}`); toast.success('Deleted'); setDel(null); load() } catch (e) { toast.error(errMsg(e)) } }} />
      )}
    </div>
  )
}

export default AdminMessages
