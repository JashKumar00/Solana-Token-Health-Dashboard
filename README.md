# Solana Token Health Dashboard

A real-time token health analytics dashboard for the Solana ecosystem, powered by the Jupiter API.

## Overview

This project provides a comprehensive view of Solana token health metrics including price, liquidity, volume, and market trends. It combines a React frontend dashboard with a Node.js API server to deliver live data from Jupiter's on-chain aggregator.

## Features

- Real-time token price and liquidity metrics via the Jupiter API
- Interactive charts and data visualizations
- Token search and filtering
- API server with caching and rate limiting
- Responsive, dark-themed UI built with Tailwind CSS

## Project Structure

```
├── artifacts/
│   ├── jupiter-dashboard/   # React + Vite frontend dashboard
│   └── api-server/          # Node.js Express API server
├── lib/                     # Shared TypeScript libraries
└── scripts/                 # Build and utility scripts
```

## Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS, Recharts, TanStack Query
- **Backend**: Node.js, Express, TypeScript
- **Package Manager**: pnpm (monorepo workspace)
- **Data Source**: Jupiter Aggregator API (Solana)

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 9+

### Install dependencies

```bash
pnpm install
```

### Run the development servers

Start the API server:
```bash
pnpm --filter api-server dev
```

Start the dashboard:
```bash
pnpm --filter jupiter-dashboard dev
```

## License

MIT
