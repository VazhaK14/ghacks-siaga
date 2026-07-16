import {
  skipToken,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { trpc } from "@/utils/trpc";

export function useReportDispatchQuery(reportId: string | null) {
  return useQuery(
    trpc.dispatch.getReportDispatch.queryOptions(
      reportId ? { reportId } : skipToken
    )
  );
}

export function useAgencyBoardQuery(enabled = true) {
  return useQuery({
    ...trpc.dispatch.listAgencyBoard.queryOptions(),
    enabled,
  });
}

export function useCreateDispatchMutation() {
  const queryClient = useQueryClient();

  return useMutation(
    trpc.dispatch.create.mutationOptions({
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: trpc.dispatch.pathKey(),
          }),
          queryClient.invalidateQueries({
            queryKey: trpc.report.pathKey(),
          }),
        ]);
      },
    })
  );
}

export function useCloseReportMutation(
  onReportClosed: (reportId: string) => void
) {
  const queryClient = useQueryClient();

  return useMutation(
    trpc.dispatch.closeReport.mutationOptions({
      onSuccess: async (result) => {
        onReportClosed(result.reportId);
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: trpc.dispatch.pathKey(),
          }),
          queryClient.invalidateQueries({
            queryKey: trpc.report.listActive.pathKey(),
          }),
          queryClient.invalidateQueries({
            queryKey: trpc.report.listActiveMapPoints.pathKey(),
          }),
          queryClient.invalidateQueries({
            queryKey: trpc.report.listArchived.pathKey(),
          }),
        ]);
      },
    })
  );
}

export function useResolveDispatchMutation(
  onReportResolved: (reportId: string) => void
) {
  const queryClient = useQueryClient();

  return useMutation(
    trpc.dispatch.resolve.mutationOptions({
      onSuccess: async (dispatch) => {
        onReportResolved(dispatch.reportId);
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: trpc.dispatch.pathKey(),
          }),
          queryClient.invalidateQueries({
            queryKey: trpc.report.listActive.pathKey(),
          }),
          queryClient.invalidateQueries({
            queryKey: trpc.report.listActiveMapPoints.pathKey(),
          }),
          queryClient.invalidateQueries({
            queryKey: trpc.report.listArchived.pathKey(),
          }),
        ]);
      },
    })
  );
}
