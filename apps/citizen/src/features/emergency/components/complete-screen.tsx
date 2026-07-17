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
import { CircleCheckBigIcon, Clock3Icon } from "lucide-react";
import { useNavigate } from "react-router";

import { MobilePage } from "@/components/mobile-page";

import { useReporterReportQuery } from "../api";
import { useIncident } from "../context";
import { INCIDENT_TYPE_LABELS, REPORT_STATUS_LABELS } from "../status-content";

export const CompleteScreen = () => {
  const navigate = useNavigate();
  const { cancelIncident, reportId } = useIncident();
  const reportQuery = useReporterReportQuery(reportId);
  const report = reportQuery.data;

  const leave = (destination: string) => {
    cancelIncident();
    navigate(destination, { replace: true });
  };
  const handleHistory = () => leave("/history");

  return (
    <MobilePage
      className="items-center gap-6 text-center"
      title="Laporan selesai"
    >
      <div className="flex size-32 items-center justify-center rounded-full bg-success/15 text-success">
        <CircleCheckBigIcon aria-hidden="true" className="size-16" />
      </div>
      <div className="flex flex-col gap-2">
        <h1 className="text-h3">Kamu sudah aman</h1>
        <p className="text-muted-foreground text-sm">
          Laporan {report?.id.slice(0, 8).toUpperCase() ?? "darurat"} sudah
          disimpan.
        </p>
      </div>

      <Card className="w-full text-left">
        <CardHeader>
          <CardTitle>Ringkasan laporan</CardTitle>
          <CardDescription>Informasi akhir dari pusat SIAGA.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Jenis</span>
            <span className="font-semibold">
              {report?.incidentType
                ? INCIDENT_TYPE_LABELS[report.incidentType]
                : "Belum diklasifikasi"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Bantuan</span>
            <span className="font-semibold">
              {report?.latestDispatch?.agencyName ?? "Belum ditetapkan"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Status</span>
            <Badge>
              {report ? REPORT_STATUS_LABELS[report.status] : "Memuat"}
            </Badge>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleHistory}>
            <Clock3Icon data-icon="inline-start" />
            Kembali ke riwayat
          </Button>
        </CardFooter>
      </Card>
    </MobilePage>
  );
};
