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
- Dark crypto theme with Solana purple/green palette
- Space Grotesk font from Google Fonts
- Features: token search, live price with 30s auto-refresh, organic score ring, trading metrics, raw API viewer, search history
- Uses Jupiter `ultra/v1/search` API for token data and price (usdPrice field)
- Falls back to `swap/v1/quote` for price derivation if usdPrice unavailable

### API Server (`artifacts/api-server`)
- Express 5 backend at `/api`
- Jupiter API routes:
  - `GET /api/jupiter/search?query=TEXT` — search tokens via Jupiter ultra/v1/search
  - `GET /api/jupiter/token/:mintAddress` — fetch token metadata
  - `GET /api/jupiter/price/:mintAddress` — fetch live price (from usdPrice or swap quote)
- API key: uses `x-api-key` header with Jupiter developer key
- Jupiter base URL: `https://api.jup.ag`
- Working endpoints: `ultra/v1/search`, `swap/v1/quote`
- Note: `tokens/v1` and `price/v2` endpoints return 404 — using ultra API instead
