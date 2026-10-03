import React, { useState } from 'react'
import { Download, Package, Container, GitBranch, Boxes, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'

const RUNTIMES = [
  { id: 'node', label: 'Node.js', port: 3000 },
  { id: 'python', label: 'Python', port: 8000 },
  { id: 'go', label: 'Go', port: 8080 },
  { id: 'static', label: 'Static site', port: 80 },
]

const INCLUDED = [
  { icon: Container, name: 'Dockerfile', text: 'Non-root image with healthcheck' },
  { icon: Boxes, name: 'docker-compose.yml', text: 'Run locally or on one server' },
  { icon: GitBranch, name: 'GitHub Actions', text: 'Test, build, push and Trivy scan' },
  { icon: ShieldCheck, name: 'Kubernetes', text: 'Deployment, Service, autoscaler, probes' },
]

const Bundle: React.FC = () => {
  const [form, setForm] = useState({ appName: '', runtime: 'node', port: 3000, replicas: 2, dockerHubUser: '' })
  const [busy, setBusy] = useState(false)

  const download = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      const res = await api.post('/generate/bundle', form, { responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url
      a.download = `${form.appName}-devops-bundle.zip`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Bundle downloaded')
    } catch (err: any) {
      // blob responses hide the JSON error body, so read it back
      let msg = 'Could not generate bundle'
      try { msg = JSON.parse(await err.response.data.text()).details || msg } catch { /* keep default */ }
      toast.error(msg)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-3">
        <span className="p-2.5 rounded-xl hero-gradient shadow-lg shadow-cyan-500/20"><Package className="w-6 h-6 text-white" /></span>
        <div>
          <h1 className="font-display text-3xl font-bold">Full-stack bundle</h1>
          <p className="text-gray-500 dark:text-gray-400">Docker, CI/CD and Kubernetes for one app — as a single ZIP.</p>
        </div>
      </div>

      <div className="mt-8 grid lg:grid-cols-5 gap-6">
        <form onSubmit={download} className="card p-6 lg:col-span-3 space-y-5">
          <div>
            <label htmlFor="appName" className="block text-sm font-medium mb-1.5">App name</label>
            <input id="appName" className="input" required pattern="[a-z][a-z0-9\-]{1,40}" placeholder="my-app"
              title="Lowercase letters, numbers and dashes"
              value={form.appName} onChange={(e) => setForm({ ...form, appName: e.target.value.toLowerCase() })} />
          </div>
          <div>
            <span className="block text-sm font-medium mb-1.5">Runtime</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" role="radiogroup" aria-label="Runtime">
              {RUNTIMES.map((r) => (
                <button type="button" key={r.id} role="radio" aria-checked={form.runtime === r.id}
                  onClick={() => setForm({ ...form, runtime: r.id, port: r.port })}
                  className={`px-3 py-2.5 rounded-xl text-sm font-medium border transition ${
                    form.runtime === r.id ? 'border-cyan-400/60 bg-cyan-400/10 text-cyan-600 dark:text-cyan-200' : 'border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5'
                  }`}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="port" className="block text-sm font-medium mb-1.5">App port</label>
              <input id="port" type="number" min={1} max={65535} className="input" value={form.port} onChange={(e) => setForm({ ...form, port: Number(e.target.value) })} />
            </div>
            <div>
              <label htmlFor="replicas" className="block text-sm font-medium mb-1.5">Kubernetes replicas</label>
              <input id="replicas" type="number" min={1} max={10} className="input" value={form.replicas} onChange={(e) => setForm({ ...form, replicas: Number(e.target.value) })} />
            </div>
          </div>
          <div>
            <label htmlFor="hub" className="block text-sm font-medium mb-1.5">Docker Hub username</label>
            <input id="hub" className="input" required pattern="[a-z0-9][a-z0-9_\-]{1,38}" placeholder="yourname" value={form.dockerHubUser}
              onChange={(e) => setForm({ ...form, dockerHubUser: e.target.value.toLowerCase() })} />
          </div>
          <button disabled={busy} className="btn-primary w-full inline-flex items-center justify-center disabled:opacity-60">
            <Download className="w-5 h-5 mr-2" /> {busy ? 'Generating…' : 'Download ZIP'}
          </button>
        </form>

        <aside className="lg:col-span-2 space-y-3" aria-label="What is included">
          {INCLUDED.map((i) => (
            <div key={i.name} className="card p-4 flex gap-3 items-start">
              <i.icon className="w-5 h-5 text-cyan-500 mt-0.5 shrink-0" />
              <div>
                <div className="font-semibold text-sm">{i.name}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{i.text}</div>
              </div>
            </div>
          ))}
        </aside>
      </div>
    </div>
  )
}

export default Bundle
