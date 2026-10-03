import React, { useId } from 'react'

/** DeployDojo mark: a "D" drawn as a deployment pipeline (commit → build → live). */
export const LogoMark: React.FC<{ size?: number; className?: string; title?: string }> = ({ size = 36, className = '', title }) => {
  const id = useId().replace(/:/g, '')
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" className={className} role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <defs>
        <linearGradient id={`g${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#06b6d4" /><stop offset=".55" stopColor="#3b82f6" /><stop offset="1" stopColor="#7c3aed" />
        </linearGradient>
        <linearGradient id={`s${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".22" /><stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="112" fill={`url(#g${id})`} />
      <rect width="512" height="256" rx="112" fill={`url(#s${id})`} />
      <path d="M168 128 V384 H236 C322 384 372 330 372 256 C372 182 322 128 236 128 Z" fill="none" stroke="#fff" strokeWidth="38" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx="168" cy="128" r="30" fill="#0b1220" stroke="#fff" strokeWidth="14" />
      <circle cx="372" cy="256" r="30" fill="#0b1220" stroke="#fff" strokeWidth="14" />
      <circle cx="168" cy="384" r="34" fill="#34d399" stroke="#fff" strokeWidth="14" />
    </svg>
  )
}

/** Mark + wordmark. `tone="light"` forces white text (for always-dark panels). */
const Logo: React.FC<{ size?: number; tone?: 'auto' | 'light'; className?: string; textClassName?: string }> = ({ size = 36, tone = 'auto', className = '', textClassName = '' }) => (
  <span className={`inline-flex items-center gap-2.5 ${className}`}>
    <LogoMark size={size} />
    <span className={`font-display font-bold tracking-tight leading-none ${tone === 'light' ? 'text-white' : 'text-slate-900 dark:text-white'} ${textClassName}`} style={{ fontSize: size * 0.55 }}>
      Deploy<span className="text-cyan-600 dark:text-cyan-300">Dojo</span>
    </span>
  </span>
)

export default Logo
