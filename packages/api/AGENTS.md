# Architecture — packages/api

This package is where all backend business logic lives (`apps/server` is bootstrap-only — see its `AGENTS.md`). **Clean architecture, 4 layers per module**, adapted for this stack: **tRPC** instead of NestJS controllers, **Prisma** (`@siaga-app/db`) instead of a generic ORM, **better-auth** (`@siaga-app/auth`) for session/auth.

## Structure

```
packages/api/src/
  index.ts                  # tRPC init: t, router, publicProcedure, protectedProcedure,
                             # + role-based procedure builders (shared across all modules)
  context.ts                 # createContext() — calls better-auth, builds ctx.session
                              # (shared across all modules — this is the request-context
                              # equivalent of a framework's auth guard/interceptor)
  routers/
    index.ts                  # appRouter — merges every module's presentation router
  modules/
    <module>/
      domain/                  # entities/value objects (types only — see Prisma note
                                # below), repository INTERFACES, pure business rules
      application/              # use cases (orchestration) — depend on domain
                                 # repository interfaces, not concrete implementations
      infrastructure/            # Prisma repository implementations, external service
                                  # clients (e.g. a future AI provider client, a dispatch
                                  # notification client) — anything that does real I/O
      presentation/
        router.ts                 # this module's tRPC router — the "controller" layer
        dto.ts                     # zod input/output schemas for this module's procedures
```

Dependency rule: **presentation → application → domain**. `infrastructure` is only reached through **interfaces defined in `domain`** (application depends on the interface, a concrete `infrastructure` class is wired in where the router is built).

## tRPC-specific adaptations

- **Controllers → tRPC routers.** Each module's `presentation/router.ts` is its controller: thin, calls exactly one use case per procedure, does no business logic itself.
- **RoleGuard → tRPC middleware.** `protectedProcedure` (already in `index.ts`) is the auth-guard equivalent. Extend the same pattern for role checks — e.g. an `operatorProcedure` built as `protectedProcedure.use(({ ctx, next }) => { if (ctx.session.user.role !== "OPERATOR") throw new TRPCError({ code: "FORBIDDEN" }); return next(); })` — rather than checking roles ad hoc inside individual procedures.
- **DTOs → zod schemas**, living in `presentation/dto.ts`, used as `.input()`/`.output()` validators. Don't hand-duplicate types between `domain` and `dto.ts` when the wire shape matches the domain shape — reuse/derive with zod's `.pick()`/`.omit()`/`.extend()` instead of writing two parallel definitions. Only diverge when the wire format genuinely differs from the domain entity (e.g. hiding internal fields).
- **Prisma types in `domain` are fine; the Prisma *client* is not.** `domain` may use Prisma-generated *types* (`import type { EmergencyReport } from "@siaga-app/db"`) as its entity shape — that's compile-time only, zero runtime coupling to the ORM. What `domain`/`application` must never do is import `@siaga-app/db`'s client/`PrismaClient` instance, call `prisma.*` directly, or otherwise perform I/O — that's what the repository interface + `infrastructure` implementation is for.
- `context.ts`'s `createContext()` (already calls `auth.api.getSession()`) is the shared better-auth adapter — modules don't each build their own session-reading logic, they consume `ctx.session` that's already populated.

## Rules (MANDATORY)

- `domain` & `application` **MUST NOT** import Prisma's client, `hono`, `fetch`, or any other framework/IO dependency.
- Keep routers thin; all business logic lives in `application` use cases.
- Do not add unnecessary abstraction — keep it simple. A module that's genuinely simple (e.g. one CRUD-ish use case) doesn't need every layer to be a multi-file affair; a single file per layer is fine. Don't create empty ceremonial folders up front.

## Current state / migration note

Right now `packages/api/src/routers/index.ts` is a single flat router (`healthCheck`, `privateData`) with no `modules/` folder yet — there's no business logic to migrate. The Prisma schema already defines the natural module boundaries for what's coming next (from the SIAGA schema design): `report` (`EmergencyReport` + its status/channel event history), `conversation` (`Message`, `CallSession`), `ai` (`AIAnalysisSnapshot`, `AIFeedback`), `dispatch` (`DispatchAgency`, `DispatchRequest`). When the first of these gets built, that's the point to create `modules/<name>/` with the 4-layer split — don't scaffold empty layers for modules that don't exist yet.
