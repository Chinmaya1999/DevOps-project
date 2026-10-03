/** Mirrors the server's rules (backend/utils/validators.js + middleware/security.js) so users never pass the form and fail on submit. */
const COMMON = new Set(['password', 'password1', 'password123', '1234567890', 'qwertyuiop', 'admin12345', 'admin123'])

export const PASSWORD_RULES = [
  { id: 'len', label: 'At least 10 characters', test: (p: string) => p.length >= 10 },
  { id: 'letter', label: 'Contains a letter', test: (p: string) => /[A-Za-z]/.test(p) },
  { id: 'digit', label: 'Contains a number', test: (p: string) => /\d/.test(p) },
]

export function passwordProblem(p: string): string | null {
  if (p.length < 10) return 'Password must be at least 10 characters long'
  if (p.length > 128) return 'Password is too long'
  if (!/[A-Za-z]/.test(p) || !/\d/.test(p)) return 'Password must contain letters and numbers'
  if (COMMON.has(p.toLowerCase())) return 'That password is too common'
  return null
}

/** 0–4 for the strength bar. */
export function passwordStrength(p: string): number {
  if (!p) return 0
  let s = 0
  if (p.length >= 10) s++
  if (p.length >= 14) s++
  if (/[A-Za-z]/.test(p) && /\d/.test(p)) s++
  if (/[^A-Za-z0-9]/.test(p) && /[A-Z]/.test(p) && /[a-z]/.test(p)) s++
  return Math.min(s, 4)
}

export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
