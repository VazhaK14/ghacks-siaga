import { Button } from "@siaga-app/ui/components/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@siaga-app/ui/components/sheet";
import { ListIcon, PanelRightIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";

import { useActiveReportsQuery, useReportDetailQuery } from "../api";
import type { MobileMapPanel } from "../types";
import { useReportCallSimulation } from "../use-report-call-simulation";
import { useMapWorkspace } from "./map-workspace";
import { ReportDetailWorkspace } from "./report-detail-workspace";
import { ReportQueuePanel } from "./report-queue-panel";

export function MapMonitorScreen() {
  const {
    connectionStatus,
    onDismissReport,
    onSelectAgency,
    onSelectReport,
    selectedAgencyId,
    selectedReportId,
  } = useMapWorkspace();
  const activeReportsQuery = useActiveReportsQuery();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedReportId = searchParams.get("reportId");
  const [mobilePanel, setMobilePanel] = useState<MobileMapPanel>(null);
  const [resolvedReportIds, setResolvedReportIds] = useState(
    () => new Set<string>()
  );
  const reportDetailQuery = useReportDetailQuery(selectedReportId);
  const { endCall, getSession, startCall } = useReportCallSimulation();
  const callSession = getSession(selectedReportId);

  const allReports = useMemo(
    () => activeReportsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [activeReportsQuery.data?.pages]
  );
  const reports = useMemo(
    () => allReports.filter((report) => !resolvedReportIds.has(report.id)),
    [allReports, resolvedReportIds]
  );
  const pendingRemovalCount = useMemo(
    () =>
      allReports.filter((report) => resolvedReportIds.has(report.id)).length,
    [allReports, resolvedReportIds]
  );
  const activeCount = Math.max(
    0,
    (activeReportsQuery.data?.pages[0]?.activeCount ?? 0) - pendingRemovalCount
  );

  const handleSelectReport = useCallback(
    (reportId: string) => {
      onSelectReport(reportId);
      setSearchParams({ reportId }, { replace: true });
      if (window.innerWidth < 1280) {
        setMobilePanel("detail");
      }
    },
    [onSelectReport, setSearchParams]
  );

  const handleLoadMore = useCallback(async (): Promise<void> => {
    await activeReportsQuery.fetchNextPage();
  }, [activeReportsQuery]);
  const handleOpenList = useCallback(() => {
    setMobilePanel("list");
  }, []);
  const handleOpenDetail = useCallback(() => {
    setMobilePanel("detail");
  }, []);
  const handleListOpenChange = useCallback((open: boolean) => {
    setMobilePanel(open ? "list" : null);
  }, []);
  const handleDetailOpenChange = useCallback((open: boolean) => {
    setMobilePanel(open ? "detail" : null);
  }, []);
  const handleReportResolved = useCallback(
    (reportId: string) => {
      setResolvedReportIds((currentReportIds) => {
        const nextReportIds = new Set(currentReportIds);
        nextReportIds.add(reportId);
        return nextReportIds;
      });
      onDismissReport(reportId);
      setSearchParams({}, { replace: true });
      setMobilePanel(null);
    },
    [onDismissReport, setSearchParams]
  );

  useEffect(() => {
    if (selectedReportId || reports.length === 0) {
      return;
    }
    const requestedReport = requestedReportId
      ? reports.find((report) => report.id === requestedReportId)
      : null;
    const nextReportId = requestedReport?.id ?? reports[0]?.id;
    if (requestedReportId && !requestedReport) {
      setSearchParams({}, { replace: true });
    }
    if (nextReportId) {
      onSelectReport(nextReportId);
    }
  }, [
    onSelectReport,
    reports,
    requestedReportId,
    selectedReportId,
    setSearchParams,
  ]);

  return (
    <div className="relative size-full min-h-0 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 z-10 hidden xl:block">
        <ReportQueuePanel
          activeCount={activeCount}
          className="pointer-events-auto absolute inset-y-4 left-[16rem] w-[22rem]"
          connectionStatus={connectionStatus}
          error={activeReportsQuery.error}
          hasNextPage={activeReportsQuery.hasNextPage}
          isFetchingNextPage={activeReportsQuery.isFetchingNextPage}
          isPending={activeReportsQuery.isPending}
          onLoadMore={handleLoadMore}
          onSelectReport={handleSelectReport}
          reports={reports}
          selectedReportId={selectedReportId}
        />

        <ReportDetailWorkspace
          className="pointer-events-auto absolute inset-y-4 right-4 w-96"
          error={reportDetailQuery.error}
          isPending={reportDetailQuery.isPending}
          mode="desktop"
          onEndCall={endCall}
          onReportResolved={handleReportResolved}
          onSelectAgency={onSelectAgency}
          onStartCall={startCall}
          report={reportDetailQuery.data ?? null}
          selectedAgencyId={selectedAgencyId}
          session={callSession}
        />
      </div>

      <div className="pointer-events-auto absolute top-3 left-14 z-10 flex gap-2 md:left-[16rem] xl:hidden">
        <Button
          onClick={handleOpenList}
          size="sm"
          type="button"
          variant="secondary"
        >
          <ListIcon data-icon="inline-start" />
          Laporan ({activeCount})
        </Button>
        {selectedReportId ? (
          <Button
            onClick={handleOpenDetail}
            size="sm"
            type="button"
            variant="secondary"
          >
            <PanelRightIcon data-icon="inline-start" />
            Detail
          </Button>
        ) : null}
      </div>

      <Sheet onOpenChange={handleListOpenChange} open={mobilePanel === "list"}>
        <SheetContent
          className="h-[72svh]! max-h-[72svh] p-0"
          showCloseButton
          side="bottom"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Daftar laporan aktif</SheetTitle>
            <SheetDescription>
              Pilih laporan untuk melihat lokasi dan detail.
            </SheetDescription>
          </SheetHeader>
          <ReportQueuePanel
            activeCount={activeCount}
            className="size-full rounded-none bg-transparent shadow-none ring-0 backdrop-blur-none"
            connectionStatus={connectionStatus}
            error={activeReportsQuery.error}
            hasNextPage={activeReportsQuery.hasNextPage}
            isFetchingNextPage={activeReportsQuery.isFetchingNextPage}
            isPending={activeReportsQuery.isPending}
            onLoadMore={handleLoadMore}
            onSelectReport={handleSelectReport}
            reports={reports}
            selectedReportId={selectedReportId}
          />
        </SheetContent>
      </Sheet>

      <Sheet
        onOpenChange={handleDetailOpenChange}
        open={mobilePanel === "detail"}
      >
        <SheetContent
          className="h-[78svh]! max-h-[78svh] p-0"
          showCloseButton
          side="bottom"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Detail laporan</SheetTitle>
            <SheetDescription>
              Informasi operasional laporan terpilih.
            </SheetDescription>
          </SheetHeader>
          <ReportDetailWorkspace
            className="size-full rounded-none bg-transparent shadow-none ring-0 backdrop-blur-none"
            error={reportDetailQuery.error}
            isPending={reportDetailQuery.isPending}
            key={selectedReportId}
            mode="mobile"
            onEndCall={endCall}
            onReportResolved={handleReportResolved}
            onSelectAgency={onSelectAgency}
            onStartCall={startCall}
            report={reportDetailQuery.data ?? null}
            selectedAgencyId={selectedAgencyId}
            session={callSession}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
