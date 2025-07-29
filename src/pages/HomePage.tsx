import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Copy, Rocket, BookOpen, Trophy, Timer } from 'lucide-react';
import { copyToClipboard } from '../utils/clipboard';
import BattleCard from '../components/BattleCard';
import CountdownTimer from '../components/CountdownTimer';
import { Battle } from '../types';

const HomePage: React.FC = () => {
  const [activeBattles, setActiveBattles] = useState<Battle[]>([]);
  const tvtCA = 'xxxxxxxxxxxx';
  const freeEndDate = new Date('2024-07-06T23:59:59'); // June 6th example

  // Mock data for demonstration
  useEffect(() => {
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
          marketCap: 0,
          volume: 0,
          migrated: true,
          twitter: '@june_token',
        },
        duration: 12,
        createdAt: new Date('2024-01-15'),
        startTime: new Date('2024-01-15T10:00:00'),
        endTime: new Date('2024-01-15T22:00:00'),
        status: 'bonded',
        winner: '1'
      }
    ];
    setActiveBattles(mockBattles);
  }, []);

  const handleCopyTVT = () => {
    copyToClipboard(tvtCA, 'TVT contract address copied!');
  };

  const newBattles = activeBattles.filter(battle => battle.status === 'new');
  const aboutToBondBattles = activeBattles.filter(battle => battle.status === 'about_to_bond');
  const bondedBattles = activeBattles.filter(battle => battle.status === 'bonded');

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
              🎉 FREE launches for everyone until July 6th | FREE launches for $TVT holders forever
            </span>
            <div className="text-white font-mono bg-black/20 px-4 py-2 rounded-lg animate-pulse-glow">
              Ends in: <CountdownTimer targetDate={freeEndDate} />
            </div>
          </div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          {/* TVT Logo */}
          <div className="flex justify-center mb-12">
            <div className="w-40 h-40 bg-tvt-gradient rounded-full flex items-center justify-center shadow-2xl animate-float pulse-glow relative">
              <div className="absolute inset-0 bg-tvt-gradient rounded-full animate-ping opacity-20"></div>
              <span className="text-white font-bold text-5xl relative z-10">TVT</span>
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

          {/* TVT Contract Address */}
          <div className="flex justify-center mb-8">
            <div className="card card-glow bg-card-gradient rounded-xl p-4 border border-dark-700/50 backdrop-blur-sm animate-slide-up" style={{animationDelay: '0.6s'}}>
              <p className="text-dark-300 text-lg mb-4 text-center font-medium">
                💎 TVT holder benefits - <span className="gradient-text font-semibold">free launches & injections from a % of generated fees</span>
              </p>
              <div className="flex items-center justify-center space-x-3 bg-dark-900/50 rounded-xl p-2">
                <span className="text-primary-400 font-semibold">CA:</span>
                <span className="font-mono text-white text-lg">{tvtCA}</span>
                <button
                  onClick={handleCopyTVT}
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
        
        <div className="relative text-center mb-16">
          <h2 className="text-5xl font-bold text-white mb-6">
            <span className="gradient-text">Active Battles</span>
          </h2>
          <p className="text-xl text-dark-300 max-w-2xl mx-auto">
            Track the community's decisions in real-time and witness epic token wars unfold
          </p>
          <div className="w-24 h-1 bg-tvt-gradient mx-auto mt-6 rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* New Battles */}
          <div>
            <h3 className="text-2xl font-bold text-white mb-6 text-center">New</h3>
            <div className="space-y-4">
              {newBattles.length > 0 ? (
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
              {aboutToBondBattles.length > 0 ? (
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
              {bondedBattles.length > 0 ? (
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
      </div>
    </div>
  );
};

export default HomePage; 