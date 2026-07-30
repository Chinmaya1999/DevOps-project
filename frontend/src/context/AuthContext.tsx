import React, { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../services/api'
import toast from 'react-hot-toast'

interface User {
  id: string
  username: string
  email: string
  role: string
  lastLogin?: string
  profilePicture?: string
  subscription?: {
    type: string
    startDate?: string
    endDate?: string
    trialEndDate?: string
    subscriptionType?: string
  }
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string, workExperience?: string, domains?: string[]) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
  setToken: (token: string) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initializeAuth = async () => {
      // Check for OAuth token in URL (exclude reset-password page)
      const isResetPasswordPage = window.location.pathname === '/reset-password'
      const urlParams = new URLSearchParams(window.location.search)
      const oauthToken = urlParams.get('token')
      const isGoogle = urlParams.get('google') === 'true'
      const isGithub = urlParams.get('github') === 'true'
      const isOAuth = isGoogle || isGithub

      console.log('AuthContext: Initializing auth', { oauthToken, isGoogle, isGithub, isOAuth, currentPath: window.location.pathname, isResetPasswordPage })

      const token = (!isResetPasswordPage && oauthToken) || localStorage.getItem('token') || sessionStorage.getItem('token')
      
      if (token) {
        console.log('AuthContext: Token found, storing and fetching profile')
        // Store token in both localStorage and sessionStorage
        localStorage.setItem('token', token)
        sessionStorage.setItem('token', token)
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
        
        // Fetch user profile
        await fetchUserProfile()
        
        // Show success toast and clean URL if it was OAuth
        if (isOAuth) {
          console.log('AuthContext: OAuth login successful')
          if (isGoogle) {
            toast.success('Google login successful!')
          } else if (isGithub) {
            toast.success('GitHub login successful!')
          }
          // Clean URL parameters - use replaceState to avoid page reload
          const cleanUrl = window.location.pathname
          window.history.replaceState({}, document.title, cleanUrl)
        }
      } else {
        console.log('AuthContext: No token found')
        setLoading(false)
      }
    }

    initializeAuth()
  }, [])

  const fetchUserProfile = async () => {
    try {
      console.log('AuthContext: Fetching user profile')
      const response = await api.get('/auth/profile')
      console.log('AuthContext: User profile fetched successfully', response.data.user)
      setUser(response.data.user)
    } catch (error) {
      console.error('AuthContext: Failed to fetch user profile:', error)
      // Remove token from both storage locations on error
      localStorage.removeItem('token')
      sessionStorage.removeItem('token')
      delete api.defaults.headers.common['Authorization']
      toast.error('Failed to authenticate. Please try logging in again.')
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password })
      const { user: userData, token } = response.data
      
      // Store token in both localStorage and sessionStorage
      localStorage.setItem('token', token)
      sessionStorage.setItem('token', token)
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      setUser(userData)
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Login failed')
    }
  }

  const register = async (username: string, email: string, password: string, workExperience?: string, domains?: string[]) => {
    try {
      const response = await api.post('/auth/register', { username, email, password, workExperience, domains })
      const { user: userData, token } = response.data
      
      // Store token in both localStorage and sessionStorage
      localStorage.setItem('token', token)
      sessionStorage.setItem('token', token)
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      setUser(userData)
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Registration failed')
    }
  }

  const logout = () => {
    // Remove token from both localStorage and sessionStorage
    localStorage.removeItem('token')
    sessionStorage.removeItem('token')
    delete api.defaults.headers.common['Authorization']
    setUser(null)
  }

  const refreshUser = async () => {
    const token = localStorage.getItem('token')
    if (token) {
      await fetchUserProfile()
    }
  }

  const setToken = (token: string) => {
    // Store token in both localStorage and sessionStorage
    localStorage.setItem('token', token)
    sessionStorage.setItem('token', token)
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    fetchUserProfile()
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    refreshUser,
    setToken
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
