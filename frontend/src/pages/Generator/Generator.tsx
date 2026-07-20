import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { Loader2, FileCode, Download, Copy, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'

interface GeneratorConfig {
  name: string
  description: string
  fields: Array<{
    name: string
    label: string
    type: string
    required?: boolean
    default?: any
    options?: string[] | Array<{ value: string; label: string }>
    placeholder?: string
    description?: string
  }>
}

const Generator: React.FC = () => {
  const { type } = useParams<{ type: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [template, setTemplate] = useState<GeneratorConfig | null>(null)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [generatedCode, setGeneratedCode] = useState<string>('')
  const [fileName, setFileName] = useState<string>('')
  const [autoGenerate, setAutoGenerate] = useState(false)

  useEffect(() => {
    if (!type) {
      navigate('/dashboard')
      return
    }

    fetchTemplate()
  }, [type, navigate])

  // Auto-generate code when coming from GitHub analysis
  useEffect(() => {
    if (autoGenerate && template && formData && Object.keys(formData).length > 0) {
      const generate = async () => {
        if (!template) return

        // Validate required fields
        const missingFields = template.fields
          .filter(field => field.required && !formData[field.name])
          .map(field => field.label)

        if (missingFields.length > 0) {
          // Don't auto-generate if required fields are missing
          setAutoGenerate(false)
          return
        }

        setGenerating(true)

        try {
          const response = await api.post(`/generate/${type}`, formData)
          const responseData = response.data.data
          
          // Handle Kubernetes multi-file response
          if (type === 'kubernetes') {
            const { deployment, service, ingress, configMap, hpa, fileName: generatedFileName } = responseData
            
            let combinedContent = deployment
            
            if (service && !service.includes(deployment.split('---')[0])) {
              combinedContent += '\n\n---\n\n' + service
            }
            
            if (ingress) {
              combinedContent += '\n\n---\n\n' + ingress
            }
            
            if (configMap) {
              combinedContent += '\n\n---\n\n' + configMap
            }
            
            if (hpa) {
              combinedContent += '\n\n---\n\n' + hpa
            }
            
            setGeneratedCode(combinedContent)
            setFileName(generatedFileName)
          } else if (type === 'terraform') {
            // Handle Terraform multi-file response
            const { main, variables, outputs, provider, readme, fileName: generatedFileName } = responseData
            
            let combinedContent = `# ${generatedFileName}

# ===========================================
# MAIN CONFIGURATION
# ===========================================
${main}

# ===========================================
# PROVIDER CONFIGURATION
# ===========================================
${provider}

# ===========================================
# VARIABLES
# ===========================================
${variables}

# ===========================================
# OUTPUTS
# ===========================================
${outputs}

# ===========================================
# README
# ===========================================
${readme}`
            
            setGeneratedCode(combinedContent)
            setFileName(generatedFileName)
          } else {
            // Handle single file responses (Jenkins, GitHub Actions, etc.)
            const { content, fileName: generatedFileName } = responseData
            setGeneratedCode(content)
            setFileName(generatedFileName)
          }
          
          toast.success('Code generated automatically from GitHub analysis!')
        } catch (error: any) {
          toast.error(error.response?.data?.error || 'Failed to generate code')
        } finally {
          setGenerating(false)
          setAutoGenerate(false)
        }
      }

      generate()
    }
  }, [autoGenerate, template, formData, type])

  const fetchTemplate = async () => {
    try {
      const response = await api.get('/generate/templates')
      const templates = response.data.data
      const currentTemplate = templates[type as keyof typeof templates]
      
      if (!currentTemplate) {
        navigate('/dashboard')
        return
      }

      setTemplate(currentTemplate)
      
      // Initialize form data with default values
      const initialData: Record<string, any> = {}
      currentTemplate.fields.forEach((field: GeneratorConfig['fields'][0]) => {
        if (field.default !== undefined) {
          initialData[field.name] = field.default
        }
      })

      // Auto-fill from GitHub analysis if available
      const analyzedRepo = location.state?.analyzedRepo
      if (analyzedRepo && analyzedRepo.owner && analyzedRepo.repo) {
        const repoUrl = `https://github.com/${analyzedRepo.owner}/${analyzedRepo.repo}`
        
        // Map fields based on generator type
        switch (type) {
          case 'jenkins':
            initialData.projectName = analyzedRepo.repo
            initialData.repositoryUrl = repoUrl
            initialData.branch = 'main'
            initialData.dockerImage = `${analyzedRepo.repo.toLowerCase()}:latest`
            initialData.testCommand = 'npm test'
            initialData.deployCommand = 'npm run deploy'
            break
          case 'github-actions':
            initialData.repositoryUrl = repoUrl
            initialData.branch = 'main'
            initialData.workflowName = 'CI/CD Pipeline'
            break
          case 'dockerfile':
            initialData.projectName = analyzedRepo.repo
            initialData.baseImage = 'node:18-alpine'
            initialData.workingDir = '/app'
            initialData.buildCommand = 'npm run build'
            initialData.startCommand = 'npm start'
            break
          case 'kubernetes':
            initialData.appName = analyzedRepo.repo.toLowerCase()
            initialData.containerImage = `${analyzedRepo.repo.toLowerCase()}:latest`
            initialData.replicas = 3
            initialData.servicePort = 80
            break
          case 'terraform':
            initialData.projectName = analyzedRepo.repo
            initialData.region = 'us-east-1'
            break
          case 'ansible':
            initialData.playbookName = `${analyzedRepo.repo}-deploy`
            initialData.targetHosts = 'webservers'
            break
          default:
            break
        }

        // Trigger auto-generation after data is set
        setAutoGenerate(true)
      }

      setFormData(initialData)
    } catch (error) {
      toast.error('Failed to load template')
      navigate('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (name: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const generateCode = async () => {
    if (!template) return

    // Validate required fields
    const missingFields = template.fields
      .filter(field => field.required && !formData[field.name])
      .map(field => field.label)

    if (missingFields.length > 0) {
      toast.error(`Please fill in: ${missingFields.join(', ')}`)
      return
    }

    setGenerating(true)

    try {
      const response = await api.post(`/generate/${type}`, formData)
      const responseData = response.data.data
      
      // Handle Kubernetes multi-file response
      if (type === 'kubernetes') {
        const { deployment, service, ingress, configMap, hpa, fileName: generatedFileName } = responseData
        
        let combinedContent = deployment
        
        if (service && !service.includes(deployment.split('---')[0])) {
          combinedContent += '\n\n---\n\n' + service
        }
        
        if (ingress) {
          combinedContent += '\n\n---\n\n' + ingress
        }
        
        if (configMap) {
          combinedContent += '\n\n---\n\n' + configMap
        }
        
        if (hpa) {
          combinedContent += '\n\n---\n\n' + hpa
        }
        
        setGeneratedCode(combinedContent)
        setFileName(generatedFileName)
      } else if (type === 'terraform') {
        // Handle Terraform multi-file response
        const { main, variables, outputs, provider, readme, fileName: generatedFileName } = responseData
        
        let combinedContent = `# ${generatedFileName}

# ===========================================
# MAIN CONFIGURATION
# ===========================================
${main}

# ===========================================
# PROVIDER CONFIGURATION
# ===========================================
${provider}

# ===========================================
# VARIABLES
# ===========================================
${variables}

# ===========================================
# OUTPUTS
# ===========================================
${outputs}

# ===========================================
# README
# ===========================================
${readme}`
        
        setGeneratedCode(combinedContent)
        setFileName(generatedFileName)
      } else {
        // Handle single file responses (Jenkins, GitHub Actions, etc.)
        const { content, fileName: generatedFileName } = responseData
        setGeneratedCode(content)
        setFileName(generatedFileName)
      }
      
      toast.success('Code generated successfully!')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to generate code')
    } finally {
      setGenerating(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedCode)
    toast.success('Code copied to clipboard!')
  }

  const downloadFile = () => {
    const blob = new Blob([generatedCode], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
    toast.success('File downloaded!')
  }

  const saveToHistory = async () => {
    try {
      // The file is already saved to history during generation
      toast.success('Configuration saved to history!')
    } catch (error) {
      toast.error('Failed to save to history')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (!template) {
    return (
      <div className="text-center py-12">
        <p className="text-secondary-600 dark:text-secondary-400">
          Template not found
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-900 dark:text-secondary-100 mb-2">
          {template.name} Generator
        </h1>
        <p className="text-secondary-600 dark:text-secondary-400">
          {template.description}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form Section */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100 mb-6">
            Configuration
          </h2>
          
          <div className="space-y-4">
            {template.fields.map((field) => (
              <div key={field.name}>
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                  {field.label}
                  {field.required && <span className="text-error-500 ml-1">*</span>}
                </label>
                
                {field.type === 'text' && (
                  <input
                    type="text"
                    className="input"
                    value={formData[field.name] || ''}
                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                  />
                )}
                
                {field.type === 'url' && (
                  <input
                    type="url"
                    className="input"
                    value={formData[field.name] || ''}
                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                    placeholder={`https://example.com`}
                  />
                )}
                
                {field.type === 'number' && (
                  <input
                    type="number"
                    className="input"
                    value={formData[field.name] || ''}
                    onChange={(e) => handleInputChange(field.name, parseInt(e.target.value))}
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                  />
                )}
                
                {field.type === 'select' && field.options && (
                  <select
                    className="input"
                    value={formData[field.name] || ''}
                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                  >
                    <option value="">Select {field.label}</option>
                    {field.options.map((option) => {
                      const value = typeof option === 'string' ? option : option.value
                      const label = typeof option === 'string' ? option : option.label
                      return (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      )
                    })}
                  </select>
                )}
                
                {field.type === 'checkbox' && (
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500"
                      checked={formData[field.name] || false}
                      onChange={(e) => handleInputChange(field.name, e.target.checked)}
                    />
                    <span className="ml-2 text-sm text-secondary-600 dark:text-secondary-400">
                      Enable {field.label.toLowerCase()}
                    </span>
                  </div>
                )}
                
                {field.type === 'array' && (
                  <div>
                    <textarea
                      className="input min-h-24 resize-none"
                      placeholder={field.placeholder || `Enter ${field.label.toLowerCase()} (one per line)`}
                      value={(formData[field.name] || []).join('\n')}
                      onChange={(e) => handleInputChange(field.name, e.target.value.split('\n').filter(item => item.trim()))}
                    />
                    <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-1">
                      {field.description || 'Enter each item on a new line'}
                    </p>
                  </div>
                )}
                
                {field.type === 'textarea' && (
                  <div>
                    <textarea
                      className="input min-h-32 resize-none"
                      placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                      value={formData[field.name] || ''}
                      onChange={(e) => handleInputChange(field.name, e.target.value)}
                    />
                    {field.description && (
                      <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-1">
                        {field.description}
                      </p>
                    )}
                  </div>
                )}
                
                {field.type === 'keyvalue' && (
                  <div>
                    <textarea
                      className="input min-h-24 resize-none"
                      placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                      value={formData[field.name] ? 
                        Object.entries(formData[field.name])
                          .map(([key, value]) => `${key}=${value}`)
                          .join('\n') : ''
                      }
                      onChange={(e) => {
                        const lines = e.target.value.split('\n').filter(line => line.trim())
                        const keyValueObject: Record<string, string> = {}
                        lines.forEach(line => {
                          const [key, ...valueParts] = line.split('=')
                          if (key && valueParts.length > 0) {
                            keyValueObject[key.trim()] = valueParts.join('=').trim()
                          }
                        })
                        handleInputChange(field.name, keyValueObject)
                      }}
                    />
                    <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-1">
                      {field.description || 'Enter key=value pairs, one per line'}
                    </p>
                  </div>
                )}
                
                {field.type === 'task-array' && (
                  <div>
                    <div className="space-y-2">
                      {(formData[field.name] || []).map((task: any, index: number) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="text"
                            className="input flex-1"
                            placeholder="Task name"
                            value={task.name || ''}
                            onChange={(e) => {
                              const tasks = [...(formData[field.name] || [])];
                              tasks[index] = { ...tasks[index], name: e.target.value };
                              handleInputChange(field.name, tasks);
                            }}
                          />
                          <input
                            type="text"
                            className="input flex-1"
                            placeholder="Module (e.g., apt, yum, copy)"
                            value={task.module || ''}
                            onChange={(e) => {
                              const tasks = [...(formData[field.name] || [])];
                              tasks[index] = { ...tasks[index], module: e.target.value };
                              handleInputChange(field.name, tasks);
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const tasks = [...(formData[field.name] || [])];
                              tasks.splice(index, 1);
                              handleInputChange(field.name, tasks);
                            }}
                            className="btn-secondary px-3 py-1"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          const tasks = [...(formData[field.name] || [])];
                          tasks.push({ name: '', module: '' });
                          handleInputChange(field.name, tasks);
                        }}
                        className="btn-secondary w-full"
                      >
                        Add Task
                      </button>
                    </div>
                    <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-1">
                      Add tasks with name and Ansible module
                    </p>
                  </div>
                )}
                
                {field.type === 'resource-array' && (
                  <div>
                    <div className="space-y-2">
                      {(formData[field.name] || []).map((resource: any, index: number) => (
                        <div key={index} className="border border-secondary-200 dark:border-secondary-700 rounded-lg p-3 space-y-2">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              className="input flex-1"
                              placeholder="Resource type (e.g., aws_instance, google_compute_instance)"
                              value={resource.type || ''}
                              onChange={(e) => {
                                const resources = [...(formData[field.name] || [])];
                                resources[index] = { ...resources[index], type: e.target.value };
                                handleInputChange(field.name, resources);
                              }}
                            />
                            <input
                              type="text"
                              className="input flex-1"
                              placeholder="Resource name"
                              value={resource.name || ''}
                              onChange={(e) => {
                                const resources = [...(formData[field.name] || [])];
                                resources[index] = { ...resources[index], name: e.target.value };
                                handleInputChange(field.name, resources);
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const resources = [...(formData[field.name] || [])];
                                resources.splice(index, 1);
                                handleInputChange(field.name, resources);
                              }}
                              className="btn-secondary px-3 py-1"
                            >
                              Remove
                            </button>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                              Configuration (JSON format)
                            </label>
                            <textarea
                              className="input min-h-20 resize-none font-mono text-xs"
                              placeholder='{"instance_type": "t2.micro", "ami": "ami-12345678"}'
                              value={resource.configuration ? JSON.stringify(resource.configuration, null, 2) : ''}
                              onChange={(e) => {
                                try {
                                  const config = e.target.value ? JSON.parse(e.target.value) : {};
                                  const resources = [...(formData[field.name] || [])];
                                  resources[index] = { ...resources[index], configuration: config };
                                  handleInputChange(field.name, resources);
                                } catch (err) {
                                  // Allow invalid JSON temporarily, but don't update state
                                }
                              }}
                            />
                          </div>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          const resources = [...(formData[field.name] || [])];
                          resources.push({ type: '', name: '', configuration: {} });
                          handleInputChange(field.name, resources);
                        }}
                        className="btn-secondary w-full"
                      >
                        Add Resource
                      </button>
                    </div>
                    <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-1">
                      Add Terraform resources with type, name, and JSON configuration
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={generateCode}
            disabled={generating}
            className="w-full mt-6 btn-primary flex items-center justify-center"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileCode className="w-4 h-4 mr-2" />
                Generate Code
              </>
            )}
          </button>
        </div>

        {/* Output Section */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100">
              Generated Code
            </h2>
            {generatedCode && (
              <div className="flex space-x-2">
                <button
                  onClick={copyToClipboard}
                  className="btn-secondary flex items-center"
                  title="Copy to clipboard"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={downloadFile}
                  className="btn-secondary flex items-center"
                  title="Download file"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={saveToHistory}
                  className="btn-secondary flex items-center"
                  title="Save to history"
                >
                  <Save className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {!generatedCode ? (
            <div className="bg-secondary-100 dark:bg-secondary-800 rounded-lg p-8 text-center">
              <FileCode className="w-12 h-12 text-secondary-400 mx-auto mb-4" />
              <p className="text-secondary-600 dark:text-secondary-400">
                Fill in the configuration form and click "Generate Code" to see output
              </p>
            </div>
          ) : (
            <div className="relative">
              <div className="bg-secondary-900 text-secondary-100 rounded-lg p-4 overflow-auto max-h-96">
                <pre className="text-sm font-mono whitespace-pre-wrap">
                  <code>{generatedCode}</code>
                </pre>
              </div>
              <div className="mt-2 text-sm text-secondary-600 dark:text-secondary-400">
                File: {fileName}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Generator
  