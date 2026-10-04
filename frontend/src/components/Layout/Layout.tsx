import ThemeToggle from '../UI/ThemeToggle'
import { loadDeploymentSettings, saveDeploymentSettings } from '../../utils/secretStore'
import React, { useState, useRef, useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import {
  LogOut,
  Menu,
  X,
  ChevronDown,
  User,
  Camera,
  Edit3,
  Crown,
  ShieldCheck,
} from 'lucide-react'
import Sidebar from './Sidebar'

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const [profileModalOpen, setProfileModalOpen] = useState(false)
  const [subscriptionPopupOpen, setSubscriptionPopupOpen] = useState(false)
  const [upgradeInfo, setUpgradeInfo] = useState<{ message?: string } | null>(null)

  useEffect(() => {
    const onUpgrade = (e: Event) => setUpgradeInfo((e as CustomEvent).detail || {})
    window.addEventListener('upgrade-required', onUpgrade)
    return () => window.removeEventListener('upgrade-required', onUpgrade)
  }, [])
  const [profileData, setProfileData] = useState({
    username: '',
    email: '',
    profilePicture: '',
    workExperience: '',
    domains: [] as string[]
  })
  const [deploymentSettings, setDeploymentSettings] = useState({
    githubToken: '',
    publicIpv4Address: '',
    instanceId: '',
    pemKeyContent: '',
    dockerHubUsername: '',
    dockerHubToken: '',
    projectName: 'InfraPilot',
    deploymentScope: 'both' as 'both' | 'frontend' | 'backend',
    domainName: '',
    enableSSL: false,
    ec2Username: 'ubuntu'
  })
  const [uploading, setUploading] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [pemFileName, setPemFileName] = useState('')
  const { user, logout, refreshUser } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const profileDropdownRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pemFileInputRef = useRef<HTMLInputElement>(null)

  // Refresh user profile when component mounts to get latest subscription status
  useEffect(() => {
    refreshUser()
  }, [])

  // Check for expired trial and show subscription popup
  useEffect(() => {
    // Don't show popup on payment page
    if (location.pathname === '/payment') {
      setSubscriptionPopupOpen(false)
      return
    }

    if (user?.subscription?.type === 'trial' && user?.subscription?.trialEndDate) {
      const now = new Date()
      const trialEndDate = new Date(user.subscription.trialEndDate)
      if (now > trialEndDate) {
        // Trial has expired, show popup
        setSubscriptionPopupOpen(true)
      }
    }
  }, [user, location.pathname])

  const handleLogout = () => {
    logout()
    navigate('/login')
    toast.success('Logged out successfully')
  }

  const handleProfileSettings = () => {
    setProfileDropdownOpen(false)
    setProfileData({
      username: user?.username || '',
      email: user?.email || '',
      profilePicture: user?.profilePicture || '',
      workExperience: (user as any)?.workExperience || '',
      domains: (user as any)?.domains || []
    })

    try {
      const parsedSettings = loadDeploymentSettings()
      if (Object.keys(parsedSettings).length > 0) {
        setDeploymentSettings({
          githubToken: parsedSettings.githubToken || '',
          publicIpv4Address: parsedSettings.publicIpv4Address || '',
          instanceId: parsedSettings.instanceId || '',
          pemKeyContent: parsedSettings.pemKeyContent || '',
          dockerHubUsername: parsedSettings.dockerHubUsername || '',
          dockerHubToken: parsedSettings.dockerHubToken || '',
          projectName: parsedSettings.projectName || 'InfraPilot',
          deploymentScope: parsedSettings.deploymentScope || 'both',
          domainName: parsedSettings.domainName || '',
          enableSSL: Boolean(parsedSettings.enableSSL),
          ec2Username: parsedSettings.ec2Username || 'ubuntu'
        })
        setPemFileName(parsedSettings.pemFileName || '')
      } else {
        setDeploymentSettings({
          githubToken: '',
          publicIpv4Address: '',
          instanceId: '',
          pemKeyContent: '',
          dockerHubUsername: '',
          dockerHubToken: '',
          projectName: 'InfraPilot',
          deploymentScope: 'both',
          domainName: '',
          enableSSL: false,
          ec2Username: 'ubuntu'
        })
        setPemFileName('')
      }
    } catch (error) {
      console.error('Failed to load saved deployment settings', error)
    }

    setProfileModalOpen(true)
  }

  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Profile picture must be less than 5MB')
      return
    }

    setUploading(true)
    try {
      const reader = new FileReader()
      reader.onload = (e) => {
        setProfileData(prev => ({
          ...prev,
          profilePicture: e.target?.result as string
        }))
        toast.success('Profile picture uploaded successfully')
      }
      reader.readAsDataURL(file)
    } catch (error) {
      toast.error('Failed to upload profile picture')
    } finally {
      setUploading(false)
    }
  }

  const handlePemFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const reader = new FileReader()
      reader.onload = () => {
        const content = reader.result as string
        setDeploymentSettings(prev => ({ ...prev, pemKeyContent: content }))
        setPemFileName(file.name)
        toast.success('PEM key loaded successfully')
      }
      reader.onerror = () => {
        toast.error('Failed to read PEM file')
      }
      reader.readAsText(file)
    } catch (error) {
      toast.error('Failed to load PEM file')
    }
  }

  const handleProfileUpdate = async () => {
    setUpdating(true)
    try {
      saveDeploymentSettings({
        ...deploymentSettings,
        pemFileName
      })
      localStorage.setItem('infraPilotProfileData', JSON.stringify(profileData))
      toast.success('Profile settings saved successfully')
      setProfileModalOpen(false)
    } catch (error) {
      toast.error('Failed to save profile settings')
    } finally {
      setUpdating(false)
    }
  }

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const isPro = user?.plan?.plan === 'pro'
  const planDays = user?.plan?.daysLeft
  const planLabel = planDays !== null && planDays !== undefined ? `${planDays} days left` : undefined

  const gateProItem = (e: React.MouseEvent, item: { name: string; pro?: boolean }) => {
    if (item.pro && !isPro) {
      e.preventDefault()
      setSidebarOpen(false)
      setUpgradeInfo({ message: `${item.name} is a Pro feature. Subscribe to Pro to unlock it, along with every other Pro tool.` })
    }
  }

  const isAdmin = user?.role === 'admin'

  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-transparent">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-secondary-900/80" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 w-72 bg-white dark:bg-ink-900 shadow-xl">
          <button
            onClick={() => setSidebarOpen(false)}
            className="absolute right-3 top-4 z-10 p-1.5 rounded-lg hover:bg-secondary-100 dark:hover:bg-white/10"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
          <Sidebar isPro={isPro} isAdmin={isAdmin} planLabel={planLabel} onProGate={gateProItem} onNavigate={() => setSidebarOpen(false)} />
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 lg:block">
        <div className="h-full bg-white dark:bg-ink-900/90 dark:backdrop-blur-xl border-r border-secondary-200 dark:border-white/10">
          <Sidebar isPro={isPro} isAdmin={isAdmin} planLabel={planLabel} onProGate={gateProItem} />
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 bg-white/80 dark:bg-ink-950/70 backdrop-blur-xl border-b border-gray-200 dark:border-white/10">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 lg:hidden transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">Hi, {user?.username}</span>
                {isPro && (
                  <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-full shadow-md">
                    <Crown className="w-3 h-3 mr-1" />
                    Pro
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <ThemeToggle />
                {/* Profile Dropdown */}
                <div className="relative" ref={profileDropdownRef}>
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="flex items-center space-x-2 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 group"
                  >
                    <div className="relative">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg group-hover:shadow-xl transition-shadow">
                        {user?.username?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      {user?.role === 'admin' && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full border-2 border-white dark:border-gray-800">
                          <Crown className="w-2 h-2 text-amber-900 m-0.5" />
                        </div>
                      )}
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-600 dark:text-gray-400 transition-transform duration-200 ${
                      profileDropdownOpen ? 'rotate-180' : ''
                    }`} />
                  </button>
                  
                  {/* Dropdown Menu */}
                  {profileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                      {/* User Info Header */}
                      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                            {user?.username?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-900 dark:text-white truncate">
                              {user?.username}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                              {user?.email}
                            </p>
                            <div className="flex items-center space-x-1 mt-1">
                              {user?.role === 'admin' ? (
                                <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 rounded-full">
                                  <Crown className="w-3 h-3 mr-1" />
                                  Admin
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">
                                  <User className="w-3 h-3 mr-1" />
                                  User
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Menu Items */}
                      <div className="py-2">
                        <button
                          onClick={handleProfileSettings}
                          className="w-full flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          <Edit3 className="w-4 h-4 mr-3" />
                          Profile Settings
                        </button>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          <LogOut className="w-4 h-4 mr-3" />
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-4 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* Profile Settings Modal */}
      {profileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Profile Settings</h2>
              <button
                onClick={() => setProfileModalOpen(false)}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Profile Picture */}
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-3xl shadow-xl">
                    {profileData.profilePicture ? (
                      <img 
                        src={profileData.profilePicture} 
                        alt="Profile" 
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      profileData.username?.charAt(0).toUpperCase() || 'U'
                    )}
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {uploading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4" />
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePictureUpload}
                    className="hidden"
                  />
                </div>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Click camera to change photo</p>
              </div>
              
              {/* Form Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={profileData.username}
                    onChange={(e) => setProfileData(prev => ({ ...prev, username: e.target.value }))}
                    className="input"
                    placeholder="Enter username"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                    className="input"
                    placeholder="Enter email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Work Experience
                  </label>
                  <textarea
                    rows={3}
                    value={profileData.workExperience}
                    onChange={(e) => setProfileData(prev => ({ ...prev, workExperience: e.target.value }))}
                    className="input resize-none"
                    placeholder="Tell us about your DevOps experience, previous roles, and projects..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Areas of Expertise
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {profileData.domains.map((domain, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full text-sm"
                      >
                        {domain}
                        <button
                          type="button"
                          onClick={() => setProfileData(prev => ({
                            ...prev,
                            domains: prev.domains.filter((_, i) => i !== index)
                          }))}
                          className="ml-2 text-blue-600 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-100"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900/40">
                  <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-3">Deployment Defaults</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        GitHub Token
                      </label>
                      <input
                        type="password"
                        value={deploymentSettings.githubToken}
                        onChange={(e) => setDeploymentSettings(prev => ({ ...prev, githubToken: e.target.value }))}
                        className="input"
                        placeholder="ghp_xxxxxxxxx"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Public IPv4 Address
                      </label>
                      <input
                        type="text"
                        value={deploymentSettings.publicIpv4Address}
                        onChange={(e) => setDeploymentSettings(prev => ({ ...prev, publicIpv4Address: e.target.value }))}
                        className="input"
                        placeholder="43.205.196.233"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Instance ID
                      </label>
                      <input
                        type="text"
                        value={deploymentSettings.instanceId}
                        onChange={(e) => setDeploymentSettings(prev => ({ ...prev, instanceId: e.target.value }))}
                        className="input"
                        placeholder="i-0123456789abcdef0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        SSH Username
                      </label>
                      <input
                        type="text"
                        value={deploymentSettings.ec2Username}
                        onChange={(e) => setDeploymentSettings(prev => ({ ...prev, ec2Username: e.target.value }))}
                        className="input"
                        placeholder="ubuntu"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        PEM Key File
                      </label>
                      <input
                        ref={pemFileInputRef}
                        type="file"
                        accept=".pem,.key"
                        onChange={handlePemFileUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => pemFileInputRef.current?.click()}
                        className="btn-secondary mb-2"
                      >
                        Upload PEM File
                      </button>
                      {pemFileName && (
                        <p className="text-xs text-green-600 dark:text-green-400">Loaded: {pemFileName}</p>
                      )}
                      {deploymentSettings.pemKeyContent && (
                        <textarea
                          rows={6}
                          value={deploymentSettings.pemKeyContent}
                          onChange={(e) => setDeploymentSettings(prev => ({ ...prev, pemKeyContent: e.target.value }))}
                          className="input mt-2 font-mono text-xs"
                          placeholder="Paste PEM content here"
                        />
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Docker Hub Username
                      </label>
                      <input
                        type="text"
                        value={deploymentSettings.dockerHubUsername}
                        onChange={(e) => setDeploymentSettings(prev => ({ ...prev, dockerHubUsername: e.target.value }))}
                        className="input"
                        placeholder="awsmallick1999"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Docker Hub Token
                      </label>
                      <input
                        type="password"
                        value={deploymentSettings.dockerHubToken}
                        onChange={(e) => setDeploymentSettings(prev => ({ ...prev, dockerHubToken: e.target.value }))}
                        className="input"
                        placeholder="dckr_pat_xxxxxxxxx"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Project Name
                      </label>
                      <input
                        type="text"
                        value={deploymentSettings.projectName}
                        onChange={(e) => setDeploymentSettings(prev => ({ ...prev, projectName: e.target.value }))}
                        className="input"
                        placeholder="InfraPilot"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Domain Name
                      </label>
                      <input
                        type="text"
                        value={deploymentSettings.domainName}
                        onChange={(e) => setDeploymentSettings(prev => ({ ...prev, domainName: e.target.value }))}
                        className="input"
                        placeholder="example.com"
                      />
                    </div>

                    <label className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                      <input
                        type="checkbox"
                        checked={deploymentSettings.enableSSL}
                        onChange={(e) => setDeploymentSettings(prev => ({ ...prev, enableSSL: e.target.checked }))}
                      />
                      <span>Enable SSL by default</span>
                    </label>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                  <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Password cannot be modified here for security reasons
                  </p>
                </div>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setProfileModalOpen(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleProfileUpdate}
                disabled={updating}
                className="btn-primary"
              >
                {updating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Updating...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade prompt: shown when the API says a feature needs Pro (or the Free limit is reached) */}
      {upgradeInfo && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="upgrade-title">
          <div className="bg-white dark:bg-ink-800 border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl max-w-md w-full p-7 text-center">
            <Crown className="w-12 h-12 mx-auto text-amber-500" />
            <h2 id="upgrade-title" className="mt-4 text-2xl font-bold text-slate-900 dark:text-white">Unlock with Pro</h2>
            <p className="mt-2 text-slate-600 dark:text-gray-300">{upgradeInfo.message || 'This feature is part of the Pro plan.'}</p>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setUpgradeInfo(null)} className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-gray-200">Not now</button>
              <button onClick={() => { setUpgradeInfo(null); navigate('/payment') }} className="flex-1 btn-primary">Subscribe now</button>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Popup Modal */}
      {subscriptionPopupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center">Trial Expired</h2>
            </div>
            
            {/* Modal Body */}
            <div className="p-6">
              <div className="text-center mb-6">
                <Crown className="w-16 h-16 text-amber-500 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Your 5-day free trial has expired. To continue accessing premium features, please upgrade to a premium subscription.
                </p>
              </div>
              
              <button
                onClick={() => {
                  setSubscriptionPopupOpen(false)
                  navigate('/payment')
                }}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300"
              >
                Upgrade to Premium
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Layout
