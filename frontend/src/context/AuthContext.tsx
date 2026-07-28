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
    // Check for OAuth token in URL
    const urlParams = new URLSearchParams(window.location.search)
    const oauthToken = urlParams.get('token')
    const isGoogle = urlParams.get('google') === 'true'
    const isGithub = urlParams.get('github') === 'true'
    const isOAuth = isGoogle || isGithub

    const token = oauthToken || localStorage.getItem('token')
    
    if (token) {
      localStorage.setItem('token', token)
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      fetchUserProfile()
      
      // Show success toast and clean URL if it was OAuth
      if (isOAuth) {
        if (isGoogle) {
          toast.success('Google login successful!')
        } else if (isGithub) {
          toast.success('GitHub login successful!')
        }
        window.history.replaceState({}, document.title, '/dashboard')
      }
    } else {
      setLoading(false)
    }
  }, [])

  const fetchUserProfile = async () => {
    try {
      const response = await api.get('/auth/profile')
      setUser(response.data.user)
    } catch (error) {
      console.error('Failed to fetch user profile:', error)
      localStorage.removeItem('token')
      delete api.defaults.headers.common['Authorization']
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password })
      const { user: userData, token } = response.data
      
      localStorage.setItem('token', token)
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
      
      localStorage.setItem('token', token)
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      setUser(userData)
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Registration failed')
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
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
    localStorage.setItem('token', token)
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
