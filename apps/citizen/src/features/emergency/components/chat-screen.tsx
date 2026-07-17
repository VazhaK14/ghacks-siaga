import { Badge } from "@siaga-app/ui/components/badge";
import { Button } from "@siaga-app/ui/components/button";
import { Field, FieldLabel } from "@siaga-app/ui/components/field";
import { Input } from "@siaga-app/ui/components/input";
import {
  ArrowUpIcon,
  BotIcon,
  CircleCheckIcon,
  Clock3Icon,
  SendIcon,
  SparklesIcon,
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
} from "../api";
import { useIncident } from "../context";
import { useLiveLocationReporting } from "../use-live-location-reporting";
import { ReportImageAttachments } from "./report-image-attachments";
import { ReportMessages } from "./report-messages";

const getAssistantPresenceLabel = (
  isAssistantTyping: boolean,
  isSupportChat: boolean
): string => {
  if (isAssistantTyping) {
    return "Sedang menyiapkan respons...";
  }
  if (isSupportChat) {
    return "Aktif mendampingi selama proses operator";
  }
  return "Online · Siap membantu laporanmu";
};

export const ChatScreen = () => {
  const navigate = useNavigate();
  const { reportId } = useIncident();
  const reportQuery = useReporterReportQuery(reportId);
  const appendText = useAppendReporterTextMutation();
  const endSession = useEndReporterSessionMutation();
  const [draft, setDraft] = useState("");
  const isSupportChat = reportQuery.data?.intakeStatus === "FINALIZED";
  const isAssistantTyping = appendText.isPending;
  const pendingMessage = appendText.isPending
    ? {
        content: appendText.variables.content,
        createdAt: new Date(appendText.submittedAt).toISOString(),
      }
    : null;
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
        source: isSupportChat ? "SUPPORT_CHAT" : "CHAT",
      });
    } catch (error) {
      setDraft(content);
      toast.error(
        error instanceof Error ? error.message : "Pesan belum terkirim."
      );
    }
  };

  const handleFinalize = async (): Promise<void> => {
    if (!reportId) {
      return;
    }
    try {
      await endSession.mutateAsync({ reportId });
      toast.success("Laporan diteruskan ke operator.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Laporan belum dapat dikirim."
      );
    }
  };
  const handleHistory = () => navigate("/history", { replace: true });
  const handleDispatch = () => navigate("/dispatch", { replace: true });
  const handleDraftChange = (event: ChangeEvent<HTMLInputElement>) => {
    setDraft(event.target.value);
  };

  if (!reportId) {
    return (
      <MobilePage className="items-center justify-center gap-4">
        <p>Laporan aktif tidak ditemukan.</p>
        <Button onClick={handleHistory}>Ke riwayat</Button>
      </MobilePage>
    );
  }

  return (
    <MobilePage
      className="gap-4"
      title={isSupportChat ? "AI pendamping" : "Chat laporan"}
    >
      <header className="citizen-glass-surface flex items-center gap-3 p-3.5">
        <div className="relative flex size-11 shrink-0 items-center justify-center rounded-2xl border border-primary/30 bg-primary/15 text-primary shadow-inner">
          <BotIcon aria-hidden="true" className="size-5" />
          <span className="absolute -right-0.5 -bottom-0.5 size-3 rounded-full border-2 border-card bg-emerald-400" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="truncate font-semibold text-sm">
              {isSupportChat ? "AI Pendamping SIAGA" : "SIAGA AI"}
            </h1>
            <SparklesIcon
              aria-hidden="true"
              className="size-3.5 text-primary"
            />
          </div>
          <p className="mt-0.5 truncate text-muted-foreground text-xs">
            {getAssistantPresenceLabel(isAssistantTyping, isSupportChat)}
          </p>
        </div>
        <Badge
          className="shrink-0 rounded-full px-2.5"
          variant={isSupportChat ? "default" : "secondary"}
        >
          {isSupportChat ? "Terkirim" : "Intake aktif"}
        </Badge>
      </header>

      {isSupportChat ? (
        <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/10 p-4 text-sm">
          <CircleCheckIcon
            aria-hidden="true"
            className="mt-0.5 size-5 shrink-0 text-primary"
          />
          <p>
            Operator sedang memproses laporan. AI tetap aktif untuk membantu
            Anda tetap tenang dan mencatat perubahan situasi.
          </p>
        </div>
      ) : null}

      {isSupportChat && reportQuery.data ? (
        <ReportImageAttachments
          attachments={reportQuery.data.imageAttachments}
          reportId={reportId}
        />
      ) : null}

      <ReportMessages
        isAssistantTyping={isAssistantTyping}
        messages={reportQuery.data?.messages ?? []}
        pendingMessage={pendingMessage}
      />

      <form
        className="citizen-glass-surface flex items-center gap-2 p-2"
        onSubmit={handleSend}
      >
        <Field className="flex-1">
          <FieldLabel className="sr-only" htmlFor="report-message">
            {isSupportChat ? "Perubahan situasi" : "Jawaban untuk SIAGA"}
          </FieldLabel>
          <Input
            autoComplete="off"
            className="h-11 rounded-xl border-transparent bg-transparent shadow-none focus-visible:border-primary/30 focus-visible:ring-0"
            disabled={appendText.isPending}
            id="report-message"
            onChange={handleDraftChange}
            placeholder={
              isSupportChat
                ? "Tulis perubahan situasi..."
                : "Ketik jawabanmu..."
            }
            value={draft}
          />
        </Field>
        <Button
          aria-label="Kirim pesan"
          className="size-11 shrink-0 rounded-xl shadow-lg shadow-primary/20"
          disabled={appendText.isPending || !draft.trim()}
          size="icon"
          type="submit"
        >
          <ArrowUpIcon />
        </Button>
      </form>

      {isSupportChat ? (
        <Button onClick={handleDispatch} variant="stroke">
          <Clock3Icon data-icon="inline-start" />
          Lihat progres operator
        </Button>
      ) : (
        <Button
          disabled={endSession.isPending}
          onClick={handleFinalize}
          variant="secondary"
        >
          <SendIcon data-icon="inline-start" />
          Kirim laporan sekarang
        </Button>
      )}
    </MobilePage>
  );
};
