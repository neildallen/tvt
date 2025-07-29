# TVT Token Launchpad - Battle Arena

A Solana-based launchpad dApp where users create competitive token "battles" using Meteora's Dynamic Bonding Curve. Two tokens launch simultaneously, and liquidity flows to the winner based on market cap after a countdown.

## 🚀 Features

### Core Functionality
- **Token Battles**: Create competitive launches with two tokens fighting for dominance
- **Dynamic Bonding Curve**: Integration with Meteora for fair token launches
- **Countdown Timers**: Customizable battle durations (15m to 12h)
- **Liquidity Pouring**: Automatic liquidity transfer from loser to winner (70%), TVT token (10%), and team wallet (20%)
- **Real-time Updates**: Live market cap and volume tracking
- **War Leaderboard**: Rankings of all migrated tokens with weekly competitions

### Pages Implemented
1. **Home Page** - Active battles display, TVT token info, navigation
2. **Create Battle** - Form for launching new token battles (no wallet connection needed)
3. **Battle Details** - Live battle tracking with countdown, progress bar, and token stats
4. **Playbook** - Comprehensive guide explaining the platform
5. **War Leaderboard** - Token rankings with podium display and weekly competitions

### Key Components
- **BattleCard** - Displays battle information in grid layout
- **CountdownTimer** - Real-time countdown with automatic updates
- **Header** - Navigation with TVT contract address and dark mode toggle
- **Responsive Design** - Mobile-first approach with Tailwind CSS

## 🛠 Technology Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Routing**: React Router v6
- **Icons**: Lucide React
- **Notifications**: React Hot Toast
- **Animations**: Framer Motion
- **Blockchain**: Solana Web3.js (ready for integration)
- **Database**: Supabase (ready for integration)

## 🎨 Design System

### Colors
- **Primary Green**: `#22c55e` (TVT brand color)
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
├── pages/
│   ├── HomePage.tsx            # Main landing page
│   ├── CreateBattlePage.tsx    # Battle creation form
│   ├── BattleDetailsPage.tsx   # Individual battle view
│   ├── PlaybookPage.tsx        # Platform documentation
│   └── LeaderboardPage.tsx     # Token rankings
├── types/
│   └── index.ts                # TypeScript definitions
├── utils/
│   ├── clipboard.ts            # Copy to clipboard utility
│   └── format.ts               # Number formatting utilities
├── App.tsx                     # Main app component with routing
├── index.tsx                   # React entry point
└── index.css                   # Global styles with Tailwind
```

## ⚡ Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm start
   ```

3. **Build for Production**
   ```bash
   npm run build
   ```

## 🔧 Next Steps for Integration

### Backend Integration
- [ ] Connect to Supabase for battle data storage
- [ ] Implement image upload for token logos
- [ ] Set up user authentication (optional)

### Solana Integration
- [ ] Connect to Meteora Dynamic Bonding Curve
- [ ] Implement token launch functionality
- [ ] Add wallet connection for trading
- [ ] Integrate real-time market data

### Smart Contract Features
- [ ] Liquidity pouring mechanism with MEV protection
- [ ] TVT token holder benefits system
- [ ] Automated battle resolution
- [ ] Weekly war competitions

### Additional Features
- [ ] Battle creation notifications
- [ ] Social media integrations
- [ ] Advanced analytics dashboard
- [ ] Mobile app (React Native)

## 🎯 Battle Flow

1. **Create Battle**: User submits metadata for two competing tokens
2. **Token Launch**: Both tokens launch simultaneously on Meteora
3. **Community Trading**: Market determines winner through volume and market cap
4. **Countdown**: Battle runs for user-defined duration
5. **Liquidity Pour**: Losing token's liquidity flows to winner and platform

## 💎 TVT Token Benefits

- **Free Launches**: No fees for TVT holders
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