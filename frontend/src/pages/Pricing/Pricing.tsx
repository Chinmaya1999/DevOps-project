import React from 'react'
import { Link } from 'react-router-dom'
import Header from '../../components/Header/Header'
import { CheckCircle, Sparkles } from 'lucide-react'

const Pricing: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-900">
      <Header showAuthButtons={true} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <Sparkles className="w-16 h-16 text-blue-600 mx-auto mb-6" />
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Simple, Transparent Pricing
          </h1>
          <p className="text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Choose the plan that fits your needs. Start free, upgrade when you are ready.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Free Plan */}
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl border-2 border-gray-200 dark:border-gray-700 shadow-lg">
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
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl border-2 border-gray-200 dark:border-gray-700 shadow-lg">
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
              to="/contact"
              className="block w-full py-3 text-center bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white font-semibold rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Contact Sales
            </Link>
          </div>
        </div>

        <div className="mt-16 text-center">
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            All plans include our core features: One-click deployment, predefined templates, and community access
          </p>
          <Link
            to="/features"
            className="text-blue-600 dark:text-blue-400 font-semibold hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
          >
            Learn more about features →
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Pricing
