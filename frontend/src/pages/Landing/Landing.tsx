import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import Header from '../../components/Header/Header'
import {
  GitBranch,
  Zap,
  Shield,
  Cloud,
  ArrowRight,
  CheckCircle,
  Code,
  Users,
  Star,
  Rocket,
  Cpu,
  Lock,
  Sparkles,
  TrendingUp,
  Mail,
  Linkedin,
  Send,
  MessageSquare
} from 'lucide-react'

const Landing: React.FC = () => {
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await fetch('https://api.cmcloud.online/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contactForm),
      });

      if (response.ok) {
        setSubmitSuccess(true);
        setContactForm({ name: '', email: '', subject: '', message: '' });
        setTimeout(() => setSubmitSuccess(false), 5000);
      } else {
        alert('Failed to send message. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting contact form:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

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

  const benefits = [
    {
      icon: Rocket,
      title: 'Solve Real Production Issues',
      description: 'Tackle real-world DevOps challenges with pre-built solutions. From deployment failures to scaling issues - we have you covered.'
    },
    {
      icon: Shield,
      title: 'Enterprise-Grade Security',
      description: 'All configurations follow security best practices. IAM roles, VPC configurations, and secrets management built-in.'
    },
    {
      icon: Code,
      title: 'Learn & Study',
      description: 'Not just a tool - it is a learning platform. Study generated configurations to understand DevOps best practices and patterns.'
    },
    {
      icon: Users,
      title: 'Community Collaboration',
      description: 'Chat with fellow DevOps engineers, share solutions, and learn from real-world experiences. Ask questions and get answers.'
    },
    {
      icon: Lock,
      title: 'Production-Ready Templates',
      description: 'Every template is tested and validated. Deploy with confidence knowing your infrastructure will work as expected.'
    },
    {
      icon: TrendingUp,
      title: 'Continuous Improvement',
      description: 'Templates are regularly updated with latest cloud provider features and DevOps best practices.'
    }
  ]

  const stats = [
    { number: '50+', label: 'Terraform Templates' },
    { number: '100%', label: 'Production Ready' },
    { number: '1-Click', label: 'Deployment' },
    { number: '24/7', label: 'Community Support' }
  ]

  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'DevOps Engineer at TechCorp',
      content: 'AutoDevOps solved our deployment issues in minutes. The one-click deployment feature saved us hours of manual configuration work.',
      avatar: 'SC'
    },
    {
      name: 'Michael Rodriguez',
      role: 'Cloud Architect at CloudScale',
      content: 'The predefined Terraform templates are production-ready. We deployed our entire infrastructure across AWS and Azure in record time.',
      avatar: 'MR'
    },
    {
      name: 'Emily Johnson',
      role: 'SRE at DevOps Inc',
      content: 'The community chat feature is amazing. I got help solving a complex Jenkins pipeline issue within minutes. Great collaboration platform!',
      avatar: 'EJ'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-900 overflow-hidden">
      <Header transparent={true} />

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden" aria-labelledby="hero-heading">
        {/* Background Effects */}
        <div className="absolute inset-0" aria-hidden="true">
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 floating-animation"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 floating-animation" style={{ animationDelay: '2s' }}></div>
          <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 floating-animation" style={{ animationDelay: '4s' }}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
          <div className="text-center">
            {/* Floating Logo */}
            <div className="flex justify-center mb-8 fade-in-up" aria-hidden="true">
              <div className="relative">
                <div className="absolute inset-0 hero-gradient rounded-full blur-2xl opacity-60 pulse-animation"></div>
                <div className="relative hero-gradient p-4 rounded-3xl shadow-2xl transform hover:rotate-12 transition-transform duration-500">
                  <GitBranch className="w-16 h-16 text-white" />
                </div>
              </div>
            </div>

            <h1 id="hero-heading" className="text-6xl md:text-8xl font-black text-gray-900 dark:text-white mb-6 slide-in-left">
              <span className="block text-gradient animated-gradient">AutoDevOps</span>
              <span className="block text-gray-900 dark:text-white text-shadow-lg">Solve Real Production Issues</span>
            </h1>

            <p className="text-2xl md:text-3xl text-gray-600 dark:text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed fade-in-up" style={{ animationDelay: '0.2s' }}>
              <span className="font-bold text-gradient">Best DevOps Platform</span> for one-click deployment, predefined Terraform templates, 
              <br className="hidden md:block" />
              Jenkins CI/CD pipelines, Docker containerization, Kubernetes orchestration, and DevOps community collaboration.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16 fade-in-up" style={{ animationDelay: '0.4s' }}>
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto fade-in-up" style={{ animationDelay: '0.6s' }}>
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
      <section className="py-24 bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl" id="features" aria-labelledby="features-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 id="features-heading" className="text-5xl md:text-6xl font-black text-gray-900 dark:text-white mb-6">
              Everything You Need for
              <span className="block text-gradient animated-gradient">DevOps Production Success</span>
            </h2>
            <p className="text-2xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto leading-relaxed">
              Comprehensive DevOps automation tools: CI/CD pipelines, Infrastructure as Code, container orchestration, cloud deployment, and production-ready configurations.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div
                  key={index}
                  className="group feature-card fade-in-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
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

      {/* Detailed Features Section */}
      <section className="py-20 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-900" aria-labelledby="toolkit-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 id="toolkit-heading" className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Complete DevOps Automation Toolkit
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Every DevOps tool you need: Terraform IaC, Jenkins CI/CD, Docker containers, Kubernetes orchestration, Ansible automation, and cloud infrastructure deployment
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Vision */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Vision - One-Click Deploy</h3>
              <p className="text-gray-600 dark:text-gray-300">Visualize your infrastructure and deploy with a single click. No manual configuration required.</p>
            </div>

            {/* Deployments */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-4">
                <Rocket className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Deployments</h3>
              <p className="text-gray-600 dark:text-gray-300">Track and manage all your deployments in one place. Monitor status, logs, and rollback if needed.</p>
            </div>

            {/* GitHub Integration */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-gradient-to-r from-gray-700 to-gray-900 rounded-xl flex items-center justify-center mb-4">
                <GitBranch className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">GitHub Integration</h3>
              <p className="text-gray-600 dark:text-gray-300">Connect your repositories, analyze code, and automate workflows with seamless GitHub integration.</p>
            </div>

            {/* Jenkins Pipeline */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl flex items-center justify-center mb-4">
                <GitBranch className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Jenkins Pipeline</h3>
              <p className="text-gray-600 dark:text-gray-300">Generate production-ready Jenkinsfiles with multi-stage CI/CD pipelines, automated testing, and deployment.</p>
            </div>

            {/* GitHub Actions */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">GitHub Actions</h3>
              <p className="text-gray-600 dark:text-gray-300">Create automated workflows with matrix builds, Docker support, and custom actions for any CI/CD need.</p>
            </div>

            {/* Ansible Playbooks */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-500 rounded-xl flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Ansible Playbooks</h3>
              <p className="text-gray-600 dark:text-gray-300">Build infrastructure automation with role-based configurations, inventory management, and idempotent operations.</p>
            </div>

            {/* Kubernetes YAML */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-blue-600 rounded-xl flex items-center justify-center mb-4">
                <Cloud className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Kubernetes YAML</h3>
              <p className="text-gray-600 dark:text-gray-300">Generate complete K8s manifests with deployments, services, ingress, ConfigMaps, and Secrets for any workload.</p>
            </div>

            {/* Terraform IaC */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center mb-4">
                <Cloud className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Terraform IaC</h3>
              <p className="text-gray-600 dark:text-gray-300">Create infrastructure as code with multi-cloud support for AWS, Azure, GCP, and on-premise deployments.</p>
            </div>

            {/* Dockerfile */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center mb-4">
                <Cpu className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Dockerfile</h3>
              <p className="text-gray-600 dark:text-gray-300">Generate optimized Dockerfiles with multi-stage builds, security scanning, and best practices for any application.</p>
            </div>

            {/* DevOps Documentation */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center mb-4">
                <Code className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">DevOps Documentation</h3>
              <p className="text-gray-600 dark:text-gray-300">Access comprehensive documentation, tutorials, and best practices for all DevOps tools and technologies.</p>
            </div>

            {/* Terraform Demos */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Terraform Demos</h3>
              <p className="text-gray-600 dark:text-gray-300">Interactive demos showing real-world Terraform deployments across multiple cloud providers and use cases.</p>
            </div>

            {/* Validator */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mb-4">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Validator</h3>
              <p className="text-gray-600 dark:text-gray-300">Validate your configurations against best practices and security standards before deployment.</p>
            </div>

            {/* History */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-xl flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">History</h3>
              <p className="text-gray-600 dark:text-gray-300">Track all your generated configurations, deployments, and changes with complete version history.</p>
            </div>

            {/* Upgrade to Premium */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Upgrade to Premium</h3>
              <p className="text-gray-600 dark:text-gray-300">Unlock advanced features, priority support, unlimited templates, and team collaboration tools.</p>
            </div>

         

            {/* Scripts */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-gradient-to-r from-slate-600 to-slate-800 rounded-xl flex items-center justify-center mb-4">
                <Code className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Scripts</h3>
              <p className="text-gray-600 dark:text-gray-300">Generate automation scripts in Bash, Shell, and Python for common DevOps tasks and operations.</p>
            </div>

            {/* Bash Script */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-gradient-to-r from-gray-600 to-gray-800 rounded-xl flex items-center justify-center mb-4">
                <Code className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Bash Script</h3>
              <p className="text-gray-600 dark:text-gray-300">Automate Linux/Unix tasks with Bash scripts for system administration, deployment, and monitoring.</p>
            </div>

            {/* Shell Script */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-gradient-to-r from-zinc-600 to-zinc-800 rounded-xl flex items-center justify-center mb-4">
                <Code className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Shell Script</h3>
              <p className="text-gray-600 dark:text-gray-300">Cross-platform shell scripts for automation across different Unix-like systems and environments.</p>
            </div>

            {/* Python Script */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-yellow-500 rounded-xl flex items-center justify-center mb-4">
                <Code className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Python Script</h3>
              <p className="text-gray-600 dark:text-gray-300">Powerful Python automation scripts for complex DevOps workflows, API integrations, and data processing.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-white dark:bg-gray-900" id="pricing" aria-labelledby="pricing-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 id="pricing-heading" className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Affordable DevOps Platform Pricing
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Choose the DevOps automation plan that fits your needs. Free tier available with unlimited Terraform templates and CI/CD pipelines in Pro plan.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-2xl border-2 border-gray-200 dark:border-gray-700">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Free</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">Perfect for individuals and small projects</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">$0</span>
                <span className="text-gray-600 dark:text-gray-300">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-gray-700 dark:text-gray-300">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                  5 Terraform templates/month
                </li>
                <li className="flex items-center text-gray-700 dark:text-gray-300">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                  Basic Jenkins pipelines
                </li>
                <li className="flex items-center text-gray-700 dark:text-gray-300">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                  Community support
                </li>
                <li className="flex items-center text-gray-700 dark:text-gray-300">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                  1 deployment/month
                </li>
              </ul>
              <Link
                to="/register"
                className="block w-full py-3 text-center bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white font-semibold rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Get Started
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-8 rounded-2xl transform scale-105 shadow-2xl">
              <div className="bg-yellow-400 text-xs font-bold px-3 py-1 rounded-full inline-block mb-4">POPULAR</div>
              <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
              <p className="text-white/80 mb-6">For growing teams and professionals</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">$29</span>
                <span className="text-white/80">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-white">
                  <CheckCircle className="w-5 h-5 text-green-300 mr-2" />
                  Unlimited Terraform templates
                </li>
                <li className="flex items-center text-white">
                  <CheckCircle className="w-5 h-5 text-green-300 mr-2" />
                  Advanced CI/CD pipelines
                </li>
                <li className="flex items-center text-white">
                  <CheckCircle className="w-5 h-5 text-green-300 mr-2" />
                  Priority email support
                </li>
                <li className="flex items-center text-white">
                  <CheckCircle className="w-5 h-5 text-green-300 mr-2" />
                  Unlimited deployments
                </li>
                <li className="flex items-center text-white">
                  <CheckCircle className="w-5 h-5 text-green-300 mr-2" />
                  Team collaboration
                </li>
              </ul>
              <Link
                to="/register"
                className="block w-full py-3 text-center bg-white text-blue-600 font-semibold rounded-xl hover:bg-gray-100 transition-colors"
              >
                Start Free Trial
              </Link>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-2xl border-2 border-gray-200 dark:border-gray-700">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Enterprise</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">For large organizations</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">Custom</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-gray-700 dark:text-gray-300">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                  Everything in Pro
                </li>
                <li className="flex items-center text-gray-700 dark:text-gray-300">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                  Custom integrations
                </li>
                <li className="flex items-center text-gray-700 dark:text-gray-300">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                  Dedicated support
                </li>
                <li className="flex items-center text-gray-700 dark:text-gray-300">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                  SLA guarantee
                </li>
                <li className="flex items-center text-gray-700 dark:text-gray-300">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                  On-premise deployment
                </li>
              </ul>
              <Link
                to="/#contact"
                className="block w-full py-3 text-center bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white font-semibold rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Documentation Section */}
      <section className="py-20 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-900" id="documentation" aria-labelledby="docs-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 id="docs-heading" className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              DevOps Documentation & Tutorials
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Learn DevOps best practices, CI/CD pipeline tutorials, Terraform guides, Kubernetes deployment documentation, and infrastructure automation
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                <GitBranch className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">Getting Started</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Quick start guides and installation instructions</p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4">
                <Cloud className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">Terraform Guides</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">In-depth Terraform tutorials and examples</p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">CI/CD Pipelines</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Jenkins and GitHub Actions best practices</p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center mb-4">
                <Cpu className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">Containerization</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Docker and Kubernetes deployment guides</p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 bg-white dark:bg-gray-900" id="about">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                About AutoDevOps
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-6">
                AutoDevOps was built by DevOps engineers, for DevOps engineers. We understand the pain of manual configuration, the complexity of infrastructure as code, and the need for reliable, production-ready solutions.
              </p>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                Our mission is to democratize DevOps by making enterprise-grade infrastructure accessible to everyone. Whether you are a startup founder, a seasoned engineer, or a student learning DevOps, AutoDevOps provides the tools and community you need to succeed.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                  <span className="text-gray-700 dark:text-gray-300">Built by industry professionals</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
                  <span className="text-gray-700 dark:text-gray-300">Trusted by 10,000+ developers</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-gray-700 dark:text-gray-300">50,000+ successful deployments</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-orange-500 rounded-full mr-3"></div>
                  <span className="text-gray-700 dark:text-gray-300">Active community support</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl blur-xl opacity-20"></div>
              <div className="relative bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 p-8 rounded-3xl">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Our Values</h3>
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Simplicity</h4>
                    <p className="text-gray-600 dark:text-gray-300">Complex DevOps made simple with intuitive tools and clear documentation.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Reliability</h4>
                    <p className="text-gray-600 dark:text-gray-300">Production-ready templates that have been tested and validated.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Community</h4>
                    <p className="text-gray-600 dark:text-gray-300">Learn from and contribute to a growing community of DevOps professionals.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Innovation</h4>
                    <p className="text-gray-600 dark:text-gray-300">Continuously improving with the latest DevOps trends and technologies.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                More Than Just a Tool -
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {" "}A Complete DevOps Solution
                </span>
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                Whether you are a beginner learning DevOps or an experienced engineer solving production issues, AutoDevOps provides the tools, templates, and community support you need.
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
                    <Zap className="w-6 h-6 text-blue-600 dark:text-blue-400 mb-2" />
                    <div className="text-sm font-medium text-gray-900 dark:text-white">1-Click Deploy</div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800 p-4 rounded-xl">
                    <Cloud className="w-6 h-6 text-purple-600 dark:text-purple-400 mb-2" />
                    <div className="text-sm font-medium text-gray-900 dark:text-white">Terraform</div>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 p-4 rounded-xl">
                    <GitBranch className="w-6 h-6 text-green-600 dark:text-green-400 mb-2" />
                    <div className="text-sm font-medium text-gray-900 dark:text-white">Jenkins</div>
                  </div>
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900 dark:to-orange-800 p-4 rounded-xl">
                    <Cpu className="w-6 h-6 text-orange-600 dark:text-orange-400 mb-2" />
                    <div className="text-sm font-medium text-gray-900 dark:text-white">Docker</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-700 dark:text-gray-300">Solve production issues instantly</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-700 dark:text-gray-300">50+ predefined templates</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-700 dark:text-gray-300">Community support 24/7</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-700 dark:text-gray-300">Learn from real solutions</span>
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
              Join thousands of engineers who have transformed their DevOps workflows and solved real production issues
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
            Ready to Solve Real Production Issues?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands of DevOps engineers who are deploying faster, learning smarter, and collaborating better with AutoDevOps.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="px-8 py-4 bg-white text-gray-900 font-semibold rounded-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-200"
            >
              Get Started Free
            </Link>
            <Link
              to="/#contact"
              className="px-8 py-4 bg-white/20 backdrop-blur text-white font-semibold rounded-xl border-2 border-white/30 hover:bg-white/30 transition-all duration-200"
            >
              Contact Us
            </Link>
          </div>
          
          {/* Trust Indicators */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-1">10K+</div>
              <div className="text-white/80 text-sm">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-1">50K+</div>
              <div className="text-white/80 text-sm">Deployments</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-1">99.9%</div>
              <div className="text-white/80 text-sm">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-1">4.9/5</div>
              <div className="text-white/80 text-sm">User Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-white dark:bg-gray-900" id="contact">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <MessageSquare className="w-16 h-16 text-blue-600 mx-auto mb-6" />
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Get In Touch
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Have questions, feedback, or suggestions? We'd love to hear from you!
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Info */}
            <div className="space-y-8">
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 p-8 rounded-2xl">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Connect on LinkedIn
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Follow me on LinkedIn for updates, DevOps tips, and to connect professionally.
                </p>
                <a
                  href="https://www.linkedin.com/in/chinmaya-kumar-mallick"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-6 py-3 bg-[#0077b5] text-white font-semibold rounded-xl hover:bg-[#006097] transition-all duration-200 hover:shadow-lg transform hover:-translate-y-1"
                >
                  <Linkedin className="w-6 h-6 mr-2" />
                  Connect on LinkedIn
                </a>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-teal-50 dark:from-gray-800 dark:to-gray-700 p-8 rounded-2xl">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Email Support
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  For direct support or inquiries:
                </p>
                <a
                  href="mailto:autodevops.cmcloud.online@gmail.com"
                  className="inline-flex items-center text-blue-600 dark:text-blue-400 font-semibold hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                >
                  <Mail className="w-5 h-5 mr-2" />
                  autodevops.cmcloud.online@gmail.com
                </a>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-2xl">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Send a Message
              </h3>
              <form onSubmit={handleContactSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Your Name / ID
                  </label>
                  <input
                    type="text"
                    id="name"
                    required
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter your name or ID"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    required
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    id="subject"
                    required
                    value={contactForm.subject}
                    onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="What's this about?"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Your Message
                  </label>
                  <textarea
                    id="message"
                    required
                    rows={5}
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                    placeholder="Describe your problem, suggest improvements, or share your ideas..."
                  />
                </div>

                {submitSuccess && (
                  <div className="p-4 bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-600 rounded-xl">
                    <p className="text-green-700 dark:text-green-300 font-semibold">
                      ✓ Message sent successfully! I'll get back to you soon.
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transform hover:-translate-y-1 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
                >
                  {isSubmitting ? (
                    'Sending...'
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      Send Message
                    </>
                  )}
                </button>
              </form>
            </div>
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
                <span className="text-xl font-bold">AutoDevOps</span>
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
            <p className="mt-2 text-sm">
              Developed by{" "}
              <a
                href="https://github.com/Chinmaya1999"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-blue-400 hover:text-blue-300 transition-colors"
              >
                Chinmaya Kumar Mallick
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Landing
