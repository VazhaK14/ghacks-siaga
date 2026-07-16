import { Button } from "@siaga-app/ui/components/button";
import { Skeleton } from "@siaga-app/ui/components/skeleton";
import { cn } from "@siaga-app/ui/lib/utils";
import {
  CheckIcon,
  LoaderCircleIcon,
  NavigationIcon,
  RadioTowerIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo } from "react";
import { toast } from "sonner";

import {
  useCreateDispatchMutation,
  useReportDispatchQuery,
  useResolveDispatchMutation,
} from "../api";
import {
  AGENCY_AVAILABILITY_CONFIG,
  AGENCY_TYPE_CONFIG,
  DISPATCH_STATUS_CONFIG,
} from "../content";
import { useAnimatedDispatchTracking } from "../hooks";
import type { DispatchAgencyRecommendation, DispatchTracking } from "../types";

interface ReportDispatchSectionProps {
  onSelectAgency: (agencyId: string) => void;
  reportId: string;
  selectedAgencyId: string | null;
}

const formatStatusTime = (value: string | null): string | null => {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));
};

function RecommendationOption({
  agency,
  isSelected,
  onSelect,
}: {
  agency: DispatchAgencyRecommendation;
  isSelected: boolean;
  onSelect: (agencyId: string) => void;
}) {
  const typeConfig = AGENCY_TYPE_CONFIG[agency.type];
  const availabilityConfig = AGENCY_AVAILABILITY_CONFIG[agency.availability];
  const TypeIcon = typeConfig.icon;
  const handleSelect = useCallback(() => {
    onSelect(agency.id);
  }, [agency.id, onSelect]);

  return (
    <button
      aria-pressed={isSelected}
      className={cn(
        "w-full rounded-md bg-background p-3 text-left ring-1 ring-foreground/10 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-55",
        isSelected && "bg-primary-10 ring-2 ring-primary-300"
      )}
      disabled={agency.availability !== "AVAILABLE"}
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
            <span className="mt-1 block text-[10px] text-muted-foreground">
              {typeConfig.label} · {agency.distanceKm} km · ETA{" "}
              {agency.etaMinutes} menit
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
      <span className="mt-2 block text-[10px] text-muted-foreground">
        {agency.matchReason}
      </span>
    </button>
  );
}

