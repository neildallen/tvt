import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Copy, Twitter, MessageCircle, TrendingUp, ArrowLeft, ExternalLink, Rocket } from 'lucide-react';
import { Battle } from '../types';
import { copyToClipboard } from '../utils/clipboard';
import { formatNumber, getImgProxyUrl } from '../utils/format';
import CountdownTimer from '../components/CountdownTimer';
import { BattleService } from '../services/BattleService';
import { BackendApiService } from '../services/BackendApiService';

const BattleDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [battle, setBattle] = useState<Battle | null>(null);
  const [loading, setLoading] = useState(true);
  const [poolInfos, setPoolInfos] = useState<{
    token1?: {
      currentPrice: number;
      marketCap: number;
      currentReserve: number;
      progress: number;
    };
    token2?: {
      currentPrice: number;
      marketCap: number;
      currentReserve: number;
      progress: number;
    };
  }>({});

  // Initialize connection
  // Pool info will be fetched from backend instead

  const fetchPoolInfo = useCallback(async (mint: string, poolAddress: string, tokenName: string, tokenSymbol: string, migrated?: boolean) => {
    if (!mint || !poolAddress) return null;
    
    try {
      console.log(`Fetching pool info from backend for ${poolAddress}...`);
      const response = await BackendApiService.getPoolInfo(mint, poolAddress, tokenName, tokenSymbol, migrated);
      
      if (response.success && response.data) {
        console.log(`Pool info received for ${poolAddress}:`, response.data);
        return {
          currentPrice: response.data.currentPrice,
          progress: response.data.progress,
          migrationThreshold: response.data.migrationThreshold,
          currentReserve: response.data.currentReserve,
          marketCap: response.data.marketCap,
        };
      } else {
        console.error('Failed to fetch pool info:', response.error);
        return null;
      }
    } catch (error) {
      console.error('Error fetching pool info from backend:', error);
      return null;
    }
  }, []);

  const fetchBattle = useCallback(async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setLoading(true);
      }
      
      if (!id) {
        setBattle(null);
        return;
      }

      console.log('Fetching battle data from backend...');
      const battleData = await BattleService.getBattleById(id);
      if (battleData) {
        setBattle(battleData);

        // Fetch pool info for both tokens if they have pool addresses
        const poolPromises = [];
        
        if (battleData.token1.poolAddress && battleData.token1.contractAddress) {
          poolPromises.push(
            fetchPoolInfo(battleData.token1.contractAddress, battleData.token1.poolAddress, battleData.token1.name, battleData.token1.ticker, battleData.token1.migrated)
              .then(info => ({ token: 'token1', info }))
          );
        }
        
        if (battleData.token2.poolAddress && battleData.token2.contractAddress) {
          poolPromises.push(
            fetchPoolInfo(battleData.token2.contractAddress, battleData.token2.poolAddress, battleData.token2.name, battleData.token2.ticker, battleData.token2.migrated)
              .then(info => ({ token: 'token2', info }))
          );
        }

        if (poolPromises.length > 0) {
          const poolResults = await Promise.all(poolPromises);
          const newPoolInfos: any = {};
          
          poolResults.forEach(result => {
            if (result.info) {
              newPoolInfos[result.token] = result.info;
            }
          });
          
          setPoolInfos(newPoolInfos);

          // Update battle with real market cap data
          const updatedBattle = { ...battleData };
          if (newPoolInfos.token1) {
            updatedBattle.token1.marketCap = newPoolInfos.token1.marketCap;
          }
          if (newPoolInfos.token2) {
            updatedBattle.token2.marketCap = newPoolInfos.token2.marketCap;
          }
          setBattle(updatedBattle);
        }
      } else {
        // Fallback to mock data if battle not found
        const mockBattle: Battle = {
          id: id,
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
      }
    } catch (error) {
      console.error('Failed to fetch battle:', error);
      setBattle(null);
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      }
    }
  }, [id, fetchPoolInfo]);

  useEffect(() => {
    fetchBattle(true);
  }, [fetchBattle]);

  // Refresh battle data every 1 minute
  useEffect(() => {
    if (!battle) {
      return;
    }

    const refreshBattleData = () => {
      console.log('Refreshing battle data (1-minute interval)...');
      fetchBattle(false);
    };

    // Set up interval to refresh battle data every 60 seconds
    const battleRefreshInterval = setInterval(refreshBattleData, 60000);

    return () => {
      clearInterval(battleRefreshInterval);
    };
  }, [battle, fetchBattle]);

  // Refresh pool data every 30 seconds for real-time market cap updates
  useEffect(() => {
    if (!battle || (!battle.token1.poolAddress && !battle.token2.poolAddress)) {
      return;
    }

    const refreshPoolData = async () => {
      console.log('Refreshing pool data (30-second interval)...');
      const poolPromises = [];
      
      if (battle.token1.poolAddress && battle.token1.contractAddress) {
        poolPromises.push(
          fetchPoolInfo(battle.token1.contractAddress, battle.token1.poolAddress, battle.token1.name, battle.token1.ticker, battle.token1.migrated)
            .then(info => ({ token: 'token1', info }))
        );
      }
      
      if (battle.token2.poolAddress && battle.token2.contractAddress) {
        poolPromises.push(
          fetchPoolInfo(battle.token2.contractAddress, battle.token2.poolAddress, battle.token2.name, battle.token2.ticker, battle.token2.migrated)
            .then(info => ({ token: 'token2', info }))
        );
      }

      if (poolPromises.length > 0) {
        try {
          const poolResults = await Promise.all(poolPromises);
          const newPoolInfos: any = {};
          
          poolResults.forEach(result => {
            if (result.info) {
              newPoolInfos[result.token] = result.info;
            }
          });
          
          setPoolInfos(prev => ({ ...prev, ...newPoolInfos }));

          // Update battle with new market cap data and check for status changes
          setBattle(prevBattle => {
            if (!prevBattle) return prevBattle;
            
            const updatedBattle = { ...prevBattle };
            
            // Update market caps and check bonding progress
            if (newPoolInfos.token1) {
              updatedBattle.token1.marketCap = newPoolInfos.token1.marketCap;
              if (newPoolInfos.token1.progress >= 100 && !updatedBattle.token1.migrated) {
                updatedBattle.token1.migrated = true;
              }
            }
            if (newPoolInfos.token2) {
              updatedBattle.token2.marketCap = newPoolInfos.token2.marketCap;
              if (newPoolInfos.token2.progress >= 100 && !updatedBattle.token2.migrated) {
                updatedBattle.token2.migrated = true;
              }
            }
            
            return updatedBattle;
          });
        } catch (error) {
          console.error('Failed to refresh pool data:', error);
        }
      }
    };

    // Initial refresh after 5 seconds to avoid overwhelming on load
    const initialTimeout = setTimeout(refreshPoolData, 5000);
    
    // Then refresh every 30 seconds
    const interval = setInterval(refreshPoolData, 30000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [battle, fetchPoolInfo]);

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
  
  // Calculate progress using real market cap data
  const token1MarketCap = poolInfos.token1?.marketCap || token1.marketCap;
  const token2MarketCap = poolInfos.token2?.marketCap || token2.marketCap;
  const totalMarketCap = token1MarketCap + token2MarketCap;
  const token1Progress = totalMarketCap > 0 ? (token1MarketCap / totalMarketCap) * 100 : 50;
  const token2Progress = 100 - token1Progress;
  
  const handleCopyCA = (ca: string, ticker: string) => {
    copyToClipboard(ca, `${ticker} contract address copied!`);
  };

  const handleSocialClick = (url: string) => {
    window.open(url, '_blank');
  };

  const renderTokenCard = (token: typeof token1, progress: number, isLeft: boolean) => {
    const poolInfo = isLeft ? poolInfos.token1 : poolInfos.token2;
    const marketCap = poolInfo?.marketCap || token.marketCap;
    const currentPrice = poolInfo?.currentPrice || 0;
    
    // Check if this token is the winner
    const isWinner = (battle.status === 'completed') && battle.winner === token.id;
    
    // Check if this token is currently leading (for bonded battles)
    const isCurrentLeader = (battle.status === 'bonded') && 
      ((isLeft && token1MarketCap > token2MarketCap) || (!isLeft && token2MarketCap > token1MarketCap));
    
    return (
      <div className={`card card-glow bg-card-gradient animate-slide-up ${isLeft ? 'lg:mr-4' : 'lg:ml-4'} ${
        isWinner ? 'ring-4 ring-yellow-400/50' : 
        isCurrentLeader ? 'ring-2 ring-green-400/30' : ''
      } relative`} style={{animationDelay: isLeft ? '0.6s' : '0.8s'}}>
        {/* Winner Badge */}
        {isWinner && (
          <div className="absolute -top-4 -right-4 z-20">
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 px-4 py-2 rounded-full shadow-2xl border-4 border-yellow-300 animate-bounce">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">👑</span>
                <span className="font-bold text-lg">WINNER!</span>
              </div>
            </div>
          </div>
        )}

        {/* Current Leader Badge */}
        {isCurrentLeader && !isWinner && (
          <div className="absolute -top-3 -right-3 z-20">
            <div className="bg-gradient-to-r from-green-400 to-green-500 text-green-900 px-3 py-1 rounded-full shadow-xl border-2 border-green-300 animate-pulse">
              <div className="flex items-center space-x-1">
                <span className="text-lg">👑</span>
                <span className="font-bold text-sm">LEADING</span>
              </div>
            </div>
          </div>
        )}
        
        {/* Token Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-6">
            {token.logo ? (
              <img src={getImgProxyUrl(token.logo, 64)} alt={token.ticker} className="w-20 h-20 rounded-full ring-4 ring-primary-500/30 shadow-xl" />
            ) : (
              <div className="w-20 h-20 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center shadow-xl ring-4 ring-primary-500/30">
                <span className="text-white text-2xl font-bold">{token.ticker[0]}</span>
              </div>
            )}
            <div>
              <h3 className="text-3xl font-bold gradient-text">{token.ticker}</h3>
              <p className="text-dark-300 text-lg">{token.name}</p>
              {currentPrice > 0 && (
                <p className="text-primary-400 text-sm font-semibold">
                  ${currentPrice.toFixed(8)} SOL
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-dark-700 rounded-lg p-4">
            <p className="text-dark-400 text-sm">Market Cap</p>
            <p className="text-2xl font-bold text-white">${formatNumber(marketCap)}</p>
            {poolInfo?.progress && (
              <p className="text-xs text-dark-400 mt-1">
                Progress: {poolInfo.progress.toFixed(1)}%
              </p>
            )}
          </div>
          <div className="bg-dark-700 rounded-lg p-4">
            <p className="text-dark-400 text-sm">Volume 24h</p>
            <p className="text-2xl font-bold text-white">${formatNumber(token.volume)}</p>
            {poolInfo?.currentReserve && (
              <p className="text-xs text-dark-400 mt-1">
                Reserve: {poolInfo.currentReserve.toFixed(2)} SOL
              </p>
            )}
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

        {/* Pool Address if available */}
        {token.poolAddress && (
          <div className="bg-dark-700 rounded-lg p-4 mb-6">
            <p className="text-dark-400 text-sm mb-2">Pool Address</p>
            <div className="flex items-center justify-between">
              <span className="font-mono text-white text-sm">{token.poolAddress}</span>
              <button
                onClick={() => handleCopyCA(token.poolAddress!, `${token.ticker} pool`)}
                className="text-dark-400 hover:text-white transition-colors"
              >
                <Copy size={16} />
              </button>
            </div>
          </div>
        )}

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
  };

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
          {battle.endTime && battle.status === 'bonded' && (
            <div className="flex flex-col items-center justify-center space-y-4 mb-6 animate-slide-up" style={{animationDelay: '0.2s'}}>
              <div className="bg-gradient-to-r from-dark-800 to-dark-900 rounded-2xl px-8 py-6 border border-dark-700/50 shadow-2xl backdrop-blur-sm">
                <p className="text-primary-400 text-sm font-semibold mb-3 uppercase tracking-wider text-center">Battle Ends In</p>
                <CountdownTimer 
                  targetDate={battle.endTime}
                  className="text-4xl font-bold text-white text-center"
                />
                
                {/* Additional countdown info */}
                <div className="mt-4 pt-4 border-t border-dark-600 grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-dark-400 uppercase tracking-wide">Started</p>
                    <p className="text-sm text-white font-semibold">
                      {battle.startTime ? new Date(battle.startTime).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-dark-400 uppercase tracking-wide">Duration</p>
                    <p className="text-sm text-white font-semibold">{battle.duration}h</p>
                  </div>
                  <div>
                    <p className="text-xs text-dark-400 uppercase tracking-wide">Status</p>
                    <p className={`text-sm font-semibold capitalize ${
                      battle.status === 'bonded' ? 'text-green-400' :
                      battle.status === 'about_to_bond' ? 'text-orange-400' :
                      battle.status === 'new' ? 'text-yellow-400' : 'text-blue-400'
                    }`}>
                      {battle.status.replace('_', ' ')}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Time remaining breakdown */}
              {(() => {
                const timeRemaining = Math.max(0, Math.floor((battle.endTime.getTime() - new Date().getTime()) / 1000));
                const days = Math.floor(timeRemaining / (24 * 3600));
                const hours = Math.floor((timeRemaining % (24 * 3600)) / 3600);
                const minutes = Math.floor((timeRemaining % 3600) / 60);
                const seconds = timeRemaining % 60;
                
                if (timeRemaining > 0) {
                  // return (
                  //   <div className="flex items-center justify-center space-x-4">
                  //     {days > 0 && (
                  //       <div className="bg-dark-700/50 rounded-lg px-3 py-2 text-center">
                  //         <p className="text-2xl font-bold text-white">{days}</p>
                  //         <p className="text-xs text-dark-400 uppercase">Days</p>
                  //       </div>
                  //     )}
                  //     <div className="bg-dark-700/50 rounded-lg px-3 py-2 text-center">
                  //       <p className="text-2xl font-bold text-white">{hours}</p>
                  //       <p className="text-xs text-dark-400 uppercase">Hours</p>
                  //     </div>
                  //     <div className="bg-dark-700/50 rounded-lg px-3 py-2 text-center">
                  //       <p className="text-2xl font-bold text-white">{minutes}</p>
                  //       <p className="text-xs text-dark-400 uppercase">Minutes</p>
                  //     </div>
                  //     <div className="bg-dark-700/50 rounded-lg px-3 py-2 text-center">
                  //       <p className="text-2xl font-bold text-primary-400 animate-pulse">{seconds}</p>
                  //       <p className="text-xs text-dark-400 uppercase">Seconds</p>
                  //     </div>
                  //   </div>
                  // );
                } else {
                  return (
                    <div className="bg-red-500/20 border border-red-500/50 rounded-lg px-6 py-3">
                      <p className="text-red-400 font-bold text-center">Battle Ended</p>
                    </div>
                  );
                }
              })()}
            </div>
          )}

          {/* Battle Completed Banner */}
          {battle.status === 'completed' && battle.winner && (
            <div className="flex flex-col items-center justify-center space-y-4 mb-6 animate-slide-up" style={{animationDelay: '0.2s'}}>
              <div className="bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border-2 border-yellow-400/50 rounded-2xl px-8 py-6 shadow-2xl backdrop-blur-sm">
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-3 mb-4">
                    <span className="text-6xl">🏆</span>
                    <div>
                      <p className="text-yellow-400 text-2xl font-bold uppercase tracking-wider">Battle Complete!</p>
                      <p className="text-white text-lg">
                        {battle.winner === token1.id ? token1.ticker : token2.ticker} is victorious!
                      </p>
                    </div>
                    <span className="text-6xl">🏆</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6 mt-6 pt-4 border-t border-yellow-400/30">
                    <div className="text-center">
                      <p className="text-yellow-400 font-bold text-lg">{token1.ticker}</p>
                      <p className="text-white text-2xl font-bold">${formatNumber(token1MarketCap)}</p>
                      <p className="text-sm text-dark-300">Final Market Cap</p>
                    </div>
                    <div className="text-center">
                      <p className="text-yellow-400 font-bold text-lg">{token2.ticker}</p>
                      <p className="text-white text-2xl font-bold">${formatNumber(token2MarketCap)}</p>
                      <p className="text-sm text-dark-300">Final Market Cap</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bonding Progress Display for new battles */}
          {battle.status === 'new' && (
            <div className="flex flex-col items-center justify-center space-y-4 mb-6 animate-slide-up" style={{animationDelay: '0.2s'}}>
              <div className="bg-gradient-to-r from-dark-800 to-dark-900 rounded-2xl px-8 py-6 border border-dark-700/50 shadow-2xl backdrop-blur-sm">
                <p className="text-yellow-400 text-sm font-semibold mb-3 uppercase tracking-wider text-center">Waiting for Both Tokens to Reach 100% Bonding</p>
                
                <div className="grid grid-cols-2 gap-6 mt-4">
                  <div className="text-center">
                    <h4 className="text-primary-400 font-bold mb-2">{token1.ticker}</h4>
                    <div className="flex items-center justify-center space-x-2">
                      <div className={`w-4 h-4 rounded-full ${token1.migrated ? 'bg-green-400' : 'bg-yellow-400'} animate-pulse`}></div>
                      <span className="text-white">
                        {poolInfos.token1?.progress ? `${poolInfos.token1.progress.toFixed(1)}%` : token1.migrated ? '100%' : 'Loading...'}
                      </span>
                    </div>
                  </div>
                  <div className="text-center">
                    <h4 className="text-blue-400 font-bold mb-2">{token2.ticker}</h4>
                    <div className="flex items-center justify-center space-x-2">
                      <div className={`w-4 h-4 rounded-full ${token2.migrated ? 'bg-green-400' : 'bg-yellow-400'} animate-pulse`}></div>
                      <span className="text-white">
                        {poolInfos.token2?.progress ? `${poolInfos.token2.progress.toFixed(1)}%` : token2.migrated ? '100%' : 'Loading...'}
                      </span>
                    </div>
                  </div>
                </div>
                
                {token1.migrated && token2.migrated && (
                  <div className="mt-4 pt-4 border-t border-dark-600 text-center">
                    <p className="text-green-400 font-bold animate-pulse">🎉 Both tokens bonded! Battle starting...</p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Progress Bar */}
          <div className="max-w-3xl mx-auto mb-12 animate-slide-up" style={{animationDelay: '0.4s'}}>
            <div className={`bg-dark-700 rounded-full h-6 overflow-hidden shadow-inner border ${
              battle.status === 'completed' ? 'border-yellow-400/50' : 'border-dark-600'
            }`}>
              <div className="h-full flex relative">
                <div 
                  className={`transition-all duration-1000 ease-out shadow-lg ${
                    battle.status === 'completed' && battle.winner === token1.id 
                      ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' 
                      : 'bg-gradient-to-r from-primary-400 to-primary-500'
                  }`}
                  style={{ width: `${token1Progress}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent animate-pulse"></div>
                </div>
                <div 
                  className={`transition-all duration-1000 ease-out shadow-lg ${
                    battle.status === 'completed' && battle.winner === token2.id 
                      ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' 
                      : 'bg-gradient-to-r from-blue-400 to-blue-500'
                  }`}
                  style={{ width: `${token2Progress}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20 animate-pulse"></div>
                </div>
              </div>
            </div>
            <div className="flex justify-between mt-4 text-lg font-bold">
              <span className={`px-3 py-1 rounded-full ${
                battle.status === 'completed' && battle.winner === token1.id 
                  ? 'text-yellow-400 bg-yellow-500/20 border border-yellow-400/30' 
                  : battle.status === 'bonded' && token1MarketCap > token2MarketCap
                  ? 'text-green-400 bg-green-500/15 border border-green-400/20'
                  : 'text-primary-400 bg-primary-500/10'
              }`}>
                {token1.ticker}: {token1Progress.toFixed(1)}% (${formatNumber(token1MarketCap)})
                {battle.status === 'completed' && battle.winner === token1.id && (
                  <span className="ml-2">👑</span>
                )}
                {battle.status === 'bonded' && token1MarketCap > token2MarketCap && battle.winner !== token1.id && (
                  <span className="ml-2 animate-pulse">👑</span>
                )}
              </span>
              <span className={`px-3 py-1 rounded-full ${
                battle.status === 'completed' && battle.winner === token2.id 
                  ? 'text-yellow-400 bg-yellow-500/20 border border-yellow-400/30' 
                  : battle.status === 'bonded' && token2MarketCap > token1MarketCap
                  ? 'text-green-400 bg-green-500/15 border border-green-400/20'
                  : 'text-blue-400 bg-blue-500/10'
              }`}>
                {token2.ticker}: {token2Progress.toFixed(1)}% (${formatNumber(token2MarketCap)})
                {battle.status === 'completed' && battle.winner === token2.id && (
                  <span className="ml-2">👑</span>
                )}
                {battle.status === 'bonded' && token2MarketCap > token1MarketCap && battle.winner !== token2.id && (
                  <span className="ml-2 animate-pulse">👑</span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Token Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative">
          {/* VS Badge */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 lg:block hidden">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center shadow-2xl border-4 border-dark-900 ${
              battle.status === 'completed' 
                ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 animate-bounce' 
                : 'bg-tvt-gradient animate-pulse pulse-glow'
            }`}>
              <span className={`font-bold text-xl ${
                battle.status === 'completed' ? 'text-yellow-900' : 'text-white'
              }`}>
                {battle.status === 'completed' ? '🏆' : 'VS'}
              </span>
            </div>
          </div>

          {renderTokenCard(token1, token1Progress, true)}
          
          {/* Mobile VS */}
          <div className="flex items-center justify-center lg:hidden">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              battle.status === 'completed' 
                ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' 
                : 'bg-dark-600'
            }`}>
              <span className={`font-bold ${
                battle.status === 'completed' ? 'text-yellow-900' : 'text-white'
              }`}>
                {battle.status === 'completed' ? '🏆' : 'VS'}
              </span>
            </div>
          </div>
          
          {renderTokenCard(token2, token2Progress, false)}
        </div>
      </div>
    </div>
  );
};

export default BattleDetailsPage; 