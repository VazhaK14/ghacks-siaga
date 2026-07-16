import { Badge } from "@siaga-app/ui/components/badge";
import { Button } from "@siaga-app/ui/components/button";
import { Field, FieldLabel } from "@siaga-app/ui/components/field";
import { Input } from "@siaga-app/ui/components/input";
import { ArrowUpIcon, MicIcon, PhoneOffIcon } from "lucide-react";
import type { ChangeEvent, FormEvent } from "react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import { MobilePage } from "@/components/mobile-page";

import {
  useAppendReporterTextMutation,
  useEndReporterSessionMutation,
  useReporterReportQuery,
  useSwitchReporterModeMutation,
} from "../api";
import { useIncident } from "../context";
import { useLiveLocationReporting } from "../use-live-location-reporting";
import { ReportMessages } from "./report-messages";

export const ChatScreen = () => {
  const navigate = useNavigate();
  const { reportId } = useIncident();
  const reportQuery = useReporterReportQuery(reportId);
  const appendText = useAppendReporterTextMutation();
  const endSession = useEndReporterSessionMutation();
  const switchMode = useSwitchReporterModeMutation();
  const [draft, setDraft] = useState("");
  useLiveLocationReporting(reportId);

  const handleSend = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = draft.trim();
    if (!(content && reportId)) {
      return;
    }
    setDraft("");
    try {
      await appendText.mutateAsync({
        content,
        idempotencyKey: `message-${crypto.randomUUID()}`,
        reportId,
      });
    } catch (error) {
      setDraft(content);
      toast.error(
        error instanceof Error ? error.message : "Pesan belum terkirim."
      );
    }
  };

  const handleUseVoice = async () => {
    if (!reportId) {
      return;
    }
    await switchMode.mutateAsync({ interactionMode: "VOICE", reportId });
    navigate("/voice-session", { replace: true });
  };

  const handleEnd = async () => {
    if (reportId) {
      await endSession.mutateAsync({ reportId });
    }
    navigate("/dispatch", { replace: true });
  };
  const handleHome = () => navigate("/", { replace: true });
  const handleDraftChange = (event: ChangeEvent<HTMLInputElement>) => {
    setDraft(event.target.value);
  };

  if (!reportId) {
    return (
      <MobilePage className="items-center justify-center gap-4">
        <p>Laporan aktif tidak ditemukan.</p>
        <Button onClick={handleHome}>Ke beranda</Button>
      </MobilePage>
    );
  }

  return (
    <MobilePage className="gap-4" title="Chat laporan">
      <header className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-h4">SIAGA</h1>
          <p className="text-muted-foreground text-xs">
            {reportQuery.data?.assignedOperator
              ? `Ditangani ${reportQuery.data.assignedOperator.name}`
              : "AI pendamping aktif"}
          </p>
        </div>
        <Badge variant={reportQuery.isError ? "destructive" : "secondary"}>
          {reportQuery.isError ? "Koneksi terganggu" : "Laporan aktif"}
        </Badge>
      </header>

      <ReportMessages messages={reportQuery.data?.messages ?? []} />

      <form className="flex items-end gap-2" onSubmit={handleSend}>
        <Field className="flex-1">
          <FieldLabel className="sr-only" htmlFor="report-message">
            Perubahan situasi
          </FieldLabel>
          <Input
            autoComplete="off"
            id="report-message"
            onChange={handleDraftChange}
            placeholder="Tulis perubahan situasi..."
            value={draft}
          />
        </Field>
        <Button
          aria-label="Kirim pesan"
          disabled={appendText.isPending || !draft.trim()}
          size="icon-lg"
          type="submit"
        >
          <ArrowUpIcon />
        </Button>
      </form>

      <div className="flex gap-2">
        <Button className="flex-1" onClick={handleUseVoice} variant="ghost">
          <MicIcon data-icon="inline-start" />
          Gunakan suara
        </Button>
        <Button
          className="flex-1"
          disabled={endSession.isPending}
          onClick={handleEnd}
          variant="ghost"
        >
          <PhoneOffIcon data-icon="inline-start" />
          Akhiri
        </Button>
      </div>
    </MobilePage>
  );
};
