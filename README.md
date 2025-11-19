# BitSync

Simple Bitcoin wallet tracker. Add BTC addresses, sync balances and transactions, view everything through a web UI or API.

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:3001` in your browser.

## Usage

1. Add a Bitcoin address (with optional label)
2. Click **Sync** to fetch balance and latest transactions
3. View details or delete addresses as needed

## API

- `GET /api/addresses` - List all addresses
- `POST /api/addresses` - Add address `{ address, label? }`
- `GET /api/addresses/:id` - Get address details
- `PATCH /api/addresses/:id` - Update label `{ label? }`
- `DELETE /api/addresses/:id` - Remove address
- `GET /api/addresses/:id/balance` - Get balance
- `GET /api/addresses/:id/transactions` - Get transactions
- `POST /api/addresses/:id/sync` - Sync address data

## Tech Stack

Node.js + Express, TypeScript, Axios for API calls. Uses Blockchair and Blockchain.com APIs (no keys needed, but watch rate limits). In-memory store for simplicity—swap it out for a real DB if you need persistence.

## Scripts

- `npm run dev` - Start dev server
- `npm run build` - Compile TypeScript
- `npm test` - Run tests
- `npm run lint` - Lint code

## Assumptions

- In-memory storage is fine for MVP—no database needed, but data resets on restart
- No authentication required (addresses are public info)
- BTC mainnet only, no multi-chain support
- Rate limits happen—built-in retry and fallback to Blockchain.com when Blockchair throttles

## Architecture

- **Singleton in-memory store** with Map-based indexing for fast lookups by address or ID
- **API client with automatic fallback**—tries Blockchair first, falls back to Blockchain.com on rate limits
- **Exponential backoff retry** for 430 responses
- **Service layer separation**—sync logic isolated from routes, easy to test and swap implementations
- **Static UI**—plain HTML/CSS/JS, no build step needed
