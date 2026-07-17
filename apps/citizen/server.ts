import path from "node:path";

import { file, serve } from "bun";

const PROXY_PREFIX = "/backend";
const BODYLESS_METHODS = new Set(["GET", "HEAD"]);
const HOP_BY_HOP_HEADERS = [
  "connection",
  "content-length",
  "host",
  "transfer-encoding",
] as const;
const STATIC_DIRECTORY = path.resolve(import.meta.dir, "build/client");
const INDEX_FILE = path.join(STATIC_DIRECTORY, "index.html");
const LEADING_SLASHES_PATTERN = /^\/+/;

const getApiUrl = (): string | undefined => {
  const apiUrl = process.env.SIAGA_API_URL?.trim();
  if (!apiUrl) {
    return;
  }
  return apiUrl.endsWith("/") ? apiUrl.slice(0, -1) : apiUrl;
};

const proxyApiRequest = async (request: Request): Promise<Response> => {
  const apiUrl = getApiUrl();
  if (!apiUrl) {
    return Response.json(
      { message: "SIAGA API proxy is not configured" },
      { status: 503 }
    );
  }

  const incomingUrl = new URL(request.url);
  const upstreamPath = incomingUrl.pathname.slice(PROXY_PREFIX.length) || "/";
  const headers = new Headers(request.headers);
  for (const header of HOP_BY_HOP_HEADERS) {
    headers.delete(header);
  }
  headers.delete("accept-encoding");

  const body = BODYLESS_METHODS.has(request.method)
    ? undefined
    : await request.arrayBuffer();
  const upstreamResponse = await fetch(
    `${apiUrl}${upstreamPath}${incomingUrl.search}`,
    {
      body,
      headers,
      method: request.method,
      redirect: "manual",
      signal: request.signal,
    }
  );
  const responseHeaders = new Headers(upstreamResponse.headers);
  for (const header of HOP_BY_HOP_HEADERS) {
    responseHeaders.delete(header);
  }

  return new Response(upstreamResponse.body, {
    headers: responseHeaders,
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
  });
};

const resolveStaticFile = (pathname: string): string | null => {
  let decodedPath: string;
  try {
    decodedPath = decodeURIComponent(pathname);
  } catch {
    return null;
  }

  const relativePath = decodedPath === "/" ? "index.html" : decodedPath;
  const staticFilePath = path.resolve(
    STATIC_DIRECTORY,
    relativePath.replace(LEADING_SLASHES_PATTERN, "")
  );
  const isInsideStaticDirectory = staticFilePath.startsWith(
    `${STATIC_DIRECTORY}${path.sep}`
  );
  return isInsideStaticDirectory ? staticFilePath : null;
};

const port = Number.parseInt(process.env.PORT ?? "3000", 10);

serve({
  fetch: async (request): Promise<Response> => {
    const { pathname } = new URL(request.url);
    if (pathname === PROXY_PREFIX || pathname.startsWith(`${PROXY_PREFIX}/`)) {
      return proxyApiRequest(request);
    }

    const staticFilePath = resolveStaticFile(pathname);
    if (staticFilePath) {
      const staticFile = file(staticFilePath);
      if (await staticFile.exists()) {
        return new Response(staticFile);
      }
    }

    return new Response(file(INDEX_FILE), {
      headers: { "Cache-Control": "no-cache" },
    });
  },
  port,
});
