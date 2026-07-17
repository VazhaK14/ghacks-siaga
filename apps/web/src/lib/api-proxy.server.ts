const PROXY_PREFIX = "/backend";
const BODYLESS_METHODS = new Set(["GET", "HEAD"]);
const HOP_BY_HOP_HEADERS = [
  "connection",
  "content-length",
  "host",
  "transfer-encoding",
] as const;

const getApiUrl = (): string | undefined => {
  const apiUrl = process.env.SIAGA_API_URL?.trim();
  if (!apiUrl) {
    return;
  }
  return apiUrl.endsWith("/") ? apiUrl.slice(0, -1) : apiUrl;
};

export const proxyApiRequest = async (request: Request): Promise<Response> => {
  const apiUrl = getApiUrl();
  if (!apiUrl) {
    return Response.json(
      { message: "SIAGA API proxy is not configured" },
      { status: 503 }
    );
  }

  const incomingUrl = new URL(request.url);
  const upstreamPath = incomingUrl.pathname.slice(PROXY_PREFIX.length) || "/";
  const upstreamUrl = `${apiUrl}${upstreamPath}${incomingUrl.search}`;
  const headers = new Headers(request.headers);
  for (const header of HOP_BY_HOP_HEADERS) {
    headers.delete(header);
  }
  headers.delete("accept-encoding");

  const body = BODYLESS_METHODS.has(request.method)
    ? undefined
    : await request.arrayBuffer();
  const upstreamResponse = await fetch(upstreamUrl, {
    body,
    headers,
    method: request.method,
    redirect: "manual",
    signal: request.signal,
  });
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
