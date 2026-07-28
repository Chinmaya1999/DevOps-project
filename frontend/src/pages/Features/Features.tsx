import React from 'react'
import { Link } from 'react-router-dom'
import Header from '../../components/Header/Header'
import { Zap, Cloud, GitBranch, Shield, Cpu, Users, ArrowRight } from 'lucide-react'

const Features: React.FC = () => {
  const features = [
    {
      icon: Zap,
      title: 'One-Click Deployment',
      description: 'Deploy your applications to production with a single click. No manual configuration needed - just select, click, and go live.',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: Cloud,
      title: 'Predefined Terraform Templates',
      description: 'Production-ready Terraform templates for AWS, Azure, GCP, and Kubernetes. Deploy infrastructure in minutes, not days.',
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: GitBranch,
      title: 'Jenkins Pipeline Generator',
      description: 'Automatically generate Jenkinsfiles with CI/CD best practices. Build, test, and deploy with confidence.',
      color: 'from-green-500 to-green-600'
    },
    {
      icon: Shield,
      title: 'Production-Ready Configurations',
      description: 'All generated configurations follow industry standards and security best practices. Ready for enterprise use.',
      color: 'from-cyan-500 to-cyan-600'
    },
    {
      icon: Cpu,
      title: 'Docker Image Deployment',
      description: 'Build, push, and deploy Docker images to any registry. Automate your container workflow end-to-end.',
      color: 'from-orange-500 to-orange-600'
    },
    {
      icon: Users,
      title: 'Collaboration & Chat',
      description: 'Chat with other users, share knowledge, and solve DevOps problems together. Learn from the community.',
      color: 'from-pink-500 to-pink-600'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-900">
      <Header showAuthButtons={true} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Everything You Need for
            <span className="block text-gradient animated-gradient">Production Success</span>
          </h1>
          <p className="text-2xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto leading-relaxed">
            From one-click deployments to community collaboration - solve real DevOps challenges with production-ready solutions.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div
                key={index}
                className="group bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
              >
                <div className={`w-20 h-20 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-xl`}>
                  <Icon className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  {feature.title}
                </h3>
                <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                  {feature.description}
                </p>
                <Link
                  to="/register"
                  className="inline-flex items-center text-blue-600 dark:text-blue-400 font-semibold group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors duration-300"
                >
                  <span>Get Started</span>
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" />
                </Link>
              </div>
            )
          })}
        </div>

        <div className="mt-16 text-center">
          <Link
            to="/register"
            className="inline-block px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-200"
          >
            Start Using These Features Today
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Features
