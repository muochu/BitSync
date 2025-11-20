# BitSync

Bitcoin wallet tracker. Add addresses, sync transactions, check balances. Works through a web UI or REST API.

## What it does

You can add Bitcoin addresses, sync their transaction history, and view balances. The UI shows everything in one place, and there's an API if you want to integrate it elsewhere.

What's included:

- Add/remove Bitcoin addresses with optional labels
- Sync transactions from Blockchair/Blockchain.com APIs
- View balances (confirmed and unconfirmed)
- REST API for all operations
- Web UI with total balance aggregation

What's not included (intentionally):

- Database persistence (in-memory only, resets on restart)
- Authentication
- Multi-chain support (BTC mainnet only)
- Scheduled background syncs (manual sync only)

## Quick Start

```bash
npm install
npm run dev
```

Then open `http://localhost:3001` in your browser.

## How to use

1. Add a Bitcoin address (you can give it a label if you want)
2. Click Sync to fetch the balance and latest transactions
3. View details or delete addresses as needed

The UI shows a total balance across all addresses at the top, and you can sync individual addresses or all at once.

## API Endpoints

- `GET /api/addresses` - List all addresses
- `POST /api/addresses` - Add address `{ address, label? }`
- `GET /api/addresses/:id` - Get address details
- `PATCH /api/addresses/:id` - Update label `{ label? }`
- `DELETE /api/addresses/:id` - Remove address
- `GET /api/addresses/:id/balance` - Get balance
- `GET /api/addresses/:id/transactions` - Get transactions
- `POST /api/addresses/:id/sync` - Sync address data

## Tech Stack

Node.js + Express, TypeScript, Axios. Uses Blockchair and Blockchain.com APIs (no API keys needed, but they have rate limits). In-memory store using Maps—simple and fast, but data doesn't persist. Easy to swap out for a real database later.

## Scripts

- `npm run dev` - Start dev server
- `npm run build` - Compile TypeScript
- `npm test` - Run tests
- `npm run lint` - Lint code

## Assumptions

- In-memory storage is fine for this prototype. Data resets when the server restarts.
- No auth needed since Bitcoin addresses are public anyway.
- BTC mainnet only—no testnet or other chains.
- Rate limits are expected. The code retries with exponential backoff and falls back to Blockchain.com if Blockchair throttles us.

## Architecture

The code is split into a few main parts:

**Routes** (`src/routes/addresses.ts`) - Express endpoints for CRUD operations and syncing. Handles validation and calls the service layer.

**Services** (`src/services/`) - Business logic lives here:

- `syncService.ts` - Coordinates syncing an address (fetches data, updates store)
- `bitcoinApi.ts` - Blockchair API client with retry logic
- `blockchainApi.ts` - Blockchain.com fallback client

**Store** (`src/config/store.ts`) - In-memory data store using Maps. Fast lookups by address or ID, handles deduplication, cascading deletes.

**UI** (`public/index.html`) - Plain HTML/CSS/JS, no build step. Shows addresses, balances, transactions. Aggregates total balance across all addresses.

### Why these choices

- In-memory Maps for O(1) lookups and simple testing. Easy to replace with a DB later.
- Service layer keeps routes thin and logic testable.
- API fallback (Blockchair → Blockchain.com) handles rate limits gracefully.
- Static UI means no build complexity, just works.

## Data Structures

Main types:

**Address** - `id` (UUID), `address` (Bitcoin address string), optional `label`, `createdAt`, optional `lastSyncedAt`

**Balance** - `addressId`, `confirmedBalance` (satoshis), `unconfirmedBalance` (satoshis), `lastUpdated`

**Transaction** - `id` (composite `${addressId}-${txHash}`), `addressId`, `txHash`, `blockHeight`, `timestamp`, `amount` (satoshis), `type` ('sent' | 'received'), `confirmations`, `fee` (satoshis)

The store uses Maps keyed by ID, with a separate index for looking up addresses by Bitcoin address string. Transactions are deduplicated by hash per address. When you delete an address, related transactions and balances are cleaned up automatically.
