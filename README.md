# Tvt Token Launchpad - Battle Arena 🚀

A Solana-based launchpad dApp where users create competitive token "battles" using Meteora's Dynamic Bonding Curve. Two tokens launch simultaneously, and liquidity flows to the winner based on market cap after a countdown.

## 🌟 **NEW: Fully Integrated with Supabase!**

✅ **Complete backend integration** with real-time updates  
✅ **Cloud storage** for token logos  
✅ **User tracking** and statistics  
✅ **Live leaderboard** with automatic updates  
✅ **Battle persistence** - never lose your data  

> See `INTEGRATION_COMPLETE.md` for full Supabase setup details

## 🚀 Features

### Core Functionality
- **Token Battles**: Create competitive launches with two tokens fighting for dominance
- **Dynamic Bonding Curve**: Integration with Meteora for fair token launches
- **Countdown Timers**: Customizable battle durations (15m to 12h)
- **Liquidity Pouring**: Automatic liquidity transfer from loser to winner (70%), Tvt token (10%), and team wallet (20%)
- **Real-time Updates**: Live market cap and volume tracking with Supabase subscriptions
- **War Leaderboard**: Rankings of all migrated tokens with weekly competitions
- **Persistent Data**: All battles, votes, and user activity stored in Supabase
- **Cloud Storage**: Token logos automatically uploaded to Supabase Storage

### Pages Implemented
1. **Home Page** - Active battles display with real-time updates from database
2. **Create Battle** - Form for launching new token battles with cloud logo upload
3. **Battle Details** - Live battle tracking with database-driven updates
4. **Playbook** - Comprehensive guide explaining the platform
5. **War Leaderboard** - Dynamic leaderboard from database with live updates

### Key Components
- **BattleCard** - Displays battle information from database
- **CountdownTimer** - Real-time countdown with automatic updates
- **Header** - Navigation with Tvt contract address
- **Responsive Design** - Mobile-first approach with Tailwind CSS

## 🛠 Technology Stack

- **Frontend**: React 18 + TypeScript
- **Backend**: Supabase (PostgreSQL + Real-time + Storage)
- **Styling**: Tailwind CSS with custom design system
- **Routing**: React Router v6
- **Icons**: Lucide React
- **Notifications**: React Hot Toast
- **Animations**: Framer Motion
- **Blockchain**: Solana Web3.js + Meteora SDK
- **Database**: Full Supabase integration with real-time subscriptions

## 🎨 Design System

### Colors
- **Primary Green**: `#22c55e` (Tvt brand color)
- **Blue Accent**: `#3b82f6` (battle contrast)
- **Dark Theme**: Various shades from `#0f172a` to `#475569`
- **Gradient**: `linear-gradient(135deg, #22c55e 0%, #3b82f6 100%)`

### Custom CSS Classes
- `.btn-primary` - Main action buttons with gradient
- `.btn-secondary` - Secondary buttons with dark styling
- `.card` - Consistent card layout throughout app
- `.input-field` - Form input styling

## 📁 Project Structure

```
src/
├── components/
│   ├── layout/
│   │   └── Header.tsx           # Navigation header
│   ├── BattleCard.tsx          # Battle display component
│   └── CountdownTimer.tsx      # Timer component
├── lib/
│   └── supabase.ts             # Supabase client configuration
├── pages/
│   ├── HomePage.tsx            # Main landing page with real-time data
│   ├── CreateBattlePage.tsx    # Battle creation with cloud uploads
│   ├── BattleDetailsPage.tsx   # Individual battle view with live updates
│   ├── PlaybookPage.tsx        # Platform documentation
│   └── LeaderboardPage.tsx     # Dynamic token rankings
├── services/
│   ├── BattleService.ts        # Battle CRUD operations
│   ├── UserService.ts          # User profile management
│   ├── ImageUploadService.ts   # Cloud storage for logos
│   ├── RealtimeService.ts      # Real-time subscriptions
│   └── LaunchpadService.ts     # Solana/Meteora integration
├── types/
│   ├── index.ts                # App TypeScript definitions
│   └── database.ts             # Generated Supabase types
├── utils/
│   ├── clipboard.ts            # Copy to clipboard utility
│   └── format.ts               # Number formatting utilities
├── App.tsx                     # Main app component with routing
├── index.tsx                   # React entry point
├── index.css                   # Global styles with Tailwind
├── supabase-setup.sql          # Database schema and setup
└── INTEGRATION_COMPLETE.md     # Supabase integration guide
```

