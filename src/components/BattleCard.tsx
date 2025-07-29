import React from 'react';
import { Link } from 'react-router-dom';
import { Copy, Twitter, MessageCircle, Timer, TrendingUp } from 'lucide-react';
import { Battle } from '../types';
import { copyToClipboard } from '../utils/clipboard';
import { formatNumber } from '../utils/format';

interface BattleCardProps {
  battle: Battle;
}

const BattleCard: React.FC<BattleCardProps> = ({ battle }) => {
  const { token1, token2, status, winner } = battle;
  
  // Determine winning token
  const winningToken = token1.marketCap > token2.marketCap ? token1 : token2;
  const losingToken = token1.marketCap > token2.marketCap ? token2 : token1;

  const handleCopyCA = (ca: string, ticker: string) => {
    copyToClipboard(ca, `${ticker} contract address copied!`);
  };

  const getStatusColor = () => {
    switch (status) {
      case 'new': return 'text-yellow-400';
      case 'about_to_bond': return 'text-orange-400';
      case 'bonded': return 'text-green-400';
      case 'completed': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  const timeRemaining = battle.endTime ? 
    Math.max(0, Math.floor((battle.endTime.getTime() - new Date().getTime()) / 1000)) : 0;

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Link to={`/battle/${battle.id}`} className="block group">
      <div className="card card-glow hover:border-primary-500/50 transition-all duration-300 hover:scale-105 hover:-translate-y-2 bg-card-gradient">
        {/* Battle Status */}
        <div className="flex items-center justify-between mb-6">
          <div className={`px-3 py-1 rounded-full text-sm font-bold ${getStatusColor()} bg-dark-700/50 backdrop-blur-sm`}>
            {status.replace('_', ' ').toUpperCase()}
          </div>
          {status === 'bonded' && timeRemaining > 0 && (
            <div className="flex items-center space-x-2 bg-red-500/20 px-3 py-1 rounded-full text-red-400 animate-pulse">
              <Timer size={16} />
              <span className="text-sm font-mono font-bold">{formatTime(timeRemaining)}</span>
            </div>
          )}
        </div>

        {/* Battle Title */}
        <h3 className="text-2xl font-bold text-white mb-6 text-center group-hover:gradient-text transition-all duration-300">
          <span className="text-primary-400">{token1.ticker}</span>
          <span className="text-dark-500 mx-2">vs</span>
          <span className="text-blue-400">{token2.ticker}</span>
        </h3>

        {/* Winner Badge */}
        {status === 'bonded' && (
          <div className="text-center mb-6">
            <span className="inline-flex items-center space-x-2 bg-gradient-to-r from-primary-500/30 to-green-500/30 text-primary-300 px-4 py-2 rounded-full text-sm font-bold border border-primary-500/30 animate-pulse">
              <TrendingUp size={18} />
              <span>{winningToken.ticker} WINNING</span>
            </span>
          </div>
        )}

        {/* Tokens */}
        <div className="space-y-4">
          {/* Token 1 */}
          <div className={`bg-gradient-to-br from-dark-700 to-dark-800 rounded-xl p-5 border transition-all duration-300 ${winner === token1.id ? 'ring-2 ring-green-400 border-green-400/50 shadow-lg shadow-green-400/20' : 'border-dark-600/50 hover:border-primary-500/30'}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-4">
                {token1.logo ? (
                  <img src={token1.logo} alt={token1.ticker} className="w-10 h-10 rounded-full ring-2 ring-primary-500/30" />
                ) : (
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-white text-sm font-bold">{token1.ticker[0]}</span>
                  </div>
                )}
                <span className="font-bold text-white text-lg">{token1.ticker}</span>
              </div>
              <div className="flex items-center space-x-2">
                                 {token1.twitter && (
                   <button
                     onClick={(e) => {
                       e.preventDefault();
                       window.open(`https://twitter.com/${token1.twitter!.replace('@', '')}`, '_blank');
                     }}
                     className="text-dark-400 hover:text-blue-400 transition-colors"
                   >
                     <Twitter size={16} />
                   </button>
                 )}
                {token1.contractAddress && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleCopyCA(token1.contractAddress!, token1.ticker);
                    }}
                    className="text-dark-400 hover:text-white transition-colors"
                  >
                    <Copy size={16} />
                  </button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-dark-400 text-sm">Market Cap</p>
                <p className="text-white font-semibold">${formatNumber(token1.marketCap)}</p>
              </div>
              <div>
                <p className="text-dark-400 text-sm">Volume</p>
                <p className="text-white font-semibold">${formatNumber(token1.volume)}</p>
              </div>
            </div>
          </div>

          {/* VS Divider */}
          <div className="flex items-center justify-center">
            <div className="bg-dark-600 rounded-full w-8 h-8 flex items-center justify-center">
              <span className="text-white font-bold text-sm">VS</span>
            </div>
          </div>

          {/* Token 2 */}
          <div className={`bg-dark-700 rounded-lg p-4 ${winner === token2.id ? 'ring-2 ring-green-400' : ''}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                {token2.logo ? (
                  <img src={token2.logo} alt={token2.ticker} className="w-8 h-8 rounded-full" />
                ) : (
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">{token2.ticker[0]}</span>
                  </div>
                )}
                <span className="font-bold text-white">{token2.ticker}</span>
              </div>
              <div className="flex items-center space-x-2">
                                 {token2.twitter && (
                   <button
                     onClick={(e) => {
                       e.preventDefault();
                       window.open(`https://twitter.com/${token2.twitter!.replace('@', '')}`, '_blank');
                     }}
                     className="text-dark-400 hover:text-blue-400 transition-colors"
                   >
                     <Twitter size={16} />
                   </button>
                 )}
                {token2.contractAddress && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleCopyCA(token2.contractAddress!, token2.ticker);
                    }}
                    className="text-dark-400 hover:text-white transition-colors"
                  >
                    <Copy size={16} />
                  </button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-dark-400 text-sm">Market Cap</p>
                <p className="text-white font-semibold">${formatNumber(token2.marketCap)}</p>
              </div>
              <div>
                <p className="text-dark-400 text-sm">Volume</p>
                <p className="text-white font-semibold">${formatNumber(token2.volume)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default BattleCard; 