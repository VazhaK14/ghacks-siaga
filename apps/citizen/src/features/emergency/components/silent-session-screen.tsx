import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@siaga-app/ui/components/alert";
import { Button } from "@siaga-app/ui/components/button";
import { Field, FieldLabel } from "@siaga-app/ui/components/field";
import { Input } from "@siaga-app/ui/components/input";
import {
  ArrowUpIcon,
  MessageCircleIcon,
  PhoneOffIcon,
  VolumeXIcon,
} from "lucide-react";
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

export const SilentSessionScreen = () => {
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
        idempotencyKey: `silent-${crypto.randomUUID()}`,
        reportId,
      });
    } catch (error) {
      setDraft(content);
      toast.error(
        error instanceof Error ? error.message : "Pesan belum terkirim."
      );
    }
  };

  const handleUseText = async () => {
    if (!reportId) {
      return;
    }
    await switchMode.mutateAsync({ interactionMode: "TEXT", reportId });
    navigate("/chat", { replace: true });
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
    <MobilePage className="gap-4" title="Mode senyap">
      <Alert>
        <VolumeXIcon aria-hidden="true" />
        <AlertTitle>Mode senyap aktif</AlertTitle>
        <AlertDescription>
          SIAGA tidak akan memutar suara. Ketik hanya saat situasi aman.
        </AlertDescription>
      </Alert>

      <ReportMessages messages={reportQuery.data?.messages ?? []} />

      <form className="flex items-end gap-2" onSubmit={handleSend}>
        <Field className="flex-1">
          <FieldLabel className="sr-only" htmlFor="silent-message">
            Pesan aman untuk SIAGA
          </FieldLabel>
          <Input
            id="silent-message"
            onChange={handleDraftChange}
            placeholder="Ketik bila aman..."
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

      <Button onClick={handleUseText} variant="ghost">
        <MessageCircleIcon data-icon="inline-start" />
        Pindah ke chat
      </Button>
      <Button disabled={endSession.isPending} onClick={handleEnd}>
        <PhoneOffIcon data-icon="inline-start" />
        Akhiri komunikasi
      </Button>
    </MobilePage>
  );
};
