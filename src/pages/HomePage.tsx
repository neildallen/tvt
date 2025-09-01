import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Copy, Rocket, BookOpen, Trophy, Timer, Grid, List, ChevronDown } from 'lucide-react';
import { copyToClipboard } from '../utils/clipboard';
import BattleCard from '../components/BattleCard';
import BattleTable from '../components/BattleTable';
import CountdownTimer from '../components/CountdownTimer';
import { Battle } from '../types';
import { BattleService } from '../services/BattleService';
import { BackendApiService } from '../services/BackendApiService';
import { TVT_CA } from '../constants';

const HomePage: React.FC = () => {
  const [activeBattles, setActiveBattles] = useState<Battle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards'); // Default to cards view
  const [selectedCategory, setSelectedCategory] = useState<'new' | 'about_to_bond' | 'graduated'>('new');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const isUpdatingRef = useRef(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const tvtCA = TVT_CA;
  const freeEndDate = new Date('2025-07-06T23:59:59'); // Updated to 2025

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
  const updateTokenDataInBattles = useCallback(async (currentBattles: Battle[]) => {
    if (isUpdatingRef.current) return currentBattles;
    isUpdatingRef.current = true;

    try {
      const updatedBattles = await Promise.all(
        currentBattles.map(async (battle) => {
          try {
            // Fetch fresh token data
            const [token1Response, token2Response] = await Promise.all([
              BackendApiService.getPoolInfo(
                battle.token1.contractAddress || '',
                battle.token1.poolAddress || '',
                battle.token1.name,
                battle.token1.ticker,
                battle.token1.migrated
              ),
              BackendApiService.getPoolInfo(
                battle.token2.contractAddress || '',
                battle.token2.poolAddress || '',
                battle.token2.name,
                battle.token2.ticker,
                battle.token2.migrated
              )
            ]);

            const newToken1Data = {
              marketCap: token1Response.data?.marketCap || battle.token1.marketCap,
              currentPrice: token1Response.data?.currentPrice || 0,
              progress: token1Response.data?.progress || 0,
              migrated: token1Response.data?.isMigrated || false,
              currentReserve: token1Response.data?.currentReserve || 0,
            };

            const newToken2Data = {
              marketCap: token2Response.data?.marketCap || battle.token2.marketCap,
              currentPrice: token2Response.data?.currentPrice || 0,
              progress: token2Response.data?.progress || 0,
              migrated: token2Response.data?.isMigrated || false,
              currentReserve: token2Response.data?.currentReserve || 0,
            };

            // Only update if data has actually changed
            const token1Changed = hasTokenDataChanged(battle.token1, newToken1Data);
            const token2Changed = hasTokenDataChanged(battle.token2, newToken2Data);

            if (token1Changed || token2Changed) {
              console.log(`Updating token data for battle ${battle.id}: ${battle.token1.ticker} vs ${battle.token2.ticker}`);
              return {
                ...battle,
                token1: token1Changed ? { ...battle.token1, ...newToken1Data } : battle.token1,
                token2: token2Changed ? { ...battle.token2, ...newToken2Data } : battle.token2,
              };
            }

            return battle;
          } catch (tokenError) {
            console.error(`Error updating token data for battle ${battle.id}:`, tokenError);
            return battle;
          }
        })
      );

      return updatedBattles;
    } finally {
      isUpdatingRef.current = false;
    }
  }, []);

  // Initial load function - loads battles and token data
  const initialLoadBattles = async () => {
    try {
      setLoading(true);
      setError(null);
      const battles = await BattleService.getBattles();
        
      // Get all necessary token info from backend for each battle using pool-info endpoint
      console.log(`Fetching token info for ${battles.length} battles...`);
      const battlesWithTokenInfo = await Promise.all(
        battles.map(async (battle) => {
          try {
            console.log(`Fetching info for battle ${battle.id}: ${battle.token1.ticker} vs ${battle.token2.ticker}`);
            
            // Fetch token info for token1 and token2 in parallel
            const [token1Response, token2Response] = await Promise.all([
              BackendApiService.getPoolInfo(
                battle.token1.contractAddress || '',
                battle.token1.poolAddress || '',
                battle.token1.name,
                battle.token1.ticker,
                battle.token1.migrated
              ),
              BackendApiService.getPoolInfo(
                battle.token2.contractAddress || '',
                battle.token2.poolAddress || '',
                battle.token2.name,
                battle.token2.ticker,
                battle.token2.migrated
              )
            ]);
            
            console.log(`Token info fetched for ${battle.token1.ticker}:`, token1Response.data);
            console.log(`Token info fetched for ${battle.token2.ticker}:`, token2Response.data);
            
            // Update battle with fresh token data
            return {
              ...battle,
              token1: {
                ...battle.token1,
                marketCap: token1Response.data?.marketCap || battle.token1.marketCap,
                currentPrice: token1Response.data?.currentPrice || 0,
                progress: token1Response.data?.progress || 0,
                migrated: token1Response.data?.isMigrated || false,
                currentReserve: token1Response.data?.currentReserve || 0,
              },
              token2: {
                ...battle.token2,
                marketCap: token2Response.data?.marketCap || battle.token2.marketCap,
                currentPrice: token2Response.data?.currentPrice || 0,
                progress: token2Response.data?.progress || 0,
                migrated: token2Response.data?.isMigrated || false,
                currentReserve: token2Response.data?.currentReserve || 0,
              }
            };
          } catch (tokenError) {
            console.error(`Error fetching token info for battle ${battle.id}:`, tokenError);
            // Return original battle data if token info fetch fails
            return battle;
          }
        })
      );
      
      console.log(`Updated ${battlesWithTokenInfo.length} battles with fresh token info`);
      console.log(battlesWithTokenInfo);
      setActiveBattles(battlesWithTokenInfo);
      setIsInitialLoad(false);
    } catch (err) {
      console.error('Error loading battles:', err);
      setError('Failed to load battles. Please try again later.');
      
      // Fallback to mock data if Supabase fails
      const mockBattles: Battle[] = [
        {
          id: '1',
          token1: {
            id: '1',
            ticker: 'JULY',
            name: 'JULY',
            logo: '/logos/july.png',
            contractAddress: 'ABC123',
            marketCap: 4590000,
            volume: 750000,
            migrated: true,
            twitter: '@july_token',
          },
          token2: {
            id: '2',
            ticker: 'JUNE',
            name: 'JUNE vs JULY',
            logo: '/logos/june.png',
            contractAddress: 'DEF456',
            marketCap: 3200000,
            volume: 650000,
            migrated: true,
            twitter: '@june_token',
          },
          duration: 12,
          createdAt: new Date('2024-01-15'),
          startTime: new Date('2024-01-15T10:00:00'),
          endTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
          status: 'bonded',
          winner: '1'
        }
      ];
      setActiveBattles(mockBattles);
      setIsInitialLoad(false);
    } finally {
      setLoading(false);
    }
  };

  // Background update function - only updates token data without showing loading
  const backgroundUpdateBattles = useCallback(async () => {
    if (isInitialLoad || loading || activeBattles.length === 0) return;

    try {
      console.log('Background update: Checking for token data changes...');
      const updatedBattles = await updateTokenDataInBattles(activeBattles);
      
      // Only update state if there were actual changes
      const hasChanges = updatedBattles.some((battle, index) => {
        const currentBattle = activeBattles[index];
        return (
          hasTokenDataChanged(currentBattle.token1, battle.token1) ||
          hasTokenDataChanged(currentBattle.token2, battle.token2)
        );
      });

      if (hasChanges) {
        console.log('Background update: Changes detected, updating UI...');
        setActiveBattles(updatedBattles);
      } else {
        console.log('Background update: No changes detected');
      }
    } catch (err) {
      console.error('Background update error:', err);
      // Don't show error to user for background updates
    }
  }, [activeBattles, isInitialLoad, loading, updateTokenDataInBattles]);

  // Load battles from Supabase with optimized real-time updates
  useEffect(() => {
    initialLoadBattles();
  }, []);

  // Set up background updates only after initial load
  useEffect(() => {
    if (isInitialLoad) return;

    const interval = setInterval(() => {
      backgroundUpdateBattles();
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, [isInitialLoad, backgroundUpdateBattles]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleCopyTvT = () => {
    copyToClipboard(tvtCA, 'TvT contract address copied!');
  };

  const newBattles = activeBattles.filter(battle => battle.status === 'new');
  const aboutToBondBattles = activeBattles.filter(battle => battle.status === 'about_to_bond');
  const bondedBattles = activeBattles.filter(battle => battle.status === 'bonded' || battle.status === 'completed');

  // Categories for dropdown
  const categories = [
    { id: 'new', label: 'New Battles', battles: newBattles },
    { id: 'about_to_bond', label: 'About to Bond', battles: aboutToBondBattles },
    { id: 'graduated', label: 'Graduated', battles: bondedBattles }
  ];

  const getCurrentCategoryData = () => {
    return categories.find(cat => cat.id === selectedCategory) || categories[0];
  };

  return (
    <div className="min-h-screen bg-dark-900 relative">
      {/* Animated Background Particles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-32 h-32 bg-primary-500/10 rounded-full blur-xl animate-float"></div>
        <div className="absolute top-40 right-32 w-24 h-24 bg-blue-500/10 rounded-full blur-xl animate-float" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-40 left-32 w-40 h-40 bg-purple-500/10 rounded-full blur-xl animate-float" style={{animationDelay: '4s'}}></div>
      </div>
      
      {/* Hero Section */}
      <div className="relative overflow-hidden mt-[70px]">
        {/* Enhanced Gradient Background */}
        <div className="absolute inset-0 bg-hero-gradient"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-dark-900/50 to-dark-900"></div>
        
        {/* Free Launch Banner */}
        <div className="relative bg-tvt-gradient text-center py-2 shadow-lg">
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-6">
            <span className="text-white font-semibold text-lg animate-slide-in">
              🎉 FREE launches for everyone until September 6th | FREE launches for $TvT holders forever
            </span>
            <div className="text-white font-mono bg-black/20 px-4 py-2 rounded-lg animate-pulse-glow">
              Ends in: <CountdownTimer targetDate={freeEndDate} />
            </div>
          </div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          {/* TvT Logo */}
          <div className="flex justify-center mb-12">
            <div className="w-40 h-40 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center shadow-2xl animate-float pulse-glow relative border border-white/20">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 to-blue-500/20 rounded-full animate-ping opacity-20"></div>
              <img 
                src="/logo.png" 
                alt="Token vs Token Logo" 
                className="w-32 h-32 object-contain relative z-10"
              />
            </div>
          </div>

          {/* Main Heading */}
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 animate-slide-up">
              Create a battle. Countdown begins.
              {/* <span className="gradient-text">Countdown begins.</span> */}
            </h1>
            <h2 className="text-3xl md:text-5xl font-bold mb-4 animate-slide-up" style={{animationDelay: '0.2s'}}>
              <span className="text-primary-400 drop-shadow-lg">Market cap decides.</span>{' '}
              <span className="text-blue-400 drop-shadow-lg">Liquidity pours.</span>
            </h2>
            <p className="text-2xl text-dark-300 max-w-4xl mx-auto mb-8 leading-relaxed animate-slide-up" style={{animationDelay: '0.4s'}}>
              Arguing over what's better? Deploy a battle and let the community decide.
              <br />
              <span className="text-primary-400 font-semibold">Real incentives, real answers.</span>
            </p>
          </div>

          {/* TvT Contract Address */}
          <div className="flex justify-center mb-8">
            <div className="card card-glow bg-card-gradient rounded-xl p-4 border border-dark-700/50 backdrop-blur-sm animate-slide-up" style={{animationDelay: '0.6s'}}>
              <p className="text-dark-300 text-lg mb-4 text-center font-medium">
                💎 TvT holder benefits - <span className="gradient-text font-semibold">free launches & injections from a % of generated fees</span>
              </p>
              <div className="flex items-center justify-center space-x-3 bg-dark-900/50 rounded-xl p-2">
                <span className="text-primary-400 font-semibold">CA:</span>
                <span className="font-mono text-white text-lg">{tvtCA}</span>
                <button
                  onClick={handleCopyTvT}
                  className="text-dark-400 hover:text-primary-400 transition-all duration-300 p-2 hover:bg-primary-500/10 rounded-lg"
                >
                  <Copy size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-20">
            <Link to="/create" className="btn-primary flex items-center justify-center space-x-3 text-xl py-4 px-8 animate-slide-up" style={{animationDelay: '0.8s'}}>
              <Rocket size={24} />
              <span>Create a Battle</span>
            </Link>
            <Link to="/playbook" className="btn-secondary flex items-center justify-center space-x-3 text-lg py-4 px-8 animate-slide-up" style={{animationDelay: '1s'}}>
              <BookOpen size={22} />
              <span>Playbook</span>
            </Link>
            <Link to="/leaderboard" className="btn-secondary flex items-center justify-center space-x-3 text-lg py-4 px-8 animate-slide-up" style={{animationDelay: '1.2s'}}>
              <Trophy size={22} />
              <span>War Leaderboard</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Active Battles Section */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-battle-gradient opacity-30 rounded-3xl"></div>
        
        <div className="relative text-center mb-4">
          <h2 className="text-5xl font-bold text-white mb-6">
            <span className="gradient-text">Active Battles</span>
          </h2>
          <p className="text-xl text-dark-300 max-w-3xl mx-auto mb-6">
            Track the community's decisions in real-time and witness epic token wars unfold
          </p>
          
          {/* View Toggle */}
          <div className="flex justify-center mb-6">
            <div className="bg-dark-800 rounded-lg p-1 border border-dark-700 flex">
              <button
                onClick={() => setViewMode('cards')}
                className={`px-4 py-2 rounded-md flex items-center space-x-2 transition-all ${
                  viewMode === 'cards'
                    ? 'bg-primary-500 text-white shadow-lg'
                    : 'text-dark-300 hover:text-white hover:bg-dark-700'
                }`}
              >
                <Grid size={18} />
                <span>Scope</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-4 py-2 rounded-md flex items-center space-x-2 transition-all ${
                  viewMode === 'table'
                    ? 'bg-primary-500 text-white shadow-lg'
                    : 'text-dark-300 hover:text-white hover:bg-dark-700'
                }`}
              >
                <List size={18} />
                <span>Discover</span>
              </button>
            </div>
          </div>
          
          <div className="w-24 h-1 bg-tvt-gradient mx-auto rounded-full"></div>
        </div>

        {viewMode === 'table' ? (
          /* Table View with Dropdown */
          <div className="space-y-8">
            {/* Category Dropdown */}
            <div className="flex justify-center">
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="bg-dark-800 border border-dark-700 rounded-xl px-6 py-3 flex items-center space-x-3 text-white hover:bg-dark-700 transition-all duration-300 min-w-[200px] justify-between"
                >
                  <span className="font-medium">{getCurrentCategoryData().label}</span>
                  <ChevronDown className={`w-5 h-5 transform transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-dark-800 border border-dark-700 rounded-xl shadow-xl z-10 overflow-hidden">
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => {
                          setSelectedCategory(category.id as any);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full px-6 py-3 text-left hover:bg-dark-700 transition-all duration-300 flex items-center justify-between ${
                          selectedCategory === category.id ? 'bg-primary-500/20 text-primary-400' : 'text-white'
                        }`}
                      >
                        <span className="font-medium">{category.label}</span>
                        <span className="text-sm text-dark-400 bg-dark-700 px-2 py-1 rounded-full">
                          {category.battles.length}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Selected Category Table */}
            <div>
              {/* <h3 className="text-2xl font-bold text-white mb-6 text-center">{getCurrentCategoryData().label}</h3> */}
              <BattleTable battles={getCurrentCategoryData().battles} loading={loading} error={error} />
            </div>
          </div>
        ) : (
          /* Card View */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* New Battles */}
            <div>
              <h3 className="text-2xl font-bold text-white mb-6 text-center">New</h3>
              <div className="space-y-4">
                {loading ? (
                  <div className="card text-center py-12">
                    <p className="text-dark-400">Loading battles...</p>
                  </div>
                ) : error ? (
                  <div className="card text-center py-12">
                    <p className="text-red-400">{error}</p>
                  </div>
                ) : newBattles.length > 0 ? (
                  newBattles.map(battle => (
                    <BattleCard key={battle.id} battle={battle} />
                  ))
                ) : (
                  <div className="card text-center py-12">
                    <p className="text-dark-400">No battles here yet</p>
                    <p className="text-dark-500 text-sm">Be the first to create one!</p>
                  </div>
                )}
              </div>
            </div>

            {/* About to Bond */}
            <div>
              <h3 className="text-2xl font-bold text-white mb-6 text-center">About to bond</h3>
              <div className="space-y-4">
                {loading ? (
                  <div className="card text-center py-12">
                    <p className="text-dark-400">Loading battles...</p>
                  </div>
                ) : aboutToBondBattles.length > 0 ? (
                  aboutToBondBattles.map(battle => (
                    <BattleCard key={battle.id} battle={battle} />
                  ))
                ) : (
                  <div className="card text-center py-12">
                    <p className="text-dark-400">No battles here yet</p>
                    <p className="text-dark-500 text-sm">Be the first to create one!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Bonded */}
            <div>
              <h3 className="text-2xl font-bold text-white mb-6 text-center">Bonded</h3>
              <div className="space-y-4">
                {loading ? (
                  <div className="card text-center py-12">
                    <p className="text-dark-400">Loading battles...</p>
                  </div>
                ) : bondedBattles.length > 0 ? (
                  bondedBattles.map(battle => (
                    <BattleCard key={battle.id} battle={battle} />
                  ))
                ) : (
                  <div className="card text-center py-12">
                    <p className="text-dark-400">No battles here yet</p>
                    <p className="text-dark-500 text-sm">Be the first to create one!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage; 