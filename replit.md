# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Contains a Bug Tracker web application for logging and tracking software defects.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM (Replit built-in)
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Artifacts

### Bug Tracker (artifacts/bug-tracker)
- **Type**: React + Vite web app
- **Preview Path**: `/`
- **Purpose**: Desktop app for tracking software defects

### API Server (artifacts/api-server)
- **Type**: Express API
- **Preview Path**: `/api`
- **Purpose**: Backend for the bug tracker

## Database Schema (lib/db/src/schema/defects.ts)
- `defects` — defect records with auto-generated DEF-NNN IDs
- `comments` — comments on defects
- `attachments` — attachment links for defects

## API Routes (/api/defects/*)
- GET/POST /defects — list and create defects
- GET/PATCH/DELETE /defects/:id — get, update, delete a defect
- GET/POST /defects/:id/comments — list and add comments
- GET/POST /defects/:id/attachments — list and add attachment links
- GET /defects/stats/summary — status counts dashboard

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
