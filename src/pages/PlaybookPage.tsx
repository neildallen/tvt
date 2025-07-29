import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Rocket, 
  Timer, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Shield,
  ArrowRight,
  BookOpen,
  Play,
  Star,
  Zap,
  Target,
  Sparkles
} from 'lucide-react';

const PlaybookPage: React.FC = () => {
  const features = [
    {
      icon: <Rocket className="w-8 h-8" />,
      title: "How It Works",
      description: "Two tokens launch simultaneously using Meteora's Dynamic Bonding Curve. The community decides the winner through trading volume and market cap.",
      gradient: "from-blue-500 to-purple-600"
    },
    {
      icon: <Timer className="w-8 h-8" />,
      title: "Launching a Battle",
      description: "Submit token metadata and set battle duration. No wallet connection needed - launches are funded by our backend wallet for free participants.",
      gradient: "from-green-500 to-emerald-600"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "For the Community",
      description: "Battles are decided by real market forces. The community votes with their wallets, making results authentic and meaningful.",
      gradient: "from-orange-500 to-red-600"
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Safety & Disclaimers",
      description: "All battles use audited smart contracts. Liquidity pouring uses MEV protection and occurs at random times to prevent exploitation.",
      gradient: "from-cyan-500 to-blue-600"
    }
  ];

  const steps = [
    {
      number: 1,
      title: "Create Battle",
      description: "Submit metadata for two competing tokens including names, logos, and social links.",
      icon: <Rocket className="w-6 h-6" />,
      color: "text-blue-400",
      bgColor: "bg-blue-500/20"
    },
    {
      number: 2,
      title: "Tokens Launch",
      description: "Both tokens launch simultaneously on Meteora's Dynamic Bonding Curve with identical starting conditions.",
      icon: <TrendingUp className="w-6 h-6" />,
      color: "text-green-400",
      bgColor: "bg-green-500/20"
    },
    {
      number: 3,
      title: "Community Decides",
      description: "Trading begins and the community determines the winner through market cap and volume over the battle duration.",
      icon: <Users className="w-6 h-6" />,
      color: "text-purple-400",
      bgColor: "bg-purple-500/20"
    },
    {
      number: 4,
      title: "Liquidity Pours",
      description: "When the countdown ends, the losing token's liquidity flows to the winner (70%), TVT token (10%), and team wallet (20%).",
      icon: <DollarSign className="w-6 h-6" />,
      color: "text-yellow-400",
      bgColor: "bg-yellow-500/20"
    }
  ];

  const benefits = [
    {
      icon: <Star className="w-6 h-6" />,
      title: "Free Launches Forever",
      description: "No fees for creating battles when you hold TVT tokens",
      highlight: "🆓"
    },
    {
      icon: <DollarSign className="w-6 h-6" />,
      title: "Fee Revenue Share",
      description: "Receive a percentage of all platform-generated fees",
      highlight: "💰"
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Priority Access",
      description: "Early access to new features and exclusive battles",
      highlight: "⚡"
    },
    {
      icon: <Target className="w-6 h-6" />,
      title: "Governance Rights",
      description: "Vote on platform decisions and protocol upgrades",
      highlight: "🗳️"
    }
  ];

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-blue-500/10"></div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-primary-500/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/3 w-16 h-16 bg-purple-500/10 rounded-full blur-lg animate-pulse delay-2000"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 mt-16">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="w-24 h-24 bg-tvt-gradient rounded-full flex items-center justify-center mx-auto mb-4 animate-float pulse-glow">
                  <BookOpen className="w-12 h-12 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
                  <Sparkles className="w-4 h-4 text-yellow-900" />
                </div>
              </div>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-white via-primary-200 to-blue-200 bg-clip-text text-transparent mb-6 animate-fade-in">
              The Token vs Token Playbook
            </h1>
            
            <p className="text-xl text-dark-300 max-w-3xl mx-auto mb-12 leading-relaxed">
              Your comprehensive guide to mastering the battle arena.
              <span className="block mt-2 text-primary-300 font-semibold">
                Prepare for victory, survive through strategy and onboard new fighters to join the action.
              </span>
            </p>

            {/* Enhanced Video Section */}
            <div className="relative bg-dark-800/80 backdrop-blur-sm rounded-3xl p-4 max-w-4xl mx-auto border border-dark-700/50 shadow-2xl transform hover:scale-[1.02] transition-transform duration-300">
              <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 to-blue-500/5 rounded-3xl"></div>
              
              <div className="relative aspect-video bg-gradient-to-br from-dark-700 to-dark-800 rounded-2xl flex items-center justify-center mb-4 border border-dark-600 overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative text-center z-10">
                  <div className="w-20 h-20 bg-tvt-gradient rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                    <Play className="w-10 h-10 text-white ml-1" />
                  </div>
                  <p className="text-primary-300 font-semibold text-lg">Introduction Video</p>
                  <p className="text-dark-400 text-sm">Coming Soon</p>
                </div>
              </div>
              
              <div className="relative grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                <div className="bg-dark-700/50 rounded-xl p-4 border border-dark-600/50">
                  <h3 className="text-lg font-bold text-primary-400 mb-2 flex items-center">
                    <BookOpen className="w-5 h-5 mr-2" />
                    Official Documentation
                  </h3>
                  <p className="text-dark-300 text-sm">Updated June 29, 2024</p>
                </div>
                <div className="bg-dark-700/50 rounded-xl p-4 border border-dark-600/50">
                  <h3 className="text-lg font-bold text-blue-400 mb-2 flex items-center">
                    <Timer className="w-5 h-5 mr-2" />
                    1 min read
                  </h3>
                  <p className="text-dark-300 text-sm">Quick overview of the platform</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Table of Contents */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-white mb-8 text-center">
            <span className="bg-gradient-to-r from-primary-400 to-blue-400 bg-clip-text text-transparent">
              Table of Contents
            </span>
          </h2>
          
          <div className="bg-dark-800/80 backdrop-blur-sm rounded-2xl border border-dark-700/50 p-8 shadow-2xl">
            <nav className="space-y-4">
              {[
                { href: "#introduction", text: "Introduction", active: true },
                { href: "#how-it-works", text: "How It Works" },
                { href: "#launching-battle", text: "Launching a Battle" },
                { href: "#community", text: "For the Community" },
                { href: "#fees-rewards", text: "Fees & Rewards" },
                { href: "#safety", text: "Safety & Disclaimers" }
              ].map((item, index) => (
                <a 
                  key={item.href}
                  href={item.href} 
                  className={`flex items-center space-x-4 p-4 rounded-xl transition-all duration-300 group ${
                    item.active 
                      ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30' 
                      : 'text-white hover:text-primary-400 hover:bg-dark-700/50'
                  }`}
                >
                  <span className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    item.active ? 'bg-primary-400 shadow-lg shadow-primary-400/50' : 'bg-dark-600 group-hover:bg-primary-400'
                  }`}></span>
                  <span className="font-medium">{item.text}</span>
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-1 transition-all duration-300" />
                </a>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Enhanced Introduction Section */}
      <div id="introduction" className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-5xl font-bold bg-gradient-to-r from-white to-primary-200 bg-clip-text text-transparent mb-12 text-center">
            Introduction
          </h2>
          
          <div className="prose prose-invert max-w-none">
            <div className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-8 mb-8 border border-dark-700/50">
              <p className="text-lg text-dark-200 mb-6 leading-relaxed">
                Welcome to <strong className="text-primary-400 font-bold">Token vs Token</strong>, the ultimate arena for memetic warfare on Solana. 
                We've built a launchpad where anyone can turn a rivalry into a tradeable, high-stakes battle.
              </p>
            </div>
            
            <div className="relative bg-gradient-to-br from-primary-500/10 to-blue-500/10 border border-primary-500/20 rounded-2xl p-8 mb-8 backdrop-blur-sm">
              <div className="absolute top-4 right-4">
                <div className="w-12 h-12 bg-primary-500/20 rounded-full flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-primary-400" />
                </div>
              </div>
              
              <p className="text-primary-100 mb-6 text-lg leading-relaxed">
                Whether it's political candidates, sports teams, tech giants, or viral memes, you 
                can deploy a battle and let the market decide the winner.
              </p>
              <p className="text-primary-100 text-lg leading-relaxed">
                This playbook is your guide to launching, trading, and winning in the Token vs Token 
                ecosystem. Prepare for a new way to resolve disputes and channel all discord on Solana.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced How It Works Section */}
      <div id="how-it-works" className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-5xl font-bold bg-gradient-to-r from-white to-primary-200 bg-clip-text text-transparent mb-16 text-center">
            How It Works
          </h2>
          
          <div className="space-y-8">
            {steps.map((step, index) => (
              <div key={step.number} className="group">
                <div className="flex gap-8 items-start">
                  <div className="flex-shrink-0">
                    <div className="relative">
                      <div className="w-16 h-16 bg-tvt-gradient rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                        <span className="text-white font-bold text-xl">{step.number}</span>
                      </div>
                      {index < steps.length - 1 && (
                        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 w-0.5 h-16 bg-gradient-to-b from-primary-400 to-transparent"></div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-grow">
                    <div className={`bg-dark-800/50 backdrop-blur-sm rounded-2xl p-8 border border-dark-700/50 transform group-hover:scale-[1.02] transition-all duration-300 ${step.bgColor}`}>
                      <div className="flex items-center space-x-4 mb-4">
                        <div className={`${step.color}`}>{step.icon}</div>
                        <h3 className="text-2xl font-bold text-white">{step.title}</h3>
                      </div>
                      <p className="text-dark-300 text-lg leading-relaxed">{step.description}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Enhanced Features Grid */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="group">
              <div className="relative bg-dark-800/50 backdrop-blur-sm rounded-2xl p-8 border border-dark-700/50 h-full transform group-hover:scale-[1.05] transition-all duration-300 overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                
                <div className="relative z-10">
                  <div className="text-primary-400 mb-6 transform group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-primary-300 transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-dark-300 text-lg leading-relaxed">{feature.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Enhanced TVT Benefits Section */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-5xl font-bold bg-gradient-to-r from-white to-primary-200 bg-clip-text text-transparent mb-4">
            TVT Holder Benefits
          </h2>
          <p className="text-dark-300 text-xl mb-12">Unlock exclusive perks and rewards</p>
          
          <div className="relative bg-tvt-gradient rounded-3xl p-12 mb-12 overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl transform translate-x-32 -translate-y-32"></div>
            
            <div className="relative z-10">
              <h3 className="text-3xl font-bold text-white mb-8">Hold $TVT for Exclusive Perks</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {benefits.map((benefit, index) => (
                  <div key={index} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 transform hover:scale-105 transition-transform duration-300">
                    <div className="text-4xl mb-4">{benefit.highlight}</div>
                    <div className="flex items-center justify-center w-12 h-12 bg-white/20 rounded-xl mx-auto mb-4">
                      {benefit.icon}
                    </div>
                    <h4 className="font-bold text-white mb-3 text-lg">{benefit.title}</h4>
                    <p className="text-green-100 text-sm leading-relaxed">{benefit.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="relative">
            <Link 
              to="/create" 
              className="inline-flex items-center space-x-3 bg-tvt-gradient text-white text-xl px-12 py-6 rounded-2xl font-bold shadow-2xl transform hover:scale-105 transition-all duration-300 hover:shadow-primary-500/25"
            >
              <Rocket className="w-7 h-7" />
              <span>Start Your First Battle</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaybookPage; 