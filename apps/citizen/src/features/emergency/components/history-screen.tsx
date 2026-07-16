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
import { Clock3Icon } from "lucide-react";
import { Link } from "react-router";

import { MobilePage } from "@/components/mobile-page";

import { useReporterReportsQuery } from "../api";
import { INCIDENT_TYPE_LABELS, REPORT_STATUS_LABELS } from "../status-content";

const formatReportDate = (value: string): string =>
  new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

export const HistoryScreen = () => {
  const reportsQuery = useReporterReportsQuery();

  return (
    <MobilePage className="gap-5" title="Riwayat laporan">
      <header className="flex flex-col gap-1">
        <h1 className="text-h3">Riwayat laporan</h1>
        <p className="text-muted-foreground text-sm">
          Semua laporan tersimpan aman di akun kamu.
        </p>
      </header>

      {reportsQuery.isPending ? (
        <p className="text-muted-foreground text-sm">Memuat riwayat...</p>
      ) : null}
      {reportsQuery.isError ? (
        <p className="text-destructive text-sm">
          Riwayat belum dapat dimuat. Periksa koneksi lalu coba lagi.
        </p>
      ) : null}
      {reportsQuery.data?.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Clock3Icon aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>Belum ada laporan</EmptyTitle>
            <EmptyDescription>
              Laporan yang pernah dibuat akan tampil di sini.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : null}
      <section aria-label="Daftar laporan" className="flex flex-col gap-4">
        {reportsQuery.data?.map((report) => (
          <Card key={report.id}>
            <CardHeader>
              <CardTitle>
                {report.title ??
                  `Laporan ${report.id.slice(0, 8).toUpperCase()}`}
              </CardTitle>
              <CardDescription>
                {report.incidentType
                  ? INCIDENT_TYPE_LABELS[report.incidentType]
                  : "Belum diklasifikasi"}
                {` · ${formatReportDate(report.createdAt)}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Badge variant="secondary">
                {REPORT_STATUS_LABELS[report.status]}
              </Badge>
              <p className="text-muted-foreground text-sm">
                {report.summary ??
                  "Laporan sudah diterima dan menunggu pembaruan penanganan."}
              </p>
            </CardContent>
            <CardFooter>
              <Button
                render={
                  <Link
                    to={`/status?reportId=${encodeURIComponent(report.id)}`}
                  />
                }
                variant="ghost"
              >
                Lihat status
              </Button>
            </CardFooter>
          </Card>
        ))}
      </section>
    </MobilePage>
  );
};
