/**
 * Checks the learning content so a typo can never ship a broken guide:
 *   node scripts/validate-content.mjs      (also run in CI: npm run check:content)
 */
import { build } from 'esbuild'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { tmpdir } from 'node:os'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const out = join(tmpdir(), `parse-${process.pid}.mjs`)
await build({ entryPoints: [join(root, 'src/content/learn/parse.ts')], outfile: out, format: 'esm', bundle: true, logLevel: 'silent' })
const { parseGuide } = await import(pathToFileURL(out).href)

let yaml = null
try { yaml = (await import(pathToFileURL(join(root, '../backend/node_modules/js-yaml/index.js')).href)).default } catch { console.warn('js-yaml not found (install backend deps) — skipping YAML block checks') }

/** Copy-paste safety: every code block must be valid for its language. */
function lintCode(b, where) {
  const lang = b.lang
  if (lang === 'yaml' && yaml) {
    try { yaml.load(b.code) } catch (e) { fail(`${where}: invalid YAML — ${e.message.split('\n')[0]}`) }
    if (/\t/.test(b.code)) fail(`${where}: tab character in YAML`)
  }
  if (lang === 'json') { try { JSON.parse(b.code) } catch (e) { fail(`${where}: invalid JSON — ${e.message}`) } }
  if (lang === 'nginx') {
    let depth = 0
    for (const raw of b.code.split('\n')) {
      const l = raw.trim()
      if (!l || l.startsWith('#')) continue
      depth += (l.match(/\{/g) || []).length - (l.match(/\}/g) || []).length
      if (!/[;{}]$/.test(l)) fail(`${where}: nginx line must end with ; { or } -> "${l}"`)
    }
    if (depth !== 0) fail(`${where}: unbalanced braces in nginx block`)
  }
  if (lang === 'dockerfile') {
    for (const l of b.code.split('\n')) {
      if (/^[A-Z]+\s+.*\s#\s/.test(l)) fail(`${where}: Dockerfile comment must be on its own line (inline # breaks the instruction): ${l}`)
    }
  }
  if (lang === 'bash' || lang === 'powershell') {
    for (const l of b.code.split('\n')) if (/^\s*\$\s/.test(l)) fail(`${where}: do not include the $ prompt in copyable commands: ${l}`)
  }
}

const dir = join(root, 'src/content/learn/guides')
const starters = join(root, '../backend/starters')
const errors = []
const guides = []
const fail = (m) => errors.push(m)

for (const f of readdirSync(dir).filter((f) => f.endsWith('.md'))) {
  let g
  try { g = parseGuide(readFileSync(join(dir, f), 'utf8')) } catch (e) { fail(`${f}: ${e.message}`); continue }
  guides.push(g)
  if (g.slug + '.md' !== f) fail(`${f}: slug "${g.slug}" must match the file name`)
  if (g.steps.length < 3) fail(`${f}: too few steps`)
  const ids = new Set()
  const walk = (blocks, where) => {
    for (const b of blocks) {
      if (b.t === 'code' && !b.code.trim()) fail(`${where}: empty code block`)
      if (b.t === 'code') lintCode(b, where)
      if (b.t === 'code' && /[“”‘’]/.test(b.code)) fail(`${where}: curly quotes inside a code block (they break when pasted): ${b.code.split('\n').find((l) => /[“”‘’]/.test(l))}`)
      if (b.t === 'download' && !existsSync(join(starters, b.starter))) fail(`${where}: unknown starter "${b.starter}"`)
      if (b.t === 'callout' || b.t === 'error') walk(b.blocks, where)
      if (b.t === 'error' && !b.title) fail(`${where}: error block without a title`)
      for (const text of [b.text, ...(b.items || [])].filter(Boolean)) {
        for (const m of text.matchAll(/\[[^\]]+\]\(([^)]*)\)/g)) {
          if (!/^(https:\/\/|\/learn(\/|$)|\/(register|login|features|pricing|help|toolbox|bundle|roadmap)$)/.test(m[1])) fail(`${where}: suspicious link "${m[1]}"`)
        }
        if ((text.match(/`/g) || []).length % 2) fail(`${where}: unbalanced backtick in "${text.slice(0, 50)}"`)
        if ((text.match(/\*\*/g) || []).length % 2) fail(`${where}: unbalanced ** in "${text.slice(0, 50)}"`)
      }
    }
  }
  walk(g.intro, `${f} intro`)
  for (const s of g.steps) {
    if (ids.has(s.id)) fail(`${f}: duplicate step id "${s.id}"`)
    ids.add(s.id)
    if (!/^[a-z0-9-]+$/.test(s.id)) fail(`${f}: bad step id "${s.id}"`)
    if (s.blocks.length === 0) fail(`${f}: step "${s.id}" is empty`)
    walk(s.blocks, `${f} › ${s.id}`)
  }
}

// curriculum must only reference guides that exist
const cur = readFileSync(join(root, 'src/content/learn/curriculum.ts'), 'utf8')
const slugs = new Set(guides.map((g) => g.slug))
for (const m of cur.matchAll(/guides:\s*\[([^\]]*)\]/g)) {
  for (const s of m[1].match(/'([^']+)'/g) || []) if (!slugs.has(s.slice(1, -1))) fail(`curriculum.ts: unknown guide ${s}`)
}
const ids = [...cur.matchAll(/id:\s*'([^']+)'/g)].map((m) => m[1])
if (new Set(ids).size !== ids.length) fail('curriculum.ts: duplicate ids')

if (errors.length) { console.error('Content problems:\n - ' + errors.join('\n - ')); process.exit(1) }
console.log(`Content OK: ${guides.length} guides, ${guides.reduce((n, g) => n + g.steps.length, 0)} steps, ${ids.length} curriculum ids`)
