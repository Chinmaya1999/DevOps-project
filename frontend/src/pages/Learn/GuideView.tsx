import React, { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CheckCircle2, Circle, Clock, Target } from 'lucide-react'
import { GUIDES, guideBySlug, lessonId } from '../../content/learn'
import { Blocks } from '../../components/Learn/GuideBlocks'
import { useLearnProgress } from '../../hooks/useLearnProgress'

const GuideView: React.FC = () => {
  const { slug } = useParams<{ slug: string }>()
  const guide = guideBySlug(slug)
  const { done, toggle, signedIn } = useLearnProgress()

  useEffect(() => {
    window.scrollTo(0, 0)
    if (guide) document.title = `${guide.title} · AutoDevOps`
    return () => { document.title = 'AutoDevOps' }
  }, [slug]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!guide) {
    return (
      <div className="max-w-xl mx-auto text-center py-20">
        <h1 className="font-display text-3xl font-bold">Guide not found</h1>
        <Link to="/learn" className="btn-primary inline-block mt-6">Back to all guides</Link>
      </div>
    )
  }

  const idx = GUIDES.findIndex((g) => g.slug === guide.slug)
  const next = GUIDES[idx + 1]
  const prev = GUIDES[idx - 1]
  const doneCount = guide.steps.filter((s) => done.has(lessonId(guide.slug, s.id))).length
  const pct = Math.round((doneCount / guide.steps.length) * 100)

  return (
    <div className="max-w-6xl mx-auto">
      <Link to="/learn" className="inline-flex items-center text-sm text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white"><ArrowLeft className="w-4 h-4 mr-1" /> All guides</Link>

      <header className="mt-4">
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">{guide.title}</h1>
        <p className="mt-3 text-lg text-slate-600 dark:text-gray-300 max-w-3xl">{guide.summary}</p>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
          <span className="px-2.5 py-1 rounded-full bg-cyan-500/15 text-cyan-700 dark:text-cyan-200 font-semibold">{guide.level}</span>
          <span className="inline-flex items-center gap-1 text-slate-500 dark:text-gray-400"><Clock className="w-4 h-4" /> about {guide.minutes} minutes</span>
          {guide.tools.map((t) => <span key={t} className="px-2 py-0.5 rounded-md bg-slate-200/70 dark:bg-white/10 text-xs">{t}</span>)}
        </div>
        <div className="mt-4 flex items-start gap-2 p-3 rounded-xl bg-violet-500/10 border border-violet-500/25 text-sm max-w-3xl"><Target className="w-5 h-5 mt-0.5 shrink-0 text-violet-600 dark:text-violet-300" /><span><strong>By the end:</strong> {guide.outcome}</span></div>
      </header>

      <div className="mt-8 grid lg:grid-cols-[260px_minmax(0,1fr)] gap-8">
        {/* step list */}
        <nav aria-label="Steps" className="hidden lg:block">
          <div className="sticky top-24 card p-4">
            <div className="flex justify-between text-sm font-medium"><span>Progress</span><span>{doneCount}/{guide.steps.length}</span></div>
            <div className="mt-2 h-1.5 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden"><div className="h-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} /></div>
            <ol className="mt-4 space-y-1 max-h-[60vh] overflow-y-auto pr-1">
              {guide.steps.map((s, i) => {
                const on = done.has(lessonId(guide.slug, s.id))
                return (
                  <li key={s.id}>
                    <a href={`#${s.id}`} className="flex items-start gap-2 text-sm px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5">
                      {on ? <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-500" /> : <Circle className="w-4 h-4 mt-0.5 shrink-0 text-slate-400" />}
                      <span className={on ? 'text-slate-500 line-through' : ''}>{i + 1}. {s.title}</span>
                    </a>
                  </li>
                )
              })}
            </ol>
          </div>
        </nav>

        <article className="min-w-0">
          <div className="text-[0.98rem] text-slate-800 dark:text-gray-200"><Blocks blocks={guide.intro} /></div>

          {!signedIn && (
            <div className="my-6 p-4 rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-sm">
              Your ticks are saved in this browser. <Link to="/register" className="font-semibold underline">Create a free account</Link> to keep your progress on every device and unlock the generators, validator and Help desk.
            </div>
          )}

          {guide.steps.map((s, i) => {
            const id = lessonId(guide.slug, s.id)
            const on = done.has(id)
            return (
              <section key={s.id} id={s.id} className="scroll-mt-24 mt-10 pt-2">
                <div className="flex items-start gap-3">
                  <span className="shrink-0 w-9 h-9 rounded-xl hero-gradient text-white flex items-center justify-center font-mono text-sm shadow-lg shadow-cyan-500/20">{i + 1}</span>
                  <h2 className="font-display text-2xl font-bold leading-snug pt-0.5">{s.title}</h2>
                </div>
                <div className="mt-3 text-[0.98rem] text-slate-800 dark:text-gray-200"><Blocks blocks={s.blocks} /></div>
                <button onClick={() => toggle(id)} aria-pressed={on}
                  className={`mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition ${on ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'border-slate-300 dark:border-white/15 hover:bg-slate-100 dark:hover:bg-white/5'}`}>
                  {on ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />} {on ? 'Done' : 'Mark this step as done'}
                </button>
              </section>
            )
          })}

          <footer className="mt-14 pt-6 border-t border-slate-200 dark:border-white/10 flex flex-wrap gap-3 justify-between">
            {prev ? <Link to={`/learn/${prev.slug}`} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-white/15"><ArrowLeft className="w-4 h-4" /> {prev.title}</Link> : <span />}
            {next ? <Link to={`/learn/${next.slug}`} className="btn-primary inline-flex items-center gap-2">Next: {next.title} <ArrowRight className="w-4 h-4" /></Link> : <Link to="/learn" className="btn-primary">Back to the roadmap</Link>}
          </footer>
        </article>
      </div>
    </div>
  )
}

export default GuideView
