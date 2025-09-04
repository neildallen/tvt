import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Rocket, Clock, Server, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { BattleFormData } from '../types';
import { BattleService } from '../services/BattleService';
import { UserService } from '../services/UserService';
import { ImageUploadService } from '../services/ImageUploadService';
import { BackendApiService } from '../services/BackendApiService';

const CreateBattlePage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState<{
    isChecking: boolean;
    isHealthy: boolean;
    message?: string;
    walletInfo?: { publicKey: string; balance: number; network: string };
  }>({
    isChecking: true,
    isHealthy: false,
  });
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

  const [logoPreviewUrls, setLogoPreviewUrls] = useState<{
    token1?: string;
    token2?: string;
  }>({});

  const [uploadedLogoUrls, setUploadedLogoUrls] = useState<{
    token1?: string;
    token2?: string;
  }>({});

  const [uploadingLogos, setUploadingLogos] = useState<{
    token1?: boolean;
    token2?: boolean;
  }>({});

  // Cleanup effect to revoke object URLs when component unmounts
  useEffect(() => {
    return () => {
      // Cleanup all preview URLs when component unmounts
      Object.values(logoPreviewUrls).forEach(url => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [logoPreviewUrls]);

  // Check backend server status on component mount
  useEffect(() => {
    const checkBackendStatus = async () => {
      try {
        setBackendStatus(prev => ({ ...prev, isChecking: true }));
        
        // Check health
        const healthCheck = await BackendApiService.checkHealth();
        
        if (healthCheck.success) {
          // Get wallet info if healthy
          const walletResponse = await BackendApiService.getWalletInfo();
          
          if (walletResponse.success && walletResponse.data) {
            setBackendStatus({
              isChecking: false,
              isHealthy: true,
              message: 'Backend server is ready',
              walletInfo: walletResponse.data,
            });
            toast.success('🚀 Backend server connected and ready!');
          } else {
            setBackendStatus({
              isChecking: false,
              isHealthy: false,
              message: walletResponse.error || 'Failed to get wallet info',
            });
          }
        } else {
          setBackendStatus({
            isChecking: false,
            isHealthy: false,
            message: healthCheck.message || 'Backend server not responding',
          });
        }
      } catch (error) {
        setBackendStatus({
          isChecking: false,
          isHealthy: false,
          message: error instanceof Error ? error.message : 'Unknown error',
        });
        console.error('Backend status check failed:', error);
      }
    };

    checkBackendStatus();
  }, []);

  const durations = [
    { value: 1, label: '1h' },
    { value: 3, label: '3h' },
    { value: 6, label: '6h' },
    { value: 12, label: '12h' },
    { value: 24, label: '24h' },
    { value: 48, label: '48h' },
    { value: 72, label: '72h' },
    { value: 168, label: '168h' },
  ];

  const handleInputChange = (
    tokenKey: 'token1' | 'token2',
    field: string,
    value: string
  ) => {
    setFormData(prev => {
      const newFormData = {
        ...prev,
        [tokenKey]: {
          ...prev[tokenKey],
          [field]: value,
        },
      };
      
      // Auto-generate names when tickers change
      if (field === 'ticker') {
        const ticker1 = tokenKey === 'token1' ? value : prev.token1.ticker;
        const ticker2 = tokenKey === 'token2' ? value : prev.token2.ticker;
        
        if (ticker1 && ticker2) {
          newFormData.token1.name = `${ticker1} vs ${ticker2}`;
          newFormData.token2.name = `${ticker2} vs ${ticker1}`;
        }
      }
      
      return newFormData;
    });
  };

  const handleFileUpload = async (tokenKey: 'token1' | 'token2', file: File) => {
    if (file && file.type.startsWith('image/')) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Image size should be less than 5MB');
        return;
      }
      
      // Set uploading state
      setUploadingLogos(prev => ({
        ...prev,
        [tokenKey]: true,
      }));
      
      // Clean up previous URL if it exists
      if (logoPreviewUrls[tokenKey]) {
        URL.revokeObjectURL(logoPreviewUrls[tokenKey]!);
      }
      
      // Create new preview URL
      const previewUrl = URL.createObjectURL(file);
      
      setLogoFiles(prev => ({
        ...prev,
        [tokenKey]: file,
      }));
      
      setLogoPreviewUrls(prev => ({
        ...prev,
        [tokenKey]: previewUrl,
      }));
      
      toast.success(`${tokenKey === 'token1' ? 'Token 1' : 'Token 2'} logo selected!`);

      // Upload to Supabase Storage
      try {
        const uploadedUrl = await ImageUploadService.uploadImage(file);
        setUploadedLogoUrls(prev => ({
          ...prev,
          [tokenKey]: uploadedUrl,
        }));
        toast.success('Logo uploaded to cloud storage!');
      } catch (error) {
        console.error('Error uploading to storage:', error);
        toast.error('Upload failed, but image will be used locally');
        // Continue with local preview even if cloud upload fails
      } finally {
        // Clear uploading state
        setUploadingLogos(prev => ({
          ...prev,
          [tokenKey]: false,
        }));
      }
    } else {
      toast.error('Please upload a valid image file');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.token1.ticker) {
      toast.error('Please fill in Token 1 ticker');
      return;
    }
    
    if (!formData.token2.ticker) {
      toast.error('Please fill in Token 2 ticker');
      return;
    }

    // Check backend status
    if (!backendStatus.isHealthy) {
      toast.error('Backend server is not available. Please try again later.');
      return;
    }

    setIsLoading(true);
    
    try {
      // Show launching feedback
      toast.loading('🚀 Launching tokens on Solana blockchain...', { id: 'launch-toast' });
      
      // Prepare battle data with uploaded logo URLs
      const battleDataWithLogos = {
        ...formData,
        token1: {
          ...formData.token1,
          logo: uploadedLogoUrls.token1,
        },
        token2: {
          ...formData.token2,
          logo: uploadedLogoUrls.token2,
        },
      };
      
      // Create battle with on-chain tokens using backend server
      const battle = await BattleService.createBattleWithBackend(battleDataWithLogos);
      
      // // Update user profile
      // await UserService.incrementBattlesCreated(creatorWallet);
      
      toast.success('🎉 Battle created successfully! Tokens are live on Solana!', { id: 'launch-toast' });
      
      // Navigate to the created battle or home page
      navigate(`/battle/${battle.id}`, { replace: true });
    } catch (error) {
      console.error('Error creating battle:', error);
      
      let errorMessage = 'Failed to create battle. Please try again.';
      if (error instanceof Error) {
        if (error.message.includes('Backend server')) {
          errorMessage = 'Backend server is not running. Please start the server and try again.';
        } else if (error.message.includes('Token launch failed')) {
          errorMessage = 'Failed to launch tokens on blockchain. Please try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast.error(errorMessage, { id: 'launch-toast' });
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

        {/* Auto-generated name display */}
        {formData[tokenKey].name && (
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Token Name <span className="text-primary-400">(Auto-generated)</span>
            </label>
            <div className="bg-dark-700/50 border border-dark-600 rounded-xl px-4 py-3 text-white font-medium">
              {formData[tokenKey].name}
            </div>
          </div>
        )}

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
              disabled={uploadingLogos[tokenKey]}
            />
            <label htmlFor={`logo-${tokenKey}`} className={`cursor-pointer ${uploadingLogos[tokenKey] ? 'pointer-events-none' : ''}`}>
              <div className="flex flex-col items-center space-y-3">
                {uploadingLogos[tokenKey] ? (
                  // Show loading state while uploading
                  <div className="flex flex-col items-center space-y-3">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary-500/20 to-blue-500/20 rounded-full flex items-center justify-center animate-spin">
                      <div className="w-8 h-8 border-2 border-primary-400 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <div>
                      <p className="text-primary-400 font-semibold">Uploading to cloud...</p>
                      <p className="text-dark-400 text-sm">Please wait</p>
                    </div>
                  </div>
                ) : logoPreviewUrls[tokenKey] ? (
                  // Show image preview when file is uploaded
                  <div className="flex flex-col items-center space-y-3">
                    <div className="relative group">
                      <img
                        src={logoPreviewUrls[tokenKey]}
                        alt={`${tokenKey} logo preview`}
                        className="w-32 h-32 object-cover rounded-2xl border-2 border-primary-500 shadow-lg group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-2xl transition-all duration-300 flex items-center justify-center">
                        <Upload className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-primary-400 font-semibold bg-primary-500/10 px-3 py-1 rounded-full text-sm">
                        ✓ {logoFiles[tokenKey]?.name}
                      </p>
                      <p className="text-dark-400 text-xs mt-1">
                        {uploadedLogoUrls[tokenKey] ? 'Uploaded to cloud • Click to change' : 'Local preview • Click to change'}
                      </p>
                    </div>
                  </div>
                ) : (
                  // Show upload placeholder when no file is uploaded
                  <>
                    <div className="w-16 h-16 bg-gradient-to-br from-primary-500/20 to-blue-500/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Upload className="w-8 h-8 text-primary-400" />
                    </div>
                    <div>
                      <p className="text-white font-semibold mb-1">Drag & drop or click to upload</p>
                      <p className="text-dark-400 text-sm">PNG, JPG, GIF up to 5MB</p>
                    </div>
                  </>
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
            readOnly
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative">
            {renderTokenForm('token1', 1)}
            
            {/* VS Divider */}
            <div className="lg:hidden flex items-center justify-center py-4">
              <div className="w-12 h-12 bg-dark-600 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white font-bold">VS</span>
              </div>
            </div>
            
            {/* Desktop VS Divider */}
            <div className="hidden lg:flex absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
              <div className="w-16 h-16 bg-gradient-to-br from-dark-600 to-dark-700 rounded-full flex items-center justify-center shadow-xl border-2 border-dark-500">
                <span className="text-white font-bold text-xl">VS</span>
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
            {/* Backend Status Indicator */}
            <div className={`
              bg-gradient-to-r rounded-2xl p-6 border transition-all duration-300
              ${backendStatus.isHealthy 
                ? 'from-green-500/10 to-blue-500/10 border-green-500/20' 
                : backendStatus.isChecking
                ? 'from-yellow-500/10 to-orange-500/10 border-yellow-500/20'
                : 'from-red-500/10 to-orange-500/10 border-red-500/20'
              }
            `}>
              <div className="flex items-center justify-center space-x-3 mb-3">
                {backendStatus.isChecking ? (
                  <>
                    <div className="w-6 h-6 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-yellow-400 font-semibold">Checking Backend Server...</span>
                  </>
                ) : backendStatus.isHealthy ? (
                  <>
                    <CheckCircle className="w-6 h-6 text-green-400" />
                    <span className="text-green-400 font-semibold">Backend Server Ready</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-6 h-6 text-red-400" />
                    <span className="text-red-400 font-semibold">Backend Server Unavailable</span>
                  </>
                )}
              </div>
              
              {/* {backendStatus.isHealthy && backendStatus.walletInfo && (
                <div className="text-sm space-y-1">
                  <p className="text-green-300">
                    <Server className="w-4 h-4 inline mr-2" />
                    Wallet: {backendStatus.walletInfo.publicKey.slice(0, 8)}...{backendStatus.walletInfo.publicKey.slice(-8)}
                  </p>
                  <p className="text-green-300">
                    💰 Balance: {backendStatus.walletInfo.balance.toFixed(4)} SOL ({backendStatus.walletInfo.network})
                  </p>
                </div>
              )} */}
              
              {!backendStatus.isHealthy && !backendStatus.isChecking && (
                <div className="text-sm">
                  <p className="text-red-300 mb-2">{backendStatus.message}</p>
                  <p className="text-red-200 text-xs">
                    Please start the backend server: <code className="bg-red-900/30 px-2 py-1 rounded">npm run dev</code> in the server directory
                  </p>
                </div>
              )}
            </div>

            <div className="bg-gradient-to-r from-primary-500/10 to-blue-500/10 rounded-2xl p-6 border border-primary-500/20">
              <p className="text-lg text-primary-300 font-semibold mb-2">
                🚀 Ready to Launch? 
              </p>
              <p className="text-dark-300">
                Tokens will be launched on Solana blockchain using our backend wallet
              </p>
            </div>
            
            <button
              type="submit"
              disabled={isLoading || !backendStatus.isHealthy}
              className="btn-primary text-2xl px-16 py-6 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-4 mx-auto relative overflow-hidden group"
            >
              {isLoading && (
                <div className="absolute inset-0 bg-gradient-to-r from-primary-600/50 to-blue-600/50 animate-pulse"></div>
              )}
              <Rocket className={`w-8 h-8 ${isLoading ? 'animate-bounce' : 'group-hover:animate-pulse'}`} />
              <span className="relative z-10 font-bold">
                {isLoading 
                  ? 'Launching on Blockchain...' 
                  : !backendStatus.isHealthy
                  ? 'Backend Server Required'
                  : 'Launch Battle'
                }
              </span>
              {isLoading && (
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent animate-ping"></div>
              )}
            </button>
            
            <p className="text-dark-500 text-sm">
              {backendStatus.isHealthy 
                ? '⚡ Battles launch instantly on Solana blockchain with real trading'
                : '🔧 Backend server required for blockchain token deployment'
              }
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateBattlePage; 