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
import { MessageCircleIcon, ShieldCheckIcon } from "lucide-react";
import { useEffect } from "react";
import { useNavigate } from "react-router";

import { MobilePage } from "@/components/mobile-page";

import { useAcknowledgeReportMutation } from "../api";
import { useIncident } from "../context";
import { useReportPhaseNavigation } from "../use-report-phase-navigation";
import { DispatchTimeline } from "./dispatch-timeline";

export const ArrivalScreen = () => {
  const navigate = useNavigate();
  const { reportId } = useIncident();
  const { phase, reportQuery } = useReportPhaseNavigation(reportId);
  const acknowledgement = useAcknowledgeReportMutation();
  const report = reportQuery.data;
  const dispatch = report?.latestDispatch;
  const agencyName = dispatch?.agencyName ?? "Tim bantuan";
  const unitCode = dispatch?.unitCode ?? "unit lapangan";
  const isWithResponder = report?.acknowledgements.includes("WITH_RESPONDER");

  useEffect(() => {
    if (phase === "completed") {
      navigate("/complete", { replace: true });
    }
  }, [navigate, phase]);

  const handleComplete = async () => {
    if (!reportId) {
      return;
    }
    await acknowledgement.mutateAsync({
      reportId,
      type: "WITH_RESPONDER",
    });
  };
  const handleHome = () => navigate("/", { replace: true });
  const handleOpenChat = () => navigate("/chat");

  if (!reportId) {
    return (
      <MobilePage className="items-center justify-center gap-4">
        <p>Laporan aktif tidak ditemukan.</p>
        <Button onClick={handleHome}>Ke beranda</Button>
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

      <div className="flex gap-2">
        <Button className="flex-1" onClick={handleOpenChat} variant="ghost">
          <MessageCircleIcon data-icon="inline-start" />
          Chat
        </Button>
        <Button
          className="flex-1"
          disabled={acknowledgement.isPending || isWithResponder}
          onClick={handleComplete}
        >
          <ShieldCheckIcon data-icon="inline-start" />
          {isWithResponder ? "Sudah dikirim" : "Bersama petugas"}
        </Button>
      </div>
    </MobilePage>
  );
};
