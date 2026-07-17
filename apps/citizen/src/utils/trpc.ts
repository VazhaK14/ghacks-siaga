import type { AppRouter } from "@siaga-app/api/routers/index";
import { env } from "@siaga-app/env/web";
import { QueryCache, QueryClient } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { toast } from "sonner";

import { getServerUrl } from "@/lib/get-server-url";

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (query.meta?.suppressGlobalErrorToast === true) {
        return;
      }
      toast.error(error.message, {
        action: {
          label: "coba lagi",
          onClick: () => {
            query.invalidate();
          },
        },
      });
    },
  }),
});

export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      fetch(requestUrl, options) {
        return globalThis.fetch(requestUrl, {
          ...options,
          credentials: "include",
        });
      },
      url: `${getServerUrl(env.VITE_SERVER_URL)}/trpc/citizen`,
    }),
  ],
});

export const trpc = createTRPCOptionsProxy<AppRouter>({
  client: trpcClient,
  queryClient,
});
