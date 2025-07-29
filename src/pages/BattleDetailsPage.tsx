import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Copy, Twitter, MessageCircle, TrendingUp, ArrowLeft, ExternalLink, Rocket } from 'lucide-react';
import { Battle } from '../types';
import { copyToClipboard } from '../utils/clipboard';
import { formatNumber } from '../utils/format';
import CountdownTimer from '../components/CountdownTimer';

const BattleDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [battle, setBattle] = useState<Battle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data fetch - replace with actual API call
    const fetchBattle = async () => {
      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock battle data
        const mockBattle: Battle = {
          id: id || '1',
          token1: {
            id: '1',
            ticker: 'TEST3',
            name: 'Real Madrid Token',
            logo: '/logos/real-madrid.png',
            contractAddress: 'ABC123DEF456',
            marketCap: 0,
            volume: 0,
            migrated: true,
            twitter: '@realmadrid',
          },
          token2: {
            id: '2',
            ticker: 'TEST4',
            name: 'Barcelona Token',
            logo: '/logos/barcelona.png',
            contractAddress: 'DEF456GHI789',
            marketCap: 0,
            volume: 0,
            migrated: true,
            twitter: '@fcbarcelona',
          },
          duration: 12,
          createdAt: new Date('2024-01-15'),
          startTime: new Date(),
          endTime: new Date(Date.now() + 15 * 60 * 1000 + 44 * 1000), // 15:44 remaining
          status: 'bonded',
        };
        
        setBattle(mockBattle);
      } catch (error) {
        console.error('Failed to fetch battle:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBattle();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-dark-300">Loading battle...</p>
        </div>
      </div>
    );
  }

  if (!battle) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Battle not found</h1>
          <Link to="/" className="btn-primary">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const { token1, token2 } = battle;
  
  // Calculate progress (mock calculation)
  const totalMarketCap = token1.marketCap + token2.marketCap;
  const token1Progress = totalMarketCap > 0 ? (token1.marketCap / totalMarketCap) * 100 : 50;
  const token2Progress = 100 - token1Progress;
  
  const handleCopyCA = (ca: string, ticker: string) => {
    copyToClipboard(ca, `${ticker} contract address copied!`);
  };

  const handleSocialClick = (url: string) => {
    window.open(url, '_blank');
  };

  const renderTokenCard = (token: typeof token1, progress: number, isLeft: boolean) => (
    <div className={`card card-glow bg-card-gradient animate-slide-up ${isLeft ? 'lg:mr-4' : 'lg:ml-4'}`} style={{animationDelay: isLeft ? '0.6s' : '0.8s'}}>
      {/* Token Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-6">
          {token.logo ? (
            <img src={token.logo} alt={token.ticker} className="w-20 h-20 rounded-full ring-4 ring-primary-500/30 shadow-xl" />
          ) : (
            <div className="w-20 h-20 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center shadow-xl ring-4 ring-primary-500/30">
              <span className="text-white text-2xl font-bold">{token.ticker[0]}</span>
            </div>
          )}
          <div>
            <h3 className="text-3xl font-bold gradient-text">{token.ticker}</h3>
            <p className="text-dark-300 text-lg">{token.name}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-dark-700 rounded-lg p-4">
          <p className="text-dark-400 text-sm">Market Cap</p>
          <p className="text-2xl font-bold text-white">${formatNumber(token.marketCap)}</p>
        </div>
        <div className="bg-dark-700 rounded-lg p-4">
          <p className="text-dark-400 text-sm">Volume 24h</p>
          <p className="text-2xl font-bold text-white">${formatNumber(token.volume)}</p>
        </div>
      </div>

      {/* Contract Address */}
      <div className="bg-dark-700 rounded-lg p-4 mb-6">
        <p className="text-dark-400 text-sm mb-2">Contract Address</p>
        <div className="flex items-center justify-between">
          <span className="font-mono text-white text-sm">{token.contractAddress}</span>
          <button
            onClick={() => handleCopyCA(token.contractAddress!, token.ticker)}
            className="text-dark-400 hover:text-white transition-colors"
          >
            <Copy size={16} />
          </button>
        </div>
      </div>

      {/* Social Links */}
      <div className="flex space-x-4">
        <button className="flex-1 bg-dark-700 hover:bg-dark-600 rounded-lg p-3 flex items-center justify-center space-x-2 transition-colors">
          <span className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
            <span className="text-white text-xs">P</span>
          </span>
          <span className="text-white text-sm">Photon</span>
        </button>
        
        <button className="flex-1 bg-dark-700 hover:bg-dark-600 rounded-lg p-3 flex items-center justify-center space-x-2 transition-colors">
          <span className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center">
            <span className="text-white text-xs">A</span>
          </span>
          <span className="text-white text-sm">Axiom</span>
        </button>
        
        <button className="flex-1 bg-dark-700 hover:bg-dark-600 rounded-lg p-3 flex items-center justify-center space-x-2 transition-colors">
          <span className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center">
            <span className="text-white text-xs">B</span>
          </span>
          <span className="text-white text-sm">BullX</span>
        </button>
        
        <button className="flex-1 bg-dark-700 hover:bg-dark-600 rounded-lg p-3 flex items-center justify-center space-x-2 transition-colors">
          <span className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
            <span className="text-white text-xs">G</span>
          </span>
          <span className="text-white text-sm">GMGN</span>
        </button>

        {token.twitter && (
          <button
            onClick={() => handleSocialClick(`https://twitter.com/${token.twitter!.replace('@', '')}`)}
            className="bg-dark-700 hover:bg-dark-600 rounded-lg p-3 flex items-center justify-center transition-colors"
          >
            <Twitter size={20} className="text-blue-400" />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-dark-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-20 right-20 w-32 h-32 bg-primary-500/10 rounded-full blur-2xl animate-float"></div>
        <div className="absolute bottom-20 left-20 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl animate-float" style={{animationDelay: '2s'}}></div>
      </div>
      
      {/* Header */}
      <div className="relative bg-gradient-to-r from-dark-800 to-dark-900 border-b border-dark-700/50 py-2 backdrop-blur-sm mt-[70px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link
              to="/"
              className="flex items-center space-x-3 text-dark-400 hover:text-primary-400 transition-all duration-300 group"
            >
              <div className="p-2 rounded-lg group-hover:bg-primary-500/10 transition-colors">
                <ArrowLeft size={22} />
              </div>
              <span className="font-semibold">Back to Home</span>
            </Link>
            
            <Link
              to="/create"
              className="btn-primary flex items-center space-x-3 text-lg py-3 px-6"
            >
              <Rocket size={24} />
              <span>Create a battle</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Battle Title */}
        <div className="text-center mb-8">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 animate-slide-up">
            <span className="text-primary-400 drop-shadow-lg">{token1.ticker}</span>
            <span className="text-dark-500 mx-6 text-4xl md:text-6xl">vs</span>
            <span className="text-blue-400 drop-shadow-lg">{token2.ticker}</span>
          </h1>
          
          {/* Countdown */}
          {battle.endTime && (
            <div className="flex items-center justify-center space-x-4 mb-6 animate-slide-up" style={{animationDelay: '0.2s'}}>
              <div className="bg-gradient-to-r from-dark-800 to-dark-900 rounded-2xl px-8 py-4 border border-dark-700/50 shadow-2xl backdrop-blur-sm">
                <p className="text-primary-400 text-sm font-semibold mb-2 uppercase tracking-wider">Battle Ends In</p>
                <CountdownTimer 
                  targetDate={battle.endTime}
                  className="text-3xl font-bold text-white"
                />
              </div>
            </div>
          )}
          
          {/* Progress Bar */}
          <div className="max-w-3xl mx-auto mb-12 animate-slide-up" style={{animationDelay: '0.4s'}}>
            <div className="bg-dark-700 rounded-full h-6 overflow-hidden shadow-inner border border-dark-600">
              <div className="h-full flex relative">
                <div 
                  className="bg-gradient-to-r from-primary-400 to-primary-500 transition-all duration-1000 ease-out shadow-lg"
                  style={{ width: `${token1Progress}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent animate-pulse"></div>
                </div>
                <div 
                  className="bg-gradient-to-r from-blue-400 to-blue-500 transition-all duration-1000 ease-out shadow-lg"
                  style={{ width: `${token2Progress}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20 animate-pulse"></div>
                </div>
              </div>
            </div>
            <div className="flex justify-between mt-4 text-lg font-bold">
              <span className="text-primary-400 bg-primary-500/10 px-3 py-1 rounded-full">
                {token1.ticker}: {token1Progress.toFixed(1)}%
              </span>
              <span className="text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full">
                {token2.ticker}: {token2Progress.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Token Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative">
          {/* VS Badge */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 lg:block hidden">
            <div className="w-20 h-20 bg-tvt-gradient rounded-full flex items-center justify-center shadow-2xl border-4 border-dark-900 animate-pulse pulse-glow">
              <span className="text-white font-bold text-xl">VS</span>
            </div>
          </div>

          {renderTokenCard(token1, token1Progress, true)}
          
          {/* Mobile VS */}
          <div className="flex items-center justify-center lg:hidden">
            <div className="w-12 h-12 bg-dark-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">VS</span>
            </div>
          </div>
          
          {renderTokenCard(token2, token2Progress, false)}
        </div>
      </div>
    </div>
  );
};

export default BattleDetailsPage; 