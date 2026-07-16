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

import { useActiveReportsQuery, useReportDetailQuery } from "../api";
import type { MobileMapPanel } from "../types";
import { useMapWorkspace } from "./map-workspace";
import { ReportDetailPanel } from "./report-detail-panel";
import { ReportQueuePanel } from "./report-queue-panel";

export function MapMonitorScreen() {
  const { connectionStatus, onSelectReport, selectedReportId } =
    useMapWorkspace();
  const activeReportsQuery = useActiveReportsQuery();
  const [mobilePanel, setMobilePanel] = useState<MobileMapPanel>(null);
  const reportDetailQuery = useReportDetailQuery(selectedReportId);

  const reports = useMemo(
    () => activeReportsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [activeReportsQuery.data?.pages]
  );
  const activeCount = activeReportsQuery.data?.pages[0]?.activeCount ?? 0;

  const handleSelectReport = useCallback(
    (reportId: string) => {
      onSelectReport(reportId);
      if (window.innerWidth < 1280) {
        setMobilePanel("detail");
      }
    },
    [onSelectReport]
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

  useEffect(() => {
    if (selectedReportId || reports.length === 0) {
      return;
    }
    const firstReportId = reports[0]?.id;
    if (firstReportId) {
      onSelectReport(firstReportId);
    }
  }, [onSelectReport, reports, selectedReportId]);

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

        <ReportDetailPanel
          className="pointer-events-auto absolute inset-y-4 right-4 w-96"
          error={reportDetailQuery.error}
          isPending={reportDetailQuery.isPending}
          report={reportDetailQuery.data ?? null}
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
          <ReportDetailPanel
            className="size-full rounded-none bg-transparent shadow-none ring-0 backdrop-blur-none"
            error={reportDetailQuery.error}
            isPending={reportDetailQuery.isPending}
            report={reportDetailQuery.data ?? null}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
