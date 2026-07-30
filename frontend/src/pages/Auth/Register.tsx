import React, { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Header from '../../components/Header/Header'
import toast from 'react-hot-toast'
import { GitBranch, Eye, EyeOff, Loader2, ArrowRight, CheckCircle, XCircle, User, Mail, Lock, Briefcase, Server, Cloud, Shield, Zap, RefreshCw, Search, ChevronDown, X } from 'lucide-react'
import api from '../../services/api'

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    workExperience: '',
    domains: [] as string[]
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<'google' | 'github' | null>(null)
  const [validation, setValidation] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    workExperience: ''
  })
  const [showOTPSection, setShowOTPSection] = useState(false)
  const [otp, setOtp] = useState('')
  const [otpLoading, setOtpLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState('')
  const [domainDropdownOpen, setDomainDropdownOpen] = useState(false)
  const [domainSearch, setDomainSearch] = useState('')
  const { register, user } = useAuth()

  const domainOptions = [
    'DevOps',
    'Cloud Computing (AWS/Azure/GCP)',
    'CI/CD',
    'Kubernetes',
    'Docker',
    'Terraform',
    'Ansible',
    'Jenkins',
    'GitHub Actions',
    'Linux/Unix',
    'Networking',
    'Security',
    'Monitoring & Observability',
    'Database Administration',
    'Machine Learning/MLOps'
  ]

  const workExperienceOptions = [
    'Less than 1 year',
    '1-2 years',
    '2-3 years',
    '3-5 years',
    '5-10 years',
    '10+ years'
  ]

  const handleDomainToggle = (domain: string) => {
    setFormData(prev => ({
      ...prev,
      domains: prev.domains.includes(domain)
        ? prev.domains.filter(d => d !== domain)
        : [...prev.domains, domain]
    }))
  }

  const filteredDomains = domainOptions.filter(domain =>
    domain.toLowerCase().includes(domainSearch.toLowerCase())
  )

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  const handleGoogleSignUp = async () => {
    setOauthLoading('google')
    try {
      // Integrate your Google OAuth here
      toast.success('Google sign-up coming soon!')
      // window.location.href = '/api/auth/google'
    } catch (error: any) {
      toast.error(error.message || 'Google sign-up failed')
    } finally {
      setOauthLoading(null)
    }
  }

  const handleGithubSignUp = async () => {
    setOauthLoading('github')
    try {
      // Integrate your GitHub OAuth here
      toast.success('GitHub sign-up coming soon!')
      // window.location.href = '/api/auth/github'
    } catch (error: any) {
      toast.error(error.message || 'GitHub sign-up failed')
    } finally {
      setOauthLoading(null)
    }
  }

  const validateField = (name: string, value: string) => {
    let error = ''
    
    switch (name) {
      case 'username':
        if (value.length < 3) {
          error = 'Username must be at least 3 characters'
        } else if (!/^[a-zA-Z0-9_]+$/.test(value)) {
          error = 'Username can only contain letters, numbers, and underscores'
        }
        break
      case 'email':
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = 'Please enter a valid email address'
        }
        break
      case 'password':
        if (value.length < 8) {
          error = 'Password must be at least 8 characters'
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
          error = 'Password must contain uppercase, lowercase, and number'
        }
        break
      case 'confirmPassword':
        if (value !== formData.password) {
          error = 'Passwords do not match'
        }
        break
      case 'workExperience':
        if (!value) {
          error = 'Please select your work experience'
        }
        break
    }
    
    setValidation(prev => ({ ...prev, [name]: error }))
    return error === ''
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    validateField(name, value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate all fields
    const isUsernameValid = validateField('username', formData.username)
    const isEmailValid = validateField('email', formData.email)
    const isPasswordValid = validateField('password', formData.password)
    const isConfirmPasswordValid = validateField('confirmPassword', formData.confirmPassword)
    const isWorkExperienceValid = validateField('workExperience', formData.workExperience)
    
    if (!isUsernameValid || !isEmailValid || !isPasswordValid || !isConfirmPasswordValid || !isWorkExperienceValid) {
      toast.error('Please fix all validation errors')
      return
    }

    setLoading(true)

    try {
      await register(formData.username, formData.email, formData.password, formData.workExperience, formData.domains)
      setRegisteredEmail(formData.email)
      setShowOTPSection(true)
      toast.success('Registration successful! Please check your email for OTP.')
    } catch (error: any) {
      toast.error(error.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const handleOTPVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!otp || otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP')
      return
    }

    setOtpLoading(true)

    try {
      await api.post('/auth/verify-otp', { email: registeredEmail, otp })
      toast.success('Email verified successfully! You can now login.')
      setShowOTPSection(false)
      // Redirect to login page
      window.location.href = '/login'
    } catch (error: any) {
      toast.error(error.response?.data?.error || error.message || 'OTP verification failed')
    } finally {
      setOtpLoading(false)
    }
  }

  const handleResendOTP = async () => {
    setResendLoading(true)

    try {
      await api.post('/auth/resend-otp', { email: registeredEmail })
      toast.success('New OTP sent to your email')
    } catch (error: any) {
      toast.error(error.response?.data?.error || error.message || 'Failed to resend OTP')
    } finally {
      setResendLoading(false)
    }
  }

  const getPasswordStrength = (password: string) => {
    if (password.length === 0) return { strength: 0, color: 'bg-gray-300', text: '' }
    if (password.length < 6) return { strength: 1, color: 'bg-red-500', text: 'Weak' }
    if (password.length < 8) return { strength: 2, color: 'bg-orange-500', text: 'Fair' }
    if (/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) return { strength: 4, color: 'bg-green-500', text: 'Strong' }
    return { strength: 3, color: 'bg-yellow-500', text: 'Good' }
  }

  const passwordStrength = getPasswordStrength(formData.password)

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
      
      <div className="flex-1 flex items-center justify-center relative px-4 py-8">
        <div className="max-w-2xl w-full">
          {/* 3D Glass Card */}
          <div className="glass-card-3d p-10 rounded-3xl">
            {showOTPSection ? (
              <div className="text-center">
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur-2xl opacity-60 animate-pulse"></div>
                    <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-2xl shadow-2xl">
                      <Lock className="w-12 h-12 text-white" />
                    </div>
                  </div>
                </div>
                <h2 className="text-4xl font-black text-white mb-2 tracking-tight">
                  Verify Your Email
                </h2>
                <p className="text-lg text-blue-200 mb-8">
                  Enter the 6-digit OTP sent to {registeredEmail}
                </p>

                <form onSubmit={handleOTPVerification} className="space-y-5">
                  <div>
                    <label htmlFor="otp" className="block text-sm font-bold text-blue-200 mb-2">
                      One-Time Password (OTP)
                    </label>
                    <input
                      id="otp"
                      type="text"
                      maxLength={6}
                      className="input-3d w-full px-4 py-3 rounded-xl text-white text-center text-2xl tracking-widest placeholder-blue-300/50 focus:outline-none"
                      placeholder="000000"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={otpLoading}
                    className="btn-3d w-full py-4 rounded-xl text-white font-bold text-lg flex items-center justify-center"
                  >
                    {otpLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        Verify OTP
                        <ArrowRight className="ml-3 w-5 h-5" />
                      </>
                    )}
                  </button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={handleResendOTP}
                      disabled={resendLoading}
                      className="text-blue-300 hover:text-white transition-colors flex items-center justify-center mx-auto"
                    >
                      {resendLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Resend OTP
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <>
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
                    Create Account
                  </h2>
                  <p className="text-lg text-blue-200">
                    Join the AutoDevOps Platform community
                  </p>
                </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="username" className="block text-sm font-bold text-blue-200 mb-2">
                  Username
                </label>
                <div className="relative">
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    className={`input-3d w-full px-4 py-3 pl-12 rounded-xl text-white placeholder-blue-300/50 focus:outline-none ${validation.username ? 'border-red-500' : ''}`}
                    placeholder="Choose a username"
                    value={formData.username}
                    onChange={handleChange}
                  />
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                    {formData.username && (
                      validation.username ? (
                        <XCircle className="w-5 h-5 text-red-500" />
                      ) : (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      )
                    )}
                  </div>
                </div>
                {validation.username && (
                  <p className="mt-1 text-xs text-red-500">{validation.username}</p>
                )}
              </div>

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
                    className={`input-3d w-full px-4 py-3 pl-12 rounded-xl text-white placeholder-blue-300/50 focus:outline-none ${validation.email ? 'border-red-500' : ''}`}
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                  />
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                    {formData.email && (
                      validation.email ? (
                        <XCircle className="w-5 h-5 text-red-500" />
                      ) : (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      )
                    )}
                  </div>
                </div>
                {validation.email && (
                  <p className="mt-1 text-xs text-red-500">{validation.email}</p>
                )}
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
                    required
                    className={`input-3d w-full px-4 py-3 pl-12 pr-12 rounded-xl text-white placeholder-blue-300/50 focus:outline-none ${validation.password ? 'border-red-500' : ''}`}
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={handleChange}
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
                {formData.password && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-blue-300">Password strength</span>
                      <span className={`text-xs font-medium ${
                        passwordStrength.strength >= 3 ? 'text-green-400' : 
                        passwordStrength.strength >= 2 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {passwordStrength.text}
                      </span>
                    </div>
                    <div className="w-full bg-blue-900/50 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                        style={{ width: `${(passwordStrength.strength / 4) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                {validation.password && (
                  <p className="mt-1 text-xs text-red-500">{validation.password}</p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-bold text-blue-200 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    className={`input-3d w-full px-4 py-3 pl-12 pr-12 rounded-xl text-white placeholder-blue-300/50 focus:outline-none ${validation.confirmPassword ? 'border-red-500' : ''}`}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-blue-400" />
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
                {validation.confirmPassword && (
                  <p className="mt-1 text-xs text-red-500">{validation.confirmPassword}</p>
                )}
              </div>

              <div>
                <label htmlFor="workExperience" className="block text-sm font-bold text-blue-200 mb-2">
                  <Briefcase className="w-4 h-4 inline mr-1" />
                  Work Experience
                </label>
                <select
                  id="workExperience"
                  name="workExperience"
                  className={`input-3d w-full px-4 py-3 rounded-xl text-white focus:outline-none ${validation.workExperience ? 'border-red-500' : ''}`}
                  value={formData.workExperience}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, workExperience: e.target.value }))
                    validateField('workExperience', e.target.value)
                  }}
                >
                  <option value="" className="bg-slate-800 text-blue-300">Select your experience level</option>
                  {workExperienceOptions.map((option) => (
                    <option key={option} value={option} className="bg-slate-800 text-white">
                      {option}
                    </option>
                  ))}
                </select>
                {validation.workExperience && (
                  <p className="mt-1 text-xs text-red-500">{validation.workExperience}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-blue-200 mb-3">
                  <Server className="w-4 h-4 inline mr-1" />
                  Areas of Expertise (Select all that apply)
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setDomainDropdownOpen(!domainDropdownOpen)}
                    className="input-3d w-full px-4 py-3 rounded-xl text-white text-left focus:outline-none flex items-center justify-between"
                  >
                    <span className={formData.domains.length > 0 ? 'text-white' : 'text-blue-300/50'}>
                      {formData.domains.length > 0 
                        ? `${formData.domains.length} domain${formData.domains.length > 1 ? 's' : ''} selected`
                        : 'Select areas of expertise'
                      }
                    </span>
                    <ChevronDown className={`w-5 h-5 text-blue-400 transition-transform duration-300 ${domainDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {domainDropdownOpen && (
                    <div className="absolute z-10 w-full mt-2 bg-slate-800/95 backdrop-blur-lg border border-blue-500/30 rounded-xl shadow-2xl overflow-hidden">
                      <div className="p-3 border-b border-blue-500/20">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-400" />
                          <input
                            type="text"
                            placeholder="Search domains..."
                            value={domainSearch}
                            onChange={(e) => setDomainSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-blue-500/30 rounded-lg text-white placeholder-blue-300/50 focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>
                      <div className="max-h-48 overflow-y-auto p-2">
                        {filteredDomains.length > 0 ? (
                          filteredDomains.map((domain) => (
                            <button
                              key={domain}
                              type="button"
                              onClick={() => handleDomainToggle(domain)}
                              className={`w-full px-3 py-2 text-left rounded-lg transition-all duration-200 flex items-center justify-between ${
                                formData.domains.includes(domain)
                                  ? 'bg-blue-500/20 border border-blue-500 text-blue-300'
                                  : 'bg-white/5 border border-transparent text-blue-200 hover:bg-white/10'
                              }`}
                            >
                              <span className="text-sm">{domain}</span>
                              {formData.domains.includes(domain) && (
                                <CheckCircle className="w-4 h-4 text-blue-400" />
                              )}
                            </button>
                          ))
                        ) : (
                          <div className="text-center py-4 text-blue-300/50 text-sm">
                            No domains found
                          </div>
                        )}
                      </div>
                      {formData.domains.length > 0 && (
                        <div className="p-2 border-t border-blue-500/20">
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, domains: [] }))}
                            className="w-full px-3 py-2 text-sm text-red-400 hover:text-red-300 transition-colors flex items-center justify-center"
                          >
                            <X className="w-4 h-4 mr-2" />
                            Clear all selections
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {formData.domains.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {formData.domains.map((domain) => (
                      <span
                        key={domain}
                        className="inline-flex items-center px-2 py-1 text-xs bg-blue-500/20 border border-blue-500/50 rounded-md text-blue-300"
                      >
                        {domain}
                        <button
                          type="button"
                          onClick={() => handleDomainToggle(domain)}
                          className="ml-1 hover:text-white"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  required
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <label htmlFor="terms" className="ml-2 text-sm text-blue-200">
                  I agree to the{' '}
                  <a href="#" className="font-medium text-blue-300 hover:text-white transition-colors">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="#" className="font-medium text-blue-300 hover:text-white transition-colors">
                    Privacy Policy
                  </a>
                </label>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading || Object.values(validation).some(v => v !== '')}
                  className="btn-3d w-full py-4 rounded-xl text-white font-bold text-lg flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      Create Account
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
                    Or sign up with
                  </span>
                </div>
              </div>

              {/* OAuth Buttons */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={handleGoogleSignUp}
                  disabled={oauthLoading !== null}
                  className="flex items-center justify-center px-4 py-3 bg-white/10 backdrop-blur border border-white/20 rounded-xl hover:bg-white/20 focus:outline-none focus:ring-4 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
                >
                  {oauthLoading === 'google' ? (
                    <Loader2 className="w-5 h-5 animate-spin text-white" />
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      <span className="text-sm font-medium text-white">Google</span>
                    </>
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={handleGithubSignUp}
                  disabled={oauthLoading !== null}
                  className="flex items-center justify-center px-4 py-3 bg-white/10 backdrop-blur border border-white/20 rounded-xl hover:bg-white/20 focus:outline-none focus:ring-4 focus:ring-gray-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
                >
                  {oauthLoading === 'github' ? (
                    <Loader2 className="w-5 h-5 animate-spin text-white" />
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                      </svg>
                      <span className="text-sm font-medium text-white">GitHub</span>
                    </>
                  )}
                </button>
              </div>

              <div className="text-center">
                <span className="text-blue-200">
                  Already have an account?{' '}
                  <Link
                    to="/login"
                    className="font-bold text-white hover:text-blue-300 transition-all"
                  >
                    Sign in now
                  </Link>
                </span>
              </div>
            </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register
