# TvT Launchpad Backend - Quick Start Guide

## 🚀 Quick Setup (5 minutes)

### 1. Install Dependencies
```bash
cd server
npm install
```

### 2. Configure Environment
```bash
# Copy example environment file
cp .env.example .env

# Edit .env file if needed (defaults should work for devnet)
```

### 3. Test Setup
```bash
npm run test
```

### 4. Start Server
```bash
npm run dev
```

Server will start on http://localhost:3001

## 🧪 Quick Tests

### Test Server Health
```bash
curl http://localhost:3001/health
```

### Check Wallet Info
```bash
curl http://localhost:3001/api/tokens/wallet
```

### Create a Test Token
```bash
curl -X POST http://localhost:3001/api/tokens/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Token",
    "symbol": "TEST"
  }'
```

## 🎯 Command Line Token Launcher

Create tokens directly from command line:

```bash
# Basic token
npm run launch "My Token" "MTK"

# With description
npm run launch "My Token" "MTK" "An awesome token"

# With all details
npm run launch "My Token" "MTK" "An awesome token" "https://example.com/logo.png"
```

## 📋 Available Endpoints

- `GET /health` - Server status
- `GET /health/solana` - Solana network status  
- `GET /api/tokens/wallet` - Wallet information
- `POST /api/tokens/create` - Create single token
- `POST /api/tokens/create-battle` - Create two tokens for battle

## 🔧 Troubleshooting

### Common Issues:

1. **"id.json file not found"**
   - Make sure `id.json` exists in server directory
   - File should contain wallet private key as array of numbers

2. **"Insufficient balance"**
   - Get devnet SOL from https://faucet.solana.com/
   - Your wallet needs at least 0.1 SOL for transactions

3. **Connection errors**
   - Check your internet connection
   - Try different RPC endpoint in `.env`

### Get Help:
- Check server logs for detailed error messages
- Run `npm run test` to verify setup
- Ensure you're on Solana devnet

## 🎉 Success!

If you see this, your backend is ready to launch tokens! 

Next steps:
1. Test creating a token via API
2. Check the token on Solana Explorer
3. Integrate with your frontend
4. Deploy to production when ready
