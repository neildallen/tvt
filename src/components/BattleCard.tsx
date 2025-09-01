import React from 'react';
import { Link } from 'react-router-dom';
import { Copy, Twitter, Timer, TrendingUp } from 'lucide-react';
import { Battle } from '../types';
import { copyToClipboard } from '../utils/clipboard';
import { formatNumber, getImgProxyUrl } from '../utils/format';

interface BattleCardProps {
  battle: Battle;
}

const BattleCard: React.FC<BattleCardProps> = ({ battle }) => {
  const { token1, token2, status } = battle;
  
  // Determine winning token
  const winningToken = token1.marketCap > token2.marketCap ? token1 : token2;

  const handleCopyCA = (ca: string, ticker: string) => {
    copyToClipboard(ca, `${ticker} contract address copied!`);
  };

  const getStatusColor = () => {
    switch (status) {
      case 'new': return 'text-yellow-400 bg-yellow-400/10';
      case 'about_to_bond': return 'text-orange-400 bg-orange-400/10';
      case 'bonded': return 'text-green-400 bg-green-400/10';
      case 'completed': return 'text-blue-400 bg-blue-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  const timeRemaining = battle.endTime ? 
    Math.max(0, Math.floor((battle.endTime.getTime() - new Date().getTime()) / 1000)) : 0;

  const formatTime = (seconds: number) => {
    const days = Math.floor(seconds / (24 * 3600));
    const hours = Math.floor((seconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatCreatedDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate progress percentages
  const totalMarketCap = token1.marketCap + token2.marketCap;
  const token1Progress = totalMarketCap > 0 ? (token1.marketCap / totalMarketCap) * 100 : 50;
  const token2Progress = 100 - token1Progress;

  return (
    <Link to={`/battle/${battle.id}`} className="block group">
      <div className="card card-glow hover:border-primary-500/50 transition-all duration-300 hover:scale-[1.02] bg-card-gradient p-2">
        {/* Header - Status and Timer inline */}
        <div className="flex items-center justify-between mb-2">
          <div className={`px-2 py-0.5 rounded text-xs font-bold ${getStatusColor()}`}>
            {status.replace('_', ' ').toUpperCase()}
          </div>
          
          {/* Battle info */}
          <div className="text-xs text-dark-400 mb-2 text-center">
            Created: {formatCreatedDate(battle.createdAt)}
          </div>

          {/* Time display based on status */}
          <div className="flex items-center space-x-2 text-xs">
            {status === 'bonded' && timeRemaining > 0 ? (
              <div className="flex items-center space-x-1 text-red-400">
                <Timer size={10} />
                <span className="font-mono">{formatTime(timeRemaining)}</span>
              </div>
            ) : status === 'completed' || (status === 'bonded' && timeRemaining === 0) ? (
              <div className="text-dark-400">
                <span>Ended</span>
              </div>
            ) : (
              <div className="text-dark-400">
                <span>{battle.duration}h battle</span>
              </div>
            )}
            
            {/* Winner badge */}
            {(status !== 'completed') && totalMarketCap > 0 && (
              <div className="flex items-center space-x-1 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 text-yellow-300 px-1.5 py-0.5 rounded text-xs font-bold border border-yellow-500/30">
                <TrendingUp size={10} />
                <span>{winningToken.ticker}</span>
              </div>
            )}
            {(status === 'completed') && totalMarketCap > 0 && (
              <div className="flex items-center space-x-1 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 text-yellow-300 px-1.5 py-0.5 rounded text-xs font-bold border border-yellow-500/30">
                <span>👑 {winningToken.ticker}</span>
              </div>
            )}
          </div>
        </div>

        {/* Battle Progress Bar */}
        {totalMarketCap > 0 && battle.status !== 'completed' && (
          <div className="mb-2">
            <div className="bg-dark-600 rounded-full h-1.5 overflow-hidden">
              <div className="h-full flex">
                <div 
                  className="bg-primary-400 transition-all duration-500"
                  style={{ width: `${token1Progress}%` }}
                />
                <div 
                  className="bg-blue-400 transition-all duration-500"
                  style={{ width: `${token2Progress}%` }}
                />
              </div>
            </div>
            <div className="flex justify-between text-xs text-dark-400 mt-1">
              <span>{token1Progress.toFixed(1)}%</span>
              <span className="text-dark-500">Total: ${formatNumber(totalMarketCap)}</span>
              <span>{token2Progress.toFixed(1)}%</span>
            </div>
          </div>
        )}

        {/* Battle Title - Compact */}
        {/* <h3 className="text-sm font-bold text-center mb-2 group-hover:gradient-text transition-all duration-300">
          <span className="text-primary-400">{token1.ticker}</span>
          <span className="text-dark-500 mx-1">vs</span>
          <span className="text-blue-400">{token2.ticker}</span>
        </h3> */}

        {/* Tokens Row - Reduced padding */}
        <div className="relative grid grid-cols-2 gap-2">
          {/* VS Mark */}
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 bg-dark-800 border border-dark-600 rounded-full w-6 h-6 flex items-center justify-center">
            <span className="text-dark-300 text-xs font-bold">VS</span>
          </div>
          
          {/* Token 1 */}
          <div className="bg-dark-700/50 rounded p-2 border border-dark-600/50 flex flex-row items-center space-x-2">
            {token1.logo ? (
              <img src={getImgProxyUrl(token1.logo, 32)} alt={token1.ticker} className="rounded-full" />
            ) : (
              <div className="w-4 h-4 bg-primary-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">{token1.ticker[0]}</span>
              </div>
            )}

            <div>
              <div className="flex items-center space-x-1 mb-1">
                <span className="font-bold text-white text-xs">{token1.ticker}</span>
                <div className="flex items-center space-x-0.5 ml-auto">
                  {token1.twitter && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        window.open(`https://twitter.com/${token1.twitter!.replace('@', '')}`, '_blank');
                      }}
                      className="text-dark-400 hover:text-blue-400 transition-colors p-0.5"
                    >
                      <Twitter size={10} />
                    </button>
                  )}
                  {token1.contractAddress && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleCopyCA(token1.contractAddress!, token1.ticker);
                      }}
                      className="text-dark-400 hover:text-white transition-colors p-0.5"
                    >
                      <Copy size={10} />
                    </button>
                  )}
                </div>
              </div>
              <div className="text-xs text-dark-400">
                MC: <span className="text-white font-semibold">${formatNumber(token1.marketCap)}</span>
              </div>
            </div>
          </div>

          {/* Token 2 */}
          <div className="bg-dark-700/50 rounded p-2 border border-dark-600/50 flex flex-row items-center space-x-2">
            {token2.logo ? (
              <img src={getImgProxyUrl(token2.logo, 32)} alt={token2.ticker} className="rounded-full" />
            ) : (
              <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">{token2.ticker[0]}</span>
              </div>
            )}
            <div>
              <div className="flex items-center space-x-1 mb-1">
                
                <span className="font-bold text-white text-xs">{token2.ticker}</span>
                <div className="flex items-center space-x-0.5 ml-auto">
                  {token2.twitter && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        window.open(`https://twitter.com/${token2.twitter!.replace('@', '')}`, '_blank');
                      }}
                      className="text-dark-400 hover:text-blue-400 transition-colors p-0.5"
                    >
                      <Twitter size={10} />
                    </button>
                  )}
                  {token2.contractAddress && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleCopyCA(token2.contractAddress!, token2.ticker);
                      }}
                      className="text-dark-400 hover:text-white transition-colors p-0.5"
                    >
                      <Copy size={10} />
                    </button>
                  )}
                </div>
              </div>
              <div className="text-xs text-dark-400">
                MC: <span className="text-white font-semibold">${formatNumber(token2.marketCap)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default BattleCard; 