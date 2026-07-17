import type { AppRouter } from "@siaga-app/api/routers/index";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { inferRouterInputs } from "@trpc/server";

import { trpc } from "@/utils/trpc";

type RouterInputs = inferRouterInputs<AppRouter>["offlineCall"];

export const useOfflineCallQuery = (
  input: RouterInputs["get"],
  enabled: boolean
) =>
  useQuery({
    ...trpc.offlineCall.get.queryOptions(input),
    enabled,
    refetchInterval: 1500,
    retry: false,
  });

export const useStartOfflineCallMutation = () =>
  useMutation(trpc.offlineCall.start.mutationOptions());

export const useOfflineCallConnectionMutation = () =>
  useMutation(trpc.offlineCall.connection.mutationOptions());

export const useAppendCallerTranscriptMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    ...trpc.offlineCall.appendCallerTranscript.mutationOptions(),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: trpc.offlineCall.get.queryKey({
          accessToken: variables.accessToken,
          callId: variables.callId,
        }),
      });
    },
  });
};

export const useEndOfflineCallMutation = () =>
  useMutation(trpc.offlineCall.endByCaller.mutationOptions());
