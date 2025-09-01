# TvT Token Launchpad - Supabase Integration

This project has been integrated with Supabase for data persistence and real-time functionality.

## 🚀 Quick Setup

### 1. Environment Variables

1. Copy the environment template:
   ```bash
   cp .env.example .env
   ```

2. Fill in your Supabase credentials in `.env`:
   ```env
   REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=your_anon_key_here
   ```

### 2. Supabase Database Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)

2. Go to the SQL Editor in your Supabase dashboard

3. Run the SQL script from `supabase-setup.sql` to create all necessary tables and functions

### 3. Install Dependencies

```bash
npm install
```

### 4. Run the Application

```bash
npm start
```

## 📊 Database Schema

### Tables Created

- **tokens** - Store token information (ticker, name, contract address, etc.)
- **battles** - Store battle data and status
- **battle_votes** - Track votes/trades within battles
- **user_profiles** - User statistics and profiles
- **leaderboard** - Cached leaderboard rankings

### Key Features

- **Real-time updates** - Database changes trigger UI updates
- **User tracking** - Tracks battles created, votes cast, volume traded
- **Leaderboard system** - Automatic ranking based on battle wins and market cap
- **Battle lifecycle** - Tracks battles from creation to completion

## 🔧 Services

### BattleService
- `createBattle()` - Create new battles
- `getBattles()` - Fetch battles with optional filtering
- `updateBattleStatus()` - Update battle progression
- `recordBattleVote()` - Track votes/trades

### UserService
- `getOrCreateUserProfile()` - Manage user profiles
- `incrementBattlesCreated()` - Track user activity
- `getTopUsers()` - Leaderboard functionality

## 🛠 Development

### Database Functions

The setup includes PostgreSQL functions for:
- Incrementing user statistics
- Updating leaderboard rankings
- Automatic triggers for battle completion

### Row Level Security (RLS)

- Read access for all authenticated users
- Write access with appropriate permissions
- Secure handling of user data

## 🚀 Deployment

1. Set up your production Supabase project
2. Update environment variables for production
3. Deploy your React app to your preferred platform
4. Ensure CORS settings in Supabase allow your domain

## 📝 Notes

- The app includes fallback mock data if Supabase is unavailable
- All database operations are wrapped with error handling
- TypeScript types are generated for database schema
- Real-time subscriptions can be added for live battle updates

## 🔗 Useful Links

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Functions Guide](https://supabase.com/docs/guides/database/functions)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
