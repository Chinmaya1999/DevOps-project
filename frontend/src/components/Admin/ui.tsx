import React, { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Loader2, X } from 'lucide-react'

export const useDebounced = <T,>(value: T, ms = 350): T => {
  const [v, setV] = useState(value)
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t) }, [value, ms])
  return v
}

export const money = (n: number, cur = 'INR') => new Intl.NumberFormat('en-IN', { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(n || 0)
export const fmtDate = (d?: string | null) => (d ? new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '—')
export const fmtDateTime = (d?: string | null) => (d ? new Date(d).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—')

const TONES = {
  green: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  amber: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  red: 'bg-red-500/15 text-red-600 dark:text-red-300',
  violet: 'bg-violet-500/15 text-violet-700 dark:text-violet-300',
  cyan: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300',
  slate: 'bg-slate-500/15 text-slate-600 dark:text-slate-300',
} as const
export const Badge: React.FC<{ tone?: keyof typeof TONES; children: React.ReactNode }> = ({ tone = 'slate', children }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${TONES[tone]}`}>{children}</span>
)

export const StatCard: React.FC<{ label: string; value: React.ReactNode; hint?: React.ReactNode; icon?: React.ElementType }> = ({ label, value, hint, icon: Icon }) => (
  <div className="card p-5">
    <div className="flex items-center justify-between text-sm text-slate-500 dark:text-gray-400"><span>{label}</span>{Icon && <Icon className="w-4 h-4" />}</div>
    <div className="mt-2 font-display text-3xl font-bold">{value}</div>
    {hint && <div className="mt-1 text-xs text-slate-500 dark:text-gray-400">{hint}</div>}
  </div>
)

export interface Pagination { page: number; pages: number; total: number; limit: number }
export const Pager: React.FC<{ p: Pagination | null; onPage: (n: number) => void }> = ({ p, onPage }) => {
  if (!p || p.total === 0) return null
  const from = (p.page - 1) * p.limit + 1
  const to = Math.min(p.page * p.limit, p.total)
  return (
    <div className="flex items-center justify-between px-4 py-3 text-sm text-slate-500 dark:text-gray-400 border-t border-slate-200 dark:border-white/10">
      <span>{from}–{to} of {p.total}</span>
      <div className="flex items-center gap-1">
        <button onClick={() => onPage(p.page - 1)} disabled={p.page <= 1} aria-label="Previous page" className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
        <span className="px-2">Page {p.page} / {p.pages}</span>
        <button onClick={() => onPage(p.page + 1)} disabled={p.page >= p.pages} aria-label="Next page" className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
      </div>
    </div>
  )
}

export const Spinner: React.FC = () => <div className="py-14 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-cyan-500" /></div>

/** Accessible modal: Escape closes, backdrop click closes, focus stays inside via autofocus on the panel. */
export const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }> = ({ title, onClose, children, wide }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="fixed inset-0 z-[60] flex items-start sm:items-center justify-center p-4 bg-black/55 backdrop-blur-sm overflow-y-auto" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} className={`w-full ${wide ? 'max-w-3xl' : 'max-w-md'} my-8 bg-white dark:bg-ink-800 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-white/10">
          <h2 className="font-display text-lg font-semibold">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

/** Destructive action: the admin must type the exact target text before the button unlocks. */
export const TypeToConfirm: React.FC<{ title: string; body: React.ReactNode; match: string; confirmLabel: string; busy?: boolean; onConfirm: () => void; onClose: () => void }> = ({ title, body, match, confirmLabel, busy, onConfirm, onClose }) => {
  const [text, setText] = useState('')
  return (
    <Modal title={title} onClose={onClose}>
      <div className="text-sm text-slate-600 dark:text-gray-300 space-y-3">
        {body}
        <label className="block"><span className="block mb-1 font-medium text-slate-800 dark:text-gray-100">Type <code className="px-1 rounded bg-slate-200/70 dark:bg-white/10">{match}</code> to confirm</span>
          <input autoFocus className="input" value={text} onChange={(e) => setText(e.target.value)} /></label>
        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10">Cancel</button>
          <button onClick={onConfirm} disabled={busy || text !== match} className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-40">{busy ? 'Working…' : confirmLabel}</button>
        </div>
      </div>
    </Modal>
  )
}

export const errMsg = (e: any, fallback = 'Something went wrong') => e?.response?.data?.error || e?.message || fallback
