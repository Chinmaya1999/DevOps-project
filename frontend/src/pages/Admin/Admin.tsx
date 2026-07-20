import React, { useState, useEffect } from 'react'
import { 
  Save, 
  Plus, 
  Edit, 
  Trash2, 
  FileText, 
  Settings,
  BarChart3,
  BookOpen,
  Tag,
  User,
  Globe,
  Users,
  Mail,
  Crown,
  Search,
  Calendar,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  X
} from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '../../services/api'

interface AppUser {
  _id: string
  username: string
  email: string
  role: 'user' | 'admin'
  isActive: boolean
  lastLogin?: string
  createdAt: string
  profilePicture?: string
}

interface UserManagementStats {
  totalUsers: number
  activeUsers: number
  adminUsers: number
  newUsersThisMonth: number
  recentRegistrations: AppUser[]
}

interface DevOpsDoc {
  _id?: string
  technology: string
  title: string
  description: string
  content: string
  category: string
  version: string
  tags: string[]
  difficulty: string
  estimatedTime: string
  prerequisites: string[]
  author: string
  isActive: boolean
  lastUpdated?: string
}

interface DashboardStats {
  totalDocs: number
  activeDocs: number
  totalCategories: number
  totalTechnologies: number
  recentUpdates: Array<{
    technology: string
    title: string
    lastUpdated: string
  }>
}

interface TerraformTemplate {
  _id?: string
  subjectName: string
  description: string
  yamlContent: string
  category: string
  provider: string
  tags: string[]
  difficulty: string
  estimatedTime: string
  prerequisites: string[]
  author: string
  isActive: boolean
  lastUpdated?: string
}

interface TerraformDashboardStats {
  totalTemplates: number
  activeTemplates: number
  totalCategories: number
  totalProviders: number
  recentUpdates: Array<{
    subjectName: string
    description: string
    lastUpdated: string
  }>
}

