import { Badge } from "@siaga-app/ui/components/badge";
import { Button } from "@siaga-app/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@siaga-app/ui/components/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@siaga-app/ui/components/empty";
import { Skeleton } from "@siaga-app/ui/components/skeleton";
import { ActivityIcon, MessageCircleIcon } from "lucide-react";
import { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router";

import { MobilePage } from "@/components/mobile-page";

import { useReporterReportQuery, useReporterReportsQuery } from "../api";
import { useIncident } from "../context";
import { ACTIVE_SESSION_STATUSES } from "../derive-phase";
import { getReportMode, getResumeRoute } from "../resume-active-report";
import { INCIDENT_TYPE_LABELS, REPORT_STATUS_LABELS } from "../status-content";
import { DispatchTimeline } from "./dispatch-timeline";

const formatReportDate = (value: string): string =>
  new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

export const StatusScreen = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedReportId = searchParams.get("reportId");
  const reportsQuery = useReporterReportsQuery();
  const incident = useIncident();
  const selectedReport = useMemo(() => {
    const reports = reportsQuery.data ?? [];
    return requestedReportId
      ? (reports.find(
          (reportListItem) => reportListItem.id === requestedReportId
        ) ?? null)
      : null;
  }, [reportsQuery.data, requestedReportId]);
  const reportQuery = useReporterReportQuery(selectedReport?.id ?? null);
  const reportDetail = reportQuery.data;
  const isSessionActive = Boolean(
    reportDetail && ACTIVE_SESSION_STATUSES.has(reportDetail.status)
  );

  const handleContinueSession = () => {
    if (!selectedReport) {
      return;
    }
    incident.setReportId(selectedReport.id);
    const mode = getReportMode(selectedReport);
    if (mode) {
      incident.setMode(mode);
    }
    navigate(getResumeRoute(selectedReport));
  };

  if (reportsQuery.isPending) {
    return (
      <MobilePage
        className="items-center justify-center gap-3"
        title="Status laporan"
      >
        <Skeleton className="size-12 rounded-full" />
        <p className="text-muted-foreground text-sm">
          Memuat status laporan...
        </p>
      </MobilePage>
    );
  }

  if (reportsQuery.isError) {
    return (
      <MobilePage
        className="items-center justify-center gap-3 text-center"
        title="Status laporan"
      >
        <h1 className="text-h4">Status belum dapat dimuat</h1>
        <p className="text-muted-foreground text-sm">
          Periksa koneksi lalu buka halaman ini kembali.
        </p>
      </MobilePage>
    );
  }

  if (!selectedReport) {
    return (
      <MobilePage
        className="items-center justify-center"
        title="Status laporan"
      >
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ActivityIcon aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>Laporan tidak ditemukan</EmptyTitle>
            <EmptyDescription>
              Kembali ke Riwayat dan pilih laporan yang ingin dilihat.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </MobilePage>
    );
  }

  return (
    <MobilePage className="gap-5" title="Status laporan">
      <header className="flex flex-col gap-1">
        <p className="text-muted-foreground text-sm">Pembaruan otomatis</p>
        <h1 className="text-h3">Status laporan</h1>
      </header>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <CardTitle>
                {selectedReport.title ??
                  `Laporan ${selectedReport.id.slice(0, 8).toUpperCase()}`}
              </CardTitle>
              <CardDescription>
                {selectedReport.incidentType
                  ? INCIDENT_TYPE_LABELS[selectedReport.incidentType]
                  : "Belum diklasifikasi"}
                {` · ${formatReportDate(selectedReport.createdAt)}`}
              </CardDescription>
            </div>
            <Badge>{REPORT_STATUS_LABELS[selectedReport.status]}</Badge>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm">
            {reportDetail?.recommendation ??
              selectedReport.summary ??
              "Laporan sudah diterima dan sedang diproses oleh SIAGA."}
          </p>
          {reportQuery.isError ? (
            <p className="text-destructive text-xs">
              Detail terbaru belum dapat dimuat. Status ringkas tetap tersedia.
            </p>
          ) : null}
        </CardContent>
        {isSessionActive ? (
          <CardFooter>
            <Button onClick={handleContinueSession} variant="secondary">
              <MessageCircleIcon data-icon="inline-start" />
              Lanjutkan komunikasi
            </Button>
          </CardFooter>
        ) : null}
      </Card>

      {reportDetail?.latestDispatch ? (
        <Card>
          <CardHeader>
            <CardTitle>Perjalanan bantuan</CardTitle>
            <CardDescription>
              {reportDetail.latestDispatch.agencyName ?? "Tim bantuan"}
              {reportDetail.latestDispatch.unitCode
                ? ` · ${reportDetail.latestDispatch.unitCode}`
                : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DispatchTimeline status={reportDetail.latestDispatch.status} />
          </CardContent>
        </Card>
      ) : null}
    </MobilePage>
  );
};
