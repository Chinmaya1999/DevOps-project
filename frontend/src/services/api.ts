import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://api.cmcloud.online/api',
  timeout: 600000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

/**
 * Sessions live in an HttpOnly cookie that scripts cannot read. State-changing requests must also carry the CSRF
 * token the server gave us at login / on page load. It is kept in memory only (never in storage).
 */
let csrfToken: string | null = null
export const setCsrfToken = (t: string | null) => { csrfToken = t }
export const API_BASE: string = import.meta.env.VITE_API_URL || 'https://api.cmcloud.online/api'

/** fetch() with the session cookie + CSRF header, for the few places that don't use axios. */
export const authFetch = (url: string, init: RequestInit = {}) =>
  fetch(url, {
    ...init,
    credentials: 'include',
    headers: { ...(init.headers || {}), ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}) },
  })

// Request interceptor
api.interceptors.request.use(
  (config) => {
    if (csrfToken) config.headers['X-CSRF-Token'] = csrfToken

    // Add anonymous user ID header for blog view tracking
    let anonymousUserId = localStorage.getItem('anonymousUserId')
    if (!anonymousUserId) {
      // Generate a new UUID for anonymous user
      anonymousUserId = crypto.randomUUID()
      localStorage.setItem('anonymousUserId', anonymousUserId)
    }
    config.headers['X-Anonymous-User-Id'] = anonymousUserId

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // A Pro-only feature (or the Free monthly limit): tell the UI so it can show an upgrade prompt
    if (error.response?.status === 403 && error.response?.data?.code === 'UPGRADE_REQUIRED') {
      window.dispatchEvent(new CustomEvent('upgrade-required', { detail: error.response.data }))
    }
    // An expired/invalid SESSION sends the user to /login. A 401 from the login/verification calls themselves
    // just means "wrong credentials" — redirecting would reload the page and swallow the error message.
    const url: string = error.config?.url || ''
    const isCredentialCall = /\/auth\/(login|register|verify-otp|resend-otp|forgot-password|reset-password|profile|2fa\/verify|logout)/.test(url)
    if (error.response?.status === 401 && !isCredentialCall) {
      setCsrfToken(null)
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
