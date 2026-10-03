import React, { useEffect, useState } from 'react'

const LINES = [
  '$ autodevops generate terraform --cloud aws --stack web-app',
  '✔ VPC, subnets, security groups',
  '✔ ECS cluster + ALB + autoscaling',
  '✔ Remote state (S3 + DynamoDB lock)',
  '✔ Security scan: 0 critical, 0 high',
  '✔ Estimated cost: $42.18 / month',
  '$ autodevops deploy --one-click',
]

/** Typewriter terminal used on the landing page. Static when reduced-motion is requested. */
const TerminalDemo: React.FC = () => {
  const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  const [count, setCount] = useState(reduce ? LINES.length : 0)

  useEffect(() => {
    if (reduce) return
    const id = setInterval(() => setCount((c) => (c >= LINES.length + 3 ? 0 : c + 1)), 900)
    return () => clearInterval(id)
  }, [reduce])

  return (
    <div className="glass-panel overflow-hidden font-mono text-sm shadow-2xl shadow-cyan-500/10">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
        <span className="w-3 h-3 rounded-full bg-red-500/80" />
        <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
        <span className="w-3 h-3 rounded-full bg-green-500/80" />
        <span className="ml-3 text-xs text-gray-400">autodevops — zsh</span>
      </div>
      <div className="p-5 space-y-1.5 min-h-[230px] text-left">
        {LINES.slice(0, Math.min(count, LINES.length)).map((l, i) => (
          <div key={i} className={l.startsWith('$') ? 'text-cyan-300' : l.startsWith('✔') ? 'text-emerald-300' : 'text-gray-300'}>
            {l}
          </div>
        ))}
        <div className="cursor-blink h-5" />
      </div>
    </div>
  )
}

export default TerminalDemo
