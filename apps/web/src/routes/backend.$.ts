import { proxyApiRequest } from "@/lib/api-proxy.server";

interface ProxyRouteArgs {
  request: Request;
}

export const loader = ({ request }: ProxyRouteArgs): Promise<Response> =>
  proxyApiRequest(request);

export const action = ({ request }: ProxyRouteArgs): Promise<Response> =>
  proxyApiRequest(request);
