import React, { createContext, useContext, useEffect, useState } from 'react'
import { api, setCsrfToken } from '../services/api'

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
  plan?: {
    plan: 'free' | 'pro'
    status: string
    label: string
    endsAt: string | null
    daysLeft: number | null
    generationsPerMonth: number | null
    features: Record<string, boolean>
  }
  workExperience?: string
  domains?: string[]
  twoFactorEnabled?: boolean
}

export type LoginResult = { twoFactorRequired: false } | { twoFactorRequired: true; challenge: string }

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<LoginResult>
  verifyTwoFactor: (challenge: string, factor: { code?: string; recoveryCode?: string }) => Promise<{ recoveryCodesLeft?: number }>
  register: (username: string, email: string, password: string, workExperience?: string, domains?: string[]) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
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

  // On load, ask the server who we are. The session cookie is HttpOnly, so this is the only way to know.
  useEffect(() => {
    fetchUserProfile()
  }, [])

  const fetchUserProfile = async () => {
    try {
      const response = await api.get('/auth/profile')
      setCsrfToken(response.data.csrfToken || null)
      setUser(response.data.user)
    } catch {
      // 401 = not signed in (normal for visitors); anything else also leaves us signed out
      setCsrfToken(null)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string): Promise<LoginResult> => {
    const response = await api.post('/auth/login', { email, password })
    if (response.data.twoFactorRequired) return { twoFactorRequired: true, challenge: response.data.challenge }
    setCsrfToken(response.data.csrfToken)
    setUser(response.data.user)
    return { twoFactorRequired: false }
  }

  const verifyTwoFactor = async (challenge: string, factor: { code?: string; recoveryCode?: string }) => {
    const response = await api.post('/auth/2fa/verify', { challenge, ...factor })
    setCsrfToken(response.data.csrfToken)
    setUser(response.data.user)
    return { recoveryCodesLeft: response.data.recoveryCodesLeft as number | undefined }
  }

  const register = async (username: string, email: string, password: string, workExperience?: string, domains?: string[]) => {
    try {
      const response = await api.post('/auth/register', { username, email, password, workExperience, domains })
      // Registration now requires OTP verification, so don't auto-login
      // Just return the response data
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.details || error.response?.data?.error || 'Registration failed')
    }
  }

  const logout = async () => {
    try { await api.post('/auth/logout') } catch { /* cookie expires on its own */ }
    setCsrfToken(null)
    setUser(null)
  }

  const refreshUser = async () => {
    await fetchUserProfile()
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    refreshUser,
    verifyTwoFactor
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
