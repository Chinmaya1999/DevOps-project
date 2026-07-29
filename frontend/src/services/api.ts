import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://api.cmcloud.online/api',
  timeout: 600000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Check localStorage first, then sessionStorage
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

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
    if (error.response?.status === 401) {
      // Remove token from both localStorage and sessionStorage
      localStorage.removeItem('token')
      sessionStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
