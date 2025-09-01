import React from 'react';
import { Link } from 'react-router-dom';
import { Copy, Twitter, Timer, TrendingUp, ExternalLink } from 'lucide-react';
import { Battle } from '../types';
import { copyToClipboard } from '../utils/clipboard';
import { formatNumber, getImgProxyUrl } from '../utils/format';

interface BattleTableProps {
  battles: Battle[];
  loading?: boolean;
  error?: string | null;
}

const BattleTable: React.FC<BattleTableProps> = ({ battles, loading, error }) => {
  const handleCopyCA = (ca: string, ticker: string) => {
    copyToClipboard(ca, `${ticker} contract address copied!`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'text-yellow-400 bg-yellow-400/10';
      case 'about_to_bond': return 'text-orange-400 bg-orange-400/10';
      case 'bonded': return 'text-green-400 bg-green-400/10';
      case 'completed': return 'text-blue-400 bg-blue-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

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

  if (loading) {
    return (
      <div className="card text-center py-12">
        <p className="text-dark-400">Loading battles...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card text-center py-12">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  if (battles.length === 0) {
    return (
      <div className="card text-center py-12">
        <p className="text-dark-400">No battles here yet</p>
        <p className="text-dark-500 text-sm">Be the first to create one!</p>
      </div>
    );
  }

  return (
    <div className="card bg-card-gradient overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-dark-700">
              <th className="text-left p-4 text-dark-300 font-medium">Battle</th>
              <th className="text-left p-4 text-dark-300 font-medium">Status</th>
              <th className="text-left p-4 text-dark-300 font-medium">Token 1</th>
              <th className="text-left p-4 text-dark-300 font-medium">Token 2</th>
              <th className="text-left p-4 text-dark-300 font-medium">Progress</th>
              <th className="text-left p-4 text-dark-300 font-medium">Time</th>
              <th className="text-left p-4 text-dark-300 font-medium">Created</th>
              <th className="text-left p-4 text-dark-300 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {battles.map((battle) => {
              const { token1, token2, status } = battle;
              const totalMarketCap = token1.marketCap + token2.marketCap;
              const token1Progress = totalMarketCap > 0 ? (token1.marketCap / totalMarketCap) * 100 : 50;
              const token2Progress = 100 - token1Progress;
              const winningToken = token1.marketCap > token2.marketCap ? token1 : token2;
              const timeRemaining = battle.endTime ? 
                Math.max(0, Math.floor((battle.endTime.getTime() - new Date().getTime()) / 1000)) : 0;

              return (
                <tr key={battle.id} className="border-b border-dark-800/50 hover:bg-dark-800/30 transition-colors">
                  {/* Battle */}
                  <td className="p-4">
                    <div className="font-bold text-white">
                      <span className="text-primary-400">{token1.ticker}</span>
                      <span className="text-dark-500 mx-2">vs</span>
                      <span className="text-blue-400">{token2.ticker}</span>
                    </div>
                    <div className="text-xs text-dark-400 mt-1">
                      {battle.duration}h battle
                    </div>
                  </td>

                  {/* Status */}
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-md text-xs font-bold ${getStatusColor(status)}`}>
                      {status.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>

                  {/* Token 1 */}
                  <td className="p-4">
                    <div className="flex items-center space-x-3">
                      {token1.logo ? (
                        <img src={getImgProxyUrl(token1.logo, 32)} alt={token1.ticker} className="w-8 h-8 rounded-full" />
                      ) : (
                        <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">{token1.ticker[0]}</span>
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-white">{token1.ticker}</div>
                        <div className="text-xs text-dark-400">${formatNumber(token1.marketCap)}</div>
                      </div>
                      <div className="flex items-center space-x-1">
                        {token1.twitter && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(`https://twitter.com/${token1.twitter!.replace('@', '')}`, '_blank');
                            }}
                            className="text-dark-400 hover:text-blue-400 transition-colors"
                          >
                            <Twitter size={12} />
                          </button>
                        )}
                        {token1.contractAddress && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyCA(token1.contractAddress!, token1.ticker);
                            }}
                            className="text-dark-400 hover:text-white transition-colors"
                          >
                            <Copy size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Token 2 */}
                  <td className="p-4">
                    <div className="flex items-center space-x-3">
                      {token2.logo ? (
                        <img src={getImgProxyUrl(token2.logo, 32)} alt={token2.ticker} className="w-8 h-8 rounded-full" />
                      ) : (
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">{token2.ticker[0]}</span>
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-white">{token2.ticker}</div>
                        <div className="text-xs text-dark-400">${formatNumber(token2.marketCap)}</div>
                      </div>
                      <div className="flex items-center space-x-1">
                        {token2.twitter && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(`https://twitter.com/${token2.twitter!.replace('@', '')}`, '_blank');
                            }}
                            className="text-dark-400 hover:text-blue-400 transition-colors"
                          >
                            <Twitter size={12} />
                          </button>
                        )}
                        {token2.contractAddress && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyCA(token2.contractAddress!, token2.ticker);
                            }}
                            className="text-dark-400 hover:text-white transition-colors"
                          >
                            <Copy size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Progress */}
                  <td className="p-4 text-center">
                    {totalMarketCap > 0 ? (
                      <div className="w-32">
                        {(status !== 'completed') && (
                          <div>
                            <div className="bg-dark-600 rounded-full h-2 overflow-hidden mb-1">
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
                            <div className="flex justify-between text-xs text-dark-400">
                              <span>{token1Progress.toFixed(0)}%</span>
                              <span>{token2Progress.toFixed(0)}%</span>
                            </div>
                            <div className="text-xs text-dark-500 text-center mt-1">
                              Total: ${formatNumber(totalMarketCap)}
                            </div>
                            <div className="text-xs text-primary-400 text-center mt-1 font-semibold">
                              {winningToken.ticker} leading
                            </div>
                          </div>
                        )}
                        {(status === 'completed') && (
                          <div className="text-sm text-primary-400 text-center mt-1 font-semibold">
                            {winningToken.ticker} 👑
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-dark-500 text-sm">No data</span>
                    )}
                  </td>

                  {/* Time */}
                  <td className="p-4">
                    {status === 'bonded' && timeRemaining > 0 ? (
                      <div className="flex items-center space-x-1 text-red-400">
                        <Timer size={12} />
                        <span className="text-sm font-mono">{formatTime(timeRemaining)}</span>
                      </div>
                    ) : status === 'completed' || (status === 'bonded' && timeRemaining === 0) ? (
                      <span className="text-dark-400 text-sm">Ended</span>
                    ) : (
                      <div className="text-dark-400 text-sm">
                        <div>{battle.duration}h duration</div>
                        {battle.startTime && (
                          <div className="text-xs text-dark-500">
                            {status === 'new' ? 'Waiting' : 'Started'}
                          </div>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Created */}
                  <td className="p-4">
                    <div className="text-sm text-dark-400">
                      {formatCreatedDate(battle.createdAt)}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="p-4">
                    <Link
                      to={`/battle/${battle.id}`}
                      className="inline-flex items-center space-x-1 text-primary-400 hover:text-primary-300 transition-colors text-sm"
                    >
                      <span>View</span>
                      <ExternalLink size={12} />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BattleTable;