function DispatchTimeline({ dispatch }: { dispatch: DispatchTracking }) {
  const steps = [
    {
      label: "Analisis laporan selesai",
      timestamp: dispatch.requestedAt,
    },
    {
      label: "Permintaan dikirim",
      timestamp: dispatch.requestedAt,
    },
    {
      label: "Unit menerima permintaan",
      timestamp: dispatch.acknowledgedAt,
    },
    {
      label: "Unit berangkat",
      timestamp: dispatch.enRouteAt,
    },
    {
      label: "Unit tiba di lokasi",
      timestamp: dispatch.arrivedAt,
    },
    {
      label: "Laporan terselesaikan",
      timestamp: dispatch.completedAt,
    },
  ];

  return (
    <ol className="mt-4">
      {steps.map((step, index) => {
        const isComplete = step.timestamp !== null;
        const isLast = index === steps.length - 1;

        return (
          <li className="relative flex gap-3 pb-4" key={step.label}>
            {isLast ? null : (
              <span
                aria-hidden
                className={cn(
                  "absolute top-5 left-[7px] h-[calc(100%-0.25rem)] w-px",
                  isComplete ? "bg-primary-300" : "bg-border"
                )}
              />
            )}
            <span
              aria-hidden
              className={cn(
                "relative z-10 mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border bg-background",
                isComplete
                  ? "border-primary-300 bg-primary-300 text-primary-foreground"
                  : "border-border"
              )}
            >
              {isComplete ? <CheckIcon className="size-2.5" /> : null}
            </span>
            <span>
              <span
                className={cn(
                  "block text-xs",
                  isComplete ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
              {step.timestamp ? (
                <span className="mt-0.5 block text-[9px] text-muted-foreground">
                  {formatStatusTime(step.timestamp)}
                </span>
              ) : null}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function ActiveDispatchTracker({
  dispatch,
  onResolve,
  resolving,
}: {
  dispatch: DispatchTracking;
  onResolve: (dispatchId: string) => void;
  resolving: boolean;
}) {
  const animatedDispatch = useAnimatedDispatchTracking(dispatch) ?? dispatch;
  const statusConfig = DISPATCH_STATUS_CONFIG[animatedDispatch.status];
  const typeConfig = AGENCY_TYPE_CONFIG[animatedDispatch.agency.type];
  const VehicleIcon = typeConfig.vehicleIcon;
  const handleResolve = useCallback(() => {
    onResolve(animatedDispatch.id);
  }, [animatedDispatch.id, onResolve]);

  return (
    <section>
      <span className="flex items-start justify-between gap-3">
        <span className="flex items-center gap-2">
          <span
            className={cn(
              "flex size-9 items-center justify-center rounded-md border",
              typeConfig.markerClassName
            )}
          >
            <VehicleIcon aria-hidden className="size-4" />
          </span>
          <span>
            <span className="block font-semibold text-foreground text-xs">
              {animatedDispatch.unitCode ?? "Unit respons"}
            </span>
            <span className="block text-[10px] text-muted-foreground">
              {animatedDispatch.agency.name}
            </span>
          </span>
        </span>
        <span className="rounded-md bg-primary-10 px-2 py-1 font-semibold text-[9px] text-primary-200">
          Mode demo
        </span>
      </span>

      <span className="mt-4 flex items-center gap-2">
        <RadioTowerIcon aria-hidden className="size-4 text-primary-200" />
        <span>
          <span className="block font-semibold text-foreground text-xs">
            {statusConfig.label}
          </span>
          <span className="block text-[10px] text-muted-foreground">
            {statusConfig.progressLabel}
          </span>
        </span>
      </span>

      <progress
        aria-label="Progress perjalanan unit"
        className="mt-3 h-2 w-full overflow-hidden rounded-full accent-primary-300"
        max={100}
        value={animatedDispatch.progressPercent}
      />
      <span className="mt-1 flex items-center justify-between text-[9px] text-muted-foreground">
        <span>{animatedDispatch.progressPercent}% perjalanan</span>
        <span>
          ETA{" "}
          {animatedDispatch.estimatedArrivalAt
            ? formatStatusTime(animatedDispatch.estimatedArrivalAt)
            : "diproses"}
        </span>
      </span>

      <DispatchTimeline dispatch={animatedDispatch} />

      {animatedDispatch.canResolve ? (
        <Button
          className="mt-1 w-full"
          disabled={resolving}
          onClick={handleResolve}
          size="sm"
          type="button"
        >
          {resolving ? (
            <LoaderCircleIcon
              className="animate-spin"
              data-icon="inline-start"
            />
          ) : (
            <CheckIcon data-icon="inline-start" />
          )}
          Tandai Terselesaikan
        </Button>
      ) : null}
    </section>
  );
}

export function ReportDispatchSection({
  onSelectAgency,
  reportId,
  selectedAgencyId,
}: ReportDispatchSectionProps) {
  const overviewQuery = useReportDispatchQuery(reportId);
  const createMutation = useCreateDispatchMutation();
  const resolveMutation = useResolveDispatchMutation();
  const selectedAgency = useMemo(
    () =>
      overviewQuery.data?.recommendations.find(
        (agency) => agency.id === selectedAgencyId
      ) ?? null,
    [overviewQuery.data?.recommendations, selectedAgencyId]
  );

  useEffect(() => {
    if (
      overviewQuery.data?.activeDispatch ||
      selectedAgencyId ||
      !overviewQuery.data
    ) {
      return;
    }

    const firstAvailableAgency = overviewQuery.data.recommendations.find(
      (agency) => agency.availability === "AVAILABLE"
    );
    if (firstAvailableAgency) {
      onSelectAgency(firstAvailableAgency.id);
    }
  }, [onSelectAgency, overviewQuery.data, selectedAgencyId]);

  const handleCreate = useCallback(() => {
    if (!selectedAgency) {
      return;
    }

    createMutation.mutate(
      {
        agencyId: selectedAgency.id,
        reportId,
      },
      {
        onError: (error) => {
          toast.error(error.message);
        },
        onSuccess: () => {
          toast.success("Permintaan dispatch dikirim");
        },
      }
    );
  }, [createMutation, reportId, selectedAgency]);

  const handleResolve = useCallback(
    (dispatchId: string) => {
      resolveMutation.mutate(
        { dispatchId },
        {
          onError: (error) => {
            toast.error(error.message);
          },
          onSuccess: () => {
            toast.success("Laporan ditandai terselesaikan");
          },
        }
      );
    },
    [resolveMutation]
  );

  if (overviewQuery.isPending) {
    return (
      <section>
        <Skeleton className="h-5 w-36 rounded-md" />
        <Skeleton className="mt-3 h-24 w-full rounded-md" />
      </section>
    );
  }

  if (overviewQuery.error || !overviewQuery.data) {
    return (
      <section>
        <h2 className="font-semibold text-foreground text-sm">
          Dispatch respons
        </h2>
        <p className="mt-2 text-muted-foreground text-xs">
          {overviewQuery.error?.message ??
            "Rekomendasi dispatch tidak tersedia."}
        </p>
      </section>
    );
  }

  if (overviewQuery.data.activeDispatch) {
    return (
      <ActiveDispatchTracker
        dispatch={overviewQuery.data.activeDispatch}
        onResolve={handleResolve}
        resolving={resolveMutation.isPending}
      />
    );
  }

  return (
    <section>
      <h2 className="flex items-center gap-2 font-semibold text-foreground text-sm">
        <NavigationIcon aria-hidden className="size-4" />
        Rekomendasi dispatch
      </h2>
      <p className="mt-1 text-[10px] text-muted-foreground">
        Diurutkan berdasarkan kecocokan, availability, dan jarak.
      </p>

      {overviewQuery.data.recommendations.length > 0 ? (
        <div className="mt-3 flex flex-col gap-2">
          {overviewQuery.data.recommendations.map((agency) => (
            <RecommendationOption
              agency={agency}
              isSelected={agency.id === selectedAgencyId}
              key={agency.id}
              onSelect={onSelectAgency}
            />
          ))}
        </div>
      ) : (
        <p className="mt-3 rounded-md bg-muted p-3 text-muted-foreground text-xs">
          Lokasi laporan belum tersedia untuk mencari unit terdekat.
        </p>
      )}

      <Button
        className="mt-3 w-full"
        disabled={!selectedAgency || createMutation.isPending}
        onClick={handleCreate}
        size="sm"
        type="button"
      >
        {createMutation.isPending ? (
          <LoaderCircleIcon className="animate-spin" data-icon="inline-start" />
        ) : (
          <NavigationIcon data-icon="inline-start" />
        )}
        Kirim Unit
      </Button>
    </section>
  );
}
