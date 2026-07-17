import { trpcServer } from "@hono/trpc-server";
import { createContext } from "@siaga-app/api/context";
import { subscribeToOfflineCallLiveEvents } from "@siaga-app/api/modules/offline-call/live-events";
import { subscribeToReportLiveEvents } from "@siaga-app/api/modules/report/presentation/live-events";
import { appRouter } from "@siaga-app/api/routers/index";
import { citizenAuth, operatorAuth } from "@siaga-app/auth";
import { env } from "@siaga-app/env/server";
import { initLogger } from "evlog";
import {
  type BetterAuthInstance,
  createAuthMiddleware,
} from "evlog/better-auth";
import { type EvlogVariables, evlog } from "evlog/hono";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { streamSSE } from "hono/streaming";

const SSE_HEARTBEAT_INTERVAL_MS = 5000;

initLogger({
  env: { service: "siaga-app-server" },
});

const identifyUser = createAuthMiddleware(operatorAuth as BetterAuthInstance, {
  exclude: ["/api/auth/**"],
  maskEmail: true,
});

const app = new Hono<EvlogVariables>();

app.use(evlog());
app.use("*", async (c, next) => {
  await identifyUser(c.get("log"), c.req.raw.headers, c.req.path);
  await next();
});

app.use(
  "/*",
  cors({
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "OPTIONS"],
    credentials: true,
    origin: env.CORS_ORIGIN,
  })
);

app.on(["POST", "GET"], "/api/auth/operator/*", (c) =>
  operatorAuth.handler(c.req.raw)
);
app.on(["POST", "GET"], "/api/auth/citizen/*", (c) =>
  citizenAuth.handler(c.req.raw)
);

app.use(
  "/trpc/operator/*",
  trpcServer({
    createContext: (_opts, context) =>
      createContext({ auth: operatorAuth, context }),
    router: appRouter,
  })
);

app.use(
  "/trpc/citizen/*",
  trpcServer({
    createContext: (_opts, context) =>
      createContext({ auth: citizenAuth, context }),
    router: appRouter,
  })
);

app.get("/sse/reports/live", async (c) => {
  const session = await operatorAuth.api.getSession({
    headers: c.req.raw.headers,
  });
  if (!session) {
    return c.json({ message: "Authentication required" }, 401);
  }
  if (session.user.role !== "OPERATOR") {
    return c.json({ message: "Operator access required" }, 403);
  }

  c.header("Cache-Control", "no-cache, no-transform");
  c.header("X-Accel-Buffering", "no");

  return streamSSE(c, async (stream) => {
    let writeQueue = Promise.resolve();
    const writeEvent = (
      event: string,
      data: object,
      id?: string
    ): Promise<void> => {
      writeQueue = writeQueue
        .then(() =>
          stream.writeSSE({
            data: JSON.stringify(data),
            event,
            id,
          })
        )
        .catch(() => undefined);
      return writeQueue;
    };

    const unsubscribe = await subscribeToReportLiveEvents(
      (reportEvent) =>
        writeEvent(
          reportEvent.type,
          reportEvent,
          `${reportEvent.updatedAt}:${reportEvent.reportId}`
        ),
      () =>
        writeEvent("report.error", {
          message: "Live report updates are temporarily unavailable",
        })
    );

    try {
      await writeEvent("connected", {
        connectedAt: new Date().toISOString(),
      });

      const sendHeartbeat = async (): Promise<void> => {
        await stream.sleep(SSE_HEARTBEAT_INTERVAL_MS);
        if (stream.aborted) {
          return;
        }
        await writeEvent("heartbeat", {
          timestamp: new Date().toISOString(),
        });
        await sendHeartbeat();
      };

      await sendHeartbeat();
    } finally {
      await unsubscribe();
    }
  });
});

app.get("/sse/offline-calls/live", async (c) => {
  const session = await operatorAuth.api.getSession({
    headers: c.req.raw.headers,
  });
  if (!session) {
    return c.json({ message: "Authentication required" }, 401);
  }
  if (session.user.role !== "OPERATOR") {
    return c.json({ message: "Operator access required" }, 403);
  }

  c.header("Cache-Control", "no-cache, no-transform");
  c.header("X-Accel-Buffering", "no");

  return streamSSE(c, async (stream) => {
    let writeQueue = Promise.resolve();
    const unsubscribe = subscribeToOfflineCallLiveEvents((event) => {
      writeQueue = writeQueue
        .then(() =>
          stream.writeSSE({
            data: JSON.stringify(event),
            event: event.type,
            id: `${event.occurredAt}:${event.callId}`,
          })
        )
        .catch(() => undefined);
    });
    try {
      await stream.writeSSE({
        data: JSON.stringify({ connectedAt: new Date().toISOString() }),
        event: "connected",
      });
      const keepAlive = async (): Promise<void> => {
        await stream.sleep(SSE_HEARTBEAT_INTERVAL_MS);
        if (stream.aborted) {
          return;
        }
        await stream.writeSSE({
          data: JSON.stringify({ timestamp: new Date().toISOString() }),
          event: "heartbeat",
        });
        await keepAlive();
      };
      await keepAlive();
    } finally {
      unsubscribe();
    }
  });
});

app.get("/", (c) => c.text("OK"));

export default app;
