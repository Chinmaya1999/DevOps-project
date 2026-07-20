import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { 
  Clock, 
  Star, 
  Users, 
  BookOpen, 
  PlayCircle, 
  ExternalLink, 
  ChevronLeft,
  Award,
  DollarSign,
  Calendar,
  Code,
  FileText,
  Github,
  Youtube,
  Globe
} from 'lucide-react'
import { api } from '../../services/api'

interface ResourceDetail {
  id: string
  title: string
  provider: string
  description: string
  duration?: string
  level?: string
  difficulty?: string
  rating: number
  enrolledCount?: number
  views?: number
  stars?: number
  forks?: number
  topics: string[]
  price?: string
  free?: boolean
  certificate?: boolean
  videoUrl?: string
  articleUrl?: string
  githubUrl?: string
  demoUrl?: string
  imageUrl?: string
  affiliateLink?: string
  youtubeChannel?: string
  language?: string
  readme?: string
  setupInstructions?: string[]
  lastUpdated?: string
}

interface RelatedResource {
  id: string
  title: string
  provider: string
  type: string
  rating: number
  duration: string
  level: string
  imageUrl?: string
}

const ResourceDetail: React.FC = () => {
  const { type, id } = useParams<{ type: string; id: string }>()
  const navigate = useNavigate()
  const [resource, setResource] = useState<ResourceDetail | null>(null)
  const [relatedResources, setRelatedResources] = useState<RelatedResource[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (type && id) {
      fetchResourceDetails()
      fetchRelatedResources()
    }
  }, [type, id])

  const fetchResourceDetails = async () => {
    try {
      const response = await api.get(`/resources/details/${type}/${id}`)
      if (response.data.success) {
        setResource(response.data.data)
      }
    } catch (err) {
      setError('Failed to load resource details')
      console.error('Error fetching resource details:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchRelatedResources = async () => {
    try {
      // In a real implementation, this would use AI to find related resources
      const mockRelated: RelatedResource[] = [
        {
          id: 'related-1',
          title: 'Advanced Docker Concepts',
          provider: 'Udemy',
          type: 'course',
          rating: 4.8,
          duration: '6 weeks',
          level: 'Advanced',
          imageUrl: 'https://via.placeholder.com/200x100?text=Advanced+Docker'
        },
        {
          id: 'related-2',
          title: 'Kubernetes Best Practices',
          provider: 'YouTube',
          type: 'tutorial',
          rating: 4.7,
          duration: '2 hours',
          level: 'Intermediate',
          imageUrl: 'https://via.placeholder.com/200x100?text=K8s+Best+Practices'
        },
        {
          id: 'related-3',
          title: 'DevOps Automation Scripts',
          provider: 'GitHub',
          type: 'project',
          rating: 4.6,
          duration: 'Self-paced',
          level: 'Intermediate',
          imageUrl: 'https://via.placeholder.com/200x100?text=DevOps+Scripts'
        }
      ]
      setRelatedResources(mockRelated)
    } catch (err) {
      console.error('Error fetching related resources:', err)
    }
  }

  const getTypeIcon = (resourceType: string) => {
    switch (resourceType) {
      case 'course': return BookOpen
      case 'tutorial': return PlayCircle
      case 'project': return Code
      default: return FileText
    }
  }

  const getTypeColor = (resourceType: string) => {
    switch (resourceType) {
      case 'course': return 'from-blue-500 to-indigo-600'
      case 'tutorial': return 'from-green-500 to-emerald-600'
      case 'project': return 'from-purple-500 to-pink-600'
      default: return 'from-gray-500 to-gray-600'
    }
  }

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'beginner': return 'bg-green-100 text-green-800'
      case 'intermediate': return 'bg-yellow-100 text-yellow-800'
      case 'advanced': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleEnrollClick = () => {
    if (resource?.affiliateLink) {
      window.open(resource.affiliateLink, '_blank')
    }
  }

  const handleVideoClick = () => {
    if (resource?.videoUrl) {
      window.open(resource.videoUrl, '_blank')
    }
  }

  const handleGithubClick = () => {
    if (resource?.githubUrl) {
      window.open(resource.githubUrl, '_blank')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error || !resource) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-900">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center py-20">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Resource not found
            </h3>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
              {error || 'The requested resource could not be loaded.'}
            </p>
            <button
              onClick={() => navigate('/roadmap')}
              className="btn-primary"
            >
              Back to Roadmap
            </button>
          </div>
        </div>
      </div>
    )
  }

  const TypeIcon = getTypeIcon(type || '')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/roadmap')}
            className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-4"
          >
            <ChevronLeft className="w-5 h-5 mr-2" />
            Back to Roadmap
          </button>
          
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Resource Header Image */}
            <div className="h-64 bg-gradient-to-r from-blue-500 to-indigo-600 relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <TypeIcon className="w-24 h-24 text-white opacity-50" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/60 to-transparent">
                <div className="flex items-center mb-4">
                  <div className={`w-16 h-16 bg-gradient-to-r ${getTypeColor(type || '')} rounded-2xl flex items-center justify-center shadow-lg`}>
                    <TypeIcon className="w-8 h-8 text-white" />
                  </div>
                  <div className="ml-4">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getLevelColor(resource.level || resource.difficulty || 'beginner')}`}>
                        {(resource.level || resource.difficulty || 'BEGINNER').toUpperCase()}
                      </span>
                      <span className="px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">
                        {type?.toUpperCase()}
                      </span>
                    </div>
                    <h1 className="text-3xl font-bold text-white">{resource.title}</h1>
                  </div>
                </div>
              </div>
            </div>

            {/* Resource Info */}
            <div className="p-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center mb-4">
                    <div className="flex items-center mr-6">
                      <Star className="w-5 h-5 text-yellow-500 mr-1" />
                      <span className="font-semibold text-gray-900 dark:text-white">{resource.rating}</span>
                    </div>
                    {resource.enrolledCount && (
                      <div className="flex items-center mr-6">
                        <Users className="w-5 h-5 text-blue-500 mr-1" />
                        <span className="text-gray-600 dark:text-gray-400">{resource.enrolledCount.toLocaleString()} enrolled</span>
                      </div>
                    )}
                    {resource.views && (
                      <div className="flex items-center mr-6">
                        <PlayCircle className="w-5 h-5 text-green-500 mr-1" />
                        <span className="text-gray-600 dark:text-gray-400">{resource.views.toLocaleString()} views</span>
                      </div>
                    )}
                    {resource.stars && (
                      <div className="flex items-center mr-6">
                        <Star className="w-5 h-5 text-purple-500 mr-1" />
                        <span className="text-gray-600 dark:text-gray-400">{resource.stars.toLocaleString()} stars</span>
                      </div>
                    )}
                  </div>
                  <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                    {resource.description}
                  </p>
                </div>
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="flex items-center">
                  <Clock className="w-5 h-5 text-gray-500 mr-3" />
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Duration</div>
                    <div className="font-semibold text-gray-900 dark:text-white">{resource.duration || 'Self-paced'}</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 text-gray-500 mr-3" />
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Provider</div>
                    <div className="font-semibold text-gray-900 dark:text-white">{resource.provider}</div>
                  </div>
                </div>
                {resource.price && (
                  <div className="flex items-center">
                    <DollarSign className="w-5 h-5 text-gray-500 mr-3" />
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Price</div>
                      <div className="font-semibold text-gray-900 dark:text-white">{resource.price}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Topics */}
              <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Topics Covered</h3>
                <div className="flex flex-wrap gap-2">
                  {resource.topics.map((topic, index) => (
                    <span key={index} className="px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg border border-blue-200 dark:border-blue-800">
                      {topic}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4 mb-8">
                {type === 'course' && resource.affiliateLink && (
                  <button
                    onClick={handleEnrollClick}
                    className="btn-primary flex items-center"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Enroll Now
                  </button>
                )}
                {resource.videoUrl && (
                  <button
                    onClick={handleVideoClick}
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors flex items-center"
                  >
                    <Youtube className="w-4 h-4 mr-2" />
                    Watch Video
                  </button>
                )}
                {resource.githubUrl && (
                  <button
                    onClick={handleGithubClick}
                    className="bg-gray-800 hover:bg-gray-900 text-white px-6 py-3 rounded-xl font-semibold transition-colors flex items-center"
                  >
                    <Github className="w-4 h-4 mr-2" />
                    View on GitHub
                  </button>
                )}
                {resource.demoUrl && (
                  <button
                    onClick={() => window.open(resource.demoUrl, '_blank')}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors flex items-center"
                  >
                    <Globe className="w-4 h-4 mr-2" />
                    Live Demo
                  </button>
                )}
              </div>

              {/* Additional Details for Projects */}
              {type === 'project' && resource.readme && (
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Project Description</h3>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{resource.readme}</p>
                  </div>
                </div>
              )}

              {/* Setup Instructions */}
              {resource.setupInstructions && resource.setupInstructions.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Setup Instructions</h3>
                  <div className="space-y-3">
                    {resource.setupInstructions.map((instruction, index) => (
                      <div key={index} className="flex items-start">
                        <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-sm font-semibold mr-3 mt-0.5">
                          {index + 1}
                        </div>
                        <p className="text-gray-700 dark:text-gray-300">{instruction}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Certificate Info for Courses */}
              {type === 'course' && resource.certificate && (
                <div className="mb-8">
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
                    <div className="flex items-center">
                      <Award className="w-6 h-6 text-green-600 dark:text-green-400 mr-3" />
                      <div>
                        <h4 className="font-semibold text-green-900 dark:text-green-100">Certificate Available</h4>
                        <p className="text-green-700 dark:text-green-300">Earn a verified certificate upon completion</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Related Resources */}
        {relatedResources.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Related Resources</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedResources.map((related) => {
                const RelatedIcon = getTypeIcon(related.type)
                return (
                  <Link
                    key={related.id}
                    to={`/resources/${related.type}/${related.id}`}
                    className="group block"
                  >
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-shadow">
                      <div className="h-32 bg-gradient-to-r from-gray-400 to-gray-500 relative">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <RelatedIcon className="w-12 h-12 text-white opacity-50" />
                        </div>
                      </div>
                      <div className="p-6">
                        <div className="flex items-center mb-3">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getLevelColor(related.level)}`}>
                            {related.level}
                          </span>
                          <span className="ml-auto text-sm text-gray-500 dark:text-gray-400">
                            {related.duration}
                          </span>
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {related.title}
                        </h3>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">{related.provider}</span>
                          <div className="flex items-center">
                            <Star className="w-4 h-4 text-yellow-500 mr-1" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">{related.rating}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ResourceDetail
