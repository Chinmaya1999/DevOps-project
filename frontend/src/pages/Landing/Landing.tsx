import React from 'react'
import { Link } from 'react-router-dom'
import Header from '../../components/Header/Header'
import {
  GitBranch,
  Zap,
  Shield,
  Cloud,
  BarChart3,
  ArrowRight,
  CheckCircle,
  Code,
  Terminal,
  Users,
  Star,
  Rocket,
  Cpu,
  Database,
  Globe,
  Lock,
  Sparkles,
  TrendingUp
} from 'lucide-react'

const Landing: React.FC = () => {
  const features = [
    {
      icon: GitBranch,
      title: 'Jenkins Pipeline',
      description: 'Generate production-ready Jenkinsfiles with multi-stage CI/CD pipelines',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: Zap,
      title: 'GitHub Actions',
      description: 'Create automated workflows with matrix builds and Docker support',
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: Shield,
      title: 'Ansible Playbooks',
      description: 'Build infrastructure automation with role-based configurations',
      color: 'from-green-500 to-green-600'
    },
    {
      icon: Cloud,
      title: 'Kubernetes YAML',
      description: 'Generate complete K8s manifests with deployments, services, and ingress',
      color: 'from-cyan-500 to-cyan-600'
    },
    {
      icon: BarChart3,
      title: 'Terraform IaC',
      description: 'Create infrastructure as code with multi-cloud support',
      color: 'from-orange-500 to-orange-600'
    }
  ]

  const benefits = [
    {
      icon: Rocket,
      title: 'Lightning Fast',
      description: 'Generate production-ready configurations in seconds, not hours'
    },
    {
      icon: Shield,
      title: 'Best Practices',
      description: 'All templates follow industry standards and security best practices'
    },
    {
      icon: Code,
      title: 'Clean Code',
      description: 'Well-structured, commented, and maintainable configuration files'
    },
    {
      icon: Users,
      title: 'Team Ready',
      description: 'Collaborate with your team and share configurations easily'
    },
    {
      icon: Lock,
      title: 'Secure',
      description: 'Enterprise-grade security with JWT authentication and data encryption'
    },
    {
      icon: TrendingUp,
      title: 'Scalable',
      description: 'Built to handle projects of any size, from startups to enterprises'
    }
  ]

  const stats = [
    { number: '5+', label: 'DevOps Tools' },
    { number: '100%', label: 'Production Ready' },
    { number: '0', label: 'Configuration Required' },
    { number: '24/7', label: 'Available' }
  ]

  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'DevOps Engineer at TechCorp',
      content: 'This tool has revolutionized our CI/CD pipeline setup. What used to take hours now takes minutes.',
      avatar: 'SC'
    },
    {
      name: 'Michael Rodriguez',
      role: 'Cloud Architect at CloudScale',
      content: 'The generated Kubernetes manifests are production-ready and follow all best practices. Incredible time saver!',
      avatar: 'MR'
    },
    {
      name: 'Emily Johnson',
      role: 'SRE at DevOps Inc',
      content: 'Finally, a tool that understands real-world DevOps needs. The Terraform templates are exceptional.',
      avatar: 'EJ'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-900 overflow-hidden">
      <Header transparent={true} />
      
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 floating-animation"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 floating-animation" style={{animationDelay: '2s'}}></div>
          <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 floating-animation" style={{animationDelay: '4s'}}></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
          <div className="text-center">
            {/* Floating Logo */}
            <div className="flex justify-center mb-8 fade-in-up">
              <div className="relative">
                <div className="absolute inset-0 hero-gradient rounded-full blur-2xl opacity-60 pulse-animation"></div>
                <div className="relative hero-gradient p-4 rounded-3xl shadow-2xl transform hover:rotate-12 transition-transform duration-500">
                  <GitBranch className="w-16 h-16 text-white" />
                </div>
              </div>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-black text-gray-900 dark:text-white mb-6 slide-in-left">
              <span className="block text-gradient animated-gradient">DevOps Pipeline</span>
              <span className="block text-gray-900 dark:text-white text-shadow-lg">Generator</span>
            </h1>
            
            <p className="text-2xl md:text-3xl text-gray-600 dark:text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed fade-in-up" style={{animationDelay: '0.2s'}}>
              Generate <span className="font-bold text-gradient">production-ready</span> DevOps configurations in seconds. 
              <br className="hidden md:block" />
              Jenkins, GitHub Actions, Ansible, Kubernetes, Terraform - all in one powerful platform.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16 fade-in-up" style={{animationDelay: '0.4s'}}>
              <Link
                to="/register"
                className="group relative px-10 py-5 hero-gradient text-white font-black text-lg rounded-2xl hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 overflow-hidden"
              >
                <span className="relative z-10 flex items-center justify-center">
                  Get Started Free
                  <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-indigo-700 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute inset-0 bg-white/20 rounded-2xl transform translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              </Link>
              
              <Link
                to="/login"
                className="group px-10 py-5 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl text-gray-900 dark:text-white font-black text-lg rounded-2xl border-2 border-gray-200 dark:border-gray-700 hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300"
              >
                <span className="flex items-center justify-center">
                  Sign In
                  <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" />
                </span>
              </Link>
            </div>

            {/* Enhanced Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto fade-in-up" style={{animationDelay: '0.6s'}}>
              {stats.map((stat, index) => (
                <div key={index} className="group text-center p-6 rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300">
                  <div className="text-4xl md:text-5xl font-black text-gradient mb-2">
                    {stat.number}
                  </div>
                  <div className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Features Section */}
      <section className="py-24 bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-black text-gray-900 dark:text-white mb-6">
              Everything You Need for
              <span className="block text-gradient animated-gradient">DevOps Excellence</span>
            </h2>
            <p className="text-2xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto leading-relaxed">
              Professional-grade tools for modern DevOps workflows. Generate, customize, and deploy with confidence.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div
                  key={index}
                  className="group feature-card fade-in-up"
                  style={{animationDelay: `${index * 0.1}s`}}
                >
                  <div className="relative">
                    <div className={`w-20 h-20 hero-gradient rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-xl`}>
                      <Icon className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-4">
                      {feature.title}
                    </h3>
                    <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                      {feature.description}
                    </p>
                    <div className="mt-6 flex items-center text-blue-600 dark:text-blue-400 font-semibold group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors duration-300">
                      <span>Learn more</span>
                      <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                Why Choose
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {" "}DevOps Generator?
                </span>
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                Stop wasting time on boilerplate configuration. Focus on what matters - building and deploying great software.
              </p>
              
              <div className="space-y-6">
                {benefits.map((benefit, index) => {
                  const Icon = benefit.icon
                  return (
                    <div key={index} className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                          {benefit.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300">
                          {benefit.description}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl blur-xl opacity-20"></div>
              <div className="relative bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-2xl">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 p-4 rounded-xl">
                    <Terminal className="w-6 h-6 text-blue-600 dark:text-blue-400 mb-2" />
                    <div className="text-sm font-medium text-gray-900 dark:text-white">CLI Ready</div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800 p-4 rounded-xl">
                    <Database className="w-6 h-6 text-purple-600 dark:text-purple-400 mb-2" />
                    <div className="text-sm font-medium text-gray-900 dark:text-white">Cloud Native</div>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 p-4 rounded-xl">
                    <Globe className="w-6 h-6 text-green-600 dark:text-green-400 mb-2" />
                    <div className="text-sm font-medium text-gray-900 dark:text-white">Multi-Cloud</div>
                  </div>
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900 dark:to-orange-800 p-4 rounded-xl">
                    <Cpu className="w-6 h-6 text-orange-600 dark:text-orange-400 mb-2" />
                    <div className="text-sm font-medium text-gray-900 dark:text-white">Automated</div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-700 dark:text-gray-300">Zero configuration required</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-700 dark:text-gray-300">Production-ready templates</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-700 dark:text-gray-300">Best practices included</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-700 dark:text-gray-300">Enterprise security</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Trusted by
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {" "}DevOps Professionals
              </span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Join thousands of engineers who've transformed their DevOps workflows
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gray-50 dark:bg-gray-800 p-8 rounded-2xl border border-gray-200 dark:border-gray-700">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                    {testimonial.avatar}
                  </div>
                  <div className="ml-4">
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {testimonial.role}
                    </div>
                  </div>
                </div>
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 dark:text-gray-300 italic">
                  "{testimonial.content}"
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Sparkles className="w-16 h-16 text-white mx-auto mb-6" />
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your DevOps Workflow?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands of developers who are already generating production-ready configurations in seconds, not hours.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="px-8 py-4 bg-white text-gray-900 font-semibold rounded-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-200"
            >
              Start Free Today
            </Link>
            <Link
              to="/login"
              className="px-8 py-4 bg-white/20 backdrop-blur text-white font-semibold rounded-xl border-2 border-white/30 hover:bg-white/30 transition-all duration-200"
            >
              View Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <GitBranch className="w-8 h-8 text-blue-400 mr-2" />
                <span className="text-xl font-bold">DevOps Generator</span>
              </div>
              <p className="text-gray-400">
                Generate production-ready DevOps configurations in seconds.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link to="/docs" className="hover:text-white transition-colors">Documentation</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/about" className="hover:text-white transition-colors">About</Link></li>
                <li><Link to="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link to="/careers" className="hover:text-white transition-colors">Careers</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/help" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link to="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                <li><Link to="/status" className="hover:text-white transition-colors">Status</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 DevOps Pipeline Generator. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Landing
