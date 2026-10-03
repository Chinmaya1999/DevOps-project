import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ChevronRight, LifeBuoy, Terminal } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { AREA_FOR_DOMAIN, isBeginner } from '../../utils/profile'

interface Area { area: string; issues: { id: string; title: string }[] }
interface Solution { id: string; tool: string; title: string; cause: string; steps: string[] }

/** Guided troubleshooting: "Where does it hurt?" → "What are you seeing?" → solution. */
const Help: React.FC = () => {
  const { user } = useAuth()
  const [catalog, setCatalog] = useState<Area[]>([])
  const [area, setArea] = useState<Area | null>(null)
  const [solution, setSolution] = useState<Solution | null>(null)
  const [loading, setLoading] = useState(true)
  const beginner = isBeginner((user as any)?.workExperience)

  useEffect(() => {
    api.get('/tools/catalog')
      .then((r) => setCatalog(r.data.data))
      .catch(() => toast.error('Could not load help topics'))
      .finally(() => setLoading(false))
  }, [])

  // areas matching the user's own domains come first
  const sorted = useMemo(() => {
    const mine = new Set(((user as any)?.domains || []).map((d: string) => AREA_FOR_DOMAIN[d]).filter(Boolean))
    return [...catalog].sort((a, b) => Number(mine.has(b.area)) - Number(mine.has(a.area)))
  }, [catalog, user])

  const open = async (id: string) => {
    try { setSolution((await api.get(`/tools/solution/${id}`)).data.data) }
    catch { toast.error('Could not load the solution') }
  }

  const back = () => (solution ? setSolution(null) : setArea(null))

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <span className="p-2.5 rounded-xl hero-gradient shadow-lg shadow-cyan-500/20"><LifeBuoy className="w-6 h-6 text-white" /></span>
        <div>
          <h1 className="font-display text-3xl font-bold">Help desk</h1>
          <p className="text-slate-600 dark:text-gray-400">Answer two quick questions and get the fix.</p>
        </div>
      </div>

      {(area || solution) && (
        <button onClick={back} className="mt-6 inline-flex items-center text-sm text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </button>
      )}

      <div className="mt-6" aria-live="polite">
        {loading && <p className="text-slate-500">Loading…</p>}

        {!loading && !area && !solution && (
          <>
            <h2 className="font-semibold mb-3">1. Where does it hurt?</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {sorted.map((a) => (
                <button key={a.area} onClick={() => setArea(a)} className="card p-4 text-left flex items-center justify-between hover:border-cyan-400/60 transition">
                  <span><span className="font-semibold">{a.area}</span><span className="block text-sm text-slate-500 dark:text-gray-400">{a.issues.length} common problems</span></span>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </button>
              ))}
            </div>
          </>
        )}

        {area && !solution && (
          <>
            <h2 className="font-semibold mb-3">2. What are you seeing in {area.area}?</h2>
            <div className="space-y-2">
              {area.issues.map((i) => (
                <button key={i.id} onClick={() => open(i.id)} className="card w-full p-4 text-left flex items-center justify-between hover:border-cyan-400/60 transition">
                  <span className="font-medium">{i.title}</span><ChevronRight className="w-5 h-5 text-slate-400" />
                </button>
              ))}
            </div>
            <p className="mt-4 text-sm text-slate-500 dark:text-gray-400">Not listed? <Link to="/toolbox" className="text-cyan-600 dark:text-cyan-300 underline">Paste your error into the Toolbox</Link>.</p>
          </>
        )}

        {solution && (
          <div className="card p-6">
            <div className="text-xs font-mono text-cyan-600 dark:text-cyan-300">{solution.tool}</div>
            <h2 className="font-display text-2xl font-semibold mt-1">{solution.title}</h2>
            <h3 className="mt-5 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-gray-400">{beginner ? 'What this means' : 'Likely cause'}</h3>
            <p className="mt-1 text-slate-700 dark:text-gray-200">{solution.cause}</p>
            <h3 className="mt-5 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-gray-400">{beginner ? 'Try these steps, in order' : 'Fix'}</h3>
            <ol className="mt-2 space-y-2">
              {solution.steps.map((st, idx) => (
                <li key={idx} className="flex gap-3 items-start">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-cyan-500/15 text-cyan-700 dark:text-cyan-200 text-xs flex items-center justify-center font-mono mt-1">{idx + 1}</span>
                  <code className="flex-1 text-sm font-mono bg-slate-100 dark:bg-black/30 rounded-lg px-3 py-2 break-words">{st}</code>
                </li>
              ))}
            </ol>
            {beginner && <p className="mt-4 text-sm text-slate-500 dark:text-gray-400 flex items-center gap-2"><Terminal className="w-4 h-4" /> Run commands one at a time and read the output before moving on. Check <Link to="/devops-docs" className="underline">the docs</Link> if a term is new.</p>}
          </div>
        )}
      </div>
    </div>
  )
}

export default Help
