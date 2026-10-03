import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Check, CheckCircle2, Copy, Download, Info, Lightbulb, Terminal } from 'lucide-react'
import type { Block } from '../../content/learn/parse'
import { API_BASE } from '../../services/api'

/** **bold**, `code` and [text](url) — rendered as React nodes, never as raw HTML. */
export const Inline: React.FC<{ text: string }> = ({ text }) => {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g).filter(Boolean)
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith('**')) return <strong key={i}>{p.slice(2, -2)}</strong>
        if (p.startsWith('`')) return <code key={i} className="px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-white/10 text-[0.9em] font-mono break-words">{p.slice(1, -1)}</code>
        const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(p)
        if (link) {
          const cls = 'text-cyan-700 dark:text-cyan-300 underline underline-offset-2 hover:no-underline'
          return link[2].startsWith('/')
            ? <Link key={i} to={link[2]} className={cls}>{link[1]}</Link>
            : <a key={i} href={link[2]} target="_blank" rel="noopener noreferrer" className={cls}>{link[1]}</a>
        }
        return <React.Fragment key={i}>{p}</React.Fragment>
      })}
    </>
  )
}

export const CodeBlock: React.FC<{ code: string; lang: string }> = ({ code, lang }) => {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    let ok = false
    try { await navigator.clipboard.writeText(code); ok = true } catch { /* not allowed here (e.g. plain http): use the fallback */ }
    if (!ok) {
      const ta = document.createElement('textarea')
      ta.value = code
      ta.setAttribute('readonly', '')
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      try { ok = document.execCommand('copy') } catch { ok = false }
      document.body.removeChild(ta)
    }
    if (ok) { setCopied(true); setTimeout(() => setCopied(false), 1800) }
  }
  const shell = ['bash', 'powershell', 'sh'].includes(lang)
  return (
    <div className="my-4 rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 bg-[#0b1220] text-gray-100 text-left">
      <div className="flex items-center justify-between px-3 py-1.5 bg-white/5 text-xs text-gray-400">
        <span className="inline-flex items-center gap-1.5 font-mono">{shell && <Terminal className="w-3.5 h-3.5" />}{lang}</span>
        <button onClick={copy} className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-white/10 text-gray-300" aria-label="Copy code">
          {copied ? <><Check className="w-3.5 h-3.5 text-emerald-400" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-[13px] leading-relaxed font-mono"><code>{code}</code></pre>
    </div>
  )
}

const CALLOUT = {
  note: { icon: Info, label: 'Note', cls: 'border-sky-500/40 bg-sky-500/10', ic: 'text-sky-600 dark:text-sky-300' },
  tip: { icon: Lightbulb, label: 'Tip', cls: 'border-emerald-500/40 bg-emerald-500/10', ic: 'text-emerald-600 dark:text-emerald-300' },
  warning: { icon: AlertTriangle, label: 'Careful', cls: 'border-amber-500/50 bg-amber-500/10', ic: 'text-amber-600 dark:text-amber-300' },
  check: { icon: CheckCircle2, label: 'Checkpoint', cls: 'border-violet-500/40 bg-violet-500/10', ic: 'text-violet-600 dark:text-violet-300' },
  expect: { icon: Terminal, label: 'You should see', cls: 'border-slate-400/40 bg-slate-500/10', ic: 'text-slate-600 dark:text-slate-300' },
} as const

export const Blocks: React.FC<{ blocks: Block[] }> = ({ blocks }) => (
  <>
    {blocks.map((b, i) => {
      switch (b.t) {
        case 'p': return <p key={i} className="my-3 leading-relaxed"><Inline text={b.text} /></p>
        case 'h': return <h3 key={i} className="mt-6 mb-2 font-display text-lg font-semibold">{b.text}</h3>
        case 'code': return <CodeBlock key={i} code={b.code} lang={b.lang} />
        case 'list': {
          const Tag = b.ordered ? 'ol' : 'ul'
          return (
            <Tag key={i} className={`my-3 pl-6 space-y-1.5 ${b.ordered ? 'list-decimal' : 'list-disc'} marker:text-slate-400`}>
              {b.items.map((it, j) => {
                const box = /^\[( |x)\]\s+/.exec(it)
                return <li key={j} className={box ? 'list-none -ml-6 flex gap-2' : ''}>{box && <span aria-hidden="true">☐</span>}<span><Inline text={box ? it.slice(box[0].length) : it} /></span></li>
              })}
            </Tag>
          )
        }
        case 'table': return (
          <div key={i} className="my-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-100 dark:bg-white/5"><tr>{b.head.map((h, j) => <th key={j} scope="col" className="px-3 py-2 font-semibold whitespace-nowrap"><Inline text={h} /></th>)}</tr></thead>
              <tbody>{b.rows.map((r, j) => <tr key={j} className="border-t border-slate-200 dark:border-white/10 align-top">{r.map((c, k) => <td key={k} className="px-3 py-2"><Inline text={c} /></td>)}</tr>)}</tbody>
            </table>
          </div>
        )
        case 'callout': {
          const c = CALLOUT[b.kind]
          return (
            <aside key={i} className={`my-4 rounded-xl border-l-4 px-4 py-3 ${c.cls}`}>
              <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wide ${c.ic}`}><c.icon className="w-4 h-4" /> {c.label}</div>
              <div className="text-[0.95rem] [&>p]:my-2 [&>div]:my-2"><Blocks blocks={b.blocks} /></div>
            </aside>
          )
        }
        case 'error': return (
          <details key={i} className="group my-3 rounded-xl border border-red-500/30 bg-red-500/5 open:bg-red-500/10">
            <summary className="cursor-pointer select-none list-none px-4 py-3 flex items-start gap-2 font-medium">
              <AlertTriangle className="w-4 h-4 mt-1 shrink-0 text-red-500" />
              <span><span className="text-xs uppercase tracking-wide text-red-600 dark:text-red-300 mr-2">If you see</span><span className="font-mono text-[0.9em]">{b.title}</span></span>
            </summary>
            <div className="px-4 pb-3 pl-10 text-[0.95rem]"><Blocks blocks={b.blocks} /></div>
          </details>
        )
        case 'download': return (
          <div key={i} className="my-5">
            <a href={`${API_BASE}/learn/starter/${b.starter}`} className="btn-primary inline-flex items-center gap-2" rel="noopener">
              <Download className="w-5 h-5" /> Download the starter project ({b.starter}.zip)
            </a>
            <p className="mt-2 text-xs text-slate-500 dark:text-gray-400">Tested sample project. Free, no sign-up needed.</p>
          </div>
        )
      }
    })}
  </>
)
