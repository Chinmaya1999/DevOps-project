import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, Award, BookOpen, Target, Zap, Cloud, Server, CheckCircle, Lock, PlayCircle, TrendingUp, Star, FileText, Code } from 'lucide-react'

interface RoadmapStep {
  id: string
  title: string
  description: string
  duration: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  prerequisites: string[]
  skills: string[]
  resources: {
    type: 'course' | 'documentation' | 'tutorial' | 'project' | 'certification'
    title: string
    url: string
    provider: string
    id: string
  }[]
  status: 'locked' | 'available' | 'in-progress' | 'completed'
  progress: number
}

interface RoadmapPath {
  id: string
  name: string
  description: string
  icon: React.ElementType
  color: string
  totalDuration: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  steps: RoadmapStep[]
}

const Roadmap: React.FC = () => {
  const [selectedPath, setSelectedPath] = useState<string>('devops')
  const [paths, setPaths] = useState<RoadmapPath[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const roadmapPaths: RoadmapPath[] = [
    {
      id: 'devops',
      name: 'DevOps Engineer',
      description: 'Complete roadmap to become a DevOps Engineer with modern tools and practices',
      icon: Server,
      color: 'from-blue-500 to-indigo-600',
      totalDuration: '6-12 months',
      difficulty: 'intermediate',
      steps: [
        {
          id: 'devops-1',
          title: 'Linux Fundamentals',
          description: 'Master Linux command line, system administration, and shell scripting',
          duration: '4-6 weeks',
          difficulty: 'beginner',
          prerequisites: [],
          skills: ['Linux CLI', 'Shell Scripting', 'System Administration', 'File Management'],
          resources: [
            { type: 'course', title: 'Linux Fundamentals for DevOps', url: '#', provider: 'Linux Academy', id: 'linux-fundamentals' },
            { type: 'tutorial', title: 'Complete Bash Scripting Guide', url: '#', provider: 'GNU Documentation', id: 'bash-scripting-guide' },
            { type: 'project', title: 'Build a Linux Server Setup', url: '#', provider: 'Practice Project', id: 'devops-pipeline-project' }
          ],
          status: 'available',
          progress: 0
        },
        {
          id: 'devops-2',
          title: 'Version Control with Git',
          description: 'Learn Git version control, branching strategies, and collaborative workflows',
          duration: '2-3 weeks',
          difficulty: 'beginner',
          prerequisites: ['Linux Fundamentals'],
          skills: ['Git Commands', 'Branching', 'Merge Strategies', 'GitHub/GitLab'],
          resources: [
            { type: 'course', title: 'Git Complete Course', url: '#', provider: 'Udemy', id: 'linux-fundamentals' },
            { type: 'documentation', title: 'Pro Git Book', url: '#', provider: 'Git SCM', id: 'bash-scripting-guide' },
            { type: 'tutorial', title: 'GitHub Workflow Tutorial', url: '#', provider: 'GitHub', id: 'devops-pipeline-project' }
          ],
          status: 'locked',
          progress: 0
        },
        {
          id: 'devops-3',
          title: 'Containerization with Docker',
          description: 'Master Docker containers, images, and container orchestration basics',
          duration: '3-4 weeks',
          difficulty: 'intermediate',
          prerequisites: ['Version Control with Git'],
          skills: ['Docker Containers', 'Dockerfile', 'Docker Compose', 'Image Management'],
          resources: [
            { type: 'course', title: 'Docker Mastery', url: '#', provider: 'Udemy', id: 'docker-mastery' },
            { type: 'documentation', title: 'Docker Official Docs', url: '#', provider: 'Docker', id: 'github-actions-tutorial' },
            { type: 'project', title: 'Containerize a Web Application', url: '#', provider: 'Hands-on', id: 'terraform-infrastructure' }
          ],
          status: 'locked',
          progress: 0
        },
        {
          id: 'devops-4',
          title: 'CI/CD Pipelines',
          description: 'Build continuous integration and deployment pipelines with Jenkins/GitHub Actions',
          duration: '4-5 weeks',
          difficulty: 'intermediate',
          prerequisites: ['Containerization with Docker'],
          skills: ['Jenkins', 'GitHub Actions', 'Pipeline Design', 'Automated Testing'],
          resources: [
            { type: 'course', title: 'CI/CD with Jenkins', url: '#', provider: 'CloudBees', id: 'aws-solutions-architect' },
            { type: 'tutorial', title: 'GitHub Actions Guide', url: '#', provider: 'GitHub Docs', id: 'kubernetes-basics' },
            { type: 'project', title: 'Build a CI/CD Pipeline', url: '#', provider: 'Practice', id: 'kubernetes-cluster-setup' }
          ],
          status: 'locked',
          progress: 0
        },
        {
          id: 'devops-5',
          title: 'Kubernetes Orchestration',
          description: 'Learn Kubernetes for container orchestration at scale',
          duration: '6-8 weeks',
          difficulty: 'advanced',
          prerequisites: ['CI/CD Pipelines'],
          skills: ['Kubernetes', 'Pods & Services', 'Deployments', 'Helm'],
          resources: [
            { type: 'course', title: 'Kubernetes for Developers', url: '#', provider: 'CNCF', id: 'linux-fundamentals' },
            { type: 'documentation', title: 'K8s Official Docs', url: '#', provider: 'Kubernetes', id: 'bash-scripting-guide' },
            { type: 'certification', title: 'CKAD Certification Prep', url: '#', provider: 'CNCF', id: 'devops-pipeline-project' }
          ],
          status: 'locked',
          progress: 0
        },
        {
          id: 'devops-6',
          title: 'Infrastructure as Code',
          description: 'Automate infrastructure provisioning with Terraform and CloudFormation',
          duration: '4-6 weeks',
          difficulty: 'advanced',
          prerequisites: ['Kubernetes Orchestration'],
          skills: ['Terraform', 'CloudFormation', 'IaC Principles', 'State Management'],
          resources: [
            { type: 'course', title: 'Terraform Deep Dive', url: '#', provider: 'HashiCorp', id: 'docker-mastery' },
            { type: 'documentation', title: 'Terraform Docs', url: '#', provider: 'HashiCorp', id: 'github-actions-tutorial' },
            { type: 'project', title: 'Deploy Infrastructure with IaC', url: '#', provider: 'Project', id: 'terraform-infrastructure' }
          ],
          status: 'locked',
          progress: 0
        },
        {
          id: 'devops-7',
          title: 'Monitoring & Observability',
          description: 'Implement monitoring, logging, and observability with Prometheus, Grafana, and ELK',
          duration: '4-5 weeks',
          difficulty: 'advanced',
          prerequisites: ['Infrastructure as Code'],
          skills: ['Prometheus', 'Grafana', 'ELK Stack', 'APM Tools'],
          resources: [
            { type: 'course', title: 'Monitoring Fundamentals', url: '#', provider: 'Prometheus', id: 'aws-solutions-architect' },
            { type: 'tutorial', title: 'Grafana Dashboard Guide', url: '#', provider: 'Grafana', id: 'kubernetes-basics' },
            { type: 'project', title: 'Setup Monitoring Stack', url: '#', provider: 'Hands-on', id: 'kubernetes-cluster-setup' }
          ],
          status: 'locked',
          progress: 0
        },
        {
          id: 'devops-8',
          title: 'DevOps Security & DevSecOps',
          description: 'Learn security practices in DevOps pipelines and infrastructure',
          duration: '3-4 weeks',
          difficulty: 'advanced',
          prerequisites: ['Monitoring & Observability'],
          skills: ['DevSecOps', 'Security Scanning', 'Compliance', 'Secret Management'],
          resources: [
            { type: 'course', title: 'DevSecOps Fundamentals', url: '#', provider: 'OWASP', id: 'linux-fundamentals' },
            { type: 'documentation', title: 'Security Best Practices', url: '#', provider: 'SANS', id: 'bash-scripting-guide' },
            { type: 'certification', title: 'Security+ Certification', url: '#', provider: 'CompTIA', id: 'devops-pipeline-project' }
          ],
          status: 'locked',
          progress: 0
        }
      ]
    },
    {
      id: 'cloud',
      name: 'Cloud Engineer',
      description: 'Complete roadmap to become a Cloud Engineer with AWS, Azure, and GCP expertise',
      icon: Cloud,
      color: 'from-purple-500 to-pink-600',
      totalDuration: '8-14 months',
      difficulty: 'intermediate',
      steps: [
        {
          id: 'cloud-1',
          title: 'Cloud Computing Fundamentals',
          description: 'Understand cloud concepts, service models, and deployment models',
          duration: '2-3 weeks',
          difficulty: 'beginner',
          prerequisites: [],
          skills: ['Cloud Concepts', 'Service Models', 'Deployment Models', 'Cloud Providers'],
          resources: [
            { type: 'course', title: 'Cloud Computing Basics', url: '#', provider: 'Coursera', id: 'linux-fundamentals' },
            { type: 'documentation', title: 'Cloud Computing Guide', url: '#', provider: 'AWS', id: 'bash-scripting-guide' },
            { type: 'certification', title: 'Cloud Practitioner', url: '#', provider: 'AWS/Azure/GCP', id: 'devops-pipeline-project' }
          ],
          status: 'available',
          progress: 0
        },
        {
          id: 'cloud-2',
          title: 'AWS Core Services',
          description: 'Master essential AWS services: EC2, S3, RDS, VPC, and more',
          duration: '6-8 weeks',
          difficulty: 'intermediate',
          prerequisites: ['Cloud Computing Fundamentals'],
          skills: ['EC2', 'S3', 'RDS', 'VPC', 'IAM', 'Lambda'],
          resources: [
            { type: 'course', title: 'AWS Solutions Architect', url: '#', provider: 'Udemy', id: 'docker-mastery' },
            { type: 'documentation', title: 'AWS Documentation', url: '#', provider: 'AWS', id: 'github-actions-tutorial' },
            { type: 'certification', title: 'AWS SAA-C03 Prep', url: '#', provider: 'AWS', id: 'terraform-infrastructure' }
          ],
          status: 'locked',
          progress: 0
        },
        {
          id: 'cloud-3',
          title: 'Azure Fundamentals',
          description: 'Learn Microsoft Azure platform and core services',
          duration: '4-6 weeks',
          difficulty: 'intermediate',
          prerequisites: ['AWS Core Services'],
          skills: ['Azure Portal', 'Virtual Machines', 'Storage', 'Networking', 'Azure AD'],
          resources: [
            { type: 'course', title: 'Azure Fundamentals', url: '#', provider: 'Microsoft Learn', id: 'aws-solutions-architect' },
            { type: 'documentation', title: 'Azure Docs', url: '#', provider: 'Microsoft', id: 'kubernetes-basics' },
            { type: 'certification', title: 'AZ-900 Prep', url: '#', provider: 'Microsoft', id: 'kubernetes-cluster-setup' }
          ],
          status: 'locked',
          progress: 0
        },
        {
          id: 'cloud-4',
          title: 'Google Cloud Platform',
          description: 'Master GCP services and architecture',
          duration: '4-6 weeks',
          difficulty: 'intermediate',
          prerequisites: ['Azure Fundamentals'],
          skills: ['Compute Engine', 'Cloud Storage', 'BigQuery', 'GKE', 'Cloud Functions'],
          resources: [
            { type: 'course', title: 'GCP Fundamentals', url: '#', provider: 'Google Cloud', id: 'linux-fundamentals' },
            { type: 'documentation', title: 'GCP Documentation', url: '#', provider: 'Google', id: 'bash-scripting-guide' },
            { type: 'certification', title: 'Associate Cloud Engineer', url: '#', provider: 'Google', id: 'devops-pipeline-project' }
          ],
          status: 'locked',
          progress: 0
        },
        {
          id: 'cloud-5',
          title: 'Cloud Architecture & Design',
          description: 'Design scalable and resilient cloud architectures',
          duration: '4-5 weeks',
          difficulty: 'advanced',
          prerequisites: ['Google Cloud Platform'],
          skills: ['Architecture Patterns', 'High Availability', 'Scalability', 'Cost Optimization'],
          resources: [
            { type: 'course', title: 'Cloud Architecture', url: '#', provider: 'AWS/Azure/GCP', id: 'docker-mastery' },
            { type: 'documentation', title: 'Well-Architected Framework', url: '#', provider: 'AWS', id: 'github-actions-tutorial' },
            { type: 'project', title: 'Design Cloud Solutions', url: '#', provider: 'Case Studies', id: 'terraform-infrastructure' }
          ],
          status: 'locked',
          progress: 0
        },
        {
          id: 'cloud-6',
          title: 'Cloud Security & Compliance',
          description: 'Implement security best practices and compliance in cloud environments',
          duration: '3-4 weeks',
          difficulty: 'advanced',
          prerequisites: ['Cloud Architecture & Design'],
          skills: ['Cloud Security', 'IAM', 'Compliance', 'Data Protection'],
          resources: [
            { type: 'course', title: 'Cloud Security', url: '#', provider: 'Cloud Security Alliance', id: 'aws-solutions-architect' },
            { type: 'documentation', title: 'Security Best Practices', url: '#', provider: 'CSP Docs', id: 'kubernetes-basics' },
            { type: 'certification', title: 'Security Specialty', url: '#', provider: 'AWS/Azure', id: 'kubernetes-cluster-setup' }
          ],
          status: 'locked',
          progress: 0
        },
        {
          id: 'cloud-7',
          title: 'Multi-Cloud & Hybrid Cloud',
          description: 'Manage multi-cloud and hybrid cloud environments',
          duration: '4-5 weeks',
          difficulty: 'advanced',
          prerequisites: ['Cloud Security & Compliance'],
          skills: ['Multi-Cloud', 'Hybrid Cloud', 'Cloud Migration', 'Interoperability'],
          resources: [
            { type: 'course', title: 'Multi-Cloud Strategy', url: '#', provider: 'Various', id: 'linux-fundamentals' },
            { type: 'documentation', title: 'Hybrid Cloud Guide', url: '#', provider: 'Vendor Docs', id: 'bash-scripting-guide' },
            { type: 'project', title: 'Multi-Cloud Setup', url: '#', provider: 'Advanced', id: 'devops-pipeline-project' }
          ],
          status: 'locked',
          progress: 0
        },
        {
          id: 'cloud-8',
          title: 'Cloud DevOps & Automation',
          description: 'Automate cloud operations and implement DevOps in cloud',
          duration: '4-6 weeks',
          difficulty: 'advanced',
          prerequisites: ['Multi-Cloud & Hybrid Cloud'],
          skills: ['Cloud DevOps', 'Infrastructure as Code', 'Automation', 'CI/CD in Cloud'],
          resources: [
            { type: 'course', title: 'Cloud DevOps', url: '#', provider: 'Cloud Providers', id: 'docker-mastery' },
            { type: 'documentation', title: 'DevOps Best Practices', url: '#', provider: 'Industry', id: 'github-actions-tutorial' },
            { type: 'project', title: 'Cloud Automation Project', url: '#', provider: 'Capstone', id: 'terraform-infrastructure' }
          ],
          status: 'locked',
          progress: 0
        }
      ]
    }
  ]

  useEffect(() => {
    setPaths(roadmapPaths)
    setLoading(false)
  }, [])

  const getStatusColor = (status: RoadmapStep['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-500 text-white'
      case 'in-progress': return 'bg-blue-500 text-white'
      case 'available': return 'bg-yellow-500 text-white'
      case 'locked': return 'bg-gray-400 text-white'
      default: return 'bg-gray-400 text-white'
    }
  }

  const getDifficultyColor = (difficulty: RoadmapStep['difficulty']) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800 border-green-200'
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'advanced': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getResourceIcon = (type: RoadmapStep['resources'][0]['type']) => {
    switch (type) {
      case 'course': return BookOpen
      case 'documentation': return FileText
      case 'tutorial': return Code
      case 'project': return Target
      case 'certification': return Award
      default: return BookOpen
    }
  }

  const currentPath = paths.find(p => p.id === selectedPath)

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
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-5xl md:text-6xl font-black text-gray-900 dark:text-white mb-4">
            <span className="text-gradient animated-gradient">DevOps & Cloud Roadmap</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Your AI-powered learning path to becoming a DevOps or Cloud Engineer
          </p>
        </div>

        {/* Path Selection */}
        <div className="mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {paths.map((path) => {
              const Icon = path.icon
              return (
                <button
                  key={path.id}
                  onClick={() => setSelectedPath(path.id)}
                  className={`p-8 rounded-2xl border-2 transition-all duration-300 ${
                    selectedPath === path.id
                      ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 shadow-xl'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center mb-4">
                    <div className={`w-16 h-16 bg-gradient-to-r ${path.color} rounded-2xl flex items-center justify-center shadow-lg`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <div className="ml-4 text-left">
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{path.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{path.totalDuration}</p>
                    </div>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 text-left mb-4">{path.description}</p>
                  <div className="flex items-center justify-between">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getDifficultyColor(path.difficulty)}`}>
                      {path.difficulty.toUpperCase()}
                    </span>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Target className="w-4 h-4 mr-1" />
                      {path.steps.length} Steps
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Roadmap Steps */}
        {currentPath && (
          <div className="space-y-8">
            {/* Progress Overview */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Your Progress - {currentPath.name}
                </h2>
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {currentPath.steps.filter(s => s.status === 'completed').length}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                      {currentPath.steps.filter(s => s.status === 'in-progress').length}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">In Progress</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-600 dark:text-gray-400">
                      {currentPath.steps.filter(s => s.status === 'locked').length}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Locked</div>
                  </div>
                </div>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 h-4 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${(currentPath.steps.filter(s => s.status === 'completed').length / currentPath.steps.length) * 100}%` 
                  }}
                ></div>
              </div>
            </div>

            {/* Steps Timeline */}
            <div className="relative">
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-300 dark:bg-gray-600"></div>
              
              {currentPath.steps.map((step, index) => (
                <div key={step.id} className="relative flex items-start mb-12">
                  {/* Step Circle */}
                  <div className="relative z-10 flex items-center justify-center w-16 h-16 bg-white dark:bg-gray-800 rounded-full border-4 border-gray-300 dark:border-gray-600 shadow-lg">
                    {step.status === 'completed' ? (
                      <CheckCircle className="w-8 h-8 text-green-500" />
                    ) : step.status === 'in-progress' ? (
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <PlayCircle className="w-5 h-5 text-white" />
                      </div>
                    ) : step.status === 'locked' ? (
                      <Lock className="w-6 h-6 text-gray-400" />
                    ) : (
                      <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                        <Zap className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Step Content */}
                  <div className="ml-8 flex-1">
                    <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-xl border-2 p-8 ${
                      step.status === 'locked' ? 'border-gray-300 dark:border-gray-600 opacity-75' : 'border-gray-200 dark:border-gray-700'
                    }`}>
                      {/* Step Header */}
                      <div className="flex items-start justify-between mb-6">
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            {step.title}
                          </h3>
                          <div className="flex items-center space-x-4">
                            <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getDifficultyColor(step.difficulty)}`}>
                              {step.difficulty.toUpperCase()}
                            </span>
                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(step.status)}`}>
                              {step.status.replace('-', ' ').toUpperCase()}
                            </span>
                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                              <Clock className="w-4 h-4 mr-1" />
                              {step.duration}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Step {index + 1} of {currentPath.steps.length}</div>
                          {step.progress > 0 && (
                            <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div 
                                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full"
                                style={{ width: `${step.progress}%` }}
                              ></div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
                        {step.description}
                      </p>

                      {/* Skills */}
                      <div className="mb-6">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Skills You'll Learn</h4>
                        <div className="flex flex-wrap gap-2">
                          {step.skills.map((skill, skillIndex) => (
                            <span key={skillIndex} className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg border border-blue-200 dark:border-blue-800 text-sm">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Prerequisites */}
                      {step.prerequisites.length > 0 && (
                        <div className="mb-6">
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Prerequisites</h4>
                          <div className="flex flex-wrap gap-2">
                            {step.prerequisites.map((prereq, prereqIndex) => (
                              <span key={prereqIndex} className="px-3 py-1 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-lg border border-amber-200 dark:border-amber-800 text-sm">
                                {prereq}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Resources */}
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Learning Resources</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {step.resources.map((resource, resourceIndex) => {
                            const ResourceIcon = getResourceIcon(resource.type)
                            return (
                              <button
                                key={resourceIndex}
                                onClick={() => navigate(`/resources/${resource.type}/${resource.id}`)}
                                className="block p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600 transition-colors text-left"
                              >
                                <div className="flex items-center mb-2">
                                  <ResourceIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
                                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase">
                                    {resource.type}
                                  </span>
                                </div>
                                <h5 className="font-semibold text-gray-900 dark:text-white mb-1">
                                  {resource.title}
                                </h5>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {resource.provider}
                                </p>
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="mt-6 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {step.status === 'available' && (
                            <button className="btn-primary">
                              <PlayCircle className="w-4 h-4 mr-2" />
                              Start Learning
                            </button>
                          )}
                          {step.status === 'in-progress' && (
                            <button className="btn-primary">
                              <TrendingUp className="w-4 h-4 mr-2" />
                              Continue Learning
                            </button>
                          )}
                          {step.status === 'completed' && (
                            <button className="btn-secondary">
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Review & Practice
                            </button>
                          )}
                        </div>
                        {step.status !== 'locked' && (
                          <button className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">
                            View Details →
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Recommendations */}
        <div className="mt-16 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-2xl border border-purple-200 dark:border-purple-800 p-8">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <Star className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white ml-4">
              AI-Powered Recommendations
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Personalized Path</h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Based on your current skills and learning pace, we recommend focusing on containerization fundamentals first.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Learning Schedule</h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Dedicate 10-15 hours per week to complete the DevOps roadmap in 6 months.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Next Steps</h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Complete Linux Fundamentals to unlock 3 more learning modules.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Roadmap
