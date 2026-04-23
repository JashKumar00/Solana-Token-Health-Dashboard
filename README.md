# Jupiter Token Health Dashboard

> A Bloomberg Terminal meets DeFi — real-time Solana token intelligence in one unified crypto terminal.

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Built with React](https://img.shields.io/badge/Built%20with-React%2019-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-24-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![Powered by Jupiter](https://img.shields.io/badge/Powered%20by-Jupiter%20API-9945FF)](https://dev.jup.ag)
[![pnpm](https://img.shields.io/badge/managed%20with-pnpm-F69220?logo=pnpm&logoColor=white)](https://pnpm.io)

<p align="center">
  <img src="screenshots/landing.jpg" alt="Jupiter Token Health — Landing Page" width="100%" />
</p>

---

## Live Demo

**[View the live dashboard →](https://38decc08-d2a6-4d0f-aa39-f9271e3e12f5-00-12kbdr1mrshn0-nnse3ss4.kirk.replit.dev/)**

---

## The Problem

Solana traders and DeFi researchers face a fragmented data landscape. To evaluate a single token you currently need to:

- Check **Jupiter** for price and organic quality score
- Open **DexScreener** for market pairs, buy/sell pressure, and DEX volume
- Use a wallet explorer for portfolio analytics
- Manually cross-reference data across 5+ browser tabs

There is no single place that gives you the full picture — price action, on-chain health, wallet exposure, and market structure — all in one professional terminal.

## The Solution

**Jupiter Token Health Dashboard** aggregates Jupiter, DexScreener, and GeckoTerminal data into a single Bloomberg-style interface built for Solana. Search any token by name, symbol, or mint address and instantly see everything that matters.

---

## Screenshots

<p align="center">
  <img src="screenshots/landing.jpg" alt="Landing Page" width="49%" />
  &nbsp;
  <img src="screenshots/dashboard.jpg" alt="Dashboard Main View" width="49%" />
</p>

<p align="center">
  <em>Left: Landing page &nbsp;·&nbsp; Right: Token Health Dashboard</em>
</p>

<p align="center">
  <img src="screenshots/pitch-deck.jpg" alt="Pitch Deck" width="80%" />
</p>

<p align="center">
  <em>Pitch deck — Jupiter Token Health Dashboard presentation</em>
</p>

---

## Target Users

| User | Use Case |
|------|----------|
| **DeFi Traders** | Evaluate token health before entering a position |
| **Meme Coin Hunters** | Spot organic volume vs. wash trading quickly |
| **Portfolio Managers** | Monitor wallet holdings and USD exposure at a glance |
| **Researchers / Analysts** | Deep-dive into DEX breakdown, trade size, and buy pressure |

---

## Features

### Token Intelligence
- **Real-time OHLCV Candlestick Chart** — TradingView Lightweight Charts with 1M / 5M / 15M / ALL time windows
- **Organic Score** — Jupiter's on-chain quality score (0–100) visualised as an animated ring
- **Live Price** — auto-refreshes every 10 seconds with a countdown indicator
- **Market Stats Panel** — price change %, buy/sell counts, and volume across 5M / 1H / 6H / 24H timeframes
- **Buy/Sell Pressure Bar** — visual breakdown of buying vs. selling pressure per timeframe
- **DEX Volume Breakdown** — bar chart of volume split by DEX (Raydium, Orca, Meteora, etc.)
- **Top Trading Pairs** — sorted by liquidity with price change, volume, buys/sells, and DexScreener links
- **Trading Intelligence** — average trade size, buy pressure %, and 24h PnL estimate per DEX
- **Token Metrics** — market cap, FDV, liquidity, holder count, 24h volume

### Wallet Analytics
- Paste any Solana wallet address to see all token holdings
- Holdings ranked by USD value with logos, symbols, prices, and amounts
- Total portfolio value and token count at a glance

### UX & Aesthetics
- Dark crypto terminal aesthetic with Solana green (#14F195) and purple (#9945FF) palette
- Particle background, aurora glow effects, and live meme coin ticker tape
- Search history chips saved to localStorage
- Collapsible raw API response viewer for power users

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, Vite 7, TypeScript, Tailwind CSS v4 |
| **Charts** | TradingView Lightweight Charts, Recharts |
| **Backend** | Express 5, Node.js 24 |
| **Monorepo** | pnpm workspaces |
| **API Contract** | OpenAPI 3.1 + Orval codegen |
| **Database** | PostgreSQL + Drizzle ORM |
| **Validation** | Zod v4 + drizzle-zod |
| **Build** | esbuild |
| **Data Sources** | Jupiter API, DexScreener API, GeckoTerminal API |

---

## Project Structure

```
/
├── artifacts/
│   ├── api-server/               # Express 5 backend — all API routes
│   │   └── src/
│   │       ├── routes/           # /api/jupiter/* route handlers
│   │       └── app.ts            # Express app with proxy config
│   ├── jupiter-dashboard/        # React + Vite frontend (main dashboard)
│   │   └── src/
│   │       ├── pages/            # dashboard.tsx — main page
│   │       └── components/       # PriceChart, MarketStats, WalletView, etc.
│   ├── landing/                  # Marketing landing page (React + Vite)
│   │   └── src/
│   │       └── pages/            # Landing, features, data sources sections
│   └── pitch-deck/               # 7-slide presentation deck (React + Vite)
│       └── src/pages/slides/
├── lib/
│   ├── api-spec/                 # openapi.yaml — single source of truth for API
│   ├── api-client-react/         # Auto-generated React Query hooks (via Orval)
│   └── db/                       # Drizzle ORM schema and migrations
├── screenshots/                  # Real screenshots of running apps
└── scripts/                      # Post-merge and build scripts
```

---

## API Endpoints

All routes are served under `/api`:

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/healthz` | Health check |
| `GET` | `/api/jupiter/search?query=TEXT` | Search tokens by name, symbol, or mint address |
| `GET` | `/api/jupiter/token/:mintAddress` | Token metadata (name, symbol, logo, decimals) |
| `GET` | `/api/jupiter/price/:mintAddress` | Live USD price |
| `GET` | `/api/jupiter/ohlcv/:mintAddress` | OHLCV candlestick data |
| `GET` | `/api/jupiter/market/:mintAddress` | DexScreener market data (pairs, volume, transactions) |
| `GET` | `/api/jupiter/wallet/:walletAddress` | Wallet token balances with enriched metadata |

---

## Getting Started

### Prerequisites

- **Node.js** 20+ (24 recommended)
- **pnpm** 10+

```bash
npm install -g pnpm
```

### 1. Clone the Repository

```bash
git clone https://github.com/JashKumar00/Solana-Token-Health-Dashboard.git
cd Solana-Token-Health-Dashboard
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Set Environment Variables

Create a `.env` file in the project root:

```env
# Jupiter API key — get one free at https://dev.jup.ag
JUPITER_API_KEY=your_jupiter_api_key_here

# Session secret for Express sessions
SESSION_SECRET=your_random_secret_here

# PostgreSQL connection string
DATABASE_URL=postgresql://user:password@localhost:5432/jupiter_dashboard
```

### 4. Push Database Schema

```bash
pnpm --filter @workspace/db run push
```

### 5. Start Development Servers

Open separate terminals for each service:

```bash
# Terminal 1 — API server (port 8080)
pnpm --filter @workspace/api-server run dev

# Terminal 2 — Frontend dashboard
pnpm --filter @workspace/jupiter-dashboard run dev

# Terminal 3 (optional) — Landing page
pnpm --filter @workspace/landing run dev

# Terminal 4 (optional) — Pitch deck presentation
pnpm --filter @workspace/pitch-deck run dev
```

The dashboard URL is printed in terminal 2 when the server starts.

---

## Building for Production

```bash
# Typecheck and build all packages
pnpm run build
```

This runs `tsc` across all packages and produces `dist/` bundles ready for deployment.

---

## Regenerating the API Client

If you modify the OpenAPI spec (`lib/api-spec/openapi.yaml`), regenerate the typed React Query hooks with:

```bash
pnpm --filter @workspace/api-spec run codegen
```

---

## How to Use

1. **Search a token** — type a name (e.g. `JUP`, `BONK`, `WIF`) or paste a Solana mint address into the search bar and select from the dropdown.
2. **Read the dashboard** — the candlestick chart, organic score ring, market stats panel, and DEX breakdown all load automatically.
3. **Switch time windows** — use the **1M / 5M / 15M / ALL** buttons on the chart to zoom in or out on price history.
4. **Analyse a wallet** — paste a Solana wallet address (e.g. from Phantom or Backpack) into the wallet field to see all holdings ranked by USD value.
5. **Inspect raw data** — expand the "Raw API Response" section at the bottom for the full JSON payload from all APIs.

---

## Presentation Deck

A 7-slide pitch deck is included in `artifacts/pitch-deck/`. It covers the problem, solution, core features, data layer, tech stack, and live demo. Access it at `/pitch-deck/` when running locally, or as a standalone slide viewer.

---

## License

MIT — free to use, modify, and distribute.

---

## Author

Built by **JashKumar00** using [Replit Agent](https://replit.com) · [GitHub](https://github.com/JashKumar00)
