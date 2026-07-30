import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../services/api'
import Header from '../../components/Header/Header'
import toast from 'react-hot-toast'
import { Key, ArrowLeft, Mail, Loader2, CheckCircle } from 'lucide-react'

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email.trim()) {
      toast.error('Please enter your email address')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address')
      return
    }

    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email })
      setEmailSent(true)
      toast.success('If an account exists with this email, a password reset link has been sent.')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to send reset email')
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
            {!emailSent ? (
              <>
                <div className="text-center mb-8">
                  <div className="flex justify-center mb-6">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur-2xl opacity-60 animate-pulse"></div>
                      <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-2xl shadow-2xl transform hover:scale-110 transition-transform duration-300">
                        <Key className="w-12 h-12 text-white" />
                      </div>
                    </div>
                  </div>
                  <h2 className="text-4xl font-black text-white mb-2 tracking-tight">
                    Forgot Password?
                  </h2>
                  <p className="text-lg text-blue-200">
                    No worries, we'll send you reset instructions
                  </p>
                </div>

                <form className="space-y-6" onSubmit={handleSubmit}>
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
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Mail className="w-5 h-5 text-blue-400" />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-3d w-full py-4 rounded-xl text-white font-bold text-lg flex items-center justify-center"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Send Reset Link'
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
              </>
            ) : (
              <>
                <div className="text-center">
                  <div className="flex justify-center mb-6">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full blur-2xl opacity-60 animate-pulse"></div>
                      <div className="relative bg-gradient-to-r from-green-500 to-emerald-600 p-4 rounded-2xl shadow-2xl">
                        <CheckCircle className="w-12 h-12 text-white" />
                      </div>
                    </div>
                  </div>
                  <h2 className="text-3xl font-black text-white mb-2 tracking-tight">
                    Check Your Email
                  </h2>
                  <p className="text-lg text-blue-200 mb-6">
                    We've sent a password reset link to your email
                  </p>

                  <div className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-6 mb-6">
                    <p className="text-blue-200 text-sm mb-2">
                      <strong>{email}</strong>
                    </p>
                    <p className="text-blue-300 text-xs">
                      Click the link in the email to reset your password. The link will expire in 1 hour.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setEmailSent(false)
                      setEmail('')
                    }}
                    className="btn-3d w-full py-4 rounded-xl text-white font-bold text-lg mb-4"
                  >
                    Resend Email
                  </button>

                  <Link
                    to="/login"
                    className="inline-flex items-center text-blue-300 hover:text-white transition-colors font-medium"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Login
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword
