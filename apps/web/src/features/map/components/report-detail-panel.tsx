import { Button } from "@siaga-app/ui/components/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@siaga-app/ui/components/empty";
import { Separator } from "@siaga-app/ui/components/separator";
import { Skeleton } from "@siaga-app/ui/components/skeleton";
import { cn } from "@siaga-app/ui/lib/utils";
import {
  ExternalLinkIcon,
  MapPinIcon,
  PhoneIcon,
  UserRoundIcon,
  XIcon,
} from "lucide-react";
import type { ReactNode } from "react";

import { ReportDispatchSection } from "@/features/dispatch/components/report-dispatch-section";
import {
  CATEGORY_CONFIG,
  formatCoordinates,
  formatReportDateTime,
  getDetailTitle,
  INCIDENT_TYPE_LABELS,
  REPORT_STATUS_LABELS,
} from "../content";
import type { DisplayError, ReportDetail } from "../types";

interface ReportDetailPanelProps {
  className?: string;
  error: DisplayError | null;
  isPending: boolean;
  onClose?: () => void;
  onSelectAgency: (agencyId: string) => void;
  report: ReportDetail | null;
  selectedAgencyId: string | null;
}

interface DetailRowProps {
  label: string;
  value: ReactNode;
}

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className="grid grid-cols-[7rem_1fr] gap-3 text-xs">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-foreground">{value}</dd>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <Skeleton className="h-6 w-2/3 rounded-md" />
      <Skeleton className="h-20 w-full rounded-md" />
      <Skeleton className="h-36 w-full rounded-md" />
      <Skeleton className="h-28 w-full rounded-md" />
    </div>
  );
}

const getExtractedDataEntries = (
  extractedData: unknown
): [string, string][] => {
  if (
    typeof extractedData !== "object" ||
    extractedData === null ||
    Array.isArray(extractedData)
  ) {
    return [];
  }

  return Object.entries(extractedData).flatMap(([key, value]) => {
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      return [[key, String(value)]];
    }
    return [];
  });
};

function ReporterSection({ report }: { report: ReportDetail }) {
  const emergencyContact = report.reporter.emergencyContactPhone ? (
    <span>
      {report.reporter.emergencyContactName ?? "Kontak"} ·{" "}
      {report.reporter.emergencyContactPhone}
    </span>
  ) : (
    "Tidak tersedia"
  );

  return (
    <section>
      <h2 className="flex items-center gap-2 font-semibold text-foreground text-sm">
        <UserRoundIcon aria-hidden className="size-4" />
        Pelapor
      </h2>
      <dl className="mt-3 flex flex-col gap-2">
        <DetailRow label="Nama" value={report.reporter.name} />
        <DetailRow label="Email" value={report.reporter.email} />
        <DetailRow
          label="Telepon"
          value={report.contactPhone ?? "Tidak tersedia"}
        />
        <DetailRow label="Kontak darurat" value={emergencyContact} />
      </dl>
      {report.contactPhone ? (
        <a
          className="mt-3 inline-flex items-center gap-1 font-semibold text-primary-200 text-xs hover:underline"
          href={`tel:${report.contactPhone}`}
        >
          <PhoneIcon aria-hidden className="size-3.5" />
          Hubungi pelapor
        </a>
      ) : null}
    </section>
  );
}

