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

export const useAppendOperatorTranscriptMutation = () =>
  useMutation(trpc.offlineCall.appendOperatorTranscript.mutationOptions());

export const useEndOperatorCallMutation = () =>
  useMutation(trpc.offlineCall.endByOperator.mutationOptions());

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
    source.addEventListener("offline-call.transcript", invalidate);
    source.addEventListener("offline-call.ended", invalidate);
    return () => source.close();
  }, [queryClient]);
};
