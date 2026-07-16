# Architecture — apps/web

This project uses **React Router v8** with **file-based route discovery** (`@react-router/fs-routes`, already configured in `src/routes.ts` — do not switch to manually declared routes) and SSR is enabled (`ssr: true` in `root.tsx`'s router context), so **route `loader` exports run for real** (server + client), not just as a convention. Routes stay thin; features own their data and logic.

## Structure (per feature: data + UI)

```
src/
  routes/                 # THIN — routing & delegation to features (file-based, fs-routes)
  features/
    <feature>/
      types.ts            # zod schemas + interfaces — no functions
      api.ts              # TanStack Query hooks — what components call
      guards.ts           # loader-callable route protection (session checks, etc.)
                           # — what route loaders call. Only add this file if the
                           # feature actually needs guards.
      components/         # UI
      index.ts            # feature public exports
  components/ui/          # shadcn — shared across features, purely presentational
  lib/                    # api-client.ts (tRPC client setup), auth-client.ts
  routes.ts
```

- Light features only need `api.ts` + `components/`. Static features (e.g. a `landing` feature) use `content.ts` + `components/`, **without** `api.ts`.
- Functions are split by **consumer**: `api.ts` is for components, `guards.ts` is for loaders.
- Types/schemas always live in `types.ts`, never inline in a function file — even for a single small interface. `api.ts`/`guards.ts` import from `types.ts`, not the other way around.
- A feature may grow (`api/` folder, `hooks.ts`) **only when it actually gets large** — do not create empty ceremonial folders up front.

## SOC rules (MANDATORY)

- **Components & routes MUST NOT `fetch` directly, and MUST NOT call `trpc.*` directly either.** All data access goes through the feature's `api.ts` (or `guards.ts` for loader-side checks) — `api.ts` is the only place that touches the tRPC client (from `lib/api-client.ts`).
- **Route `loader` exports** (real React Router loaders — see `useLoaderData` in a route file) handle initial route data and auth gating; **TanStack Query** (in `api.ts`) handles interactive data/refetch in components. Loaders call functions in the feature's `guards.ts`/`api.ts`, never raw `fetch` or the tRPC client directly.
- shadcn lives only in `components/ui/`, kept purely presentational.

## Current state / migration note

The app currently has a flat `src/components/` + `src/routes/` structure with no `features/` folder yet, and `src/utils/trpc.ts` (not `lib/api-client.ts`) holds the tRPC client. Auth gating today (`dashboard.tsx`) is done client-side via `useEffect` + `useNavigate`, not a loader — this causes a visible flash of protected content before the redirect fires. When a route needs real protection, move that check into a `loader` (via a feature's `guards.ts`) instead of repeating the `useEffect` pattern, and when a feature's logic first needs its own `api.ts`/`types.ts`, that's the point to carve it out of `src/components/` into `src/features/<feature>/`. Don't force-migrate everything at once — apply the structure as each feature is actually touched.
