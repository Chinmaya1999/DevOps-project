import React, { useState } from 'react'
import { CheckCircle, XCircle, AlertCircle, RefreshCw, FileCode, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'

const Validator: React.FC = () => {
  const [validatorInput, setValidatorInput] = useState<string>('')
  const [validating, setValidating] = useState(false)
  const [validationType, setValidationType] = useState<string>('jenkins')
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean
    errors: string[]
    suggestions: string[]
    correctedCode?: string
  } | null>(null)

  const validationTypes = [
    { value: 'jenkins', label: 'Jenkins Pipeline' },
    { value: 'github-actions', label: 'GitHub Actions' },
    { value: 'dockerfile', label: 'Dockerfile' },
    { value: 'terraform', label: 'Terraform' },
    { value: 'kubernetes', label: 'Kubernetes YAML' },
    { value: 'ansible', label: 'Ansible Playbooks' }
  ]

  const validateCode = async () => {
    if (!validatorInput.trim()) {
      toast.error('Please paste some code to validate')
      return
    }

    setValidating(true)
    try {
      const response = await api.post('/validate/pipeline', { 
        code: validatorInput,
        type: validationType
      })
      setValidationResult(response.data.data)
      toast.success('Validation completed!')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Validation failed')
    } finally {
      setValidating(false)
    }
  }

  const applyAutoCorrection = () => {
    if (validationResult?.correctedCode) {
      setValidatorInput(validationResult.correctedCode)
      setValidationResult(null)
      toast.success('Auto-correction applied!')
    }
  }

  const copyToClipboard = () => {
    if (validationResult?.correctedCode) {
      navigator.clipboard.writeText(validationResult.correctedCode)
      toast.success('Corrected code copied to clipboard!')
    } else {
      navigator.clipboard.writeText(validatorInput)
      toast.success('Original code copied to clipboard!')
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-900 dark:text-secondary-100 mb-2">
          Configuration Validator
        </h1>
        <p className="text-secondary-600 dark:text-secondary-400">
          Validate and get suggestions for your DevOps configuration files
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100 mb-6">
            Input Configuration
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                Configuration Type
              </label>
              <select
                className="input"
                value={validationType}
                onChange={(e) => setValidationType(e.target.value)}
              >
                {validationTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                Paste Configuration Code
              </label>
              <textarea
                className="input min-h-64 resize-none font-mono text-sm"
                placeholder={`Paste your ${validationTypes.find(t => t.value === validationType)?.label.toLowerCase()} code here...`}
                value={validatorInput}
                onChange={(e) => setValidatorInput(e.target.value)}
              />
            </div>

            <button
              onClick={validateCode}
              disabled={validating || !validatorInput.trim()}
              className="w-full btn-primary flex items-center justify-center"
            >
              {validating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Validating...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Validate Syntax
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results Section */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100">
              Validation Results
            </h2>
            {validatorInput && (
              <button
                onClick={copyToClipboard}
                className="btn-secondary flex items-center"
                title="Copy to clipboard"
              >
                <FileCode className="w-4 h-4" />
              </button>
            )}
          </div>

          {!validationResult ? (
            <div className="bg-secondary-100 dark:bg-secondary-800 rounded-lg p-8 text-center">
              <FileCode className="w-12 h-12 text-secondary-400 mx-auto mb-4" />
              <p className="text-secondary-600 dark:text-secondary-400">
                Paste your configuration code and click "Validate Syntax" to see results
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className={`flex items-center p-3 rounded-lg ${
                validationResult.isValid 
                  ? 'bg-success-100 dark:bg-success-900 text-success-800 dark:text-success-200' 
                  : 'bg-error-100 dark:bg-error-900 text-error-800 dark:text-error-200'
              }`}>
                {validationResult.isValid ? (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    <span className="font-medium">Syntax is valid!</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 mr-2" />
                    <span className="font-medium">Syntax errors found</span>
                  </>
                )}
              </div>

              {validationResult.errors.length > 0 && (
                <div className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg p-3">
                  <h4 className="font-medium text-error-800 dark:text-error-200 mb-2">Errors:</h4>
                  <ul className="text-sm text-error-700 dark:text-error-300 space-y-1">
                    {validationResult.errors.map((error, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-error-500 mr-2">•</span>
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {validationResult.suggestions.length > 0 && (
                <div className="bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-lg p-3">
                  <h4 className="font-medium text-warning-800 dark:text-warning-200 mb-2">Suggestions:</h4>
                  <ul className="text-sm text-warning-700 dark:text-warning-300 space-y-1">
                    {validationResult.suggestions.map((suggestion, index) => (
                      <li key={index} className="flex items-start">
                        <AlertCircle className="w-3 h-3 mr-2 mt-1 flex-shrink-0" />
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {validationResult.correctedCode && (
                <div className="space-y-2">
                  <button
                    onClick={applyAutoCorrection}
                    className="w-full btn-secondary flex items-center justify-center"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Apply Auto-Correction
                  </button>
                  <div className="bg-secondary-100 dark:bg-secondary-800 rounded-lg p-3">
                    <h4 className="font-medium text-secondary-700 dark:text-secondary-300 mb-2">Preview of corrections:</h4>
                    <div className="bg-secondary-900 dark:bg-black rounded p-2 overflow-auto max-h-32">
                      <pre className="text-xs font-mono">
                        <code>{validationResult.correctedCode}</code>
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Validator
