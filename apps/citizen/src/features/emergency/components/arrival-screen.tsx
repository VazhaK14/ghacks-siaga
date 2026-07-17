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
import { MessageCircleIcon } from "lucide-react";
import { useEffect } from "react";
import { useNavigate } from "react-router";

import { MobilePage } from "@/components/mobile-page";

import { useIncident } from "../context";
import { useReportPhaseNavigation } from "../use-report-phase-navigation";
import { DispatchTimeline } from "./dispatch-timeline";

export const ArrivalScreen = () => {
  const navigate = useNavigate();
  const { reportId } = useIncident();
  const { phase, reportQuery } = useReportPhaseNavigation(reportId);
  const report = reportQuery.data;
  const dispatch = report?.latestDispatch;
  const agencyName = dispatch?.agencyName ?? "Tim bantuan";
  const unitCode = dispatch?.unitCode ?? "unit lapangan";

  useEffect(() => {
    if (phase === "completed") {
      navigate("/complete", { replace: true });
    }
  }, [navigate, phase]);

  const handleHistory = () => navigate("/history", { replace: true });
  const handleOpenChat = () => navigate("/chat");

  if (!reportId) {
    return (
      <MobilePage className="items-center justify-center gap-4">
        <p>Laporan aktif tidak ditemukan.</p>
        <Button onClick={handleHistory}>Ke riwayat</Button>
      </MobilePage>
    );
  }

  return (
    <MobilePage className="gap-5" title="Bantuan tiba">
      <header className="flex flex-col gap-2">
        <Badge>Bantuan tiba</Badge>
        <h1 className="text-h3">Petugas sudah di lokasi</h1>
        <p className="text-muted-foreground text-sm">
          Pastikan identitas petugas sebelum membuka pintu atau mendekat.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>{agencyName}</CardTitle>
          <CardDescription>Kode unit: {unitCode}</CardDescription>
        </CardHeader>
        <CardContent>
          <DispatchTimeline status={dispatch?.status ?? "ARRIVED"} />
        </CardContent>
        <CardFooter>
          <p className="text-muted-foreground text-xs">
            Jangan membagikan informasi pribadi selain kepada petugas
            terverifikasi.
          </p>
        </CardFooter>
      </Card>

      <div>
        <Button className="w-full" onClick={handleOpenChat} variant="ghost">
          <MessageCircleIcon data-icon="inline-start" />
          Chat
        </Button>
      </div>
    </MobilePage>
  );
};
