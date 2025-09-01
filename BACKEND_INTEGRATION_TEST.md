# Tvt Launchpad - Backend Integration Testing Guide

## 🎯 What Changed

The CreateBattlePage now uses the backend server to launch real tokens on Solana blockchain instead of just creating database entries.

## 🚀 Quick Test

### 1. Start Backend Server
```bash
cd server
npm run dev
```
Wait for: `🚀 Tvt Launchpad Server running on port 3001`

### 2. Start Frontend
```bash
npm run dev
```

### 3. Test Token Creation
1. Go to http://localhost:3000/create-battle
2. You should see "Backend Server Ready" with wallet info
3. Fill in token details (name, ticker, etc.)
4. Click "Launch Battle"
5. Watch console logs for blockchain deployment progress

## 🔍 What Happens Now

### Old Flow (Database Only):
1. Create token entries in database
2. Set status to "new"
3. No blockchain interaction

### New Flow (Backend + Blockchain):
1. ✅ Frontend checks backend server health
2. ✅ Backend loads wallet from `id.json`
3. ✅ Backend creates real tokens on Solana with bonding curves
4. ✅ Backend returns contract addresses and transaction IDs
5. ✅ Frontend saves tokens to database with real addresses
6. ✅ Battle status set to "bonded" (ready for trading)

## 🎉 Success Indicators

### Frontend UI:
- Green "Backend Server Ready" status
- Shows wallet address and SOL balance
- "Launching on Blockchain..." during creation
- Success toast with Solana confirmation

### Backend Logs:
```
🧪 Testing Tvt Launchpad Backend Setup...
✅ All tests passed! Backend is ready to launch tokens.
🚀 Tvt Launchpad Server running on port 3001
Creating token: TokenName (SYMBOL)
Pool creation transaction sent: 5x7...
Pool creation transaction confirmed: 5x7...
✅ Tokens launched successfully
```

### Database Results:
- Tokens have real `contract_address` and `pool_address`
- Battle status is `bonded` instead of `new`
- Market cap set to $5,000 (from backend config)

### Solana Explorer:
- Real token contracts viewable on https://explorer.solana.com/?cluster=devnet
- Pool addresses with actual liquidity
- Transaction history of token creation

## 🛠️ Troubleshooting

### "Backend Server Unavailable"
- Start backend: `cd server && npm run dev`
- Check if running on port 3001
- Verify `id.json` exists in server directory

### "Insufficient Balance"
- Get devnet SOL: https://faucet.solana.com/
- Backend wallet needs 0.1+ SOL for transactions

### "Token Launch Failed"
- Check backend console for detailed errors
- Verify Solana network connectivity
- Check `PLATFORM_CONFIG` address

## 📊 Monitoring

### Backend Health Check:
```bash
curl http://localhost:3001/health
```

### Wallet Info:
```bash
curl http://localhost:3001/api/tokens/wallet
```

### Create Test Token:
```bash
curl -X POST http://localhost:3001/api/tokens/create \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Token", "symbol": "TEST"}'
```

## 🎊 Complete Flow Test

1. **Backend Ready**: Green status indicator
2. **Form Fill**: Token names, tickers, logos
3. **Launch**: Click "Launch Battle" button
4. **Blockchain**: Tokens created on Solana (15-30 seconds)
5. **Database**: Battle saved with contract addresses
6. **Navigation**: Redirect to battle page
7. **Trading**: Users can now actually trade the tokens!

The system now creates **real, tradeable tokens** instead of just database entries! 🚀
