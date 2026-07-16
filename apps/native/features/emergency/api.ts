import {
  skipToken,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { trpc } from "@/utils/trpc";

const useInvalidateReporterReports = () => {
  const queryClient = useQueryClient();
  return async (): Promise<void> => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: trpc.report.listMine.queryKey(),
      }),
      queryClient.invalidateQueries({
        queryKey: trpc.report.getMine.pathKey(),
      }),
    ]);
  };
};

export function useCreateReporterReportMutation() {
  const invalidate = useInvalidateReporterReports();
  return useMutation(
    trpc.report.create.mutationOptions({ onSuccess: invalidate })
  );
}

export function useReporterReportQuery(reportId: string | null) {
  return useQuery(
    trpc.report.getMine.queryOptions(reportId ? { reportId } : skipToken, {
      refetchInterval: 2000,
      retry: false,
    })
  );
}

export function useReporterReportsQuery() {
  return useQuery(
    trpc.report.listMine.queryOptions(undefined, {
      refetchInterval: 5000,
    })
  );
}

export function useAppendReporterTextMutation() {
  const invalidate = useInvalidateReporterReports();
  return useMutation(
    trpc.report.appendReporterText.mutationOptions({ onSuccess: invalidate })
  );
}

export function useLiveKitConnectionMutation() {
  return useMutation(trpc.report.getLiveKitToken.mutationOptions());
}

export function useActivateReporterSessionMutation() {
  const invalidate = useInvalidateReporterReports();
  return useMutation(
    trpc.report.activateSession.mutationOptions({ onSuccess: invalidate })
  );
}

export function useUpdateReporterLocationMutation() {
  const invalidate = useInvalidateReporterReports();
  return useMutation(
    trpc.report.updateLocation.mutationOptions({ onSuccess: invalidate })
  );
}

export function useSwitchReporterModeMutation() {
  const invalidate = useInvalidateReporterReports();
  return useMutation(
    trpc.report.switchMode.mutationOptions({ onSuccess: invalidate })
  );
}

export function useEndReporterSessionMutation() {
  const invalidate = useInvalidateReporterReports();
  return useMutation(
    trpc.report.endSession.mutationOptions({ onSuccess: invalidate })
  );
}

export function useRequestCancellationMutation() {
  const invalidate = useInvalidateReporterReports();
  return useMutation(
    trpc.report.requestCancellation.mutationOptions({ onSuccess: invalidate })
  );
}

export function useAcknowledgeReportMutation() {
  const invalidate = useInvalidateReporterReports();
  return useMutation(
    trpc.report.acknowledge.mutationOptions({ onSuccess: invalidate })
  );
}
