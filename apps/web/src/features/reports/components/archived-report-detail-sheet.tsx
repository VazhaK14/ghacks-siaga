import { Badge } from "@siaga-app/ui/components/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@siaga-app/ui/components/sheet";
import { Skeleton } from "@siaga-app/ui/components/skeleton";
import { cn } from "@siaga-app/ui/lib/utils";
import { Building2Icon, Clock3Icon, RadioTowerIcon } from "lucide-react";

import { CATEGORY_CONFIG, INCIDENT_TYPE_LABELS } from "@/features/map/content";

import { useArchivedReportDetailQuery } from "../api";
import {
  ARCHIVED_STATUS_LABELS,
  ARCHIVED_STATUS_VARIANTS,
  formatArchivedDateTime,
} from "../content";

interface ArchivedReportDetailSheetProps {
  onOpenChange: (open: boolean) => void;
  reportId: string | null;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[7rem_1fr] gap-3 text-xs">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-foreground">{value}</dd>
    </div>
  );
}

export function ArchivedReportDetailSheet({
  onOpenChange,
  reportId,
}: ArchivedReportDetailSheetProps) {
  const detailQuery = useArchivedReportDetailQuery(reportId);
  const report = detailQuery.data;
  const category = report ? CATEGORY_CONFIG[report.category] : null;

  return (
    <Sheet onOpenChange={onOpenChange} open={reportId !== null}>
      <SheetContent className="w-full sm:max-w-xl" side="right">
        <SheetHeader className="border-b pr-12">
          <SheetTitle>{report?.title ?? "Detail laporan terminal"}</SheetTitle>
          <SheetDescription>
            Audit trail laporan dan unit respons yang menangani.
          </SheetDescription>
        </SheetHeader>

        {detailQuery.isPending ? (
          <div className="flex flex-col gap-3 p-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : null}

        {detailQuery.error ? (
          <p className="p-4 text-destructive text-sm">
            {detailQuery.error.message}
          </p>
        ) : null}

        {report && category ? (
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <section className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={category.badgeClassName} variant="outline">
                  {category.label}
                </Badge>
                <Badge variant={ARCHIVED_STATUS_VARIANTS[report.status]}>
                  {ARCHIVED_STATUS_LABELS[report.status]}
                </Badge>
              </div>

              <dl className="flex flex-col gap-2 rounded-md bg-muted/50 p-3">
                <DetailRow
                  label="Jenis"
                  value={
                    report.incidentType
                      ? INCIDENT_TYPE_LABELS[report.incidentType]
                      : "Belum diklasifikasi"
                  }
                />
                <DetailRow label="Pelapor" value={report.reporter.name} />
                <DetailRow label="Email" value={report.reporter.email} />
                <DetailRow
                  label="Telepon"
                  value={report.reporter.phoneNumber ?? "Tidak tersedia"}
                />
                <DetailRow
                  label="Operator"
                  value={report.assignedOperator?.name ?? "Tidak ditugaskan"}
                />
                <DetailRow
                  label="Waktu akhir"
                  value={formatArchivedDateTime(report.terminalAt)}
                />
              </dl>

              <div>
                <h3 className="font-semibold text-foreground text-sm">
                  Ringkasan
                </h3>
                <p className="mt-2 text-muted-foreground text-xs leading-relaxed">
                  {report.summary ?? "Ringkasan tidak tersedia."}
                </p>
                <p className="mt-2 text-muted-foreground text-xs">
                  {report.address ?? "Alamat tidak tersedia."}
                </p>
              </div>

              <div>
                <h3 className="flex items-center gap-2 font-semibold text-foreground text-sm">
                  <RadioTowerIcon aria-hidden />
                  Riwayat dispatch
                </h3>
                {report.dispatches.length > 0 ? (
                  <div className="mt-3 flex flex-col gap-2">
                    {report.dispatches.map((dispatch) => (
                      <div
                        className="rounded-md border bg-background p-3"
                        key={dispatch.id}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <span className="flex items-center gap-2">
                            <Building2Icon aria-hidden />
                            <span>
                              <span className="block font-semibold text-xs">
                                {dispatch.unitCode ?? "Unit respons"}
                              </span>
                              <span className="block text-[10px] text-muted-foreground">
                                {dispatch.agency?.name ??
                                  "Instansi tidak tersedia"}
                              </span>
                            </span>
                          </span>
                          <Badge variant="outline">{dispatch.status}</Badge>
                        </div>
                        <p className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Clock3Icon aria-hidden />
                          Dikirim {formatArchivedDateTime(dispatch.requestedAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-muted-foreground text-xs">
                    Tidak ada dispatch tercatat.
                  </p>
                )}
              </div>

              <div>
                <h3 className="font-semibold text-foreground text-sm">
                  Riwayat status
                </h3>
                <ol className="mt-3 flex flex-col gap-3">
                  {report.statusHistory.map((event) => (
                    <li className="relative pl-4 text-xs" key={event.id}>
                      <span
                        aria-hidden
                        className={cn(
                          "absolute top-1.5 left-0 size-2 rounded-full",
                          event.toStatus === report.status
                            ? "bg-primary"
                            : "bg-muted-foreground"
                        )}
                      />
                      <p className="font-medium text-foreground">
                        {event.toStatus.replaceAll("_", " ")}
                      </p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        {formatArchivedDateTime(event.createdAt)}
                        {event.note ? ` · ${event.note}` : ""}
                      </p>
                    </li>
                  ))}
                </ol>
              </div>
            </section>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
