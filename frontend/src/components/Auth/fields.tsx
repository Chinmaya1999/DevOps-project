import React, { useId, useState } from 'react'
import { Check, Circle, Eye, EyeOff } from 'lucide-react'
import { PASSWORD_RULES, passwordStrength } from '../../utils/password'

interface FieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string
  error?: string
  hint?: React.ReactNode
}

export const TextField: React.FC<FieldProps> = ({ label, error, hint, className = '', ...rest }) => {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium mb-1.5">{label}</label>
      <input id={id} aria-invalid={!!error} aria-describedby={error ? `${id}-err` : undefined} className={`input ${error ? '!border-red-500' : ''} ${className}`} {...rest} />
      {error && <p id={`${id}-err`} role="alert" className="mt-1.5 text-sm text-red-500">{error}</p>}
      {hint && !error && <p className="mt-1.5 text-xs text-slate-500 dark:text-gray-400">{hint}</p>}
    </div>
  )
}

export const PasswordField: React.FC<FieldProps & { meter?: boolean }> = ({ label, error, meter, value, className = '', ...rest }) => {
  const id = useId()
  const [show, setShow] = useState(false)
  const pw = String(value ?? '')
  const strength = passwordStrength(pw)
  const colors = ['bg-slate-300 dark:bg-white/10', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-emerald-500']
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium mb-1.5">{label}</label>
      <div className="relative">
        <input id={id} type={show ? 'text' : 'password'} value={value} aria-invalid={!!error} aria-describedby={error ? `${id}-err` : undefined}
          className={`input pr-12 ${error ? '!border-red-500' : ''} ${className}`} {...rest} />
        <button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white">
          {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>
      {error && <p id={`${id}-err`} role="alert" className="mt-1.5 text-sm text-red-500">{error}</p>}
      {meter && pw.length > 0 && (
        <div className="mt-3" aria-live="polite">
          <div className="flex gap-1.5">
            {[1, 2, 3, 4].map((n) => <span key={n} className={`h-1.5 flex-1 rounded-full transition-colors ${strength >= n ? colors[strength] : colors[0]}`} />)}
          </div>
          <ul className="mt-2 grid gap-1 text-xs">
            {PASSWORD_RULES.map((r) => {
              const ok = r.test(pw)
              return (
                <li key={r.id} className={`flex items-center gap-1.5 ${ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-gray-400'}`}>
                  {ok ? <Check className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />} {r.label}
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
