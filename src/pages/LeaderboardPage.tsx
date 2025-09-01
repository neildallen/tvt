import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  Trophy, 
  Copy, 
  Twitter, 
  TrendingUp, 
  Crown, 
  Medal, 
  Award,
  Sparkles,
  Star,
  Zap,
  Target,
  ExternalLink
} from 'lucide-react';
import { LeaderboardEntry } from '../types';
import { copyToClipboard } from '../utils/clipboard';
import { formatNumber, getImgProxyUrl } from '../utils/format';
import CountdownTimer from '../components/CountdownTimer';
import { BattleService } from '../services/BattleService';
import { BackendApiService } from '../services/BackendApiService';

const LeaderboardPage: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const isUpdatingRef = useRef(false);
  
  // Next war date (everyday at 12:00 AM)
  const nextWarDate = (() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0); // Set to 12:00 AM
    return tomorrow;
  })();
  
  // Helper function to compare token data and detect changes
  const hasTokenDataChanged = (oldToken: any, newToken: any) => {
    return (
      oldToken.marketCap !== newToken.marketCap ||
      oldToken.currentPrice !== newToken.currentPrice ||
      oldToken.progress !== newToken.progress ||
      oldToken.migrated !== newToken.migrated ||
      oldToken.currentReserve !== newToken.currentReserve
    );
  };

  // Optimized function to update only changed token data
  const updateTokenDataInLeaderboard = useCallback(async (currentLeaderboard: LeaderboardEntry[]) => {
    if (isUpdatingRef.current) return currentLeaderboard;
    isUpdatingRef.current = true;

    try {
      const updatedLeaderboard = await Promise.all(
        currentLeaderboard.map(async (entry) => {
          try {
            // Fetch fresh token data
            const tokenResponse = await BackendApiService.getPoolInfo(
              entry.token.contractAddress || '',
              entry.token.poolAddress || '',
              entry.token.name,
              entry.token.ticker,
              entry.token.migrated
            );

            const newTokenData = {
              marketCap: tokenResponse.data?.marketCap || entry.token.marketCap,
              currentPrice: tokenResponse.data?.currentPrice || 0,
              progress: tokenResponse.data?.progress || 0,
              migrated: tokenResponse.data?.isMigrated || false,
              currentReserve: tokenResponse.data?.currentReserve || 0,
            };

            // Only update if data has actually changed
            const tokenChanged = hasTokenDataChanged(entry.token, newTokenData);

            if (tokenChanged) {
              console.log(`Updating token data for leaderboard entry ${entry.token.ticker}`);
              return {
                ...entry,
                token: { ...entry.token, ...newTokenData }
              };
            }

            return entry;
          } catch (tokenError) {
            console.error(`Error updating token data for ${entry.token.ticker}:`, tokenError);
            return entry;
          }
        })
      );

      return updatedLeaderboard;
    } finally {
      isUpdatingRef.current = false;
    }
  }, []);

  // Initial load function - loads leaderboard and token data
  const initialLoadLeaderboard = async () => {
    try {
      setLoading(true);
      const leaderboardData = await BattleService.getLeaderboard();
      
      // Get fresh token data for each leaderboard entry
      console.log(`Fetching token info for ${leaderboardData.length} leaderboard entries...`);
      const leaderboardWithTokenInfo = await Promise.all(
        leaderboardData.map(async (entry) => {
          try {
            console.log(`Fetching info for token ${entry.token.ticker}`);
            
            const tokenResponse = await BackendApiService.getPoolInfo(
              entry.token.contractAddress || '',
              entry.token.poolAddress || '',
              entry.token.name,
              entry.token.ticker,
              entry.token.migrated
            );
            
            console.log(`Token info fetched for ${entry.token.ticker}:`, tokenResponse.data);
            
            // Update entry with fresh token data
            return {
              ...entry,
              token: {
                ...entry.token,
                marketCap: tokenResponse.data?.marketCap || entry.token.marketCap,
                currentPrice: tokenResponse.data?.currentPrice || 0,
                progress: tokenResponse.data?.progress || 0,
                migrated: tokenResponse.data?.isMigrated || false,
                currentReserve: tokenResponse.data?.currentReserve || 0,
              }
            };
          } catch (tokenError) {
            console.error(`Error fetching token info for ${entry.token.ticker}:`, tokenError);
            return entry;
          }
        })
      );
      
      console.log(`Updated ${leaderboardWithTokenInfo.length} leaderboard entries with fresh token info`);
      setLeaderboard(leaderboardWithTokenInfo);
      setIsInitialLoad(false);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
      setIsInitialLoad(false);
    } finally {
      setLoading(false);
    }
  };

  // Background update function - only updates token data without showing loading
  const backgroundUpdateLeaderboard = useCallback(async () => {
    if (isInitialLoad || loading || leaderboard.length === 0) return;

    try {
      console.log('Background update: Checking for leaderboard token data changes...');
      const updatedLeaderboard = await updateTokenDataInLeaderboard(leaderboard);
      
      // Only update state if there were actual changes
      const hasChanges = updatedLeaderboard.some((entry, index) => {
        const currentEntry = leaderboard[index];
        return hasTokenDataChanged(currentEntry.token, entry.token);
      });

      if (hasChanges) {
        console.log('Background update: Changes detected, updating leaderboard UI...');
        setLeaderboard(updatedLeaderboard);
      } else {
        console.log('Background update: No changes detected in leaderboard');
      }
    } catch (err) {
      console.error('Background leaderboard update error:', err);
      // Don't show error to user for background updates
    }
  }, [leaderboard, isInitialLoad, loading, updateTokenDataInLeaderboard]);

  useEffect(() => {
    initialLoadLeaderboard();
  }, []);

  // Set up background updates only after initial load
  useEffect(() => {
    if (isInitialLoad) return;

    const interval = setInterval(() => {
      backgroundUpdateLeaderboard();
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, [isInitialLoad, backgroundUpdateLeaderboard]);

  // Auto-buy function for rank 1 token
  const handleWarComplete = useCallback(async () => {
    if (leaderboard.length === 0) {
      console.log('No leaderboard data available for auto-buy');
      return;
    }

    const rank1Token = leaderboard[0];
    if (!rank1Token || !rank1Token.token.contractAddress || !rank1Token.token.poolAddress) {
      console.log('Rank 1 token missing required data for auto-buy');
      return;
    }

    try {
      console.log(`🎯 War complete! Auto-buying rank 1 token: ${rank1Token.token.ticker} with 3 SOL`);
      
      const buyResult = await BackendApiService.rewardChampion(
        rank1Token.token.contractAddress,
        rank1Token.token.poolAddress,
        3, // 3 SOL
        500 // 5% slippage
      );

      if (buyResult.success) {
        console.log(`✅ Successfully bought ${rank1Token.token.ticker}!`, buyResult.data);
        // You could add a toast notification here
      } else {
        console.error(`❌ Failed to buy ${rank1Token.token.ticker}:`, buyResult.error);
      }
    } catch (error) {
      console.error('Error during auto-buy:', error);
    }
  }, [leaderboard]);

  const handleCopyCA = (ca: string, ticker: string) => {
    copyToClipboard(ca, `${ticker} contract address copied!`);
  };

  const handleSocialClick = (url: string) => {
    window.open(url, '_blank');
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-400 animate-pulse" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-orange-400" />;
      default:
        return <div className="w-6 h-6 flex items-center justify-center bg-gradient-to-br from-dark-600 to-dark-700 rounded-full text-dark-300 text-sm font-bold border border-dark-500">{rank}</div>;
    }
  };

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-black shadow-lg shadow-yellow-400/50';
      case 2:
        return 'bg-gradient-to-r from-gray-300 to-gray-500 text-black shadow-lg shadow-gray-400/50';
      case 3:
        return 'bg-gradient-to-r from-orange-400 to-orange-600 text-black shadow-lg shadow-orange-400/50';
      default:
        return 'bg-gradient-to-r from-dark-700 to-dark-600 text-white border border-dark-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-500 mx-auto mb-6"></div>
            <Crown className="w-8 h-8 text-yellow-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <p className="text-dark-300 text-lg">Loading champions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-orange-500/10"></div>
        
        {/* Floating Trophy Elements */}
        <div className="absolute top-20 left-10 w-16 h-16 bg-yellow-400/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-32 right-20 w-24 h-24 bg-orange-400/20 rounded-full blur-2xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-red-400/20 rounded-full blur-lg animate-pulse delay-2000"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 mt-16">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-float pulse-glow">
                  <Trophy className="w-12 h-12 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-300 rounded-full flex items-center justify-center animate-bounce">
                  <Crown className="w-4 h-4 text-yellow-900" />
                </div>
              </div>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent mb-6 animate-fade-in">
              War Leaderboard
            </h1>
            
            <p className="text-xl text-dark-300 max-w-2xl mx-auto mb-4 leading-relaxed">
              These tokens won their battles, but the war is still 
              <span className="text-red-400 font-bold"> ON!</span>
            </p>
            <p className="text-dark-400 mb-12 flex items-center justify-center space-x-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span>Wars occur daily at 12:00 AM</span>
              <Zap className="w-4 h-4 text-yellow-400" />
            </p>

            {/* Enhanced Next War Countdown */}
            <div className="relative bg-dark-800/80 backdrop-blur-sm rounded-3xl p-8 max-w-4xl mx-auto border border-dark-700/50 shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-3xl"></div>
              <div className="absolute top-4 left-4">
                <Target className="w-6 h-6 text-yellow-400 animate-pulse" />
              </div>
              
              <div className="relative z-10">
                <h3 className="text-2xl font-bold text-white mb-6">
                  The token with highest market cap will receive 
                  <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent"> Liquidity Boost</span> in
                </h3>
                <div className="bg-gradient-to-r from-primary-500/20 to-orange-500/20 rounded-2xl p-6 border border-primary-500/30">
                  <CountdownTimer 
                    targetDate={nextWarDate}
                    onComplete={handleWarComplete}
                    className="text-4xl font-bold text-yellow-400"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {leaderboard.length > 0 && (
          <>
            {/* Enhanced Top 3 Podium */}
            <div className="mb-20">
              <h2 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent text-center mb-16">
                Hall of Champions
              </h2>
              
              <div className="flex justify-center items-end space-x-8 mb-8">
                {/* 2nd Place */}
                {leaderboard[1] && (
                  <div className="text-center group transform hover:scale-105 transition-transform duration-300">
                    <div className="relative bg-gradient-to-b from-gray-300 to-gray-500 rounded-t-3xl p-8 h-40 flex flex-col justify-end shadow-2xl">
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                        <Medal className="w-8 h-8 text-gray-600" />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-t-3xl"></div>
                      
                      <div className="relative bg-white rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center shadow-xl border-4 border-gray-300">
                        {leaderboard[1].token.logo ? (
                          <img src={getImgProxyUrl(leaderboard[1].token.logo, 64)} alt={leaderboard[1].token.ticker} className="w-16 h-16 rounded-full" />
                        ) : (
                          <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-lg">{leaderboard[1].token.ticker[0]}</span>
                          </div>
                        )}
                      </div>
                      <div className="text-black font-bold text-lg">{leaderboard[1].token.ticker}</div>
                      <div className="text-black text-sm">${formatNumber(leaderboard[1].token.marketCap)}</div>
                    </div>
                    <div className="bg-gradient-to-b from-gray-400 to-gray-600 text-center py-6 text-white font-bold text-xl rounded-b-xl shadow-lg">
                      2nd Place
                    </div>
                  </div>
                )}

                {/* 1st Place */}
                {leaderboard[0] && (
                  <div className="text-center group transform hover:scale-105 transition-transform duration-300">
                    <div className="relative bg-gradient-to-b from-yellow-300 to-yellow-500 rounded-t-3xl p-8 h-52 flex flex-col justify-end shadow-2xl">
                      <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                        <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                          <Crown className="w-8 h-8 text-yellow-700" />
                        </div>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent rounded-t-3xl"></div>
                      <div className="absolute top-4 right-4">
                        <Sparkles className="w-6 h-6 text-yellow-600 animate-pulse" />
                      </div>
                      
                      <div className="relative bg-white rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center shadow-2xl border-4 border-yellow-400">
                        {leaderboard[0].token.logo ? (
                          <img src={getImgProxyUrl(leaderboard[0].token.logo, 64)} alt={leaderboard[0].token.ticker} className="w-20 h-20 rounded-full" />
                        ) : (
                          <div className="w-20 h-20 bg-primary-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-xl">{leaderboard[0].token.ticker[0]}</span>
                          </div>
                        )}
                      </div>
                      <div className="text-black font-bold text-xl">{leaderboard[0].token.ticker}</div>
                      <div className="text-black text-lg font-semibold">${formatNumber(leaderboard[0].token.marketCap)}</div>
                    </div>
                    <div className="bg-gradient-to-b from-yellow-400 to-yellow-600 text-center py-6 text-black font-bold text-2xl rounded-b-xl shadow-lg">
                      🏆 Champion 🏆
                    </div>
                  </div>
                )}

                {/* 3rd Place */}
                {leaderboard[2] && (
                  <div className="text-center group transform hover:scale-105 transition-transform duration-300">
                    <div className="relative bg-gradient-to-b from-orange-300 to-orange-500 rounded-t-3xl p-8 h-36 flex flex-col justify-end shadow-2xl">
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                        <Award className="w-8 h-8 text-orange-600" />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-t-3xl"></div>
                      
                      <div className="relative bg-white rounded-full w-18 h-18 mx-auto mb-4 flex items-center justify-center shadow-xl border-4 border-orange-300">
                        {leaderboard[2].token.logo ? (
                          <img src={getImgProxyUrl(leaderboard[2].token.logo, 64)} alt={leaderboard[2].token.ticker} className="w-14 h-14 rounded-full" />
                        ) : (
                          <div className="w-14 h-14 bg-primary-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold">{leaderboard[2].token.ticker[0]}</span>
                          </div>
                        )}
                      </div>
                      <div className="text-black font-bold">{leaderboard[2].token.ticker}</div>
                      <div className="text-black text-sm">${formatNumber(leaderboard[2].token.marketCap)}</div>
                    </div>
                    <div className="bg-gradient-to-b from-orange-400 to-orange-600 text-center py-6 text-white font-bold text-xl rounded-b-xl shadow-lg">
                      3rd Place
                    </div>
                  </div>
                )}
              </div>

              {/* Confetti Effect for Winner */}
              <div className="flex justify-center">
                <div className="relative">
                  <div className="absolute top-0 left-0 w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="absolute top-0 right-0 w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                  <div className="absolute bottom-0 left-1/2 w-2 h-2 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }}></div>
                </div>
              </div>
            </div>

            {/* Enhanced Full Leaderboard Table */}
            <div className="bg-dark-800/80 backdrop-blur-sm rounded-3xl border border-dark-700/50 overflow-hidden shadow-2xl">
              <div className="p-8 border-b border-dark-700/50 bg-gradient-to-r from-dark-800/50 to-dark-700/50">
                <div className="flex items-center justify-between">
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-primary-200 bg-clip-text text-transparent">
                    Complete Rankings
                  </h2>
                  <div className="flex items-center space-x-2 text-dark-300">
                    <Trophy className="w-5 h-5" />
                    <span className="text-sm">Battle Winners</span>
                  </div>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-dark-700/50 backdrop-blur-sm">
                    <tr>
                      <th className="px-8 py-6 text-left text-sm font-bold text-dark-200 uppercase tracking-wider">Rank</th>
                      <th className="px-8 py-6 text-left text-sm font-bold text-dark-200 uppercase tracking-wider">Token</th>
                      <th className="px-8 py-6 text-left text-sm font-bold text-dark-200 uppercase tracking-wider">Market Cap</th>
                      <th className="px-8 py-6 text-left text-sm font-bold text-dark-200 uppercase tracking-wider">Contract</th>
                      {/* <th className="px-8 py-6 text-left text-sm font-bold text-dark-200 uppercase tracking-wider">Actions</th> */}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-700/50">
                    {leaderboard.map((entry) => (
                      <tr 
                        key={entry.token.id} 
                        className={`hover:bg-dark-700/30 transition-all duration-300 group ${
                          entry.rank === 1 ? 'bg-yellow-500/5 border-l-4 border-yellow-400' : ''
                        }`}
                      >
                        {/* Rank */}
                        <td className="px-8 py-6">
                          <div className="flex items-center space-x-4">
                            <div className={`rounded-xl px-4 py-2 text-sm font-bold transform group-hover:scale-105 transition-transform duration-300 ${getRankBadgeColor(entry.rank)}`}>
                              #{entry.rank}
                            </div>
                            {getRankIcon(entry.rank)}
                          </div>
                        </td>

                        {/* Token Info */}
                        <td className="px-8 py-6">
                          <div className="flex items-center space-x-4">
                            <div className="relative">
                              {entry.token.logo ? (
                                <img src={getImgProxyUrl(entry.token.logo, 64)} alt={entry.token.ticker} className="w-16 h-16 rounded-2xl shadow-lg" />
                              ) : (
                                <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg">
                                  <span className="text-white font-bold text-lg">{entry.token.ticker[0]}</span>
                                </div>
                              )}
                              {entry.rank <= 3 && (
                                <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                                  <Star className="w-3 h-3 text-yellow-900" />
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-white text-xl group-hover:text-primary-300 transition-colors">
                                {entry.token.ticker}
                              </div>
                              <div className="text-dark-400 text-sm">{entry.token.name}</div>
                            </div>
                          </div>
                        </td>

                        {/* Market Cap */}
                        <td className="px-8 py-6">
                          <div className="text-white font-bold text-xl">${formatNumber(entry.token.marketCap)}</div>
                          {/* <div className="flex items-center space-x-1 text-green-400 text-sm">
                            <TrendingUp size={14} />
                            <span>+24.5%</span>
                          </div> */}
                        </td>

                        {/* Contract Address */}
                        <td className="px-8 py-6">
                          <div className="flex items-center space-x-3">
                            <span className="font-mono text-dark-300 text-sm bg-dark-700/50 px-3 py-2 rounded-lg">
                              {entry.token.contractAddress?.slice(0, 6)}...{entry.token.contractAddress?.slice(-4)}
                            </span>
                            <button
                              onClick={() => handleCopyCA(entry.token.contractAddress!, entry.token.ticker)}
                              className="p-2 bg-dark-700/50 rounded-lg text-dark-400 hover:text-white hover:bg-dark-600 transition-all duration-300"
                            >
                              <Copy size={16} />
                            </button>
                          </div>
                        </td>

                        {/* Actions */}
                        {/* <td className="px-8 py-6">
                          <div className="flex items-center space-x-3">
                            {entry.token.twitter && (
                              <button
                                onClick={() => handleSocialClick(`https://twitter.com/${entry.token.twitter!.replace('@', '')}`)}
                                className="p-3 bg-dark-700/50 rounded-xl hover:bg-blue-500/20 hover:text-blue-400 transition-all duration-300 group"
                              >
                                <Twitter size={18} className="text-blue-400" />
                              </button>
                            )}
                            <Link
                              to={`/battle/${entry.token.id}`}
                              className="px-4 py-3 bg-primary-500/20 text-primary-400 rounded-xl hover:bg-primary-500/30 transition-all duration-300 text-sm font-semibold flex items-center space-x-2 group"
                            >
                              <span>View Battle</span>
                              <ExternalLink size={14} className="group-hover:translate-x-1 transition-transform duration-300" />
                            </Link>
                          </div>
                        </td> */}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Enhanced Create Battle CTA */}
        <div className="text-center mt-20">
          <div className="relative bg-gradient-to-br from-primary-500/10 to-purple-500/10 rounded-3xl p-12 border border-primary-500/20 backdrop-blur-sm">
            <div className="absolute top-4 right-4">
              <Sparkles className="w-8 h-8 text-primary-400 animate-pulse" />
            </div>
            
            <h3 className="text-4xl font-bold bg-gradient-to-r from-white to-primary-200 bg-clip-text text-transparent mb-6">
              Think you can climb the ranks?
            </h3>
            <p className="text-dark-300 text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
              Create your own battle and compete for the top spot in the ultimate arena of token warfare!
            </p>
            
            <Link 
              to="/create" 
              className="inline-flex items-center space-x-3 bg-tvt-gradient text-white text-xl px-12 py-6 rounded-2xl font-bold shadow-2xl transform hover:scale-105 transition-all duration-300 hover:shadow-primary-500/25"
            >
              <Trophy className="w-7 h-7" />
              <span>Start Your Battle</span>
              <Zap className="w-6 h-6" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage; 