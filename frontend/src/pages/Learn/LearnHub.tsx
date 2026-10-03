import React from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, CheckCircle2, Circle, Clock, ExternalLink, GraduationCap, Target, Wrench } from 'lucide-react'
import { GUIDES, lessonId, guideBySlug } from '../../content/learn'
import { STAGES, checkpointId, totalCheckpoints } from '../../content/learn/curriculum'
import { useLearnProgress } from '../../hooks/useLearnProgress'

const LEVEL_CLS: Record<string, string> = {
  Beginner: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  Intermediate: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
}

/** Learn hub: deployment guides + the zero-to-DevOps-engineer roadmap, with progress. */
const LearnHub: React.FC = () => {
  const { done, toggle, signedIn } = useLearnProgress()

  const guideDone = (slug: string) => guideBySlug(slug)!.steps.filter((s) => done.has(lessonId(slug, s.id))).length
  const stepsTotal = GUIDES.reduce((n, g) => n + g.steps.length, 0)
  const stepsDone = GUIDES.reduce((n, g) => n + guideDone(g.slug), 0)
  const cpDone = STAGES.reduce((n, s) => n + s.checkpoints.filter((_, i) => done.has(checkpointId(s.id, i))).length, 0)
  const overall = Math.round(((stepsDone + cpDone) / (stepsTotal + totalCheckpoints())) * 100)

  return (
    <div className="max-w-5xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 text-sm font-medium text-cyan-700 dark:text-cyan-300"><GraduationCap className="w-5 h-5" /> Learn DevOps</div>
          <h1 className="mt-2 font-display text-4xl font-bold tracking-tight">From zero to DevOps engineer</h1>
          <p className="mt-3 max-w-2xl text-lg text-slate-600 dark:text-gray-300">
            Step-by-step guides that deploy <strong>real websites on a real server</strong>, plus a 12-stage roadmap for college students and freshers — about 6–9 months, part-time.
          </p>
        </div>
        <div className="card p-4 w-full md:w-60 shrink-0" aria-label="Your progress">
          <div className="flex justify-between text-sm"><span className="font-medium">Your progress</span><span className="font-bold">{overall}%</span></div>
          <div className="mt-2 h-2 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden"><div className="h-full bg-gradient-to-r from-cyan-500 to-violet-600 transition-all" style={{ width: `${overall}%` }} /></div>
          {!signedIn && <p className="mt-2 text-xs text-slate-500 dark:text-gray-400"><Link to="/register" className="underline">Create a free account</Link> to save progress on every device.</p>}
        </div>
      </header>

      {/* Guides */}
      <section className="mt-12" aria-labelledby="guides-h">
        <h2 id="guides-h" className="font-display text-2xl font-bold flex items-center gap-2"><BookOpen className="w-6 h-6 text-cyan-500" /> Deployment guides</h2>
        <p className="mt-1 text-slate-600 dark:text-gray-400">Do them in this order. Each one ends with a working result, and every risky step lists the errors you might hit and how to fix them.</p>
        <div className="mt-5 grid md:grid-cols-2 gap-4">
          {GUIDES.map((g, i) => {
            const d = guideDone(g.slug)
            const pct = Math.round((d / g.steps.length) * 100)
            return (
              <Link key={g.slug} to={`/learn/${g.slug}`} className="card p-5 hover:border-cyan-400/60 transition group flex flex-col">
                <div className="flex items-start justify-between gap-3">
                  <span className="shrink-0 w-8 h-8 rounded-lg bg-cyan-500/15 text-cyan-700 dark:text-cyan-200 flex items-center justify-center font-mono text-sm">{i + 1}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${LEVEL_CLS[g.level] || ''}`}>{g.level}</span>
                </div>
                <h3 className="mt-3 font-display text-lg font-semibold group-hover:text-cyan-700 dark:group-hover:text-cyan-300">{g.title}</h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-gray-400 flex-1">{g.summary}</p>
                <div className="mt-4 flex flex-wrap gap-1.5">{g.tools.slice(0, 4).map((t) => <span key={t} className="px-2 py-0.5 rounded-md text-xs bg-slate-200/70 dark:bg-white/10">{t}</span>)}</div>
                <div className="mt-4 flex items-center justify-between text-xs text-slate-500 dark:text-gray-400">
                  <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> ~{g.minutes} min · {g.steps.length} steps</span>
                  <span>{d}/{g.steps.length} done</span>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden"><div className="h-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} /></div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* Roadmap */}
      <section className="mt-16" aria-labelledby="road-h">
        <h2 id="road-h" className="font-display text-2xl font-bold flex items-center gap-2"><Target className="w-6 h-6 text-violet-500" /> The roadmap: 12 stages</h2>
        <p className="mt-1 text-slate-600 dark:text-gray-400">What to learn, in order, how to know you are ready to move on, and a project for each stage. Tick the checkpoints as you earn them.</p>

        <ol className="mt-6 space-y-4">
          {STAGES.map((s) => {
            const n = s.checkpoints.filter((_, i) => done.has(checkpointId(s.id, i))).length
            return (
              <li key={s.id}>
                <details className="card group" open={s.id === 'foundations'}>
                  <summary className="cursor-pointer list-none p-5 flex items-center justify-between gap-4">
                    <div>
                      <h3 className="font-display text-lg font-semibold">{s.title}</h3>
                      <p className="text-sm text-slate-500 dark:text-gray-400">{s.weeks} · {n}/{s.checkpoints.length} checkpoints</p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-lg bg-slate-200/70 dark:bg-white/10 group-open:hidden">Open</span>
                    <span className="text-xs px-2 py-1 rounded-lg bg-slate-200/70 dark:bg-white/10 hidden group-open:inline">Close</span>
                  </summary>
                  <div className="px-5 pb-5 grid md:grid-cols-2 gap-6 text-sm">
                    <div>
                      <p className="text-base"><strong>Goal:</strong> {s.goal}</p>
                      <h4 className="mt-4 font-semibold">What you will learn</h4>
                      <ul className="mt-1 list-disc pl-5 space-y-1 text-slate-700 dark:text-gray-300">{s.topics.map((t) => <li key={t}>{t}</li>)}</ul>
                      <h4 className="mt-4 font-semibold flex items-center gap-1.5"><Wrench className="w-4 h-4" /> Project</h4>
                      <p className="mt-1 text-slate-700 dark:text-gray-300">{s.project}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold">You are ready to move on when…</h4>
                      <ul className="mt-2 space-y-2">
                        {s.checkpoints.map((c, i) => {
                          const id = checkpointId(s.id, i)
                          const on = done.has(id)
                          return (
                            <li key={id}>
                              <button onClick={() => toggle(id)} aria-pressed={on} className="flex gap-2 text-left w-full hover:text-cyan-700 dark:hover:text-cyan-300">
                                {on ? <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" /> : <Circle className="w-5 h-5 shrink-0 text-slate-400" />}
                                <span className={on ? 'line-through text-slate-500' : ''}>I {c.replace(/^I /, '')}</span>
                              </button>
                            </li>
                          )
                        })}
                      </ul>
                      {s.guides.length > 0 && (<>
                        <h4 className="mt-5 font-semibold">Guides for this stage</h4>
                        <ul className="mt-1 space-y-1">{s.guides.map((slug) => <li key={slug}><Link className="underline text-cyan-700 dark:text-cyan-300" to={`/learn/${slug}`}>{guideBySlug(slug)!.title}</Link></li>)}</ul>
                      </>)}
                      <h4 className="mt-5 font-semibold">Free resources</h4>
                      <ul className="mt-1 space-y-1">{s.resources.map((r) => <li key={r.url}><a className="inline-flex items-center gap-1 underline text-cyan-700 dark:text-cyan-300" href={r.url} target="_blank" rel="noopener noreferrer">{r.label} <ExternalLink className="w-3.5 h-3.5" /></a></li>)}</ul>
                    </div>
                  </div>
                </details>
              </li>
            )
          })}
        </ol>
      </section>

      <section className="mt-16 card p-6 flex flex-col md:flex-row gap-4 md:items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold">Stuck on an error?</h2>
          <p className="text-slate-600 dark:text-gray-400">Every learner gets stuck. Pick your problem in the Help desk, or paste the error into the Toolbox.</p>
        </div>
        <div className="flex gap-3"><Link to="/help" className="btn-primary">Help desk</Link><Link to="/toolbox" className="px-5 py-3 rounded-xl border border-slate-300 dark:border-white/15 font-semibold">Toolbox</Link></div>
      </section>
    </div>
  )
}

export default LearnHub
