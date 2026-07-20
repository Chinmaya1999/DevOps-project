import React from 'react'
import { Link } from 'react-router-dom'
import {
  GitBranch,
  FileCode,
  History,
  Zap,
  Shield,
  Cloud,
  BarChart3,
  ArrowRight,
  Package
} from 'lucide-react'
import { useDashboardStats } from '../../hooks/useDashboardStats'

const Dashboard: React.FC = () => {
  const { stats, loading, error } = useDashboardStats()
  const generators = [
    {
      name: 'Jenkins Pipeline',
      description: 'Generate production-ready Jenkinsfile for CI/CD pipelines',
      icon: FileCode,
      href: '/generator/jenkins',
      color: 'from-blue-500 to-blue-600',
      features: ['Multi-stage pipelines', 'Docker support', 'Test automation']
    },
    {
      name: 'GitHub Actions',
      description: 'Create GitHub Actions workflows for automated CI/CD',
      icon: Zap,
      href: '/generator/github-actions',
      color: 'from-purple-500 to-purple-600',
      features: ['Matrix builds', 'Docker builds', 'Multi-environment']
    },
    {
      name: 'Ansible Playbooks',
      description: 'Generate Ansible playbooks for infrastructure automation',
      icon: Shield,
      href: '/generator/ansible',
      color: 'from-green-500 to-green-600',
      features: ['Configuration management', 'Deployment automation', 'Role-based']
    },
    {
      name: 'Kubernetes YAML',
      description: 'Create Kubernetes manifests for container orchestration',
      icon: Cloud,
      href: '/generator/kubernetes',
      color: 'from-cyan-500 to-cyan-600',
      features: ['Deployments', 'Services', 'Ingress', 'HPA']
    },
    {
      name: 'Terraform IaC',
      description: 'Generate Terraform configuration for infrastructure as code',
      icon: BarChart3,
      href: '/generator/terraform',
      color: 'from-orange-500 to-orange-600',
      features: ['Multi-cloud', 'State management', 'Modular structure']
    },
    {
      name: 'Dockerfile',
      description: 'Generate production-ready Dockerfile for containerization',
      icon: Package,
      href: '/generator/dockerfile',
      color: 'from-indigo-500 to-indigo-600',
      features: ['Multi-stage builds', 'Optimization', 'Health checks']
    }
  ]

  const getDashboardStats = () => {
    if (loading) {
      return [
        { label: 'Total Generations', value: '...', icon: FileCode },
        { label: 'Active Projects', value: '...', icon: GitBranch },
        { label: 'Saved Configurations', value: '...', icon: History },
      ]
    }

    if (error) {
      return [
        { label: 'Total Generations', value: '!', icon: FileCode },
        { label: 'Active Projects', value: '!', icon: GitBranch },
        { label: 'Saved Configurations', value: '!', icon: History },
      ]
    }

    const totalGenerations = stats?.totalFiles || 0
    const activeProjects = Object.keys(stats?.filesByType || {}).length
    const savedConfigurations = stats?.totalFiles || 0

    return [
      { label: 'Total Generations', value: totalGenerations.toString(), icon: FileCode },
      { label: 'Active Projects', value: activeProjects.toString(), icon: GitBranch },
      { label: 'Saved Configurations', value: savedConfigurations.toString(), icon: History },
    ]
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-900 dark:text-secondary-100 mb-2">
          Welcome to DevOps  Generator
        </h1>
        <p className="text-secondary-600 dark:text-secondary-400">
          Generate production-ready configuration files for your DevOps workflows
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {getDashboardStats().map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="card p-6">
              <div className="flex items-center">
                <div className="p-3 bg-primary-100 rounded-lg dark:bg-primary-900">
                  <Icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-secondary-600 dark:text-secondary-400">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
                    {stat.value}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Generators Grid */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100 mb-6">
          Choose a Generator
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {generators.map((generator, index) => {
            const Icon = generator.icon
            return (
              <Link
                key={index}
                to={generator.href}
                className="card p-6 hover:shadow-lg transition-shadow duration-200 group"
              >
                <div className={`w-12 h-12 bg-gradient-to-r ${generator.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-2">
                  {generator.name}
                </h3>
                <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-4">
                  {generator.description}
                </p>
                <div className="space-y-2 mb-4">
                  {generator.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center text-xs text-secondary-500 dark:text-secondary-400">
                      <div className="w-1 h-1 bg-primary-500 rounded-full mr-2" />
                      {feature}
                    </div>
                  ))}
                </div>
                <div className="flex items-center text-primary-600 dark:text-primary-400 text-sm font-medium group-hover:text-primary-700 dark:group-hover:text-primary-300">
                  Get Started
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-200" />
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            to="/terraform-demos"
            className="flex items-center p-4 bg-secondary-50 dark:bg-secondary-800 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700 transition-colors duration-200"
          >
            <FileCode className="w-5 h-5 text-secondary-600 dark:text-secondary-400 mr-3" />
            <div>
              <p className="font-medium text-secondary-900 dark:text-secondary-100">
                Terraform Demos
              </p>
              <p className="text-sm text-secondary-600 dark:text-secondary-400">
                Browse pre-built Terraform templates
              </p>
            </div>
          </Link>
          
          <Link
            to="/history"
            className="flex items-center p-4 bg-secondary-50 dark:bg-secondary-800 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700 transition-colors duration-200"
          >
            <History className="w-5 h-5 text-secondary-600 dark:text-secondary-400 mr-3" />
            <div>
              <p className="font-medium text-secondary-900 dark:text-secondary-100">
                View History
              </p>
              <p className="text-sm text-secondary-600 dark:text-secondary-400">
                Access your previously generated configurations
              </p>
            </div>
          </Link>
          
          <div className="flex items-center p-4 bg-secondary-50 dark:bg-secondary-800 rounded-lg">
            <GitBranch className="w-5 h-5 text-secondary-600 dark:text-secondary-400 mr-3" />
            <div>
              <p className="font-medium text-secondary-900 dark:text-secondary-100">
                Documentation
              </p>
              <p className="text-sm text-secondary-600 dark:text-secondary-400">
                Learn how to use the generated files
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
