/**
 * Where the browser keeps credentials the user types in (GitHub token, Docker Hub token, SSH private key).
 *
 * Secrets go to sessionStorage: they live only as long as the tab, never persist on disk, and are not shared
 * between tabs. Non-secret settings (project name, usernames) stay in localStorage for convenience.
 * Any secret an older version left in localStorage is moved out and deleted on first read.
 */
const SETTINGS_KEY = 'infraPilotDeploymentSettings'
const SECRETS_KEY = 'infraPilotDeploymentSecrets'
const SECRET_FIELDS = ['pemKeyContent', 'githubToken', 'dockerHubToken'] as const

const parse = (raw: string | null): Record<string, any> => {
  try { return raw ? JSON.parse(raw) : {} } catch { return {} }
}

export function loadDeploymentSettings(): Record<string, any> {
  const pub = parse(localStorage.getItem(SETTINGS_KEY))
  const sec = parse(sessionStorage.getItem(SECRETS_KEY))
  let migrated = false
  for (const f of SECRET_FIELDS) {
    if (f in pub) { if (pub[f] && !sec[f]) sec[f] = pub[f]; delete pub[f]; migrated = true }
  }
  if (migrated) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(pub))
    sessionStorage.setItem(SECRETS_KEY, JSON.stringify(sec))
  }
  return { ...pub, ...sec }
}

export function saveDeploymentSettings(settings: Record<string, any>) {
  const pub: Record<string, any> = {}
  const sec: Record<string, any> = {}
  for (const [k, v] of Object.entries(settings)) ((SECRET_FIELDS as readonly string[]).includes(k) ? sec : pub)[k] = v
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(pub))
  sessionStorage.setItem(SECRETS_KEY, JSON.stringify(sec))
}

/** Single secrets (e.g. 'github_token'): session-only, with one-time cleanup of the old persistent copy. */
export function getSecret(key: string): string | null {
  const old = localStorage.getItem(key)
  if (old !== null) { if (!sessionStorage.getItem(key)) sessionStorage.setItem(key, old); localStorage.removeItem(key) }
  return sessionStorage.getItem(key)
}
export const setSecret = (key: string, value: string) => { sessionStorage.setItem(key, value); localStorage.removeItem(key) }
