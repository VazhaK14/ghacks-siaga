import { Skeleton } from "@siaga-app/ui/components/skeleton";
import { cn } from "@siaga-app/ui/lib/utils";
import { RadioTowerIcon } from "lucide-react";
import { useCallback } from "react";

import { useAgencyBoardQuery } from "../api";
import {
  AGENCY_AVAILABILITY_CONFIG,
  AGENCY_TYPE_CONFIG,
  DISPATCH_STATUS_CONFIG,
} from "../content";
import type { AgencyBoardItem } from "../types";

interface AgencyBoardPanelProps {
  className?: string;
  onSelectAgency: (agencyId: string) => void;
  selectedAgencyId: string | null;
}

function AgencyBoardCard({
  agency,
  isSelected,
  onSelectAgency,
}: {
  agency: AgencyBoardItem;
  isSelected: boolean;
  onSelectAgency: (agencyId: string) => void;
}) {
  const typeConfig = AGENCY_TYPE_CONFIG[agency.type];
  const availabilityConfig = AGENCY_AVAILABILITY_CONFIG[agency.availability];
  const TypeIcon = typeConfig.icon;
  const handleSelect = useCallback(() => {
    onSelectAgency(agency.id);
  }, [agency.id, onSelectAgency]);

  return (
    <button
      aria-pressed={isSelected}
      className={cn(
        "w-full rounded-md bg-background p-3 text-left ring-1 ring-foreground/10 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isSelected && "bg-primary-10 ring-2 ring-primary-300"
      )}
      onClick={handleSelect}
      type="button"
    >
      <span className="flex items-start justify-between gap-3">
        <span className="flex min-w-0 items-start gap-2">
          <span
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-md border",
              typeConfig.markerClassName
            )}
          >
            <TypeIcon aria-hidden className="size-4" />
          </span>
          <span className="min-w-0">
            <span className="block truncate font-semibold text-foreground text-xs">
              {agency.name}
            </span>
            <span className="mt-1 block truncate text-[10px] text-muted-foreground">
              {typeConfig.label} · {agency.jurisdiction}
            </span>
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-1 text-[9px] text-muted-foreground">
          <span
            aria-hidden
            className={cn(
              "size-2 rounded-full",
              availabilityConfig.dotClassName
            )}
          />
          {availabilityConfig.label}
        </span>
      </span>

      {agency.activeDispatch ? (
        <span className="mt-3 block rounded-md bg-primary-10 p-2">
          <span className="flex items-center gap-1 font-semibold text-[10px] text-primary-200">
            <RadioTowerIcon aria-hidden className="size-3" />
            {DISPATCH_STATUS_CONFIG[agency.activeDispatch.status].label}
          </span>
          <span className="mt-1 block truncate text-[9px] text-muted-foreground">
            {agency.activeDispatch.unitCode} ·{" "}
            {agency.activeDispatch.destination.title}
          </span>
        </span>
      ) : (
        <span className="mt-2 block truncate text-[9px] text-muted-foreground">
          {agency.address}
        </span>
      )}
    </button>
  );
}

export function AgencyBoardPanel({
  className,
  onSelectAgency,
  selectedAgencyId,
}: AgencyBoardPanelProps) {
  const agenciesQuery = useAgencyBoardQuery();
  const availableCount =
    agenciesQuery.data?.filter((agency) => agency.availability === "AVAILABLE")
      .length ?? 0;
  const activeCount =
    agenciesQuery.data?.filter((agency) => agency.activeDispatch).length ?? 0;

  return (
    <aside
      aria-label="Board unit respons"
      className={cn(
        "flex min-h-0 flex-col overflow-hidden rounded-md bg-popover/95 text-popover-foreground shadow-xl ring-1 ring-foreground/10 backdrop-blur-sm",
        className
      )}
    >
      <header className="border-b p-4">
        <span className="block font-bold text-base text-foreground">
          Unit Respons
        </span>
        <span className="mt-1 block text-muted-foreground text-xs">
          {availableCount} tersedia · {activeCount} sedang bertugas
        </span>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {agenciesQuery.isPending ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-24 w-full rounded-md" />
            <Skeleton className="h-24 w-full rounded-md" />
            <Skeleton className="h-24 w-full rounded-md" />
          </div>
        ) : null}

        {agenciesQuery.error ? (
          <p className="p-3 text-destructive text-xs">
            {agenciesQuery.error.message}
          </p>
        ) : null}

        {agenciesQuery.data ? (
          <div className="flex flex-col gap-2">
            {agenciesQuery.data.map((agency) => (
              <AgencyBoardCard
                agency={agency}
                isSelected={agency.id === selectedAgencyId}
                key={agency.id}
                onSelectAgency={onSelectAgency}
              />
            ))}
          </div>
        ) : null}
      </div>
    </aside>
  );
}
