import React, { useState, useEffect } from 'react'
import { Copy, ChevronDown, ChevronRight, Server, Database } from 'lucide-react'
import { api } from '../../services/api'

const providerColors: { [key: string]: string } = {
  aws: 'from-orange-500 to-orange-600',
  gcp: 'from-blue-500 to-blue-600',
  azure: 'from-green-500 to-green-600',
  generic: 'from-gray-500 to-gray-600',
  other: 'from-purple-500 to-purple-600'
}

const TerraformDemos: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [expandedDemo, setExpandedDemo] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [uploadedTemplates, setUploadedTemplates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const categories = [
    { id: 'all', name: 'All Services' },
    { id: 'networking', name: 'Networking' },
    { id: 'compute', name: 'Compute' },
    { id: 'storage', name: 'Storage' },
    { id: 'security', name: 'Security' },
    { id: 'container', name: 'Containers' },
    { id: 'other', name: 'Other' }
  ]

  useEffect(() => {
    fetchUploadedTemplates()
  }, [])

  const fetchUploadedTemplates = async () => {
    try {
      const response = await api.get('/terraform-templates')
      if (response.data.success) {
        setUploadedTemplates(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching uploaded templates:', error)
    } finally {
      setLoading(false)
    }
  }

  // Convert uploaded templates to TerraformDemo format
  const convertedUploadedTemplates = uploadedTemplates.map(template => ({
    id: template._id,
    provider: template.provider,
    service: template.provider.toUpperCase(),
    title: template.subjectName,
    description: template.description || `Uploaded ${template.provider} template`,
    icon: template.provider === 'aws' ? Server : template.provider === 'gcp' ? Server : template.provider === 'azure' ? Server : Database,
    yaml: template.yamlContent,
    category: template.category,
    isStatic: false,
    author: template.author,
    lastUpdated: template.lastUpdated,
    difficulty: template.difficulty
  }))

  // Only use uploaded templates from database (static templates are now in DB)
  const allDemos = convertedUploadedTemplates

  const filteredDemos = selectedCategory === 'all' 
    ? allDemos 
    : allDemos.filter(demo => demo.category === selectedCategory)

  const copyToClipboard = async (yaml: string, demoId: string) => {
    try {
      await navigator.clipboard.writeText(yaml)
      setCopiedId(demoId)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100 mb-2">
          Terraform Demo Templates
        </h2>
        <p className="text-sm text-secondary-600 dark:text-secondary-400">
          Copy and modify these pre-built Terraform configurations for your infrastructure
        </p>
      </div>

      {loading && (
        <div className="text-center py-4">
          <div className="inline-flex items-center text-sm text-secondary-600 dark:text-secondary-400">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 mr-2"></div>
            Loading uploaded templates...
          </div>
        </div>
      )}

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
              selectedCategory === category.id
                ? 'bg-primary-600 text-white'
                : 'bg-secondary-100 dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-200 dark:hover:bg-secondary-700'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* Demos Grid */}
      <div className="space-y-4">
        {filteredDemos.map((demo) => {
          const Icon = demo.icon
          const isExpanded = expandedDemo === demo.id
          const isCopied = copiedId === demo.id

          return (
            <div key={demo.id} className="card overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 bg-gradient-to-r ${providerColors[demo.provider]} rounded-lg flex items-center justify-center`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
                          {demo.title}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          demo.provider === 'aws' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                          demo.provider === 'gcp' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                          demo.provider === 'azure' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                          demo.provider === 'generic' ? 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' :
                          'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                        }`}>
                          {demo.provider.toUpperCase()}
                        </span>
                        {!demo.isStatic && (
                          <span className="px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            Uploaded
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-secondary-600 dark:text-secondary-400">
                        {demo.description}
                      </p>
                      {!demo.isStatic && demo.author && (
                        <p className="text-xs text-secondary-500 dark:text-secondary-500 mt-1">
                          By {demo.author} {demo.lastUpdated && `• ${new Date(demo.lastUpdated).toLocaleDateString()}`}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => copyToClipboard(demo.yaml, demo.id)}
                      className="p-2 text-secondary-500 hover:text-primary-600 dark:text-secondary-400 dark:hover:text-primary-400 transition-colors duration-200"
                      title="Copy to clipboard"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setExpandedDemo(isExpanded ? null : demo.id)}
                      className="p-2 text-secondary-500 hover:text-primary-600 dark:text-secondary-400 dark:hover:text-primary-400 transition-colors duration-200"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {isCopied && (
                  <div className="mb-4 p-2 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-lg text-sm">
                    ✓ Copied to clipboard!
                  </div>
                )}

                {isExpanded && (
                  <div className="mt-4">
                    <div className="bg-secondary-900 dark:bg-black rounded-lg p-4 overflow-x-auto">
                      <pre className="text-sm text-secondary-100 font-mono whitespace-pre-wrap">
                        <code>{demo.yaml}</code>
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {filteredDemos.length === 0 && (
        <div className="text-center py-8">
          <p className="text-secondary-500 dark:text-secondary-400">
            No demos found for this category.
          </p>
        </div>
      )}
    </div>
  )
}

export default TerraformDemos
