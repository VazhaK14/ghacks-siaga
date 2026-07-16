import { cn } from "@siaga-app/ui/lib/utils";
import { MapPinIcon } from "lucide-react";
import { useCallback } from "react";

import {
  CATEGORY_CONFIG,
  formatReportTime,
  getReportTitle,
  INCIDENT_TYPE_LABELS,
  REPORT_STATUS_LABELS,
} from "../content";
import type { ActiveReportListItem } from "../types";

interface ReportQueueCardProps {
  isSelected: boolean;
  onSelect: (reportId: string) => void;
  report: ActiveReportListItem;
}

export function ReportQueueCard({
  isSelected,
  onSelect,
  report,
}: ReportQueueCardProps) {
  const category = CATEGORY_CONFIG[report.category];
  const CategoryIcon = category.icon;
  const handleSelect = useCallback(() => {
    onSelect(report.id);
  }, [onSelect, report.id]);

  return (
    <button
      aria-pressed={isSelected}
      className={cn(
        "relative w-full overflow-hidden rounded-md bg-background p-3 pl-5 text-left ring-1 ring-foreground/10 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isSelected && "bg-primary-10 ring-2 ring-primary-300"
      )}
      onClick={handleSelect}
      type="button"
    >
      <span
        aria-hidden
        className={cn("absolute inset-y-0 left-0 w-1.5", category.barClassName)}
      />

      <span className="flex items-start justify-between gap-3">
        <span className="min-w-0">
          <span className="block text-[10px] text-muted-foreground">
            {report.id.slice(-8).toUpperCase()} ·{" "}
            {formatReportTime(report.createdAt)}
          </span>
          <span className="mt-1 line-clamp-2 block font-semibold text-foreground text-sm">
            {getReportTitle(report)}
          </span>
        </span>

        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 font-semibold text-[9px]",
            category.badgeClassName
          )}
        >
          <CategoryIcon aria-hidden className="size-3" />
          {category.label}
        </span>
      </span>

      <span className="mt-3 flex items-center justify-between gap-3 text-[10px] text-muted-foreground">
        <span className="truncate">
          {report.incidentType
            ? INCIDENT_TYPE_LABELS[report.incidentType]
            : "Belum diklasifikasi"}
        </span>
        <span className="shrink-0">{REPORT_STATUS_LABELS[report.status]}</span>
      </span>

      <span className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
        <MapPinIcon aria-hidden className="size-3" />
        <span className="truncate">
          {report.address ??
            (report.latitude === null
              ? "Lokasi belum tersedia"
              : "Koordinat tersedia")}
        </span>
      </span>
    </button>
  );
}
