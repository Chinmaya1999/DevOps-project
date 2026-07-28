import React, { useState, useEffect } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Header from '../../components/Header/Header'
import toast from 'react-hot-toast'
import { GitBranch, Eye, EyeOff, Loader2, ArrowRight, Server, Cloud, Shield, Zap } from 'lucide-react'

const Login: React.FC = () => {
  const [searchParams] = useSearchParams()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login, user, setToken } = useAuth()

  // Handle OAuth callback
  useEffect(() => {
    const token = searchParams.get('token')
    const github = searchParams.get('github')
    const google = searchParams.get('google')
    
    if (token && (github === 'true' || google === 'true')) {
      localStorage.setItem('token', token)
      setToken(token)
      toast.success(`${github === 'true' ? 'GitHub' : 'Google'} login successful!`)
      window.location.href = '/dashboard'
    }
    
    const error = searchParams.get('error')
    if (error) {
      toast.error('OAuth login failed. Please try again.')
      window.history.replaceState({}, document.title, '/login')
    }
  }, [searchParams, setToken])

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleGoogleSignIn = () => {
    window.location.href = 'https://api.cmcloud.online/api/auth/google'
  }

  const handleGithubSignIn = () => {
    window.location.href = 'https://api.cmcloud.online/api/auth/github'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await login(formData.email, formData.password)
      toast.success('Login successful!')
    } catch (error: any) {
      toast.error(error.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `
            linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          animation: 'gridMove 20s linear infinite'
        }} />
        
        {/* Floating Orbs */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{animationDuration: '8s'}}></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{animationDuration: '12s', animationDelay: '2s'}}></div>
        <div className="absolute bottom-20 left-1/3 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{animationDuration: '10s', animationDelay: '4s'}}></div>
        
        {/* 3D Floating Icons */}
        <div className="absolute top-1/4 left-10 animate-float-slow" style={{animationDuration: '15s'}}>
          <Server className="w-16 h-16 text-blue-400 opacity-30" />
        </div>
        <div className="absolute top-1/3 right-16 animate-float-slow" style={{animationDuration: '18s', animationDelay: '3s'}}>
          <Cloud className="w-20 h-20 text-purple-400 opacity-30" />
        </div>
        <div className="absolute bottom-1/4 left-1/4 animate-float-slow" style={{animationDuration: '20s', animationDelay: '5s'}}>
          <Shield className="w-14 h-14 text-cyan-400 opacity-30" />
        </div>
        <div className="absolute bottom-1/3 right-1/4 animate-float-slow" style={{animationDuration: '16s', animationDelay: '7s'}}>
          <Zap className="w-12 h-12 text-yellow-400 opacity-30" />
        </div>
      </div>

      <style>{`
        @keyframes gridMove {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0) translateX(0) rotate(0deg); }
          25% { transform: translateY(-30px) translateX(15px) rotate(5deg); }
          50% { transform: translateY(-15px) translateX(-10px) rotate(-5deg); }
          75% { transform: translateY(-40px) translateX(5px) rotate(3deg); }
        }
        .animate-float {
          animation: float 8s ease-in-out infinite;
        }
        .animate-float-slow {
          animation: float-slow 15s ease-in-out infinite;
        }
        .glass-card-3d {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 
            0 25px 50px -12px rgba(0, 0, 0, 0.5),
            0 0 0 1px rgba(255, 255, 255, 0.05),
            inset 0 0 20px rgba(255, 255, 255, 0.05);
          transform: perspective(1000px) rotateX(0deg) rotateY(0deg);
          transition: all 0.5s ease;
        }
        .glass-card-3d:hover {
          transform: perspective(1000px) rotateX(2deg) rotateY(-2deg) translateY(-5px);
          box-shadow: 
            0 35px 60px -12px rgba(0, 0, 0, 0.6),
            0 0 0 1px rgba(255, 255, 255, 0.1),
            inset 0 0 30px rgba(255, 255, 255, 0.08);
        }
        .input-3d {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          transition: all 0.3s ease;
        }
        .input-3d:focus {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(59, 130, 246, 0.5);
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
          transform: translateY(-2px);
        }
        .btn-3d {
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          box-shadow: 
            0 10px 30px -10px rgba(59, 130, 246, 0.5),
            0 0 0 1px rgba(255, 255, 255, 0.1);
          transition: all 0.3s ease;
        }
        .btn-3d:hover {
          transform: translateY(-3px);
          box-shadow: 
            0 20px 40px -10px rgba(59, 130, 246, 0.6),
            0 0 0 1px rgba(255, 255, 255, 0.2);
        }
        .btn-3d:active {
          transform: translateY(-1px);
        }
      `}</style>
      
      <Header showAuthButtons={false} />
      
      <div className="flex-1 flex items-center justify-center relative px-4">
        <div className="max-w-md w-full">
          {/* 3D Glass Card */}
          <div className="glass-card-3d p-10 rounded-3xl">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur-2xl opacity-60 animate-pulse"></div>
                  <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-2xl shadow-2xl transform hover:scale-110 transition-transform duration-300">
                    <GitBranch className="w-12 h-12 text-white" />
                  </div>
                </div>
              </div>
              <h2 className="text-4xl font-black text-white mb-2 tracking-tight">
                Welcome Back
              </h2>
              <p className="text-lg text-blue-200">
                Sign in to your AutoDevOps Platform
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-sm font-bold text-blue-200 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      className="input-3d w-full px-4 py-3 pl-12 rounded-xl text-white placeholder-blue-300/50 focus:outline-none"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={handleChange}
                    />
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <div className="w-5 h-5 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-bold text-blue-200 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      className="input-3d w-full px-4 py-3 pl-12 pr-12 rounded-xl text-white placeholder-blue-300/50 focus:outline-none"
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleChange}
                    />
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <div className="w-5 h-5 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full animate-pulse"></div>
                    </div>
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-blue-300 hover:text-white transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember"
                    name="remember"
                    type="checkbox"
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <label htmlFor="remember" className="ml-2 text-sm font-medium text-blue-200">
                    Remember me
                  </label>
                </div>
                <a href="#" className="text-sm font-medium text-blue-300 hover:text-white transition-colors">
                  Forgot password?
                </a>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-3d w-full py-4 rounded-xl text-white font-bold text-lg flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="ml-3 w-5 h-5" />
                    </>
                  )}
                </button>
              </div>

              {/* OAuth Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-blue-500/30"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-transparent text-blue-300 font-medium">
                    Or continue with
                  </span>
                </div>
              </div>

              {/* OAuth Buttons */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="flex items-center justify-center px-4 py-3 bg-white/10 backdrop-blur border border-white/20 rounded-xl hover:bg-white/20 focus:outline-none focus:ring-4 focus:ring-blue-500/50 transition-all duration-300 transform hover:scale-105"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="text-sm font-medium text-white">Google</span>
                </button>
                
                <button
                  type="button"
                  onClick={handleGithubSignIn}
                  className="flex items-center justify-center px-4 py-3 bg-white/10 backdrop-blur border border-white/20 rounded-xl hover:bg-white/20 focus:outline-none focus:ring-4 focus:ring-gray-500/50 transition-all duration-300 transform hover:scale-105"
                >
                  <svg className="w-5 h-5 mr-2 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  <span className="text-sm font-medium text-white">GitHub</span>
                </button>
              </div>

              <div className="text-center">
                <span className="text-blue-200">
                  Don't have an account?{' '}
                  <Link
                    to="/register"
                    className="font-bold text-white hover:text-blue-300 transition-all"
                  >
                    Sign up now
                  </Link>
                </span>
              </div>
            </form>
          </div>
          
          {/* Additional Info */}
          <div className="mt-6 text-center">
            <p className="text-sm text-blue-300/70">
              By signing in, you agree to our{' '}
              <a href="#" className="font-medium text-blue-300 hover:text-white transition-colors">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="font-medium text-blue-300 hover:text-white transition-colors">
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
