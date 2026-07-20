import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { 
  ArrowLeft, 
  Copy, 
  Clock, 
  User, 
  Tag, 
  Calendar,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { api } from '../../services/api'

interface DevOpsDoc {
  _id: string
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
  lastUpdated: string
  createdAt: string
}

const DevOpsDocDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [doc, setDoc] = useState<DevOpsDoc | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  const categoryColors: { [key: string]: string } = {
    cicd: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white',
    containerization: 'bg-gradient-to-r from-emerald-500 to-green-600 text-white',
    orchestration: 'bg-gradient-to-r from-purple-500 to-purple-600 text-white',
    iac: 'bg-gradient-to-r from-orange-500 to-orange-600 text-white',
    monitoring: 'bg-gradient-to-r from-red-500 to-rose-600 text-white',
    security: 'bg-gradient-to-r from-amber-500 to-yellow-600 text-white',
    other: 'bg-gradient-to-r from-gray-500 to-gray-600 text-white'
  }

  const difficultyColors: { [key: string]: string } = {
    beginner: 'bg-gradient-to-r from-emerald-400 to-green-500 text-white',
    intermediate: 'bg-gradient-to-r from-amber-400 to-orange-500 text-white',
    advanced: 'bg-gradient-to-r from-red-400 to-rose-500 text-white'
  }

  useEffect(() => {
    if (id) {
      fetchDoc()
    }
  }, [id])

  const fetchDoc = async () => {
    try {
      const response = await api.get(`/devops-docs/${id}`)
      if (response.data.success) {
        setDoc(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching doc:', error)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatContent = (content: string) => {
    const lines = content.split('\n')
    const formattedElements: JSX.Element[] = []
    let inCodeBlock = false
    let codeBlockContent: string[] = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      if (line.startsWith('```')) {
        if (inCodeBlock) {
          // End of code block
          formattedElements.push(
            <div key={`code-${i}`} className="bg-secondary-900 dark:bg-black rounded-lg p-4 my-4 overflow-x-auto">
              <pre className="text-green-400 font-mono text-sm whitespace-pre">
                <code>{codeBlockContent.join('\n')}</code>
              </pre>
            </div>
          )
          codeBlockContent = []
          inCodeBlock = false
        } else {
          // Start of code block
          inCodeBlock = true
        }
      } else if (inCodeBlock) {
        // Inside code block
        codeBlockContent.push(line)
      } else if (line.startsWith('# ')) {
        formattedElements.push(<h1 key={i} className="text-2xl font-bold text-secondary-900 dark:text-secondary-100 mt-6 mb-4">{line.substring(2)}</h1>)
      } else if (line.startsWith('## ')) {
        formattedElements.push(<h2 key={i} className="text-xl font-semibold text-secondary-900 dark:text-secondary-100 mt-5 mb-3">{line.substring(3)}</h2>)
      } else if (line.startsWith('### ')) {
        formattedElements.push(<h3 key={i} className="text-lg font-medium text-secondary-900 dark:text-secondary-100 mt-4 mb-2">{line.substring(4)}</h3>)
      } else if (line.startsWith('#### ')) {
        formattedElements.push(<h4 key={i} className="text-base font-medium text-secondary-900 dark:text-secondary-100 mt-3 mb-2">{line.substring(5)}</h4>)
      } else if (line.startsWith('- ')) {
        formattedElements.push(<li key={i} className="ml-6 text-secondary-700 dark:text-secondary-300 list-disc">{line.substring(2)}</li>)
      } else if (line.startsWith('* ')) {
        formattedElements.push(<li key={i} className="ml-6 text-secondary-700 dark:text-secondary-300 list-disc">{line.substring(2)}</li>)
      } else if (line.match(/^\d+\. /)) {
        formattedElements.push(<li key={i} className="ml-6 text-secondary-700 dark:text-secondary-300 list-decimal">{line.substring(line.indexOf(' ') + 1)}</li>)
      } else if (line.startsWith('`') && line.endsWith('`')) {
        formattedElements.push(<code key={i} className="bg-secondary-100 dark:bg-secondary-800 px-2 py-1 rounded font-mono text-sm text-secondary-800 dark:text-secondary-200">{line.slice(1, -1)}</code>)
      } else if (line.trim() === '') {
        formattedElements.push(<br key={i} />)
      } else if (line.match(/^[A-Z][a-zA-Z\s]+:$/)) {
        formattedElements.push(<h4 key={i} className="text-lg font-semibold text-primary-600 dark:text-primary-400 mt-4 mb-2">{line}</h4>)
      } else {
        formattedElements.push(<p key={i} className="text-secondary-700 dark:text-secondary-300 mb-2 leading-relaxed">{line}</p>)
      }
    }

    // Handle unclosed code block
    if (inCodeBlock && codeBlockContent.length > 0) {
      formattedElements.push(
        <div key="code-final" className="bg-secondary-900 dark:bg-black rounded-lg p-4 my-4 overflow-x-auto">
          <pre className="text-green-400 font-mono text-sm whitespace-pre">
            <code>{codeBlockContent.join('\n')}</code>
          </pre>
        </div>
      )
    }

    return formattedElements
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="absolute inset-0 hero-gradient rounded-full blur-2xl opacity-30 pulse-animation"></div>
            <div className="relative hero-gradient p-4 rounded-2xl">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
          </div>
          <p className="mt-4 text-lg font-medium text-gray-600 dark:text-gray-300">Loading documentation...</p>
        </div>
      </div>
    )
  }

  if (!doc) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-4">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-rose-600 rounded-full blur-2xl opacity-30"></div>
              <div className="relative bg-gradient-to-r from-red-500 to-rose-600 p-4 rounded-2xl">
                <AlertCircle className="w-12 h-12 text-white" />
              </div>
            </div>
          </div>
          <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-4">
            Documentation not found
          </h3>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
            The requested documentation could not be found or may have been removed.
          </p>
          <Link
            to="/devops-docs"
            className="btn-primary"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Documentation
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-900">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Enhanced Header */}
        <div className="mb-12">
          <Link
            to="/devops-docs"
            className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-6 font-medium transition-colors duration-200"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Documentation
          </Link>
          
          <div className="glass-card p-8">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-6">
                  <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white">
                    {doc.technology}
                  </h1>
                  <div className="flex gap-3">
                    <span className={`px-4 py-2 text-sm font-bold rounded-full ${categoryColors[doc.category]} shadow-lg`}>
                      {doc.category.toUpperCase()}
                    </span>
                    <span className={`px-4 py-2 text-sm font-bold rounded-full ${difficultyColors[doc.difficulty]} shadow-lg`}>
                      {doc.difficulty.toUpperCase()}
                    </span>
                  </div>
                </div>
                
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">
                  {doc.title}
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                  {doc.description}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Metadata */}
        <div className="glass-card p-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Author</p>
                <p className="font-bold text-gray-900 dark:text-white">{doc.author}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Est. Time</p>
                <p className="font-bold text-gray-900 dark:text-white">{doc.estimatedTime}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Tag className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Version</p>
                <p className="font-bold text-gray-900 dark:text-white">v{doc.version}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Updated</p>
                <p className="font-bold text-gray-900 dark:text-white">{formatDate(doc.lastUpdated)}</p>
              </div>
            </div>
          </div>

          {/* Tags and Prerequisites */}
          <div className="grid md:grid-cols-2 gap-8 mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
            {doc.tags.length > 0 && (
              <div>
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {doc.tags.map((tag, index) => (
                    <span key={index} className="px-3 py-1 text-sm bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-md border border-blue-200 dark:border-blue-800 font-medium">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {doc.prerequisites.length > 0 && (
              <div>
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Prerequisites</h4>
                <ul className="space-y-2">
                  {doc.prerequisites.map((prereq, index) => (
                    <li key={index} className="flex items-center text-gray-700 dark:text-gray-300">
                      <CheckCircle className="w-5 h-5 mr-3 text-green-500 flex-shrink-0" />
                      <span className="font-medium">{prereq}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Content */}
        <div className="glass-card p-8 mb-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-3xl font-black text-gray-900 dark:text-white">
              <span className="text-gradient">Setup Guide</span>
            </h3>
            <div className="flex gap-3">
              <button
                onClick={() => copyToClipboard(doc.content)}
                className={`flex items-center px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                  copied 
                    ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg'
                    : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg hover:shadow-xl'
                }`}
              >
                {copied ? (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5 mr-2" />
                    Copy Guide
                  </>
                )}
              </button>
            </div>
          </div>
          
          <div className="prose prose-lg max-w-none dark:prose-invert">
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-8 border border-gray-200 dark:border-gray-700">
              {formatContent(doc.content)}
            </div>
          </div>
        </div>

        {/* Enhanced Footer */}
        <div className="text-center py-8">
          <div className="glass-card p-6">
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              Last updated on <span className="font-bold text-gray-900 dark:text-white">{formatDate(doc.lastUpdated)}</span> by <span className="font-bold text-gray-900 dark:text-white">{doc.author}</span>
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Generated by DevOps Pipeline Generator • Powered by modern best practices
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DevOpsDocDetail
