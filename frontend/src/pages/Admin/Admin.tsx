import React, { useState, useEffect } from 'react'
import { 
  Save, 
  Plus, 
  Edit, 
  Trash2, 
  FileText, 
  Settings,
  BookOpen,
  Tag,
  User,
  Globe,
  Users,
  CheckCircle,
  Eye,
  MessageSquare,
  Award,
  HelpCircle,
  TrendingUp,
  Heart
} from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '../../services/api'

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
  const [activeTab, setActiveTab] = useState<'docs' | 'create' | 'terraform' | 'chat' | 'blogs'>('docs')
  const [docs, setDocs] = useState<DevOpsDoc[]>([])
  const [terraformTemplates, setTerraformTemplates] = useState<TerraformTemplate[]>([])
  const [terraformStats, setTerraformStats] = useState<TerraformDashboardStats | null>(null)
  const [chatStats, setChatStats] = useState<any>(null)
  const [blogs, setBlogs] = useState<any[]>([])
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
    if (activeTab === 'docs') {
      fetchDocs()
    } else if (activeTab === 'terraform') {
      fetchTerraformTemplates()
      fetchTerraformDashboardStats()
    } else if (activeTab === 'chat') {
      fetchChatStats()
    } else if (activeTab === 'blogs') {
      fetchBlogs()
    }
    setLoading(false)
  }, [activeTab])









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

  const fetchChatStats = async () => {
    try {
      const response = await api.get('/chat/admin/stats')
      setChatStats(response.data)
    } catch (error) {
      console.error('Error fetching chat stats:', error)
    }
  }

  const fetchBlogs = async () => {
    try {
      const response = await api.get('/blogs/admin/all')
      setBlogs(response.data.blogs)
    } catch (error) {
      console.error('Error fetching blogs:', error)
      toast.error('Failed to load blogs')
    }
  }

  const handleToggleFeatured = async (blogId: string) => {
    try {
      await api.put(`/blogs/admin/${blogId}/featured`)
      toast.success('Blog featured status updated')
      fetchBlogs()
    } catch (error) {
      console.error('Error toggling featured:', error)
      toast.error('Failed to update featured status')
    }
  }

  const handleDeleteBlog = async (blogId: string) => {
    if (!window.confirm('Are you sure you want to delete this blog?')) {
      return
    }
    try {
      await api.delete(`/blogs/${blogId}`)
      toast.success('Blog deleted successfully')
      fetchBlogs()
    } catch (error) {
      console.error('Error deleting blog:', error)
      toast.error('Failed to delete blog')
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
    <div>
      <div>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-secondary-100 mb-2">
            Content
          </h1>
          <p className="text-secondary-600 dark:text-secondary-400">
            Documentation, templates, blog posts and chat activity
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-md mb-8">
          <div className="flex border-b border-secondary-200 dark:border-secondary-700">
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
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'chat'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-secondary-500 hover:text-secondary-700 dark:hover:text-secondary-300'
              }`}
            >
              <MessageSquare className="w-4 h-4 inline mr-2" />
              Chat Analytics
            </button>
            <button
              onClick={() => setActiveTab('blogs')}
              className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'blogs'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-secondary-500 hover:text-secondary-700 dark:hover:text-secondary-300'
              }`}
            >
              <FileText className="w-4 h-4 inline mr-2" />
              Blog Management
            </button>
          </div>
        </div>


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


        {/* Chat Analytics Tab */}
        {activeTab === 'chat' && chatStats && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-md p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <MessageSquare className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-secondary-600 dark:text-secondary-400">Total Chats</p>
                    <p className="text-2xl font-semibold text-secondary-900 dark:text-secondary-100">{chatStats.totalChats}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-md p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                    <FileText className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-secondary-600 dark:text-secondary-400">Total Messages</p>
                    <p className="text-2xl font-semibold text-secondary-900 dark:text-secondary-100">{chatStats.totalMessages}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-md p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                    <HelpCircle className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-secondary-600 dark:text-secondary-400">Questions Asked</p>
                    <p className="text-2xl font-semibold text-secondary-900 dark:text-secondary-100">{chatStats.totalQuestions}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-md p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-secondary-600 dark:text-secondary-400">Questions Solved</p>
                    <p className="text-2xl font-semibold text-secondary-900 dark:text-secondary-100">{chatStats.solvedQuestions}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-md p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-pink-100 dark:bg-pink-900 rounded-lg">
                    <Users className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-secondary-600 dark:text-secondary-400">Collaboration Requests</p>
                    <p className="text-2xl font-semibold text-secondary-900 dark:text-secondary-100">{chatStats.totalCollaborationRequests}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-md p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-teal-100 dark:bg-teal-900 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-secondary-600 dark:text-secondary-400">Accepted Collaborations</p>
                    <p className="text-2xl font-semibold text-secondary-900 dark:text-secondary-100">{chatStats.acceptedCollaborations}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-md p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-secondary-600 dark:text-secondary-400">Active Users</p>
                    <p className="text-2xl font-semibold text-secondary-900 dark:text-secondary-100">{chatStats.activeUsers}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-md p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                    <User className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-secondary-600 dark:text-secondary-400">Total Users</p>
                    <p className="text-2xl font-semibold text-secondary-900 dark:text-secondary-100">{chatStats.totalUsers}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Contributors */}
            <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold text-secondary-900 dark:text-secondary-100 mb-4 flex items-center">
                <Award className="w-5 h-5 mr-2 text-yellow-500" />
                Top Contributors
              </h3>
              <div className="space-y-3">
                {chatStats.topContributors?.map((contributor: any, index: number) => (
                  <div
                    key={contributor._id}
                    className={`flex items-center space-x-3 p-3 rounded-lg ${
                      index === 0 ? 'bg-yellow-100 dark:bg-yellow-900' :
                      index === 1 ? 'bg-gray-200 dark:bg-gray-700' :
                      index === 2 ? 'bg-orange-100 dark:bg-orange-900' :
                      'bg-gray-50 dark:bg-gray-800'
                    }`}
                  >
                    <div className="w-8 h-8 flex items-center justify-center font-bold text-secondary-900 dark:text-secondary-100">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-secondary-900 dark:text-secondary-100">{contributor.user?.username}</p>
                      <p className="text-sm text-secondary-600 dark:text-secondary-400">{contributor.questionsSolved} questions solved</p>
                    </div>
                    <div className="flex items-center space-x-1 text-yellow-500">
                      <Award className="w-5 h-5" />
                      <span className="font-bold">{contributor.points}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Messages */}
            <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold text-secondary-900 dark:text-secondary-100 mb-4 flex items-center">
                <MessageSquare className="w-5 h-5 mr-2 text-blue-500" />
                Recent Messages
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {chatStats.recentMessages?.map((message: any) => (
                  <div key={message._id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-secondary-900 dark:text-secondary-100">{message.sender?.username}</span>
                      <span className="text-xs text-secondary-500 dark:text-secondary-400">
                        {new Date(message.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-secondary-600 dark:text-secondary-400">{message.content}</p>
                    {message.isQuestion && (
                      <div className="mt-2 flex items-center space-x-2">
                        <HelpCircle className="w-4 h-4 text-purple-500" />
                        <span className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 px-2 py-1 rounded-full">
                          Question {message.isSolved ? '✓ Solved' : ''}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Blog Management Tab */}
        {activeTab === 'blogs' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">Blog Management</h2>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-md p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                    <FileText className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-secondary-600 dark:text-secondary-400">Total Blogs</p>
                    <p className="text-2xl font-semibold text-secondary-900 dark:text-secondary-100">{blogs.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-md p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-secondary-600 dark:text-secondary-400">Published</p>
                    <p className="text-2xl font-semibold text-secondary-900 dark:text-secondary-100">
                      {blogs.filter((b: any) => b.status === 'published').length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-md p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                    <Eye className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-secondary-600 dark:text-secondary-400">Drafts</p>
                    <p className="text-2xl font-semibold text-secondary-900 dark:text-secondary-100">
                      {blogs.filter((b: any) => b.status === 'draft').length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-md p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg">
                    <Heart className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-secondary-600 dark:text-secondary-400">Total Likes</p>
                    <p className="text-2xl font-semibold text-secondary-900 dark:text-secondary-100">
                      {blogs.reduce((sum: number, b: any) => sum + b.likeCount, 0)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Blogs Table */}
            <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-md overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">All Blogs</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Title</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Author</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Stats</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Featured</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {blogs.map((blog: any) => (
                      <tr key={blog._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                            {blog.title}
                          </div>
                          <div className="text-sm text-secondary-500 dark:text-secondary-400">
                            {new Date(blog.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            {blog.authorAvatar && (
                              <img
                                src={blog.authorAvatar}
                                alt={blog.authorName}
                                className="w-8 h-8 rounded-full mr-2"
                              />
                            )}
                            <div className="text-sm text-secondary-900 dark:text-secondary-100">
                              {blog.authorName}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 rounded-full">
                            {blog.category}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            blog.status === 'published' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : blog.status === 'draft'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                          }`}>
                            {blog.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-4 text-sm text-secondary-500 dark:text-secondary-400">
                            <span className="flex items-center">
                              <Heart className="w-4 h-4 mr-1" />
                              {blog.likeCount}
                            </span>
                            <span className="flex items-center">
                              <MessageSquare className="w-4 h-4 mr-1" />
                              {blog.commentCount}
                            </span>
                            <span className="flex items-center">
                              <Eye className="w-4 h-4 mr-1" />
                              {blog.views}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleToggleFeatured(blog._id)}
                            className={`p-2 rounded-lg transition-colors ${
                              blog.isFeatured
                                ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400'
                                : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-400'
                            }`}
                          >
                            <Award className="w-5 h-5" />
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => window.open(`/blogs/${blog._id}`, '_blank')}
                              className="p-2 text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900 rounded-lg transition-colors"
                              title="View"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteBlog(blog._id)}
                              className="p-2 text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900 rounded-lg transition-colors"
                              title="Delete"
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

        {/* User Modal */}

      </div>
    </div>
  )
}

export default Admin
