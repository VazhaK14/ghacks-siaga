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

export const usePrepareReportImageUploadsMutation = () =>
  useMutation(trpc.report.prepareImageUploads.mutationOptions());

export const useCompleteReportImageUploadsMutation = () => {
  const invalidate = useInvalidateReporterReports();
  return useMutation(
    trpc.report.completeImageUploads.mutationOptions({ onSuccess: invalidate })
  );
};

export const useReporterImageAccessQuery = (
  reportId: string,
  attachmentIds: string[]
) =>
  useQuery(
    trpc.report.getReporterImageAccess.queryOptions(
      attachmentIds.length > 0 ? { attachmentIds, reportId } : skipToken,
      { retry: false, staleTime: 4 * 60 * 1000 }
    )
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

export const useAppendAcousticSignalMutation = () => {
  const invalidate = useInvalidateReporterReports();
  return useMutation(
    trpc.report.appendAcousticSignal.mutationOptions({ onSuccess: invalidate })
  );
};

export const useGetReporterLiveKitConnectionMutation = () =>
  useMutation(trpc.report.getLiveKitToken.mutationOptions());

export const useActivateReporterSessionMutation = () => {
  const invalidate = useInvalidateReporterReports();
  return useMutation(
    trpc.report.activateSession.mutationOptions({ onSuccess: invalidate })
  );
};

export const useRealtimeTranscriptionTokenMutation = () =>
  useMutation(trpc.report.getRealtimeTranscriptionToken.mutationOptions());

export const useSynthesizeSpeechMutation = () =>
  useMutation(trpc.report.synthesizeSpeech.mutationOptions());

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

export const useIncomingOperatorCallQuery = (callSessionId: string | null) =>
  useQuery(
    trpc.report.getIncomingCall.queryOptions(
      callSessionId ? { callSessionId } : skipToken,
      { refetchInterval: 1000, retry: false }
    )
  );

export const useAcceptIncomingCallMutation = () =>
  useMutation(trpc.report.acceptIncomingCall.mutationOptions());

export const useRejectIncomingCallMutation = () =>
  useMutation(trpc.report.rejectIncomingCall.mutationOptions());

export const useEndIncomingCallMutation = () =>
  useMutation(trpc.report.endIncomingCall.mutationOptions());