const Admin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'docs' | 'create' | 'terraform' | 'users'>('dashboard')
  const [users, setUsers] = useState<AppUser[]>([])
  const [userStats, setUserStats] = useState<UserManagementStats | null>(null)
  const [editingUser, setEditingUser] = useState<AppUser | null>(null)
  const [userModalOpen, setUserModalOpen] = useState(false)
  const [userSearchTerm, setUserSearchTerm] = useState('')
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'user' | 'admin'>('all')
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [showPassword, setShowPassword] = useState(false)
  const [userFormData, setUserFormData] = useState({
    username: '',
    email: '',
    role: 'user' as 'user' | 'admin',
    password: '',
    isActive: true
  })
  const [docs, setDocs] = useState<DevOpsDoc[]>([])
  const [terraformTemplates, setTerraformTemplates] = useState<TerraformTemplate[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [terraformStats, setTerraformStats] = useState<TerraformDashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingDoc, setEditingDoc] = useState<DevOpsDoc | null>(null)
  const [editingTemplate, setEditingTemplate] = useState<TerraformTemplate | null>(null)
  const [formData, setFormData] = useState<DevOpsDoc>({
    technology: '',
    title: '',
    description: '',
    content: '',
    category: 'other',
    version: '1.0.0',
    tags: [],
    difficulty: 'intermediate',
    estimatedTime: '30 minutes',
    prerequisites: [],
    author: 'Admin',
    isActive: true
  })
  const [templateFormData, setTemplateFormData] = useState<TerraformTemplate>({
    subjectName: '',
    description: '',
    yamlContent: '',
    category: 'other',
    provider: 'generic',
    tags: [],
    difficulty: 'intermediate',
    estimatedTime: '15 minutes',
    prerequisites: [],
    author: 'Admin',
    isActive: true
  })

  const categories = [
    { value: 'cicd', label: 'CI/CD' },
    { value: 'containerization', label: 'Containerization' },
    { value: 'orchestration', label: 'Orchestration' },
    { value: 'iac', label: 'Infrastructure as Code' },
    { value: 'monitoring', label: 'Monitoring' },
    { value: 'security', label: 'Security' },
    { value: 'other', label: 'Other' }
  ]

  const terraformCategories = [
    { value: 'networking', label: 'Networking' },
    { value: 'compute', label: 'Compute' },
    { value: 'storage', label: 'Storage' },
    { value: 'security', label: 'Security' },
    { value: 'database', label: 'Database' },
    { value: 'monitoring', label: 'Monitoring' },
    { value: 'other', label: 'Other' }
  ]

  const terraformProviders = [
    { value: 'aws', label: 'AWS' },
    { value: 'azure', label: 'Azure' },
    { value: 'gcp', label: 'Google Cloud' },
    { value: 'generic', label: 'Generic' },
    { value: 'other', label: 'Other' }
  ]

  const difficulties = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' }
  ]

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchDashboardStats()
      fetchUserStats()
    } else if (activeTab === 'docs') {
      fetchDocs()
    } else if (activeTab === 'terraform') {
      fetchTerraformTemplates()
      fetchTerraformDashboardStats()
    } else if (activeTab === 'users') {
      fetchUsers()
      fetchUserStats()
    }
    setLoading(false)
  }, [activeTab])

  const fetchUserStats = async () => {
    try {
      const response = await api.get('/admin/users/stats')
      if (response.data.success) {
        setUserStats(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching user stats:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users')
      if (response.data.success) {
        setUsers(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingUser 
        ? `/admin/users/${editingUser._id}`
        : '/admin/users'
      
      const method = editingUser ? 'put' : 'post'
      const data = editingUser ? {
        username: userFormData.username,
        email: userFormData.email,
        role: userFormData.role,
        isActive: userFormData.isActive
      } : userFormData
      
      const response = await api[method](url, data)
      
      if (response.data.success) {
        toast.success(editingUser ? 'User updated successfully!' : 'User created successfully!')
        setUserModalOpen(false)
        setEditingUser(null)
        setUserFormData({
          username: '',
          email: '',
          role: 'user',
          password: '',
          isActive: true
        })
        fetchUsers()
        fetchUserStats()
      } else {
        toast.error('Error: ' + (response.data.error || 'Unknown error occurred'))
      }
    } catch (error: any) {
      console.error('Error saving user:', error)
      toast.error('Error saving user: ' + (error.response?.data?.error || 'Unknown error'))
    }
  }

  const handleUserEdit = (user: AppUser) => {
    setEditingUser(user)
    setUserFormData({
      username: user.username,
      email: user.email,
      role: user.role,
      password: '',
      isActive: user.isActive
    })
    setUserModalOpen(true)
  }

  const handleUserDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return
    }

    try {
      const response = await api.delete(`/admin/users/${id}`)
      
      if (response.data.success) {
        toast.success('User deleted successfully!')
        fetchUsers()
        fetchUserStats()
      } else {
        toast.error('Error: ' + (response.data.error || 'Unknown error occurred'))
      }
    } catch (error: any) {
      console.error('Error deleting user:', error)
      toast.error('Error deleting user: ' + (error.response?.data?.error || 'Unknown error'))
    }
  }

  const handleUserStatusToggle = async (id: string, isActive: boolean) => {
    try {
      const response = await api.put(`/admin/users/${id}`, { isActive })
      
      if (response.data.success) {
        toast.success(`User ${isActive ? 'activated' : 'deactivated'} successfully!`)
        fetchUsers()
        fetchUserStats()
      } else {
        toast.error('Error: ' + (response.data.error || 'Unknown error occurred'))
      }
    } catch (error: any) {
      console.error('Error updating user status:', error)
      toast.error('Error updating user status: ' + (error.response?.data?.error || 'Unknown error'))
    }
  }

  const filteredUsers = (users || []).filter(user => {
    if (!user || !user.username || !user.email) return false;
    const matchesSearch = user.username.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                          user.email.toLowerCase().includes(userSearchTerm.toLowerCase())
    const matchesRole = userRoleFilter === 'all' || user.role === userRoleFilter
    const matchesStatus = userStatusFilter === 'all' || 
                        (userStatusFilter === 'active' && user.isActive) ||
                        (userStatusFilter === 'inactive' && !user.isActive)
    
    return matchesSearch && matchesRole && matchesStatus
  })

  const fetchDashboardStats = async () => {
    try {
      const response = await api.get('/admin/dashboard')
      if (response.data.success) {
        setStats(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    }
  }

  const fetchDocs = async () => {
    try {
      const response = await api.get('/admin/docs')
      if (response.data.success) {
        setDocs(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching docs:', error)
    }
  }

  const fetchTerraformTemplates = async () => {
    try {
      const response = await api.get('/terraform-templates')
      if (response.data.success) {
        setTerraformTemplates(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching terraform templates:', error)
    }
  }

  const fetchTerraformDashboardStats = async () => {
    try {
      const response = await api.get('/terraform-templates/admin/dashboard')
      if (response.data.success) {
        setTerraformStats(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching terraform dashboard stats:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingDoc 
        ? `/admin/docs/${editingDoc._id}`
        : '/admin/docs'
      
      const method = editingDoc ? 'put' : 'post'
      
      const response = await api[method](url, formData)
      
      if (response.data.success) {
        alert(editingDoc ? 'Documentation updated successfully!' : 'Documentation created successfully!')
        setFormData({
          technology: '',
          title: '',
          description: '',
          content: '',
          category: 'other',
          version: '1.0.0',
          tags: [],
          difficulty: 'intermediate',
          estimatedTime: '30 minutes',
          prerequisites: [],
          author: 'Admin',
          isActive: true
        })
        setEditingDoc(null)
        setActiveTab('docs')
        fetchDocs()
      } else {
        alert('Error: ' + (response.data.error || 'Unknown error occurred'))
      }
    } catch (error: any) {
      console.error('Error saving doc:', error)
      alert('Error saving documentation: ' + (error.response?.data?.error || 'Unknown error'))
    }
  }

  const handleEdit = (doc: DevOpsDoc) => {
    setEditingDoc(doc)
    setFormData(doc)
    setActiveTab('create')
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this documentation?')) {
      return
    }

    try {
      const response = await api.delete(`/admin/docs/${id}`)
      
      if (response.data.success) {
        alert('Documentation deleted successfully!')
        fetchDocs()
      } else {
        alert('Error: ' + (response.data.error || 'Unknown error occurred'))
      }
    } catch (error: any) {
      console.error('Error deleting doc:', error)
      alert('Error deleting documentation: ' + (error.response?.data?.error || 'Unknown error'))
    }
  }

  const handleTemplateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingTemplate 
        ? `/terraform-templates/${editingTemplate._id}`
        : '/terraform-templates'
      
      const method = editingTemplate ? 'put' : 'post'
      
      const response = await api[method](url, templateFormData)
      
      if (response.data.success) {
        alert(editingTemplate ? 'Terraform template updated successfully!' : 'Terraform template created successfully!')
        setTemplateFormData({
          subjectName: '',
          description: '',
          yamlContent: '',
          category: 'other',
          provider: 'generic',
          tags: [],
          difficulty: 'intermediate',
          estimatedTime: '15 minutes',
          prerequisites: [],
          author: 'Admin',
          isActive: true
        })
        setEditingTemplate(null)
        setActiveTab('terraform')
        fetchTerraformTemplates()
      } else {
        alert('Error: ' + (response.data.error || 'Unknown error occurred'))
      }
    } catch (error: any) {
      console.error('Error saving template:', error)
      alert('Error saving terraform template: ' + (error.response?.data?.error || 'Unknown error'))
    }
  }

  const handleTemplateEdit = (template: TerraformTemplate) => {
    setEditingTemplate(template)
    setTemplateFormData(template)
    setActiveTab('terraform')
  }

  const handleTemplateDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this terraform template?')) {
      return
    }

    try {
      const response = await api.delete(`/terraform-templates/${id}`)
      
      if (response.data.success) {
        alert('Terraform template deleted successfully!')
        fetchTerraformTemplates()
      } else {
        alert('Error: ' + (response.data.error || 'Unknown error occurred'))
      }
    } catch (error: any) {
      console.error('Error deleting template:', error)
      alert('Error deleting terraform template: ' + (error.response?.data?.error || 'Unknown error'))
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      setFormData(prev => ({ ...prev, content }))
    }
    reader.readAsText(file)
  }

  const handleTemplateFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      setTemplateFormData(prev => ({ ...prev, yamlContent: content }))
    }
    reader.readAsText(file)
  }

  const handleTagsChange = (value: string) => {
    const tags = value.split(',').map(tag => tag.trim()).filter(tag => tag)
    setFormData(prev => ({ ...prev, tags }))
  }

  const handlePrerequisitesChange = (value: string) => {
    const prerequisites = value.split('\n').map(prereq => prereq.trim()).filter(prereq => prereq)
    setFormData(prev => ({ ...prev, prerequisites }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-secondary-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-secondary-100 mb-2">
            Admin Dashboard
          </h1>
          <p className="text-secondary-600 dark:text-secondary-400">
            Manage DevOps documentation and setup guides
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-md mb-8">
          <div className="flex border-b border-secondary-200 dark:border-secondary-700">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'dashboard'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-secondary-500 hover:text-secondary-700 dark:hover:text-secondary-300'
              }`}
            >
              <BarChart3 className="w-4 h-4 inline mr-2" />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('docs')}
              className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'docs'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-secondary-500 hover:text-secondary-700 dark:hover:text-secondary-300'
              }`}
            >
              <BookOpen className="w-4 h-4 inline mr-2" />
              Documentation
            </button>
            <button
              onClick={() => {
                setActiveTab('create')
                setEditingDoc(null)
                setFormData({
                  technology: '',
                  title: '',
                  description: '',
                  content: '',
                  category: 'other',
                  version: '1.0.0',
                  tags: [],
                  difficulty: 'intermediate',
                  estimatedTime: '30 minutes',
                  prerequisites: [],
                  author: 'Admin',
                  isActive: true
                })
              }}
              className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'create'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-secondary-500 hover:text-secondary-700 dark:hover:text-secondary-300'
              }`}
            >
              <Plus className="w-4 h-4 inline mr-2" />
              {editingDoc ? 'Edit Documentation' : 'Create Documentation'}
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'users'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-secondary-500 hover:text-secondary-700 dark:hover:text-secondary-300'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              User Management
            </button>
            <button
              onClick={() => setActiveTab('terraform')}
              className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'terraform'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-secondary-500 hover:text-secondary-700 dark:hover:text-secondary-300'
              }`}
            >
              <Globe className="w-4 h-4 inline mr-2" />
              Terraform Templates
            </button>
          </div>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-secondary-600 dark:text-secondary-400">Total Docs</p>
                  <p className="text-2xl font-semibold text-secondary-900 dark:text-secondary-100">{stats.totalDocs}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                  <Settings className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-secondary-600 dark:text-secondary-400">Active Docs</p>
                  <p className="text-2xl font-semibold text-secondary-900 dark:text-secondary-100">{stats.activeDocs}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <Tag className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-secondary-600 dark:text-secondary-400">Categories</p>
                  <p className="text-2xl font-semibold text-secondary-900 dark:text-secondary-100">{stats.totalCategories}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
                  <FileText className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-secondary-600 dark:text-secondary-400">Technologies</p>
                  <p className="text-2xl font-semibold text-secondary-900 dark:text-secondary-100">{stats.totalTechnologies}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Documentation List Tab */}
        {activeTab === 'docs' && (
          <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-secondary-200 dark:divide-secondary-700">
                <thead className="bg-secondary-50 dark:bg-secondary-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                      Technology
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                      Version
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                      Updated
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-secondary-800 divide-y divide-secondary-200 dark:divide-secondary-700">
                  {docs.map((doc) => (
                    <tr key={doc._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-secondary-900 dark:text-secondary-100">
                        {doc.technology}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500 dark:text-secondary-400">
                        {doc.title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500 dark:text-secondary-400">
                        {doc.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500 dark:text-secondary-400">
                        v{doc.version}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500 dark:text-secondary-400">
                        {new Date(doc.lastUpdated || '').toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(doc)}
                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(doc._id!)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Create/Edit Documentation Tab */}
        {activeTab === 'create' && (
          <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-md p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                    Technology *
                  </label>
                  <input
                    type="text"
                    value={formData.technology}
                    onChange={(e) => setFormData(prev => ({ ...prev, technology: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-secondary-700 dark:text-secondary-100"
                    placeholder="e.g., Jenkins, Docker, Kubernetes"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-secondary-700 dark:text-secondary-100"
                    placeholder="Setup guide title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-secondary-700 dark:text-secondary-100"
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                    Version
                  </label>
                  <input
                    type="text"
                    value={formData.version}
                    onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
                    className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-secondary-700 dark:text-secondary-100"
                    placeholder="1.0.0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                    Difficulty
                  </label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value }))}
                    className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-secondary-700 dark:text-secondary-100"
                  >
                    {difficulties.map(diff => (
                      <option key={diff.value} value={diff.value}>{diff.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                    Estimated Time
                  </label>
                  <input
                    type="text"
                    value={formData.estimatedTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, estimatedTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-secondary-700 dark:text-secondary-100"
                    placeholder="30 minutes"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  required
                  rows={3}
                  className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-secondary-700 dark:text-secondary-100"
                  placeholder="Brief description of the setup guide"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.tags.join(', ')}
                  onChange={(e) => handleTagsChange(e.target.value)}
                  className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-secondary-700 dark:text-secondary-100"
                  placeholder="docker, devops, setup"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                  Prerequisites (one per line)
                </label>
                <textarea
                  value={formData.prerequisites.join('\n')}
                  onChange={(e) => handlePrerequisitesChange(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-secondary-700 dark:text-secondary-100"
                  placeholder="Docker installed&#10;Basic command line knowledge"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                  Content * (or upload file)
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  required
                  rows={15}
                  className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-secondary-700 dark:text-secondary-100 font-mono text-sm"
                  placeholder="# Setup Guide&#10;&#10;## Prerequisites&#10;- List prerequisites here&#10;&#10;## Installation Steps&#10;1. Step one&#10;2. Step two&#10;&#10;## Verification&#10;How to verify the setup"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                  Upload Documentation File
                </label>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  accept=".txt,.md"
                  className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-secondary-700 dark:text-secondary-100"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded dark:bg-secondary-700 dark:border-secondary-600"
                />
                <label className="ml-2 text-sm text-secondary-700 dark:text-secondary-300">
                  Active (visible to users)
                </label>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('docs')
                    setEditingDoc(null)
                  }}
                  className="px-4 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md shadow-sm text-sm font-medium text-secondary-700 dark:bg-secondary-700 dark:text-secondary-100 hover:bg-secondary-50 dark:hover:bg-secondary-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <Save className="w-4 h-4 inline mr-2" />
                  {editingDoc ? 'Update Documentation' : 'Create Documentation'}
                </button>
              </div>
            </form>
          </div>
        )}
        
        {/* Terraform Templates Tab */}
        {activeTab === 'terraform' && (
          <div>
            {/* Terraform Templates Dashboard Stats */}
            {terraformStats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-md p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <Globe className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-secondary-600 dark:text-secondary-400">Total Templates</p>
                      <p className="text-2xl font-semibold text-secondary-900 dark:text-secondary-100">{terraformStats.totalTemplates}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-md p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                      <Settings className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-secondary-600 dark:text-secondary-400">Active Templates</p>
                      <p className="text-2xl font-semibold text-secondary-900 dark:text-secondary-100">{terraformStats.activeTemplates}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-md p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                      <Tag className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-secondary-600 dark:text-secondary-400">Categories</p>
                      <p className="text-2xl font-semibold text-secondary-900 dark:text-secondary-100">{terraformStats.totalCategories}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-md p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
                      <FileText className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-secondary-600 dark:text-secondary-400">Providers</p>
                      <p className="text-2xl font-semibold text-secondary-900 dark:text-secondary-100">{terraformStats.totalProviders}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Create/Edit Terraform Template Form */}
            <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-md p-6 mb-8">
              <h3 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100 mb-6">
                {editingTemplate ? 'Edit Terraform Template' : 'Create New Terraform Template'}
              </h3>
              <form onSubmit={handleTemplateSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                      Subject Name *
                    </label>
                    <input
                      type="text"
                      value={templateFormData.subjectName}
                      onChange={(e) => setTemplateFormData(prev => ({ ...prev, subjectName: e.target.value }))}
                      required
                      className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-secondary-700 dark:text-secondary-100"
                      placeholder="e.g., AWS EC2 Instance, Azure Storage Account"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                      Provider
                    </label>
                    <select
                      value={templateFormData.provider}
                      onChange={(e) => setTemplateFormData(prev => ({ ...prev, provider: e.target.value }))}
                      className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-secondary-700 dark:text-secondary-100"
                    >
                      {terraformProviders.map(provider => (
                        <option key={provider.value} value={provider.value}>{provider.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                      Category
                    </label>
                    <select
                      value={templateFormData.category}
                      onChange={(e) => setTemplateFormData(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-secondary-700 dark:text-secondary-100"
                    >
                      {terraformCategories.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                      Difficulty
                    </label>
                    <select
                      value={templateFormData.difficulty}
                      onChange={(e) => setTemplateFormData(prev => ({ ...prev, difficulty: e.target.value }))}
                      className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-secondary-700 dark:text-secondary-100"
                    >
                      {difficulties.map(diff => (
                        <option key={diff.value} value={diff.value}>{diff.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                      Estimated Time
                    </label>
                    <input
                      type="text"
                      value={templateFormData.estimatedTime}
                      onChange={(e) => setTemplateFormData(prev => ({ ...prev, estimatedTime: e.target.value }))}
                      className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-secondary-700 dark:text-secondary-100"
                      placeholder="15 minutes"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={templateFormData.description}
                    onChange={(e) => setTemplateFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-secondary-700 dark:text-secondary-100"
                    placeholder="Brief description of what this terraform template creates"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={templateFormData.tags.join(', ')}
                    onChange={(e) => handleTagsChange(e.target.value)}
                    className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-secondary-700 dark:text-secondary-100"
                    placeholder="ec2, aws, compute"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                    YAML Content * (or upload file)
                  </label>
                  <textarea
                    value={templateFormData.yamlContent}
                    onChange={(e) => setTemplateFormData(prev => ({ ...prev, yamlContent: e.target.value }))}
                    required
                    rows={15}
                    className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-secondary-700 dark:text-secondary-100 font-mono text-sm"
                    placeholder="# Terraform Configuration&#10;&#10;resource &#34;aws_instance&#34; &#34;example&#34; {&#10;  ami           = &#34;ami-12345678&#34;&#10;  instance_type = &#34;t2.micro&#34;&#10;  &#10;  tags = {&#10;    Name = &#34;ExampleInstance&#34;&#10;  }&#10;}"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                    Upload YAML File
                  </label>
                  <input
                    type="file"
                    onChange={handleTemplateFileUpload}
                    accept=".yml,.yaml,.tf"
                    className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-secondary-700 dark:text-secondary-100"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={templateFormData.isActive}
                    onChange={(e) => setTemplateFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded dark:bg-secondary-700 dark:border-secondary-600"
                  />
                  <label className="ml-2 text-sm text-secondary-700 dark:text-secondary-300">
                    Active (visible to users)
                  </label>
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTemplate(null)
                      setTemplateFormData({
                        subjectName: '',
                        description: '',
                        yamlContent: '',
                        category: 'other',
                        provider: 'generic',
                        tags: [],
                        difficulty: 'intermediate',
                        estimatedTime: '15 minutes',
                        prerequisites: [],
                        author: 'Admin',
                        isActive: true
                      })
                    }}
                    className="px-4 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md shadow-sm text-sm font-medium text-secondary-700 dark:bg-secondary-700 dark:text-secondary-100 hover:bg-secondary-50 dark:hover:bg-secondary-600"
                  >
                    Clear
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <Save className="w-4 h-4 inline mr-2" />
                    {editingTemplate ? 'Update Template' : 'Create Template'}
                  </button>
                </div>
              </form>
            </div>

            {/* Terraform Templates List */}
            <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-md overflow-hidden">
              <h3 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100 p-6 pb-4">
                Existing Terraform Templates
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-secondary-200 dark:divide-secondary-700">
                  <thead className="bg-secondary-50 dark:bg-secondary-900">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                        Subject Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                        Provider
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                        Difficulty
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                        Updated
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-secondary-800 divide-y divide-secondary-200 dark:divide-secondary-700">
                    {terraformTemplates.map((template) => (
                      <tr key={template._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-secondary-900 dark:text-secondary-100">
                          {template.subjectName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500 dark:text-secondary-400">
                          {template.provider}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500 dark:text-secondary-400">
                          {template.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500 dark:text-secondary-400">
                          {template.difficulty}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500 dark:text-secondary-400">
                          {new Date(template.lastUpdated || '').toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleTemplateEdit(template)}
                              className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleTemplateDelete(template._id!)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* User Management Tab */}
        {activeTab === 'users' && (
          <div>
            {/* User Management Stats */}
            {userStats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-md p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-secondary-600 dark:text-secondary-400">Total Users</p>
                      <p className="text-2xl font-semibold text-secondary-900 dark:text-secondary-100">{userStats.totalUsers}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-md p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                      <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-secondary-600 dark:text-secondary-400">Active Users</p>
                      <p className="text-2xl font-semibold text-secondary-900 dark:text-secondary-100">{userStats.activeUsers}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-md p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-amber-100 dark:bg-amber-900 rounded-lg">
                      <Crown className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-secondary-600 dark:text-secondary-400">Admin Users</p>
                      <p className="text-2xl font-semibold text-secondary-900 dark:text-secondary-100">{userStats.adminUsers}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-md p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                      <Calendar className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-secondary-600 dark:text-secondary-400">New This Month</p>
                      <p className="text-2xl font-semibold text-secondary-900 dark:text-secondary-100">{userStats.newUsersThisMonth}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* User Management Controls */}
            <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-md p-6 mb-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => {
                      setEditingUser(null)
                      setUserFormData({
                        username: '',
                        email: '',
                        role: 'user',
                        password: '',
                        isActive: true
                      })
                      setUserModalOpen(true)
                    }}
                    className="btn-primary flex items-center"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add New User
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <select
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value as 'all' | 'user' | 'admin')}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="all">All Roles</option>
                    <option value="user">Users</option>
                    <option value="admin">Admins</option>
                  </select>

                  <select
                    value={userStatusFilter}
                    onChange={(e) => setUserStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-secondary-200 dark:divide-secondary-700">
                  <thead className="bg-secondary-50 dark:bg-secondary-900">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                        Last Login
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                        Joined
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-secondary-800 divide-y divide-secondary-200 dark:divide-secondary-700">
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((user) => (
                        <tr key={user._id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                                {user.username?.charAt(0).toUpperCase() || 'U'}
                              </div>
                              <div className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                                {user.username}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500 dark:text-secondary-400">
                            <div className="flex items-center">
                              <Mail className="w-4 h-4 mr-2 text-gray-400" />
                              {user.email}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                              user.role === 'admin' 
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            }`}>
                              {user.role === 'admin' ? (
                                <><Crown className="w-3 h-3 mr-1" />Admin</>
                              ) : (
                                <><User className="w-3 h-3 mr-1" />User</>
                              )}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => handleUserStatusToggle(user._id, !user.isActive)}
                              className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full transition-colors ${
                                user.isActive
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 hover:bg-green-200'
                                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 hover:bg-red-200'
                              }`}
                            >
                              {user.isActive ? (
                                <><CheckCircle className="w-3 h-3 mr-1" />Active</>
                              ) : (
                                <><XCircle className="w-3 h-3 mr-1" />Inactive</>
                              )}
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500 dark:text-secondary-400">
                            {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500 dark:text-secondary-400">
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleUserEdit(user)}
                                className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                title="Edit user"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleUserDelete(user._id)}
                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                title="Delete user"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center">
                            <Users className="w-12 h-12 text-gray-400 mb-4" />
                            <p className="text-gray-500 dark:text-gray-400">
                              {users.length === 0 ? 'No users found in database' : 'No users match your filters'}
                            </p>
                            {users.length === 0 && (
                              <button
                                onClick={() => {
                                  setEditingUser(null)
                                  setUserFormData({
                                    username: '',
                                    email: '',
                                    role: 'user',
                                    password: '',
                                    isActive: true
                                  })
                                  setUserModalOpen(true)
                                }}
                                className="mt-4 btn-primary"
                              >
                                Add First User
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* User Modal */}
        {userModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-secondary-800 rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {editingUser ? 'Edit User' : 'Add New User'}
                </h2>
                <button
                  onClick={() => {
                    setUserModalOpen(false)
                    setEditingUser(null)
                  }}
                  className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Modal Body */}
              <form onSubmit={handleUserSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={userFormData.username}
                    onChange={(e) => setUserFormData(prev => ({ ...prev, username: e.target.value }))}
                    required
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
                    value={userFormData.email}
                    onChange={(e) => setUserFormData(prev => ({ ...prev, email: e.target.value }))}
                    required
                    className="input"
                    placeholder="Enter email"
                  />
                </div>
                
                {!editingUser && (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={userFormData.password}
                        onChange={(e) => setUserFormData(prev => ({ ...prev, password: e.target.value }))}
                        required
                        className="input pr-12"
                        placeholder="Enter password"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-4 flex items-center"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                        ) : (
                          <Eye className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Role
                  </label>
                  <select
                    value={userFormData.role}
                    onChange={(e) => setUserFormData(prev => ({ ...prev, role: e.target.value as 'user' | 'admin' }))}
                    className="input"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={userFormData.isActive}
                    onChange={(e) => setUserFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="isActive" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Active
                  </label>
                </div>
              </form>
              
              {/* Modal Footer */}
              <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => {
                    setUserModalOpen(false)
                    setEditingUser(null)
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  onClick={handleUserSubmit}
                  className="btn-primary"
                >
                  {editingUser ? 'Update User' : 'Create User'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Admin
