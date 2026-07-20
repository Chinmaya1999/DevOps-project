import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  History,
  FileCode,
  Download,
  Copy,
  Trash2,
  Eye,
  Search,
  Calendar,
  Tag
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import LoadingSpinner from '../../components/UI/LoadingSpinner'

interface GeneratedFile {
  _id: string
  name: string
  type: string
  fileName: string
  description?: string
  tags: string[]
  createdAt: string
  downloadCount: number
}

const HistoryPage: React.FC = () => {
  const [files, setFiles] = useState<GeneratedFile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [selectedFile, setSelectedFile] = useState<GeneratedFile | null>(null)
  const [fileContent, setFileContent] = useState('')
  const [showContentModal, setShowContentModal] = useState(false)

  useEffect(() => {
    fetchFiles()
  }, [])

  const fetchFiles = async () => {
    try {
      const response = await api.get('/history')
      setFiles(response.data.data.files)
    } catch (error) {
      toast.error('Failed to fetch history')
    } finally {
      setLoading(false)
    }
  }

  const viewFile = async (file: GeneratedFile) => {
    try {
      const response = await api.get(`/history/${file._id}`)
      setFileContent(response.data.data.content)
      setSelectedFile(file)
      setShowContentModal(true)
    } catch (error) {
      toast.error('Failed to load file content')
    }
  }

  const downloadFile = async (file: GeneratedFile) => {
    try {
      const response = await api.get(`/history/${file._id}`)
      const content = response.data.data.content
      
      const blob = new Blob([content], { type: 'text/plain' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = file.fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      
      toast.success('File downloaded!')
    } catch (error) {
      toast.error('Failed to download file')
    }
  }

  const copyToClipboard = async (file: GeneratedFile) => {
    try {
      const response = await api.get(`/history/${file._id}`)
      const content = response.data.data.content
      
      await navigator.clipboard.writeText(content)
      toast.success('Content copied to clipboard!')
    } catch (error) {
      toast.error('Failed to copy content')
    }
  }

  const deleteFile = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return
    
    try {
      await api.delete(`/history/${fileId}`)
      setFiles(files.filter(file => file._id !== fileId))
      toast.success('File deleted successfully!')
    } catch (error) {
      toast.error('Failed to delete file')
    }
  }

  const getTypeIcon = () => {
    return <FileCode className="w-5 h-5" />
  }

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      jenkins: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'github-actions': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      ansible: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      kubernetes: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
      terraform: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
    }
    return colors[type] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
  }

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         file.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         file.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesType = !selectedType || file.type === selectedType
    
    return matchesSearch && matchesType
  })

  const uniqueTypes = Array.from(new Set(files.map(file => file.type)))

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-900 dark:text-secondary-100 mb-2">
          Configuration History
        </h1>
        <p className="text-secondary-600 dark:text-secondary-400">
          View and manage your previously generated configuration files
        </p>
      </div>

      {/* Filters */}
      <div className="card p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary-400" />
              <input
                type="text"
                placeholder="Search files..."
                className="input pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="md:w-48">
            <select
              className="input"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="">All Types</option>
              {uniqueTypes.map(type => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Files List */}
      {filteredFiles.length === 0 ? (
        <div className="card p-12 text-center">
          <History className="w-16 h-16 text-secondary-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100 mb-2">
            No files found
          </h3>
          <p className="text-secondary-600 dark:text-secondary-400 mb-6">
            {files.length === 0 
              ? "You haven't generated any configuration files yet. Start by creating your first configuration!"
              : "No files match your current filters."
            }
          </p>
          {files.length === 0 && (
            <Link
              to="/dashboard"
              className="btn-primary"
            >
              Go to Dashboard
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFiles.map((file) => (
            <div key={file._id} className="card p-6 hover:shadow-lg transition-shadow duration-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  {getTypeIcon()}
                  <div className="ml-3">
                    <h3 className="font-medium text-secondary-900 dark:text-secondary-100">
                      {file.name}
                    </h3>
                    <p className="text-sm text-secondary-600 dark:text-secondary-400">
                      {file.fileName}
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(file.type)}`}>
                  {file.type.replace('-', ' ')}
                </span>
              </div>

              {file.description && (
                <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-4">
                  {file.description}
                </p>
              )}

              {file.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {file.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 text-xs bg-secondary-100 text-secondary-800 dark:bg-secondary-700 dark:text-secondary-200 rounded"
                    >
                      <Tag className="w-3 h-3 mr-1" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between text-sm text-secondary-500 dark:text-secondary-400 mb-4">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  {new Date(file.createdAt).toLocaleDateString()}
                </div>
                <div className="flex items-center">
                  <Download className="w-4 h-4 mr-1" />
                  {file.downloadCount}
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => viewFile(file)}
                  className="btn-secondary flex-1 flex items-center justify-center"
                  title="View content"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => downloadFile(file)}
                  className="btn-secondary flex-1 flex items-center justify-center"
                  title="Download file"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => copyToClipboard(file)}
                  className="btn-secondary flex-1 flex items-center justify-center"
                  title="Copy to clipboard"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteFile(file._id)}
                  className="btn-error flex-1 flex items-center justify-center"
                  title="Delete file"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Content Modal */}
      {showContentModal && selectedFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-secondary-800 rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-secondary-200 dark:border-secondary-700">
              <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
                {selectedFile.name}
              </h3>
              <button
                onClick={() => setShowContentModal(false)}
                className="text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300"
              >
                ×
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="bg-secondary-900 text-secondary-100 rounded-lg p-4">
                <pre className="text-sm font-mono whitespace-pre-wrap overflow-x-auto">
                  <code>{fileContent}</code>
                </pre>
              </div>
            </div>

            <div className="flex justify-end space-x-2 p-6 border-t border-secondary-200 dark:border-secondary-700">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(fileContent)
                  toast.success('Content copied to clipboard!')
                }}
                className="btn-secondary flex items-center"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </button>
              <button
                onClick={() => {
                  const blob = new Blob([fileContent], { type: 'text/plain' })
                  const url = window.URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = selectedFile.fileName
                  document.body.appendChild(a)
                  a.click()
                  document.body.removeChild(a)
                  window.URL.revokeObjectURL(url)
                  toast.success('File downloaded!')
                }}
                className="btn-primary flex items-center"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default HistoryPage
