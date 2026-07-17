import { env } from "@siaga-app/env/web";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { getServerUrl } from "@/lib/get-server-url";
import { trpc } from "@/utils/trpc";

export const useOfflineCallsQuery = () =>
  useQuery({
    ...trpc.offlineCall.list.queryOptions(),
    refetchInterval: 3000,
  });

export const useOfflineCallDetailQuery = (callId: string | null) =>
  useQuery({
    ...trpc.offlineCall.getOperatorDetail.queryOptions({
      callId: callId ?? "",
    }),
    enabled: Boolean(callId),
    refetchInterval: 2000,
  });

export const useAcceptOfflineCallMutation = () =>
  useMutation(trpc.offlineCall.accept.mutationOptions());

export const useOperatorConnectionMutation = () =>
  useMutation(trpc.offlineCall.operatorConnection.mutationOptions());

export const useEndOperatorCallMutation = () =>
  useMutation(trpc.offlineCall.endByOperator.mutationOptions());

export const useFinalizeOfflineCallMutation = () => {
  const queryClient = useQueryClient();
  return useMutation(
    trpc.offlineCall.finalize.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.offlineCall.pathKey(),
        });
      },
    })
  );
};

export const useConvertOfflineCallMutation = () => {
  const queryClient = useQueryClient();
  return useMutation(
    trpc.offlineCall.convertToReport.mutationOptions({
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: trpc.offlineCall.pathKey(),
          }),
          queryClient.invalidateQueries({
            queryKey: trpc.report.pathKey(),
          }),
        ]);
      },
    })
  );
};

export const useOfflineCallLiveUpdates = (): void => {
  const queryClient = useQueryClient();
  useEffect(() => {
    const source = new EventSource(
      `${getServerUrl(env.VITE_SERVER_URL)}/sse/offline-calls/live`,
      { withCredentials: true }
    );
    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: trpc.offlineCall.pathKey() });
    };
    source.addEventListener("offline-call.created", invalidate);
    source.addEventListener("offline-call.accepted", invalidate);
    source.addEventListener("offline-call.ended", invalidate);
    source.addEventListener("offline-call.finalized", invalidate);
    source.addEventListener("offline-call.converted", invalidate);
    return () => source.close();
  }, [queryClient]);
};
