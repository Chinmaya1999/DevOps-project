/**
 * Tiny Markdown dialect for the learning guides (no dependencies, no HTML injection — everything becomes React nodes).
 *
 *   ---                       front matter: slug, title, level, minutes, tools, summary, outcome
 *   ## Step title {#step-id}  starts a step
 *   ```bash ... ```           copyable code
 *   :::note|warning|tip|check ... :::     call-outs
 *   :::expect ... :::         "you should see this"
 *   :::error Short title ... :::          "if you see this error"
 *   :::download static-site   download button for a starter project
 *   | a | b | tables, - / 1. lists, **bold**, `code`, [text](url)
 */
export type Block =
  | { t: 'p'; text: string }
  | { t: 'h'; text: string }
  | { t: 'list'; ordered: boolean; items: string[] }
  | { t: 'code'; lang: string; code: string }
  | { t: 'table'; head: string[]; rows: string[][] }
  | { t: 'callout'; kind: 'note' | 'warning' | 'tip' | 'check' | 'expect'; blocks: Block[] }
  | { t: 'error'; title: string; blocks: Block[] }
  | { t: 'download'; starter: string }

export interface Step { id: string; title: string; blocks: Block[] }
export interface Guide {
  slug: string; title: string; level: string; minutes: number
  tools: string[]; summary: string; outcome: string
  intro: Block[]; steps: Step[]
}

const CALLOUTS = new Set(['note', 'warning', 'tip', 'check', 'expect'])

export function parseBlocks(lines: string[]): Block[] {
  const out: Block[] = []
  let i = 0
  const isBlank = (l: string) => l.trim() === ''
  while (i < lines.length) {
    const line = lines[i]
    if (isBlank(line)) { i++; continue }

    // fenced code
    const fence = /^```(\S*)\s*$/.exec(line)
    if (fence) {
      const code: string[] = []
      i++
      while (i < lines.length && !/^```\s*$/.test(lines[i])) code.push(lines[i++])
      if (i >= lines.length) throw new Error('Unclosed code fence')
      i++
      out.push({ t: 'code', lang: fence[1] || 'text', code: code.join('\n') })
      continue
    }

    // containers
    const cont = /^:::(\w+)\s*(.*)$/.exec(line)
    if (cont) {
      const [, kind, rest] = cont
      if (kind === 'download') { out.push({ t: 'download', starter: rest.trim() }); i++; continue }
      const inner: string[] = []
      i++
      let inFence = false
      while (i < lines.length && (inFence || !/^:::\s*$/.test(lines[i]))) {
        if (/^```/.test(lines[i])) inFence = !inFence
        inner.push(lines[i++])
      }
      if (i >= lines.length) throw new Error(`Unclosed ":::${kind}" block`)
      i++
      const blocks = parseBlocks(inner)
      if (kind === 'error') out.push({ t: 'error', title: rest.trim(), blocks })
      else if (CALLOUTS.has(kind)) out.push({ t: 'callout', kind: kind as any, blocks })
      else throw new Error(`Unknown block ":::${kind}"`)
      continue
    }

    // sub-heading
    const h = /^###\s+(.*)$/.exec(line)
    if (h) { out.push({ t: 'h', text: h[1].trim() }); i++; continue }

    // table
    if (/^\|/.test(line)) {
      const rows: string[][] = []
      while (i < lines.length && /^\|/.test(lines[i])) {
        rows.push(lines[i].trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim()))
        i++
      }
      const [head, sep, ...body] = rows
      if (!sep || !sep.every((c) => /^:?-{2,}:?$/.test(c))) throw new Error('Table needs a header separator row')
      out.push({ t: 'table', head, rows: body })
      continue
    }

    // lists
    const ul = /^\s*[-*]\s+(.*)$/.exec(line)
    const ol = /^\s*\d+\.\s+(.*)$/.exec(line)
    if (ul || ol) {
      const ordered = !!ol
      const items: string[] = []
      while (i < lines.length) {
        const m = (ordered ? /^\s*\d+\.\s+(.*)$/ : /^\s*[-*]\s+(.*)$/).exec(lines[i])
        if (m) { items.push(m[1]); i++ }
        else if (/^\s{2,}\S/.test(lines[i]) && items.length) { items[items.length - 1] += ' ' + lines[i].trim(); i++ }
        else break
      }
      out.push({ t: 'list', ordered, items })
      continue
    }

    // paragraph
    const para: string[] = []
    while (i < lines.length && !isBlank(lines[i]) && !/^(```|:::|###\s|\||\s*[-*]\s+\S|\s*\d+\.\s+\S)/.test(lines[i])) para.push(lines[i++].trim())
    out.push({ t: 'p', text: para.join(' ') })
  }
  return out
}

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60)

export function parseGuide(raw: string): Guide {
  const m = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(raw.replace(/\r\n/g, '\n'))
  if (!m) throw new Error('Missing front matter')
  const meta: Record<string, string> = {}
  for (const l of m[1].split('\n')) {
    const kv = /^(\w+):\s*(.*)$/.exec(l)
    if (kv) meta[kv[1]] = kv[2].trim()
  }
  for (const k of ['slug', 'title', 'level', 'minutes', 'tools', 'summary', 'outcome']) if (!meta[k]) throw new Error(`Front matter is missing "${k}"`)

  // split into intro + steps on "## " (outside code fences)
  const lines = m[2].split('\n')
  const intro: string[] = []
  const steps: { title: string; id: string; lines: string[] }[] = []
  let fence = false
  for (const l of lines) {
    if (/^```/.test(l)) fence = !fence
    const h = !fence && /^##\s+(.*)$/.exec(l)
    if (h) {
      const idm = /\{#([a-z0-9-]+)\}\s*$/.exec(h[1])
      const title = h[1].replace(/\s*\{#[a-z0-9-]+\}\s*$/, '').trim()
      steps.push({ title, id: idm ? idm[1] : slugify(title), lines: [] })
    } else (steps.length ? steps[steps.length - 1].lines : intro).push(l)
  }
  return {
    slug: meta.slug, title: meta.title, level: meta.level, minutes: Number(meta.minutes),
    tools: meta.tools.split(',').map((s) => s.trim()).filter(Boolean),
    summary: meta.summary, outcome: meta.outcome,
    intro: parseBlocks(intro),
    steps: steps.map((s) => ({ id: s.id, title: s.title, blocks: parseBlocks(s.lines) })),
  }
}
