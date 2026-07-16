# Architecture — apps/native

This project uses **Expo Router** (file-based, `app/` directory) in **client-only mode** — there's no `expo-server` dependency, so this is not an SSR/full-stack Expo Router deployment. That matters for one specific deviation from the web app's pattern below: **Expo Router's `loader`/`useLoaderData` only works under `expo-server`** (confirmed from the installed `expo-router` package — `useLoaderData`'s type imports `LoaderFunction` from `expo-server`), so it isn't usable here, and this version of `expo-router` also no longer exports a declarative `<Redirect>` component. Route guards are therefore **hook/layout-based**, not loader-based — see below.

## Structure (per feature: data + UI)

```
app/                       # THIN — Expo Router file-based routes & delegation to features
features/
  <feature>/
    types.ts               # zod schemas + interfaces — no functions
    api.ts                 # TanStack Query hooks (wrapping the tRPC client) — what components call
    guards.ts              # hook-callable route protection (e.g. session checks) — what
                            # a route's _layout.tsx calls. Only add this file if the
                            # feature actually needs guards.
    components/             # UI
    index.ts                # feature public exports
components/                 # heroui-native-based shared components across features,
                             # kept purely presentational (this app's equivalent of
                             # web's shadcn components/ui/ — heroui-native is the
                             # primitive layer instead of shadcn)
lib/                        # api-client.ts (tRPC client setup), auth-client.ts
contexts/                   # cross-cutting React context providers (e.g. theme)
```

- Light features only need `api.ts` + `components/`. Static features use `content.ts` + `components/`, **without** `api.ts`.
- Functions are split by **consumer**: `api.ts` is for components, `guards.ts` is for layouts.
- Types/schemas always live in `types.ts`, never inline in a function file — even for a single small interface. `api.ts`/`guards.ts` import from `types.ts`, not the other way around.
- A feature may grow (`api/` folder, `hooks.ts`) **only when it actually gets large** — do not create empty ceremonial folders up front.

## SOC rules (MANDATORY)

- **Components & routes (screens) MUST NOT `fetch` directly, and MUST NOT call `trpc.*` directly either.** All data access goes through the feature's `api.ts` (or `guards.ts` for layout-side checks) — `api.ts` is the only place that touches the tRPC client (from `lib/api-client.ts`).
- **Route protection is layout-based, not loader-based:** a feature's `guards.ts` exports a hook (e.g. `useRequireAuth()`) that a route's `_layout.tsx` calls; the hook reads session state and calls `router.replace(...)` (from `expo-router`'s `useRouter()`) inside a `useEffect` when the guard fails. **TanStack Query** (in `api.ts`) handles all other data fetching, both initial and interactive — there's no separate "loader vs query" split on native the way there is on web, since Expo Router has no usable loader mechanism in this app's configuration.
- heroui-native / shared presentational components live only in `components/`, kept purely presentational.

## Current state / migration note

The app currently has a flat `app/` (screens) + `components/` structure with no `features/` folder yet, and `utils/trpc.ts` (not `lib/api-client.ts`) holds the tRPC client — `lib/auth-client.ts` already matches the target `lib/` convention. There's no route-guarding code at all yet (no protected routes exist currently). When the first protected screen is built, that's the point to add its feature's `guards.ts` with a `useRequireAuth()`-style hook rather than inlining a `useEffect` redirect check directly in the screen — and when a feature's logic first needs its own `api.ts`/`types.ts`, carve it out of the flat `app/`/`components/` structure into `features/<feature>/`. Don't force-migrate everything at once — apply the structure as each feature is actually touched.