function LocationSection({ report }: { report: ReportDetail }) {
  const { latitude, longitude } = report;
  const hasLocation = latitude !== null && longitude !== null;
  const mapsUrl = hasLocation
    ? `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
    : undefined;

  return (
    <section>
      <h2 className="flex items-center gap-2 font-semibold text-foreground text-sm">
        <MapPinIcon aria-hidden className="size-4" />
        Lokasi
      </h2>
      <p className="mt-2 text-muted-foreground text-xs">
        {report.address ?? "Lokasi belum tersedia"}
      </p>
      {hasLocation ? (
        <>
          <p className="mt-1 font-mono text-[10px] text-muted-foreground">
            {formatCoordinates(latitude, longitude)}
          </p>
          <a
            className="mt-3 inline-flex items-center gap-1 font-semibold text-primary-200 text-xs hover:underline"
            href={mapsUrl}
            rel="noopener"
            target="_blank"
          >
            <ExternalLinkIcon aria-hidden className="size-3.5" />
            Buka di Google Maps
          </a>
        </>
      ) : null}
    </section>
  );
}

function AnalysisSection({ report }: { report: ReportDetail }) {
  const confidenceScore = report.latestAnalysis?.confidenceScore;
  const confidenceLabel =
    confidenceScore === null || confidenceScore === undefined
      ? "Belum tersedia"
      : `${Math.round(confidenceScore * 100)}%`;

  return (
    <section>
      <h2 className="font-semibold text-foreground text-sm">Analisis AI</h2>
      <p className="mt-2 text-muted-foreground text-xs leading-relaxed">
        {report.latestAnalysis?.summary ??
          report.recommendation ??
          "Analisis belum tersedia."}
      </p>
      <dl className="mt-3 flex flex-col gap-2">
        <DetailRow
          label="Rekomendasi"
          value={
            report.latestAnalysis?.recommendation ??
            report.recommendation ??
            "Belum tersedia"
          }
        />
        <DetailRow label="Confidence" value={confidenceLabel} />
      </dl>
    </section>
  );
}

function AdditionalDataSection({ report }: { report: ReportDetail }) {
  const extractedEntries = getExtractedDataEntries(report.extractedData);
  if (extractedEntries.length === 0) {
    return null;
  }

  return (
    <>
      <Separator className="my-4" />
      <section>
        <h2 className="font-semibold text-foreground text-sm">
          Informasi tambahan
        </h2>
        <dl className="mt-3 flex flex-col gap-2">
          {extractedEntries.map(([key, value]) => (
            <DetailRow key={key} label={key} value={value} />
          ))}
        </dl>
      </section>
    </>
  );
}

function StatusHistorySection({ report }: { report: ReportDetail }) {
  return (
    <section>
      <h2 className="font-semibold text-foreground text-sm">Riwayat status</h2>
      <ol className="mt-3 flex flex-col gap-3">
        {report.statusHistory.map((statusEvent) => (
          <li className="relative pl-4 text-xs" key={statusEvent.id}>
            <span
              aria-hidden
              className="absolute top-1.5 left-0 size-2 rounded-full bg-primary-300"
            />
            <p className="font-medium text-foreground">
              {statusEvent.toStatus.replaceAll("_", " ")}
            </p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              {formatReportDateTime(statusEvent.createdAt)}
              {statusEvent.note ? ` · ${statusEvent.note}` : ""}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function LoadedReportDetail({
  className,
  onClose,
  onSelectAgency,
  report,
  selectedAgencyId,
}: {
  className?: string;
  onClose?: () => void;
  onSelectAgency: (agencyId: string) => void;
  report: ReportDetail;
  selectedAgencyId: string | null;
}) {
  const category = CATEGORY_CONFIG[report.category];
  const CategoryIcon = category.icon;

  return (
    <aside
      aria-label="Detail laporan"
      className={cn(
        "flex min-h-0 flex-col overflow-hidden rounded-lg bg-popover/95 text-popover-foreground shadow-xl ring-1 ring-foreground/10 backdrop-blur-sm",
        className
      )}
    >
      <header className="flex items-start justify-between gap-3 border-b p-4">
        <span className="min-w-0">
          <span className="text-[10px] text-muted-foreground">
            {report.id.slice(-8).toUpperCase()}
          </span>
          <span className="mt-1 block font-bold text-base text-foreground">
            {getDetailTitle(report)}
          </span>
          <span className="mt-2 flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-2 py-1 font-semibold text-[10px]",
                category.badgeClassName
              )}
            >
              <CategoryIcon aria-hidden className="size-3" />
              {category.label}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {REPORT_STATUS_LABELS[report.status]}
            </span>
          </span>
        </span>

        {onClose ? (
          <Button
            aria-label="Tutup detail"
            onClick={onClose}
            size="icon-sm"
            type="button"
            variant="ghost"
          >
            <XIcon />
          </Button>
        ) : null}
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <section>
          <h2 className="font-semibold text-foreground text-sm">
            Ringkasan kejadian
          </h2>
          <p className="mt-2 text-muted-foreground text-xs leading-relaxed">
            {report.summary ?? "Ringkasan belum tersedia."}
          </p>
          <dl className="mt-4 flex flex-col gap-2">
            <DetailRow
              label="Jenis"
              value={
                report.incidentType
                  ? INCIDENT_TYPE_LABELS[report.incidentType]
                  : "Belum diklasifikasi"
              }
            />
            <DetailRow
              label="Dibuat"
              value={formatReportDateTime(report.createdAt)}
            />
            <DetailRow
              label="Kanal"
              value={report.activeChannel ?? "Belum ditentukan"}
            />
            <DetailRow
              label="Penanganan"
              value={report.handlingMode === "AI" ? "AI" : "Operator"}
            />
          </dl>
        </section>

        <Separator className="my-4" />
        <ReportDispatchSection
          onSelectAgency={onSelectAgency}
          reportId={report.id}
          selectedAgencyId={selectedAgencyId}
        />
        <Separator className="my-4" />
        <ReporterSection report={report} />
        <Separator className="my-4" />
        <LocationSection report={report} />
        <Separator className="my-4" />
        <AnalysisSection report={report} />
        <AdditionalDataSection report={report} />
        <Separator className="my-4" />
        <StatusHistorySection report={report} />
      </div>
    </aside>
  );
}

export function ReportDetailPanel({
  className,
  error,
  isPending,
  onSelectAgency,
  onClose,
  report,
  selectedAgencyId,
}: ReportDetailPanelProps) {
  if (isPending) {
    return (
      <aside
        aria-label="Detail laporan"
        className={cn(
          "overflow-hidden rounded-lg bg-popover/95 shadow-xl ring-1 ring-foreground/10 backdrop-blur-sm",
          className
        )}
      >
        <DetailSkeleton />
      </aside>
    );
  }

  if (error || !report) {
    return (
      <aside
        aria-label="Detail laporan"
        className={cn(
          "flex min-h-0 flex-col overflow-hidden rounded-lg bg-popover/95 shadow-xl ring-1 ring-foreground/10 backdrop-blur-sm",
          className
        )}
      >
        <Empty>
          <EmptyHeader>
            <EmptyTitle>
              {error ? "Detail tidak dapat dimuat" : "Pilih laporan"}
            </EmptyTitle>
            <EmptyDescription>
              {error?.message ??
                "Pilih laporan pada daftar atau marker untuk melihat detail."}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </aside>
    );
  }

  return (
    <LoadedReportDetail
      className={className}
      onClose={onClose}
      onSelectAgency={onSelectAgency}
      report={report}
      selectedAgencyId={selectedAgencyId}
    />
  );
}
