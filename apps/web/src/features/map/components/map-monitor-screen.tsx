import { Button } from "@siaga-app/ui/components/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@siaga-app/ui/components/sheet";
import { cn } from "@siaga-app/ui/lib/utils";
import { ChevronRightIcon, ListIcon, PanelRightIcon } from "lucide-react";
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
    isMapFocusMode,
    onDismissReport,
    onSelectAgency,
    onSelectReport,
    selectedAgencyId,
    selectedReportId,
    onToggleMapFocus,
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
        <div className="absolute inset-y-4 left-[16rem] w-[22rem] overflow-hidden">
          <ReportQueuePanel
            activeCount={activeCount}
            className={cn(
              "pointer-events-auto size-full transition-[transform,opacity] duration-300 ease-out",
              isMapFocusMode &&
                "pointer-events-none -translate-x-full opacity-0"
            )}
            connectionStatus={connectionStatus}
            error={activeReportsQuery.error}
            hasNextPage={activeReportsQuery.hasNextPage}
            isFetchingNextPage={activeReportsQuery.isFetchingNextPage}
            isPending={activeReportsQuery.isPending}
            onLoadMore={handleLoadMore}
            onSelectReport={handleSelectReport}
            onToggleVisibility={onToggleMapFocus}
            reports={reports}
            selectedReportId={selectedReportId}
          />
        </div>

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

      <div
        className={cn(
          "pointer-events-none absolute top-1/2 left-2 z-20 hidden -translate-y-1/2 opacity-0 transition-opacity duration-200 xl:left-[16.25rem] xl:block",
          isMapFocusMode && "pointer-events-auto opacity-100"
        )}
      >
        <Button
          aria-pressed={isMapFocusMode}
          className="size-8 rounded-md border border-neutral-300 bg-white p-0 text-neutral-1000 opacity-100 shadow-md hover:bg-neutral-200 focus-visible:ring-2 focus-visible:ring-neutral-700/40"
          data-map-panel-toggle
          onClick={onToggleMapFocus}
          size="icon-sm"
          title="Tampilkan daftar laporan"
          type="button"
          variant="secondary"
        >
          <ChevronRightIcon aria-hidden className="size-5" strokeWidth={3} />
        </Button>
      </div>

      {isMapFocusMode ? null : (
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
      )}

      {!isMapFocusMode && (
        <Sheet
          onOpenChange={handleListOpenChange}
          open={mobilePanel === "list"}
        >
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
      )}

      {!isMapFocusMode && (
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
      )}
    </div>
  );
}
