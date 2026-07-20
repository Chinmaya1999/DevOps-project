import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, Filter, Clock, User, Tag, BookOpen } from 'lucide-react'
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
}

const DevOpsDocs: React.FC = () => {
  const [docs, setDocs] = useState<DevOpsDoc[]>([])
  const [filteredDocs, setFilteredDocs] = useState<DevOpsDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedDifficulty, setSelectedDifficulty] = useState('')
  const [categories, setCategories] = useState<string[]>([])
  const [technologies, setTechnologies] = useState<string[]>([])

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
    fetchDocs()
    fetchCategories()
    fetchTechnologies()
  }, [])

  useEffect(() => {
    let filtered = docs

    if (searchTerm) {
      filtered = filtered.filter(doc =>
        doc.technology.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedCategory) {
      filtered = filtered.filter(doc => doc.category === selectedCategory)
    }

    if (selectedDifficulty) {
      filtered = filtered.filter(doc => doc.difficulty === selectedDifficulty)
    }

    setFilteredDocs(filtered)
  }, [docs, searchTerm, selectedCategory, selectedDifficulty])

  const fetchDocs = async () => {
    try {
      const response = await api.get('/devops-docs')
      if (response.data.success) {
        setDocs(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching docs:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await api.get('/devops-docs/categories')
      if (response.data.success) {
        setCategories(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchTechnologies = async () => {
    try {
      const response = await api.get('/devops-docs/technologies')
      if (response.data.success) {
        setTechnologies(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching technologies:', error)
    }
  }

  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Enhanced Header */}
        <div className="mb-12 text-center">
          <h1 className="text-5xl md:text-6xl font-black text-gray-900 dark:text-white mb-4">
            <span className="text-gradient animated-gradient">DevOps Documentation</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Comprehensive setup guides for modern DevOps technologies
          </p>
        </div>

        {/* Enhanced Filters */}
        <div className="glass-card p-8 mb-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                <Search className="w-4 h-4 inline mr-2" />
                Search
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search technologies or titles..."
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                <Filter className="w-4 h-4 inline mr-2" />
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="input"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                Difficulty Level1
              </label>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="input"
              >
                <option value="">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                Quick Access
              </label>
              <select
                onChange={(e) => {
                  const tech = e.target.value
                  if (tech) {
                    setSearchTerm(tech)
                  }
                }}
                className="input"
              >
                <option value="">Select Technology</option>
                {technologies.map(tech => (
                  <option key={tech} value={tech}>{tech}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Enhanced Documentation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredDocs.map((doc, index) => (
            <Link
              key={doc._id}
              to={`/devops-docs/${doc._id}`}
              className="group block fade-in-up"
              style={{animationDelay: `${index * 0.1}s`}}
            >
              <div className="group feature-card h-full">
                {/* Card Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2 group-hover:text-gradient transition-all duration-300">
                      {doc.technology}
                    </h3>
                    <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full ${categoryColors[doc.category]} shadow-lg`}>
                      {doc.category.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Title and Description */}
                <h4 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-3">
                  {doc.title}
                </h4>
                <p className="text-gray-600 dark:text-gray-300 mb-6 line-clamp-3 leading-relaxed">
                  {doc.description}
                </p>

                {/* Metadata */}
                <div className="flex flex-wrap gap-3 mb-6">
                  <span className={`inline-flex items-center px-3 py-1 text-xs font-bold rounded-full ${difficultyColors[doc.difficulty]} shadow-md`}>
                    {doc.difficulty.toUpperCase()}
                  </span>
                  <span className="inline-flex items-center px-3 py-1 text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                    <Clock className="w-3 h-3 mr-1" />
                    {doc.estimatedTime}
                  </span>
                  <span className="inline-flex items-center px-3 py-1 text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                    <Tag className="w-3 h-3 mr-1" />
                    v{doc.version}
                  </span>
                </div>

                {/* Tags */}
                {doc.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {doc.tags.slice(0, 3).map((tag, tagIndex) => (
                      <span key={tagIndex} className="px-2 py-1 text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-md border border-blue-200 dark:border-blue-800">
                        #{tag}
                      </span>
                    ))}
                    {doc.tags.length > 3 && (
                      <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-md">
                        +{doc.tags.length - 3} more
                      </span>
                    )}
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <span className="flex items-center font-medium">
                    <User className="w-4 h-4 mr-2" />
                    {doc.author}
                  </span>
                  <span className="font-medium">{formatDate(doc.lastUpdated)}</span>
                </div>

                {/* Hover indicator */}
                <div className="mt-4 text-center text-xs text-gradient font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  EXPLORE GUIDE →
                </div>
              </div>
            </Link>
          ))}
        </div>

        {filteredDocs.length === 0 && (
          <div className="text-center py-20">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full blur-2xl opacity-30"></div>
                <div className="relative bg-gradient-to-r from-blue-500 to-indigo-600 p-4 rounded-2xl">
                  <BookOpen className="w-12 h-12 text-white" />
                </div>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              No documentation found
            </h3>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
              Try adjusting your search or filters to find what you're looking for
            </p>
            <button
              onClick={() => {
                setSearchTerm('')
                setSelectedCategory('')
                setSelectedDifficulty('')
              }}
              className="btn-secondary"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default DevOpsDocs
