import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Rocket, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { BattleFormData } from '../types';

const CreateBattlePage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<BattleFormData>({
    token1: {
      ticker: '',
      name: '',
      twitter: '',
      telegram: '',
    },
    token2: {
      ticker: '',
      name: '',
      twitter: '',
      telegram: '',
    },
    duration: 12, // Default 12 hours
  });

  const [logoFiles, setLogoFiles] = useState<{
    token1?: File;
    token2?: File;
  }>({});

  const durations = [
    { value: 0.25, label: '15m' },
    { value: 1, label: '1h' },
    { value: 2, label: '2h' },
    { value: 3, label: '3h' },
    { value: 4, label: '4h' },
    { value: 6, label: '6h' },
    { value: 8, label: '8h' },
    { value: 10, label: '10h' },
    { value: 12, label: '12h' },
  ];

  const handleInputChange = (
    tokenKey: 'token1' | 'token2',
    field: string,
    value: string
  ) => {
    setFormData(prev => ({
      ...prev,
      [tokenKey]: {
        ...prev[tokenKey],
        [field]: value,
      },
    }));
  };

  const handleFileUpload = (tokenKey: 'token1' | 'token2', file: File) => {
    if (file && file.type.startsWith('image/')) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Image size should be less than 5MB');
        return;
      }
      setLogoFiles(prev => ({
        ...prev,
        [tokenKey]: file,
      }));
      toast.success(`${tokenKey === 'token1' ? 'Token 1' : 'Token 2'} logo uploaded!`);
    } else {
      toast.error('Please upload a valid image file');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.token1.ticker || !formData.token1.name) {
      toast.error('Please fill in Token 1 details');
      return;
    }
    
    if (!formData.token2.ticker || !formData.token2.name) {
      toast.error('Please fill in Token 2 details');
      return;
    }

    setIsLoading(true);
    
    try {
      // Here you would integrate with your backend/Supabase
      // For now, we'll simulate the process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success('Battle created successfully! Tokens are launching...');
      navigate('/');
    } catch (error) {
      toast.error('Failed to create battle. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderTokenForm = (tokenKey: 'token1' | 'token2', tokenNumber: number) => (
    <div className="card card-glow bg-card-gradient animate-slide-up" style={{animationDelay: `${tokenNumber * 0.2}s`}}>
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-2xl font-bold gradient-text">Token {tokenNumber}</h3>
        <div className="w-10 h-10 bg-tvt-gradient rounded-full flex items-center justify-center shadow-lg animate-pulse">
          <span className="text-white font-bold text-lg">{tokenNumber}</span>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-dark-300 mb-2">
            Ticker*
          </label>
          <input
            type="text"
            placeholder="E.G. TRUMP"
            className="input-field"
            value={formData[tokenKey].ticker}
            onChange={(e) => handleInputChange(tokenKey, 'ticker', e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-dark-300 mb-2">
            Token Name*
          </label>
          <input
            type="text"
            placeholder="E.G. TRUMP TOKEN"
            className="input-field"
            value={formData[tokenKey].name}
            onChange={(e) => handleInputChange(tokenKey, 'name', e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-dark-300 mb-3">
            Logo* <span className="text-primary-400">(Max 5MB)</span>
          </label>
          <div className="border-2 border-dashed border-dark-600 rounded-2xl p-10 text-center hover:border-primary-500 hover:bg-primary-500/5 transition-all duration-300 group">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(tokenKey, file);
              }}
              className="hidden"
              id={`logo-${tokenKey}`}
            />
            <label htmlFor={`logo-${tokenKey}`} className="cursor-pointer">
              <div className="flex flex-col items-center space-y-3">
                <div className="w-16 h-16 bg-gradient-to-br from-primary-500/20 to-blue-500/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Upload className="w-8 h-8 text-primary-400" />
                </div>
                <div>
                  <p className="text-white font-semibold mb-1">Drag & drop or click to upload</p>
                  <p className="text-dark-400 text-sm">PNG, JPG, GIF up to 5MB</p>
                </div>
                {logoFiles[tokenKey] && (
                  <p className="text-primary-400 font-semibold bg-primary-500/10 px-3 py-1 rounded-full text-sm">
                    ✓ {logoFiles[tokenKey]?.name}
                  </p>
                )}
              </div>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-dark-300 mb-2">
            Website (optional)
          </label>
          <input
            type="url"
            placeholder="https://example.com"
            className="input-field"
            value={`https://tvt.fun/${formData[tokenKey].ticker.toLowerCase()}`}
          />
          <p className="text-xs text-dark-500 mt-1">
            Automatically generated based on ticker
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-dark-300 mb-2">
            Twitter (optional)
          </label>
          <input
            type="text"
            placeholder="@username or https://twitter.com/username"
            className="input-field"
            value={formData[tokenKey].twitter || ''}
            onChange={(e) => handleInputChange(tokenKey, 'twitter', e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-dark-300 mb-2">
            Telegram (optional)
          </label>
          <input
            type="text"
            placeholder="https://t.me/groupname"
            className="input-field"
            value={formData[tokenKey].telegram || ''}
            onChange={(e) => handleInputChange(tokenKey, 'telegram', e.target.value)}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-dark-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-40 h-40 bg-primary-500/10 rounded-full blur-2xl animate-float"></div>
        <div className="absolute bottom-20 right-20 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl animate-float" style={{animationDelay: '3s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-purple-500/5 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-16 mt-16">
          <div className="w-24 h-24 bg-tvt-gradient rounded-full flex items-center justify-center mx-auto mb-8 animate-float pulse-glow">
            <Rocket className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            <span className="gradient-text">Token vs Token</span>
          </h1>
          <p className="text-xl text-dark-300 max-w-2xl mx-auto leading-relaxed">
            Can't agree on who's better? Create a battle and let the community decide.
            <br />
            <span className="text-primary-400 font-semibold">No wallet connection needed!</span>
          </p>
          <div className="w-24 h-1 bg-tvt-gradient mx-auto mt-6 rounded-full"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Token Forms */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {renderTokenForm('token1', 1)}
            
            {/* VS Divider */}
            <div className="lg:hidden flex items-center justify-center py-4">
              <div className="w-12 h-12 bg-dark-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">VS</span>
              </div>
            </div>
            <div className="hidden lg:flex lg:absolute lg:left-1/2 lg:transform lg:-translate-x-1/2 lg:top-1/2 lg:-translate-y-1/2 lg:z-10">
              <div className="w-12 h-12 bg-dark-600 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white font-bold">VS</span>
              </div>
            </div>

            {renderTokenForm('token2', 2)}
          </div>

          {/* Battle Duration */}
          <div className="card card-glow bg-card-gradient animate-slide-up" style={{animationDelay: '0.6s'}}>
            <div className="text-center mb-10">
              <h3 className="text-3xl font-bold text-white mb-4">
                <Clock className="w-8 h-8 inline-block mr-3 text-primary-400" />
                <span className="gradient-text">Battle Duration</span>
              </h3>
              <p className="text-xl text-dark-300">How long should this epic battle last?</p>
              <div className="w-20 h-1 bg-tvt-gradient mx-auto mt-4 rounded-full"></div>
            </div>
            
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 mb-8">
              {durations.map((duration) => (
                <button
                  key={duration.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, duration: duration.value }))}
                  className={`
                    p-5 rounded-2xl border-2 transition-all duration-300 font-bold text-xl hover:scale-105 relative overflow-hidden
                    ${formData.duration === duration.value
                      ? 'border-primary-500 bg-gradient-to-br from-primary-500/30 to-blue-500/30 text-white shadow-lg shadow-primary-500/25'
                      : 'border-dark-600 bg-dark-700 text-dark-300 hover:border-primary-500/50 hover:text-white'
                    }
                  `}
                >
                  {formData.duration === duration.value && (
                    <div className="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-blue-500/20 animate-pulse"></div>
                  )}
                  <span className="relative z-10">{duration.label}</span>
                </button>
              ))}
            </div>
            
            <div className="text-center bg-dark-900/50 rounded-xl p-4">
              <p className="text-primary-400 font-semibold">
                ⏰ Selected: <span className="text-white">{durations.find(d => d.value === formData.duration)?.label}</span>
              </p>
              <p className="text-dark-400 text-sm mt-1">
                Perfect timing for maximum community engagement!
              </p>
            </div>
          </div>

          {/* Connect Wallet & Submit */}
          <div className="text-center space-y-8 animate-slide-up" style={{animationDelay: '0.8s'}}>
            <div className="bg-gradient-to-r from-primary-500/10 to-blue-500/10 rounded-2xl p-6 border border-primary-500/20">
              <p className="text-lg text-primary-300 font-semibold mb-2">
                🚀 Ready to Launch? 
              </p>
              <p className="text-dark-300">
                No wallet connection needed - launches are funded by our backend wallet
              </p>
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary text-2xl px-16 py-6 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-4 mx-auto relative overflow-hidden group"
            >
              {isLoading && (
                <div className="absolute inset-0 bg-gradient-to-r from-primary-600/50 to-blue-600/50 animate-pulse"></div>
              )}
              <Rocket className={`w-8 h-8 ${isLoading ? 'animate-bounce' : 'group-hover:animate-pulse'}`} />
              <span className="relative z-10 font-bold">
                {isLoading ? 'Creating Epic Battle...' : 'Launch Battle'}
              </span>
              {isLoading && (
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent animate-ping"></div>
              )}
            </button>
            
            <p className="text-dark-500 text-sm">
              ⚡ Battles launch instantly with identical starting conditions
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateBattlePage; 