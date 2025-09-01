# TvT Launchpad Backend Server

A Node.js/Express backend server for launching tokens on Solana using the Dynamic Bonding Curve SDK.

## Features

- 🚀 Launch tokens with bonding curves using backend wallet
- 💰 Check wallet balance and information
- ⚔️ Create battle tokens (two tokens at once)
- 🔐 API key authentication (production)
- 🏥 Health check endpoints
- 📊 Solana network monitoring

## Prerequisites

- Node.js 18+ 
- Yarn or npm
- Solana wallet private key in `id.json` format

## Setup

1. **Install dependencies**
   ```bash
   cd server
   yarn install
   # or
   npm install
   ```

2. **Create environment file**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   NODE_ENV=development
   PORT=3001
   SOLANA_NETWORK=devnet
   SOLANA_RPC_ENDPOINT=https://api.devnet.solana.com
   PLATFORM_CONFIG=Hz3hBp4oRxJHZrU24P5kHTHzHffQjoWTq68CrDatewk3
   API_KEY=your-secret-api-key-here
   ```

3. **Create wallet file**
   
   Create `id.json` in the server root directory with your wallet private key:
   ```json
   ```

4. **Start the server**
   ```bash
   # Development mode
   yarn dev
   
   # Production mode
   yarn build
   yarn start
   ```

## API Endpoints

### Health Checks

- `GET /health` - Server health status
- `GET /health/solana` - Solana network connectivity

### Wallet Information

- `GET /api/tokens/wallet` - Get wallet public key and balance

### Token Creation

- `POST /api/tokens/create` - Create a single token
- `POST /api/tokens/create-battle` - Create two tokens for battle

## API Usage Examples

### 1. Check Wallet Info

```bash
curl http://localhost:3001/api/tokens/wallet
```

Response:
```json
{
  "success": true,
  "data": {
    "publicKey": "ABC123...",
    "balance": 1.5,
    "network": "devnet",
    "explorer": "https://explorer.solana.com/address/ABC123...?cluster=devnet"
  }
}
```

### 2. Create Single Token

```bash
curl -X POST http://localhost:3001/api/tokens/create \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "My Token",
    "symbol": "MTK",
    "description": "My awesome token",
    "image": "https://example.com/logo.png"
  }'
```

### 3. Create Battle Tokens

```bash
curl -X POST http://localhost:3001/api/tokens/create-battle \\
  -H "Content-Type: application/json" \\
  -d '{
    "token1": {
      "name": "Alpha Token",
      "ticker": "ALPHA",
      "logo": "https://example.com/alpha.png"
    },
    "token2": {
      "name": "Beta Token", 
      "ticker": "BETA",
      "logo": "https://example.com/beta.png"
    }
  }'
```

## Response Format

All endpoints return responses in this format:

```json
{
  "success": true|false,
  "data": {...},        // Present on success
  "error": "message"    // Present on error
}
```

## Security

- API key authentication in production
- CORS protection
- Helmet security headers
- Request size limits
- Input validation

## Development

- TypeScript for type safety
- ESLint and Prettier for code quality
- Morgan for HTTP request logging
- Detailed error handling and logging

## Deployment

1. Set `NODE_ENV=production`
2. Configure production RPC endpoint
3. Set secure API key
4. Update CORS origins
5. Use process manager (PM2, Docker, etc.)

## Troubleshooting

### Common Issues

1. **"id.json file not found"**
   - Create the `id.json` file with your wallet private key array

2. **"Insufficient balance"**
   - Ensure your wallet has enough SOL for transaction fees

3. **"Failed to connect to Solana"**
   - Check your RPC endpoint and network connectivity

4. **"Invalid config address"**
   - Verify the PLATFORM_CONFIG address is correct for your network

### Debug Mode

Set `DEBUG=*` environment variable for detailed logging:

```bash
DEBUG=* yarn dev
```

## License

MIT
