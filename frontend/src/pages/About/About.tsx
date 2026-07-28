import React from 'react'
import { Link } from 'react-router-dom'
import Header from '../../components/Header/Header'
import { Sparkles, Users, TrendingUp } from 'lucide-react'

const About: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-900">
      <Header showAuthButtons={true} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <Sparkles className="w-16 h-16 text-blue-600 mx-auto mb-6" />
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            About AutoDevOps
          </h1>
          <p className="text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Built by DevOps engineers, for DevOps engineers
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 items-center mb-20">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
              Our Mission
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
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

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg text-center">
            <Users className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">10K+</div>
            <div className="text-gray-600 dark:text-gray-300">Active Users</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg text-center">
            <TrendingUp className="w-12 h-12 text-purple-600 mx-auto mb-4" />
            <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">50K+</div>
            <div className="text-gray-600 dark:text-gray-300">Deployments</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg text-center">
            <Sparkles className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">99.9%</div>
            <div className="text-gray-600 dark:text-gray-300">Uptime</div>
          </div>
        </div>

        <div className="text-center">
          <Link
            to="/register"
            className="inline-block px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-200"
          >
            Join Our Community Today
          </Link>
        </div>
      </div>
    </div>
  )
}

export default About
