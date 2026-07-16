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

export const useCreateReporterReportMutation = () => {
  const invalidate = useInvalidateReporterReports();
  return useMutation(
    trpc.report.create.mutationOptions({ onSuccess: invalidate })
  );
};

export const useReporterReportQuery = (reportId: string | null) =>
  useQuery(
    trpc.report.getMine.queryOptions(reportId ? { reportId } : skipToken, {
      refetchInterval: 2000,
      retry: false,
    })
  );

export const useReporterReportsQuery = () =>
  useQuery(
    trpc.report.listMine.queryOptions(undefined, { refetchInterval: 5000 })
  );

export const useAppendReporterTextMutation = () => {
  const invalidate = useInvalidateReporterReports();
  return useMutation(
    trpc.report.appendReporterText.mutationOptions({ onSuccess: invalidate })
  );
};

export const useUpdateReporterLocationMutation = () => {
  const invalidate = useInvalidateReporterReports();
  return useMutation(
    trpc.report.updateLocation.mutationOptions({ onSuccess: invalidate })
  );
};

export const useSwitchReporterModeMutation = () => {
  const invalidate = useInvalidateReporterReports();
  return useMutation(
    trpc.report.switchMode.mutationOptions({ onSuccess: invalidate })
  );
};

export const useEndReporterSessionMutation = () => {
  const invalidate = useInvalidateReporterReports();
  return useMutation(
    trpc.report.endSession.mutationOptions({ onSuccess: invalidate })
  );
};

export const useRequestCancellationMutation = () => {
  const invalidate = useInvalidateReporterReports();
  return useMutation(
    trpc.report.requestCancellation.mutationOptions({ onSuccess: invalidate })
  );
};

export const useAcknowledgeReportMutation = () => {
  const invalidate = useInvalidateReporterReports();
  return useMutation(
    trpc.report.acknowledge.mutationOptions({ onSuccess: invalidate })
  );
};
