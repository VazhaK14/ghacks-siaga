import { Button } from "@siaga-app/ui/components/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@siaga-app/ui/components/empty";
import { Skeleton } from "@siaga-app/ui/components/skeleton";
import { cn } from "@siaga-app/ui/lib/utils";
import { LoaderCircleIcon } from "lucide-react";

import { LIVE_STATUS_CONFIG } from "../content";
import type {
  ActiveReportListItem,
  DisplayError,
  LiveConnectionStatus,
} from "../types";
import { ReportQueueCard } from "./report-queue-card";

interface ReportQueuePanelProps {
  activeCount: number;
  className?: string;
  connectionStatus: LiveConnectionStatus;
  error: DisplayError | null;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  isPending: boolean;
  onLoadMore: () => void;
  onSelectReport: (reportId: string) => void;
  reports: ActiveReportListItem[];
  selectedReportId: string | null;
}

function ReportQueueSkeleton() {
  return (
    <div className="flex flex-col gap-2 p-3">
      <Skeleton className="h-28 w-full rounded-md" />
      <Skeleton className="h-28 w-full rounded-md" />
      <Skeleton className="h-28 w-full rounded-md" />
    </div>
  );
}

export function ReportQueuePanel({
  activeCount,
  className,
  connectionStatus,
  error,
  hasNextPage,
  isFetchingNextPage,
  isPending,
  onLoadMore,
  onSelectReport,
  reports,
  selectedReportId,
}: ReportQueuePanelProps) {
  const liveStatus = LIVE_STATUS_CONFIG[connectionStatus];

  return (
    <aside
      aria-label="Daftar laporan aktif"
      className={cn(
        "flex min-h-0 flex-col overflow-hidden rounded-lg bg-popover/95 text-popover-foreground shadow-xl ring-1 ring-foreground/10 backdrop-blur-sm",
        className
      )}
    >
      <header className="flex items-start justify-between gap-3 border-b p-4">
        <span>
          <span className="block font-bold text-base text-foreground">
            Laporan Masuk
          </span>
          <span className="mt-1 block text-muted-foreground text-xs">
            {activeCount} laporan aktif
          </span>
        </span>
        <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <span
            aria-hidden
            className={cn("size-2 rounded-full", liveStatus.dotClassName)}
          />
          {liveStatus.label}
        </span>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {isPending ? <ReportQueueSkeleton /> : null}

        {!isPending && error ? (
          <Empty className="min-h-64">
            <EmptyHeader>
              <EmptyTitle>Laporan tidak dapat dimuat</EmptyTitle>
              <EmptyDescription>{error.message}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : null}

        {!(isPending || error) && reports.length === 0 ? (
          <Empty className="min-h-64">
            <EmptyHeader>
              <EmptyTitle>Tidak ada laporan aktif</EmptyTitle>
              <EmptyDescription>
                Laporan baru akan tampil di antrean ini.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : null}

        {!(isPending || error) && reports.length > 0 ? (
          <div className="flex flex-col gap-2 p-3">
            {reports.map((report) => (
              <ReportQueueCard
                isSelected={selectedReportId === report.id}
                key={report.id}
                onSelect={onSelectReport}
                report={report}
              />
            ))}
          </div>
        ) : null}
      </div>

      {hasNextPage ? (
        <footer className="border-t p-3">
          <Button
            className="w-full"
            disabled={isFetchingNextPage}
            onClick={onLoadMore}
            size="sm"
            type="button"
            variant="secondary"
          >
            {isFetchingNextPage ? (
              <LoaderCircleIcon
                className="animate-spin"
                data-icon="inline-start"
              />
            ) : null}
            Muat lagi
          </Button>
        </footer>
      ) : null}
    </aside>
  );
}
