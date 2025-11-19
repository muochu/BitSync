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

## Notes

Data is stored in memory, so it resets on server restart. For production, replace the store implementation with a database.