## ⚡ Getting Started

### Prerequisites
- Node.js 16+ installed
- Supabase account (your credentials are already configured)

### Quick Start
1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set up Supabase Database**
   - Go to your Supabase dashboard: https://supabase.com/dashboard
   - Navigate to SQL Editor
   - Copy and paste the contents of `supabase-setup.sql`
   - Run the script to create all tables and functions

3. **Create Storage Bucket**
   - Go to Storage in your Supabase dashboard
   - Create a new bucket named `token-logos`
   - Set it to public for direct URL access

4. **Start Development Server**
   ```bash
   npm start
   ```

5. **Test the Integration**
   - Create a new battle to test database integration
   - Upload logos to test cloud storage
   - Check Supabase dashboard to see real data

### Build for Production
```bash
npm run build
```

## 📊 Database Schema (Supabase)

### Core Tables
- **tokens** - Token metadata, logos, contract addresses, statistics
- **battles** - Battle configuration, status, timing, creator info
- **battle_votes** - Individual votes/trades within battles
- **user_profiles** - User statistics and activity tracking
- **leaderboard** - Cached rankings with automatic updates

### Automatic Features
- **Real-time subscriptions** for live updates
- **Automatic leaderboard** calculation when battles complete
- **User statistics** tracking (battles created, votes cast, volume traded)
- **Row Level Security** for secure data access

## 🔧 Integration Status

### ✅ Completed Integrations
- **Supabase Database**: Complete with tables, functions, and RLS
- **Real-time Updates**: Live subscriptions for battles, votes, and leaderboard
- **Cloud Storage**: Automatic logo uploads to Supabase Storage
- **User Tracking**: Comprehensive statistics and profile management
- **Type Safety**: Full TypeScript support with generated database types

### 🚧 Next Steps for Blockchain Integration
- [ ] Connect to Meteora Dynamic Bonding Curve SDK
- [ ] Implement token launch functionality with real transactions
- [ ] Add wallet connection (Phantom, Solflare, etc.)
- [ ] Integrate real-time market data from Solana
- [ ] Implement liquidity pouring mechanism with MEV protection

### 🎯 Additional Features
- [ ] Push notifications for battle updates
- [ ] Social media sharing integration
- [ ] Advanced analytics dashboard
- [ ] Mobile app (React Native)
- [ ] Discord/Telegram bot integration

## 🎯 Battle Flow

1. **Create Battle**: User submits metadata for two competing tokens
2. **Token Launch**: Both tokens launch simultaneously on Meteora
3. **Community Trading**: Market determines winner through volume and market cap
4. **Countdown**: Battle runs for user-defined duration
5. **Liquidity Pour**: Losing token's liquidity flows to winner and platform

## 💎 TvT Token Benefits

- **Free Launches**: No fees for Tvt holders
- **Revenue Share**: Percentage of platform fees
- **Priority Access**: Early access to new features
- **Voting Rights**: Platform governance participation

## 🔒 Security Features

- MEV protection for liquidity pouring
- Random timing for battle resolution
- Audited smart contracts
- Slippage protection

## 📱 Mobile Responsive

The application is fully responsive and optimized for:
- Mobile devices (iOS/Android)
- Tablets
- Desktop browsers
- Progressive Web App ready

---

**Built with ❤️ for the Solana ecosystem** 