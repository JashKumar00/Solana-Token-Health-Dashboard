# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Artifacts

### Jupiter Token Health Dashboard (`artifacts/jupiter-dashboard`)
- React + Vite frontend at `/` (previewPath: /)
- Dark crypto theme with Solana purple/green palette, Space Grotesk font
- **Token dashboard features:**
  - Token search (name/symbol/mint) via dropdown
  - Real-time live price chart (Recharts AreaChart) that accumulates 5s samples — 1M/5M/15M/ALL time windows
  - Price auto-refresh every **5 seconds** with countdown bar
  - Organic score animated ring (0-100 health score)
  - Market Stats panel: 5M/1H/6H/24H timeframe grid with price change %, buy/sell counts, volume
  - Buy/Sell Pressure visualization bar for each timeframe
  - DEX Volume Breakdown bar chart (Recharts BarChart, color-coded by DEX)
  - Top Trading Pairs table sorted by liquidity with price change, volume, buys/sells, DexScreener link
  - Trading Intelligence cards: avg trade size, buy pressure %, 24h PnL estimate per DEX
  - Token metrics: market cap, FDV, liquidity, holder count, 24h volume
  - Raw API viewer (collapsible)
- **Wallet portfolio features:**
  - Paste a Solana wallet address → see all token holdings
  - Holdings ranked by USD value with logos, symbols, prices, amounts
  - Total portfolio value, token count
- Logo click returns to home screen
- Search history chips (saved to localStorage)

### API Server (`artifacts/api-server`)
- Express 5 backend at `/api`
- Jupiter API routes (all using `x-api-key` header with Jupiter developer key):
  - `GET /api/jupiter/search?query=TEXT` — search tokens via Jupiter `ultra/v1/search`
  - `GET /api/jupiter/token/:mintAddress` — fetch token metadata
  - `GET /api/jupiter/price/:mintAddress` — fetch live price (from usdPrice or swap/v1/quote fallback)
  - `GET /api/jupiter/wallet/:walletAddress` — fetch wallet balances + enriched token metadata
  - `GET /api/jupiter/market/:mintAddress` — DexScreener market data (price changes, txns, volumes, top pairs)
- Jupiter base URL: `https://api.jup.ag`; DexScreener base: `https://api.dexscreener.com`
- Working Jupiter endpoints: `ultra/v1/search`, `ultra/v1/balances/:wallet`, `swap/v1/quote`
- Note: `tokens/v1` and `price/v2` endpoints return 404 — using ultra API instead
