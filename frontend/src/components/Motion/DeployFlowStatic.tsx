import React from 'react'
import { ArrowRight } from 'lucide-react'
import { DEPLOY_STAGES } from './deployStages'

/** Non-3D version of the deployment flow: used on phones and when the visitor prefers reduced motion. */
const DeployFlowStatic: React.FC<{ className?: string }> = ({ className = '' }) => (
  <ol className={`flex flex-wrap items-center gap-2 ${className}`} aria-label="How an app is deployed: from git push to a live server">
    {DEPLOY_STAGES.map((s, i) => (
      <li key={s.key} className="flex items-center gap-2">
        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-white/10 bg-white/70 dark:bg-white/5 text-sm">
          <s.icon className="w-4 h-4" style={{ color: s.color === '#e2e8f0' ? undefined : s.color }} />
          <span className="font-medium">{s.tool}</span>
        </span>
        {i < DEPLOY_STAGES.length - 1 && <ArrowRight className="w-4 h-4 text-slate-400" aria-hidden="true" />}
      </li>
    ))}
  </ol>
)

export default DeployFlowStatic
