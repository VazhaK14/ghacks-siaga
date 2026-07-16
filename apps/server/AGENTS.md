# Architecture — apps/server

This app is **bootstrap only** — it wires up the Hono server (CORS, request logging, mounting `better-auth`'s handler at `/api/auth/*`, mounting the tRPC router at `/trpc/*`) and nothing else. It currently is and should stay a single thin `src/index.ts`.

**No business logic, no route handlers with actual logic, no Prisma queries belong here.** All of that lives in `@siaga-app/api` (`packages/api`) — see `packages/api/AGENTS.md` for the clean-architecture module structure used there. If you find yourself writing anything beyond Hono middleware wiring in this app, it belongs in a `packages/api/src/modules/<module>/` instead.
