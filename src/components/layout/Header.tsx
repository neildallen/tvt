import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Copy, 
  Moon, 
  Menu, 
  X, 
  Trophy, 
  BookOpen, 
  Rocket,
  Home
} from 'lucide-react';
import { copyToClipboard } from '../../utils/clipboard';
import { TVT_CA } from '../../constants';

const Header: React.FC = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const tvtCA = TVT_CA; // TVT contract address

  const handleCopyCA = () => {
    copyToClipboard(tvtCA, 'TvT contract address copied!');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const navigationItems = [
    {
      path: '/',
      label: 'Home',
      icon: <Home className="w-4 h-4" />
    },
    {
      path: '/create',
      label: 'Create Battle',
      icon: <Rocket className="w-4 h-4" />
    },
    {
      path: '/playbook',
      label: 'Playbook',
      icon: <BookOpen className="w-4 h-4" />
    },
    {
      path: '/leaderboard',
      label: 'War Leaderboard',
      icon: <Trophy className="w-4 h-4" />
    }
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-dark-900/80 backdrop-blur-xl border-b border-dark-700/50 shadow-2xl p-3">
        {/* Animated background elements */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 via-transparent to-blue-500/5"></div>
        <div className="absolute top-0 left-1/4 w-32 h-1 bg-gradient-to-r from-transparent via-primary-400/50 to-transparent"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-18">
            {/* Enhanced Logo */}
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="relative">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                  <img 
                    src="/logo.png" 
                    alt="Token vs Token Logo" 
                    className="w-8 h-8 object-contain"
                  />
                </div>
              </div>
              <div className="hidden sm:block">
                <span className="text-2xl font-bold bg-gradient-to-r from-white to-primary-200 bg-clip-text text-transparent group-hover:from-primary-300 group-hover:to-blue-300 transition-all duration-300">
                  Token vs Token
                </span>
              </div>
            </Link>

            {/* Enhanced Navigation */}
            <nav className="hidden lg:flex items-center space-x-1">
              {navigationItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`relative px-4 py-2 rounded-xl transition-all duration-300 group flex items-center space-x-2 ${
                    location.pathname === item.path
                      ? 'text-primary-400'
                      : 'text-dark-300 hover:text-white hover:bg-dark-700/50'
                  }`}
                >
                  <span className={`transition-colors duration-300 ${
                    location.pathname === item.path ? 'text-primary-400' : 'text-dark-400 group-hover:text-primary-400'
                  }`}>
                    {item.icon}
                  </span>
                  <span className="font-medium">{item.label}</span>
                  {location.pathname === item.path && (
                    <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-primary-400 rounded-full animate-pulse"></div>
                  )}
                </Link>
              ))}
            </nav>

            {/* Enhanced Right Section */}
            <div className="flex items-center space-x-3">
              {/* TvT Contract Address */}
              <div className="hidden md:flex items-center space-x-3 bg-dark-800/50 backdrop-blur-sm rounded-2xl px-4 py-2 border border-dark-700/50 shadow-lg">
                <span className="text-xs text-dark-400 font-medium">TvT CA:</span>
                <span className="text-sm font-mono text-white bg-dark-700/50 px-2 py-1 rounded-lg">
                  {tvtCA.slice(0, 4) + '...' + tvtCA.slice(-4)}
                </span>
                <button
                  onClick={handleCopyCA}
                  className="p-1.5 text-dark-400 hover:text-white hover:bg-dark-600/50 rounded-lg transition-all duration-300 group"
                  title="Copy contract address"
                >
                  <Copy size={14} className="group-hover:scale-110 transition-transform duration-300" />
                </button>
              </div>

              {/* Theme Toggle */}
              {/* <button className="p-3 text-dark-400 hover:text-white hover:bg-dark-700/50 rounded-xl transition-all duration-300 group">
                <Moon size={20} className="group-hover:rotate-12 transition-transform duration-300" />
              </button> */}

              {/* Mobile Menu Button */}
              <button
                onClick={toggleMobileMenu}
                className="lg:hidden p-3 text-dark-400 hover:text-white hover:bg-dark-700/50 rounded-xl transition-all duration-300"
              >
                {isMobileMenuOpen ? (
                  <X size={24} className="transform rotate-180 transition-transform duration-300" />
                ) : (
                  <Menu size={24} className="transition-transform duration-300" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Enhanced Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={toggleMobileMenu}
          ></div>
          
          {/* Menu Panel */}
          <div className="fixed top-[72px] left-0 right-0 bg-dark-900/95 backdrop-blur-xl border-b border-dark-700/50 shadow-2xl">
            <div className="px-4 py-6 space-y-2">
              {navigationItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={toggleMobileMenu}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                    location.pathname === item.path
                      ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                      : 'text-dark-300 hover:text-white hover:bg-dark-800/50'
                  }`}
                >
                  <span className={`transition-colors duration-300 ${
                    location.pathname === item.path ? 'text-primary-400' : 'text-dark-400'
                  }`}>
                    {item.icon}
                  </span>
                  <span className="font-medium">{item.label}</span>
                </Link>
              ))}
              
              {/* Mobile Contract Address */}
              <div className="mt-6 pt-6 border-t border-dark-700/50">
                <div className="bg-dark-800/50 rounded-xl p-4 border border-dark-700/50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-dark-400 font-medium">TvT Contract</span>
                    </div>
                    <button
                      onClick={handleCopyCA}
                      className="p-2 text-dark-400 hover:text-white hover:bg-dark-600/50 rounded-lg transition-all duration-300"
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                  <span className="text-sm font-mono text-white bg-dark-700/50 px-3 py-2 rounded-lg block">
                    {tvtCA.slice(0, 15) + '...' + tvtCA.slice(-15)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Spacer for fixed header */}
      <div className="h-18"></div>
    </>
  );
};

export default Header; 