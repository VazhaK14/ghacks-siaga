import { Badge } from "@siaga-app/ui/components/badge";
import { Button } from "@siaga-app/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@siaga-app/ui/components/card";
import { MessageCircleIcon, ShieldCheckIcon } from "lucide-react";
import { useEffect } from "react";
import { useNavigate } from "react-router";

import { MobilePage } from "@/components/mobile-page";

import { useAcknowledgeReportMutation } from "../api";
import { SAFETY_INSTRUCTIONS } from "../content";
import { useIncident } from "../context";
import { REPORT_STATUS_LABELS } from "../status-content";
import { useReportPhaseNavigation } from "../use-report-phase-navigation";
import { DispatchTimeline } from "./dispatch-timeline";

export const DispatchScreen = () => {
  const navigate = useNavigate();
  const { reportId } = useIncident();
  const { phase, reportQuery } = useReportPhaseNavigation(reportId);
  const acknowledgement = useAcknowledgeReportMutation();
  const report = reportQuery.data;
  const dispatch = report?.latestDispatch;
  const isHelpVisible = report?.acknowledgements.includes("HELP_VISIBLE");

  useEffect(() => {
    if (phase === "arrived") {
      navigate("/arrival", { replace: true });
      return;
    }
    if (phase === "completed") {
      navigate("/complete", { replace: true });
    }
  }, [navigate, phase]);

  const handleArrival = async () => {
    if (!reportId) {
      return;
    }
    await acknowledgement.mutateAsync({
      reportId,
      type: "HELP_VISIBLE",
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
    <MobilePage className="gap-5" title="Status bantuan">
      <header className="flex flex-col gap-1">
        <h1 className="text-h3">Bantuan sedang diproses</h1>
        <p className="text-muted-foreground text-sm">
          {dispatch
            ? `${dispatch.agencyName ?? "Tim bantuan"} · unit ${
                dispatch.unitCode ?? "belum ditetapkan"
              }`
            : "Operator sedang meninjau laporan dan menyiapkan unit bantuan."}
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>
            {report ? REPORT_STATUS_LABELS[report.status] : "Memuat status"}
          </CardTitle>
          <CardDescription>
            Pembaruan otomatis setiap dua detik.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm">
            {report?.recommendation ??
              "Tetap berada di tempat aman dan kirim perubahan situasi melalui chat."}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Perjalanan bantuan</CardTitle>
          <CardDescription>Status unit respons terpilih.</CardDescription>
        </CardHeader>
        <CardContent>
          <DispatchTimeline status={dispatch?.status} />
        </CardContent>
      </Card>

      <section aria-labelledby="safety-title" className="flex flex-col gap-3">
        <h2 className="text-h5" id="safety-title">
          Tetap aman
        </h2>
        {SAFETY_INSTRUCTIONS.map((instruction, index) => (
          <div
            className="citizen-glass-surface flex items-center gap-3 p-4"
            key={instruction.id}
          >
            <Badge>{index + 1}</Badge>
            <p className="text-sm">{instruction.text}</p>
          </div>
        ))}
      </section>

      <div className="flex gap-2">
        <Button className="flex-1" onClick={handleOpenChat} variant="ghost">
          <MessageCircleIcon data-icon="inline-start" />
          Chat
        </Button>
        <Button
          className="flex-1"
          disabled={acknowledgement.isPending || isHelpVisible}
          onClick={handleArrival}
        >
          <ShieldCheckIcon data-icon="inline-start" />
          {isHelpVisible ? "Sudah dikirim" : "Bantuan terlihat"}
        </Button>
      </div>
    </MobilePage>
  );
};
