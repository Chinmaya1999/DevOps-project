import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { GitBranch, Menu, X } from 'lucide-react'

interface HeaderProps {
  showAuthButtons?: boolean
  transparent?: boolean
}

const Header: React.FC<HeaderProps> = ({ showAuthButtons = true, transparent = false }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
  const location = useLocation()

  const navigation = [
    { name: 'Features', href: '/features' },
    { name: 'Pricing', href: '/pricing' },
    { name: 'Documentation', href: '/docs' },
    { name: 'About', href: '/about' }
  ]

  const isActive = (href: string) => {
    return location.pathname === href
  }

  return (
    <header className={`w-full z-50 ${
      transparent 
        ? 'absolute top-0 left-0 right-0 bg-blue-700' 
        : 'bg-blue-600 border-b border-blue-700 shadow-lg'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <GitBranch className={`w-8 h-8 ${transparent ? 'text-white' : 'text-white'}`} />
            <span className={`text-xl font-bold ${transparent ? 'text-white' : 'text-white'}`}>
              DevOps Generator
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? transparent 
                      ? 'text-white'
                      : 'text-white font-semibold'
                    : transparent
                      ? 'text-white/90 hover:text-white'
                      : 'text-white/90 hover:text-white'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Auth Buttons */}
          {showAuthButtons && (
            <div className="hidden md:flex items-center space-x-4">
              <Link
                to="/login"
                className={`text-sm font-medium transition-colors ${
                  transparent
                    ? 'text-white/90 hover:text-white'
                    : 'text-white/90 hover:text-white'
                }`}
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 text-sm font-medium text-blue-600 bg-white rounded-lg hover:bg-gray-100 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                Get Started
              </Link>
            </div>
          )}

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`p-2 rounded-lg transition-colors ${
                transparent
                  ? 'text-white hover:bg-white/10'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className={`md:hidden ${
            transparent ? 'bg-white/10 backdrop-blur-md' : 'bg-blue-700'
          } border-t ${
            transparent ? 'border-white/20' : 'border-blue-800'
          }`}>
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    isActive(item.href)
                      ? transparent
                        ? 'text-white bg-white/20'
                        : 'text-white font-semibold bg-white/10'
                      : transparent
                        ? 'text-white/90 hover:text-white hover:bg-white/10'
                        : 'text-white/90 hover:text-white hover:bg-white/10'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              
              {showAuthButtons && (
                <>
                  <div className={`border-t ${transparent ? 'border-white/20' : 'border-white/20'} my-2`}></div>
                  <Link
                    to="/login"
                    className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                      transparent
                        ? 'text-white/90 hover:text-white hover:bg-white/10'
                        : 'text-white/90 hover:text-white hover:bg-white/10'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="block px-3 py-2 rounded-md text-base font-medium text-blue-600 bg-white hover:bg-gray-100 transition-all duration-200"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

export default Header
