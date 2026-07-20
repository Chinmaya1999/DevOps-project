import React, { useState, useRef } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import {
  GitBranch,
  History,
  LogOut,
  Menu,
  X,
  Home,
  BarChart3,
  Zap,
  Shield,
  Cloud,
  Server,
  Package,
  Database,
  CheckCircle,
  Container,
  Terminal,
  Code,
  FileText,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Settings,
  User,
  Camera,
  Edit3,
  Crown,
  ShieldCheck,
  Github,
  Rocket
} from 'lucide-react'

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [scriptsDropdownOpen, setScriptsDropdownOpen] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const [profileModalOpen, setProfileModalOpen] = useState(false)
  const [profileData, setProfileData] = useState({
    username: '',
    email: '',
    profilePicture: ''
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
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const profileDropdownRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pemFileInputRef = useRef<HTMLInputElement>(null)

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
      profilePicture: user?.profilePicture || ''
    })

    try {
      const savedSettings = localStorage.getItem('infraPilotDeploymentSettings')
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings)
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
      localStorage.setItem('infraPilotDeploymentSettings', JSON.stringify({
        ...deploymentSettings,
        pemFileName
      }))
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

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Vision - One-Click Deploy', href: '/vision', icon: Rocket },
    { name: 'Deployments', href: '/deployments', icon: Server },
    { name: 'GitHub Integration', href: '/github', icon: Github },
    { name: 'Jenkins Pipeline', href: '/generator/jenkins', icon: Server },
    { name: 'GitHub Actions', href: '/generator/github-actions', icon: Zap },
    { name: 'Ansible Playbooks', href: '/generator/ansible', icon: Shield },
    { name: 'Kubernetes YAML', href: '/generator/kubernetes', icon: Cloud },
    { name: 'Terraform IaC', href: '/generator/terraform', icon: Package },
    { name: 'Dockerfile', href: '/generator/dockerfile', icon: Container },
    { name: 'DevOps Documentation', href: '/devops-docs', icon: BookOpen },
    { name: 'Terraform Demos', href: '/terraform-demos', icon: Database },
    { name: 'Validator', href: '/validator', icon: CheckCircle },
    { name: 'History', href: '/history', icon: History },
    
//  { name: 'DevOps Roadmap', href: '/roadmap', icon: Map }
  ]

  const adminNavigation = [
    { name: 'Admin', href: '/admin', icon: Settings },
    
  ]

  const scriptsSubmenu = [
    { name: 'Bash Script', href: '/generator/bash', icon: Terminal },
    { name: 'Shell Script', href: '/generator/shell', icon: Code },
    { name: 'Python Script', href: '/generator/python', icon: FileText },
   
  ]
  

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return location.pathname === '/' || location.pathname === '/dashboard'
    }
    return location.pathname.startsWith(href)
  }

  const isScriptsActive = () => {
    return scriptsSubmenu.some(item => location.pathname.startsWith(item.href))
  }

  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-secondary-900">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-secondary-900/80" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-secondary-800 shadow-xl">
          <div className="flex items-center justify-between p-4 border-b border-secondary-200 dark:border-secondary-700">
            <div className="flex items-center">
              <GitBranch className="w-8 h-8 text-primary-600" />
              <span className="ml-2 text-xl font-bold text-secondary-900 dark:text-secondary-100">
                DevOps Gen
              </span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-200px)]">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`sidebar-item ${
                    isActive(item.href) ? 'sidebar-item-active' : 'sidebar-item-inactive'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              )
            })}
            
            {/* Admin Menu - Only show for admin users */}
            {user?.role === 'admin' && (
              <div className="space-y-1">
                {adminNavigation.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`sidebar-item ${
                        isActive(item.href) ? 'sidebar-item-active' : 'sidebar-item-inactive'
                      }`}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <Icon className="w-5 h-5 mr-3" />
                      {item.name}
                    </Link>
                  )
                })}
              </div>
            )}
            
            {/* Scripts Dropdown */}
            <div className="space-y-1">
              <button
                onClick={() => setScriptsDropdownOpen(!scriptsDropdownOpen)}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isScriptsActive() 
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300' 
                    : 'text-secondary-600 hover:bg-secondary-100 dark:text-secondary-400 dark:hover:bg-secondary-700'
                }`}
              >
                <Code className="w-5 h-5 mr-3" />
                Scripts
                {scriptsDropdownOpen ? (
                  <ChevronDown className="w-4 h-4 ml-auto" />
                ) : (
                  <ChevronRight className="w-4 h-4 ml-auto" />
                )}
              </button>
              
              {scriptsDropdownOpen && (
                <div className="ml-8 space-y-1">
                  {scriptsSubmenu.map((item) => {
                    const Icon = item.icon
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={`sidebar-item ${
                          isActive(item.href) ? 'sidebar-item-active' : 'sidebar-item-inactive'
                        }`}
                        onClick={() => setSidebarOpen(false)}
                      >
                        <Icon className="w-4 h-4 mr-3" />
                        {item.name}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 lg:block">
        <div className="h-full bg-white dark:bg-secondary-800 border-r border-secondary-200 dark:border-secondary-700">
          <div className="flex items-center p-6 border-b border-secondary-200 dark:border-secondary-700">
            <GitBranch className="w-8 h-8 text-primary-600" />
            <span className="ml-2 text-xl font-bold text-secondary-900 dark:text-secondary-100">
              InfraPilot.       
            </span>
          </div>
          <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-200px)]">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`sidebar-item ${
                    isActive(item.href) ? 'sidebar-item-active' : 'sidebar-item-inactive'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              )
            })}
            
            {/* Admin Menu - Only show for admin users */}
            {user?.role === 'admin' && (
              <div className="space-y-1">
                {adminNavigation.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`sidebar-item ${
                        isActive(item.href) ? 'sidebar-item-active' : 'sidebar-item-inactive'
                      }`}
                    >
                      <Icon className="w-5 h-5 mr-3" />
                      {item.name}
                    </Link>
                  )
                })}
              </div>
            )}
            
            {/* Scripts Dropdown */}
            <div className="space-y-1">
              <button
                onClick={() => setScriptsDropdownOpen(!scriptsDropdownOpen)}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isScriptsActive() 
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300' 
                    : 'text-secondary-600 hover:bg-secondary-100 dark:text-secondary-400 dark:hover:bg-secondary-700'
                }`}
              >
                <Code className="w-5 h-5 mr-3" />
                Scripts
                {scriptsDropdownOpen ? (
                  <ChevronDown className="w-4 h-4 ml-auto" />
                ) : (
                  <ChevronRight className="w-4 h-4 ml-auto" />
                )}
              </button>
              
              {scriptsDropdownOpen && (
                <div className="ml-8 space-y-1">
                  {scriptsSubmenu.map((item) => {
                    const Icon = item.icon
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={`sidebar-item ${
                          isActive(item.href) ? 'sidebar-item-active' : 'sidebar-item-inactive'
                        }`}
                      >
                        <Icon className="w-4 h-4 mr-3" />
                        {item.name}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 lg:hidden transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <BarChart3 className="w-4 h-4 text-blue-500" />
                <span className="font-medium">Welcome back, {user?.username}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Dashboard"
                >
                  <Home className="w-5 h-5" />
                </button>
                
                <button
                  onClick={() => navigate('/history')}
                  className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="History"
                >
                  <History className="w-5 h-5" />
                </button>
                
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
    </div>
  )
}

export default Layout
