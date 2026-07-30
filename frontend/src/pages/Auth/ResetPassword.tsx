import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../../services/api'
import Header from '../../components/Header/Header'
import toast from 'react-hot-toast'
import { Lock, Check, ArrowLeft, Eye, EyeOff, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Invalid or missing reset token. Please request a new password reset link.')
    }
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!token) {
      toast.error('Invalid reset token')
      return
    }

    if (!password || !confirmPassword) {
      toast.error('Please fill in all fields')
      return
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long')
      return
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      await api.post('/auth/reset-password', { token, password, confirmPassword })
      setStatus('success')
      setMessage('Password reset successfully! You can now login with your new password.')
      toast.success('Password reset successfully!')
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login', { 
          state: { message: 'Password reset successfully! Please login with your new password.' }
        })
      }, 3000)
    } catch (error: any) {
      setStatus('error')
      setMessage(error.response?.data?.message || 'Failed to reset password. Please try again.')
      toast.error(error.response?.data?.error || 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return 0
    let strength = 0
    if (pwd.length >= 6) strength += 1
    if (pwd.length >= 10) strength += 1
    if (/[A-Z]/.test(pwd)) strength += 1
    if (/[0-9]/.test(pwd)) strength += 1
    if (/[^A-Za-z0-9]/.test(pwd)) strength += 1
    return strength
  }

  const strength = getPasswordStrength(password)
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-400', 'bg-green-500']
  const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong']

  if (status === 'error' && !token) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
        <Header showAuthButtons={false} />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white/10 backdrop-blur border border-white/20 rounded-3xl p-10 text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-red-500/20 p-4 rounded-full">
                <AlertCircle className="w-12 h-12 text-red-400" />
              </div>
            </div>
            <h2 className="text-3xl font-black text-white mb-4">Invalid Reset Link</h2>
            <p className="text-blue-200 mb-6">{message}</p>
            <Link
              to="/forgot-password"
              className="inline-flex items-center btn-3d px-6 py-3 rounded-xl text-white font-bold"
            >
              Request New Reset Link
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
        <Header showAuthButtons={false} />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white/10 backdrop-blur border border-white/20 rounded-3xl p-10 text-center">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full blur-2xl opacity-60 animate-pulse"></div>
                <div className="relative bg-gradient-to-r from-green-500 to-emerald-600 p-4 rounded-2xl shadow-2xl">
                  <CheckCircle className="w-12 h-12 text-white" />
                </div>
              </div>
            </div>
            <h2 className="text-3xl font-black text-white mb-4">Password Reset Successful!</h2>
            <p className="text-blue-200 mb-6">{message}</p>
            <p className="text-blue-300 text-sm mb-6">Redirecting to login page...</p>
          </div>
        </div>
      </div>
    )
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
        .animate-float {
          animation: float 8s ease-in-out infinite;
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
                    <Lock className="w-12 h-12 text-white" />
                  </div>
                </div>
              </div>
              <h2 className="text-4xl font-black text-white mb-2 tracking-tight">
                Reset Password
              </h2>
              <p className="text-lg text-blue-200">
                Create a new secure password
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="password" className="block text-sm font-bold text-blue-200 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    className="input-3d w-full px-4 py-3 pl-12 pr-12 rounded-xl text-white placeholder-blue-300/50 focus:outline-none"
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-blue-400" />
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
                
                {/* Password Strength Indicator */}
                {password && (
                  <div className="mt-3">
                    <div className="flex gap-1 mb-1">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-all ${
                            i < strength ? strengthColors[strength - 1] : 'bg-gray-600'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-blue-300">
                      Password strength: <span className={strength >= 3 ? 'text-green-400' : 'text-yellow-400'}>{strengthLabels[strength - 1] || 'Very Weak'}</span>
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-bold text-blue-200 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    className="input-3d w-full px-4 py-3 pl-12 pr-12 rounded-xl text-white placeholder-blue-300/50 focus:outline-none"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Check className="w-5 h-5 text-blue-400" />
                  </div>
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-blue-300 hover:text-white transition-colors"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                
                {/* Password Match Indicator */}
                {confirmPassword && (
                  <div className="mt-2 flex items-center gap-2">
                    {password === confirmPassword ? (
                      <p className="text-xs text-green-400 flex items-center">
                        <Check className="w-3 h-3 mr-1" />
                        Passwords match
                      </p>
                    ) : (
                      <p className="text-xs text-red-400">
                        Passwords do not match
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Password Requirements */}
              <div className="bg-white/5 rounded-lg p-4 space-y-2">
                <p className="text-xs text-blue-300 font-medium mb-2">Password requirements:</p>
                <div className="space-y-1">
                  <p className={`text-xs flex items-center ${password.length >= 6 ? 'text-green-400' : 'text-blue-400'}`}>
                    <Check className={`w-3 h-3 mr-2 ${password.length >= 6 ? 'text-green-400' : 'text-blue-400'}`} />
                    At least 6 characters
                  </p>
                  <p className={`text-xs flex items-center ${password.length >= 10 ? 'text-green-400' : 'text-blue-400'}`}>
                    <Check className={`w-3 h-3 mr-2 ${password.length >= 10 ? 'text-green-400' : 'text-blue-400'}`} />
                    10+ characters (recommended)
                  </p>
                  <p className={`text-xs flex items-center ${/[A-Z]/.test(password) ? 'text-green-400' : 'text-blue-400'}`}>
                    <Check className={`w-3 h-3 mr-2 ${/[A-Z]/.test(password) ? 'text-green-400' : 'text-blue-400'}`} />
                    Uppercase letter (recommended)
                  </p>
                  <p className={`text-xs flex items-center ${/[0-9]/.test(password) ? 'text-green-400' : 'text-blue-400'}`}>
                    <Check className={`w-3 h-3 mr-2 ${/[0-9]/.test(password) ? 'text-green-400' : 'text-blue-400'}`} />
                    Number (recommended)
                  </p>
                  <p className={`text-xs flex items-center ${/[^A-Za-z0-9]/.test(password) ? 'text-green-400' : 'text-blue-400'}`}>
                    <Check className={`w-3 h-3 mr-2 ${/[^A-Za-z0-9]/.test(password) ? 'text-green-400' : 'text-blue-400'}`} />
                    Special character (recommended)
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || password !== confirmPassword || password.length < 6}
                className="btn-3d w-full py-4 rounded-xl text-white font-bold text-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  'Reset Password'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="inline-flex items-center text-blue-300 hover:text-white transition-colors font-medium"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResetPassword
