import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { speak } from "expo-speech";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

import { SiagaButton } from "@/components/siaga-button";
import { SiagaScreen } from "@/components/siaga-screen";
import {
  useAcknowledgeReportMutation,
  useAppendReporterTextMutation,
  useCreateReporterReportMutation,
  useEndReporterSessionMutation,
  useReporterReportQuery,
  useRequestCancellationMutation,
  useSwitchReporterModeMutation,
} from "@/features/emergency/api";
import { DispatchTimeline } from "@/features/emergency/components/dispatch-timeline";
import { LiveAudioRoom } from "@/features/emergency/components/live-audio-room";
import { SAFETY_INSTRUCTIONS } from "@/features/emergency/content";
import { useIncident } from "@/features/emergency/context";
import {
  INCIDENT_TYPE_LABELS,
  REPORT_STATUS_LABELS,
} from "@/features/emergency/status-content";
import type { EmergencyCategory } from "@/features/emergency/types";
import { useLiveLocationReporting } from "@/features/emergency/use-live-location-reporting";
import { useReportPhaseNavigation } from "@/features/emergency/use-report-phase-navigation";
import { useVoiceTranscription } from "@/features/emergency/use-voice-transcription";
import { useSiagaColor } from "@/lib/use-siaga-color";

const INCIDENT_TYPE_BY_CATEGORY: Record<
  EmergencyCategory,
  "CRIME" | "FIRE" | "MEDICAL" | "TRAFFIC_ACCIDENT" | "NATURAL_DISASTER"
> = {
  Bencana: "NATURAL_DISASTER",
  Kebakaran: "FIRE",
  Kecelakaan: "TRAFFIC_ACCIDENT",
  Kriminal: "CRIME",
  Medis: "MEDICAL",
};

const INTERACTION_MODE_BY_REPORT_MODE: Record<
  "voice" | "text" | "silent",
  "VOICE" | "TEXT" | "SILENT"
> = {
  silent: "SILENT",
  text: "TEXT",
  voice: "VOICE",
};

const WAVE_BARS = [
  { height: 16, id: "a" },
  { height: 26, id: "b" },
  { height: 36, id: "c" },
  { height: 46, id: "d" },
  { height: 56, id: "e" },
  { height: 58, id: "f" },
  { height: 48, id: "g" },
  { height: 38, id: "h" },
  { height: 28, id: "i" },
  { height: 18, id: "j" },
  { height: 20, id: "k" },
  { height: 30, id: "l" },
  { height: 40, id: "m" },
  { height: 50, id: "n" },
  { height: 60, id: "o" },
] as const;

const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const remainingSeconds = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainingSeconds}`;
};

function PulseCore({ isOperator }: { isOperator: boolean }) {
  const primary = useSiagaColor("primary");

  return (
    <View className="items-center justify-center rounded-full bg-white/10 p-8">
      <View className="items-center justify-center rounded-full bg-white/15 p-6">
        <View className="size-[100px] items-center justify-center rounded-full bg-white">
          {isOperator ? (
            <Ionicons color={primary} name="headset-outline" size={44} />
          ) : (
            <Text className="font-bold text-4xl text-siaga-primary">✦</Text>
          )}
        </View>
      </View>
    </View>
  );
}

function Waveform() {
  return (
    <View
      accessibilityLabel="Visualisasi suara aktif"
      className="flex-row items-center gap-3"
    >
      {WAVE_BARS.map((bar) => (
        <View
          className="w-2 rounded-full bg-siaga-priority"
          key={bar.id}
          style={{ height: bar.height }}
        />
      ))}
    </View>
  );
}

export function ConnectingScreen() {
  const router = useRouter();
  const {
    cancelIncident,
    category,
    connectionTarget,
    idempotencyKey,
    location,
    mode,
    reportId,
    setReportId,
  } = useIncident();
  const createReport = useCreateReporterReportMutation();
  const cancellation = useRequestCancellationMutation();
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const isOperator = connectionTarget === "operator";

  useEffect(() => {
    if (!(idempotencyKey && mode) || reportId || createReport.isPending) {
      return;
    }
    createReport
      .mutateAsync({
        address: location?.address,
        idempotencyKey,
        incidentType: category
          ? INCIDENT_TYPE_BY_CATEGORY[category]
          : undefined,
        interactionMode: INTERACTION_MODE_BY_REPORT_MODE[mode],
        latitude: location?.latitude,
        longitude: location?.longitude,
        responderPreference: isOperator ? "OPERATOR" : "AI",
      })
      .then((report) => {
        setReportId(report.id);
        if (mode === "voice") {
          router.replace("/voice-session");
          return;
        }
        if (mode === "silent") {
          router.replace("/silent-session");
          return;
        }
        router.replace("/chat");
      })
      .catch((error: unknown) => {
        setConnectionError(
          error instanceof Error
            ? error.message
            : "Laporan belum berhasil dibuat. Coba lagi."
        );
      });
  }, [
    category,
    createReport,
    idempotencyKey,
    isOperator,
    location,
    mode,
    reportId,
    router,
    setReportId,
  ]);

  const handleCancel = useCallback(async () => {
    if (reportId) {
      try {
        await cancellation.mutateAsync({
          reason: "Pelapor membatalkan saat proses koneksi",
          reportId,
        });
      } catch {
        setConnectionError(
          "Permintaan pembatalan belum terkirim. Laporan tetap aktif."
        );
        return;
      }
    }
    cancelIncident();
    router.replace("/");
  }, [cancelIncident, cancellation, reportId, router]);

  return (
    <SiagaScreen contentClassName="items-center justify-center gap-8" isDark>
      <StatusBar style="light" />
      <PulseCore isOperator={isOperator} />
      <Text className="text-center font-bold text-2xl text-white leading-9">
        {isOperator
          ? "Menghubungkan ke operator..."
          : "Menghubungkan ke\nSIAGA AI..."}
      </Text>
      {connectionError ? (
        <Text className="text-center text-[12px] text-white">
          {connectionError}
        </Text>
      ) : null}
      <Pressable
        accessibilityRole="button"
        className="w-full items-center justify-center rounded-xl border border-white py-4"
        onPress={handleCancel}
      >
        <Text className="font-semibold text-[13px] text-white">
          Batalkan SOS
        </Text>
      </Pressable>
    </SiagaScreen>
  );
}

export function VoiceSessionScreen() {
  const router = useRouter();
  const { connectionTarget, reportId } = useIncident();
  const reportQuery = useReporterReportQuery(reportId);
  const endSession = useEndReporterSessionMutation();
  const switchMode = useSwitchReporterModeMutation();
  const appendText = useAppendReporterTextMutation();
  const [seconds, setSeconds] = useState(0);
  const isOperator = connectionTarget === "operator";
  const lastSpokenMessageId = useRef<string | null>(null);
  useLiveLocationReporting(reportId);

  const handleFinalTranscript = useCallback(
    (transcript: string) => {
      if (!reportId) {
        return;
      }
      appendText.mutate({
        content: transcript,
        idempotencyKey: `voice-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        reportId,
      });
    },
    [appendText, reportId]
  );

  const { interimText, status: sttStatus } = useVoiceTranscription({
    enabled: Boolean(reportId),
    onFinalResult: handleFinalTranscript,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((current) => current + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const latestAssistantMessage = [...(reportQuery.data?.messages ?? [])]
    .reverse()
    .find((message) => message.senderType === "AI_AGENT");

  useEffect(() => {
    if (
      !latestAssistantMessage ||
      latestAssistantMessage.id === lastSpokenMessageId.current
    ) {
      return;
    }
    lastSpokenMessageId.current = latestAssistantMessage.id;
    speak(latestAssistantMessage.content, { language: "id-ID" });
  }, [latestAssistantMessage]);

  const handleEndCall = useCallback(async () => {
    if (!reportId) {
      router.replace("/");
      return;
    }
    await endSession.mutateAsync({ reportId });
    router.replace("/dispatch");
  }, [endSession, reportId, router]);

  const handleUseText = useCallback(async () => {
    if (!reportId) {
      return;
    }
    await switchMode.mutateAsync({
      interactionMode: "TEXT",
      reportId,
    });
    router.replace("/chat");
  }, [reportId, router, switchMode]);

  const latestTranscript = [...(reportQuery.data?.messages ?? [])]
    .reverse()
    .find(
      (message) =>
        message.type === "TRANSCRIPT_FINAL" || message.senderType === "REPORTER"
    );

  let listeningStateText = "SIAGA SEDANG MENDENGARKAN";
  if (reportQuery.data?.assignedOperator) {
    listeningStateText = `DITANGANI ${reportQuery.data.assignedOperator.name.toUpperCase()}`;
  } else if (sttStatus === "unavailable") {
    listeningStateText = "SUARA TIDAK TERSEDIA — GUNAKAN CHAT";
  }

  const content = (
    <SiagaScreen contentClassName="gap-6 pt-14 pb-10" isDark isScrollable>
      <StatusBar style="light" />
      <Text className="text-center text-[12px] text-white">
        {formatDuration(seconds)}
      </Text>

      {isOperator ? null : (
        <View className="gap-2 rounded-2xl bg-siaga-primary p-5">
          <Text className="font-semibold text-[10px] text-white">
            SIAGA AKTIF
          </Text>
          <Text className="font-extrabold text-2xl text-white leading-8">
            {reportQuery.data?.assignedOperator
              ? "Operator sudah mengambil alih"
              : "Ceritakan keadaan daruratnya"}
          </Text>
          <Text className="text-[11px] text-white leading-4">
            Mikrofon dikirim melalui ruang laporan privat.
          </Text>
        </View>
      )}

      <Text className="text-center font-semibold text-[11px] text-siaga-primary">
        {listeningStateText}
      </Text>

      <View className="items-center py-4">
        <Waveform />
      </View>

      <View className="gap-3 rounded-xl border border-white/15 bg-white/5 p-4">
        <Text className="font-semibold text-[10px] text-siaga-primary">
          TRANSKRIP
        </Text>
        <Text className="text-[12px] text-white leading-5">
          {interimText ||
            latestTranscript?.content ||
            "Transkrip akan muncul begitu kamu mulai berbicara."}
        </Text>
      </View>

      <SiagaButton onPress={handleUseText} tone="outline">
        Pindah ke chat
      </SiagaButton>
      <SiagaButton isDisabled={endSession.isPending} onPress={handleEndCall}>
        Akhiri komunikasi
      </SiagaButton>
    </SiagaScreen>
  );

  if (!reportId) {
    return content;
  }

  return <LiveAudioRoom reportId={reportId}>{content}</LiveAudioRoom>;
}

export function ChatScreen() {
  const router = useRouter();
  const { reportId } = useIncident();
  const reportQuery = useReporterReportQuery(reportId);
  const appendText = useAppendReporterTextMutation();
  const endSession = useEndReporterSessionMutation();
  const switchMode = useSwitchReporterModeMutation();
  const [draft, setDraft] = useState("");
  const placeholderColor = useSiagaColor("muted");
  useLiveLocationReporting(reportId);

  const messages = useMemo(
    () => (reportQuery.data?.messages ?? []).slice(-8),
    [reportQuery.data?.messages]
  );

  const handleSend = useCallback(async () => {
    const nextMessage = draft.trim();
    if (!(nextMessage && reportId)) {
      return;
    }
    setDraft("");
    await appendText.mutateAsync({
      content: nextMessage,
      idempotencyKey: `message-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      reportId,
    });
  }, [appendText, draft, reportId]);

  const handleEndSession = useCallback(async () => {
    if (reportId) {
      await endSession.mutateAsync({ reportId });
    }
    router.replace("/dispatch");
  }, [endSession, reportId, router]);

  const handleUseVoice = useCallback(async () => {
    if (!reportId) {
      return;
    }
    await switchMode.mutateAsync({
      interactionMode: "VOICE",
      reportId,
    });
    router.replace("/voice-session");
  }, [reportId, router, switchMode]);

  let chatStatusText = "Laporan aktif";
  if (reportQuery.isError) {
    chatStatusText = "Koneksi terganggu";
  } else if (reportQuery.data?.assignedOperator) {
    chatStatusText = `Ditangani ${reportQuery.data.assignedOperator.name}`;
  }

  return (
    <SiagaScreen contentClassName="gap-4 pt-16 pb-8" isScrollable>
      <View className="flex-row items-center gap-3 rounded-2xl border border-siaga-border bg-siaga-panel p-4">
        <View className="size-11 items-center justify-center rounded-full bg-siaga-primary">
          <Text className="font-bold text-lg text-white">✦</Text>
        </View>
        <View className="gap-1">
          <Text className="font-extrabold text-[16px] text-siaga-body">
            SIAGA
          </Text>
          <View className="flex-row items-center gap-2">
            <View className="size-2 rounded-full bg-siaga-success" />
            <Text className="text-[10px] text-siaga-muted-strong">
              {chatStatusText}
            </Text>
          </View>
        </View>
      </View>

      <View className="gap-3">
        {messages.map((message) => {
          const isUser = message.senderType === "REPORTER";
          return (
            <View
              className={`max-w-[85%] rounded-2xl border p-3.5 ${
                isUser
                  ? "self-end border-siaga-primary bg-siaga-primary"
                  : "self-start border-siaga-border bg-siaga-panel"
              }`}
              key={message.id}
            >
              <Text
                className={`font-semibold text-[10px] ${
                  isUser ? "text-white/80" : "text-siaga-primary"
                }`}
              >
                {isUser ? "KAMU" : "SIAGA"}
              </Text>
              <Text
                className={`mt-1 text-[12px] leading-5 ${
                  isUser ? "text-white" : "text-siaga-body"
                }`}
              >
                {message.content}
              </Text>
            </View>
          );
        })}
      </View>

      <View className="flex-row items-center gap-2 rounded-xl border border-siaga-border bg-siaga-panel p-2">
        <TextInput
          accessibilityLabel="Perubahan situasi"
          className="min-h-11 flex-1 px-2 text-siaga-body"
          onChangeText={setDraft}
          onSubmitEditing={handleSend}
          placeholder="Tulis perubahan situasi..."
          placeholderTextColor={placeholderColor}
          returnKeyType="send"
          value={draft}
        />
        <Pressable
          accessibilityLabel="Kirim pesan"
          accessibilityRole="button"
          className="size-11 items-center justify-center rounded-full bg-siaga-primary"
          onPress={handleSend}
        >
          <Ionicons color="#fff" name="arrow-up" size={22} />
        </Pressable>
      </View>

      <View className="flex-row gap-2.5">
        <Pressable
          accessibilityRole="button"
          className="h-11 flex-1 items-center justify-center rounded-[10px] border border-siaga-primary"
          onPress={handleUseVoice}
        >
          <Text className="font-semibold text-[10px] text-siaga-primary">
            Gunakan suara
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          className="h-11 flex-1 items-center justify-center rounded-[10px] border border-siaga-primary"
          onPress={handleEndSession}
        >
          <Text className="font-semibold text-[10px] text-siaga-primary">
            Akhiri komunikasi
          </Text>
        </Pressable>
      </View>
    </SiagaScreen>
  );
}

export function DispatchScreen() {
  const router = useRouter();
  const { reportId } = useIncident();
  const primary = useSiagaColor("primary");
  const { phase, reportQuery } = useReportPhaseNavigation(reportId);
  const acknowledgement = useAcknowledgeReportMutation();
  const report = reportQuery.data;
  const dispatch = report?.latestDispatch;
  const agencyName = dispatch?.agencyName ?? "Tim bantuan";
  const unitCode = dispatch?.unitCode ?? "belum ditetapkan";
  const isHelpVisible = report?.acknowledgements.includes("HELP_VISIBLE");

  useEffect(() => {
    if (phase === "arrived") {
      router.replace("/arrival");
      return;
    }
    if (phase === "completed") {
      router.replace("/complete");
    }
  }, [phase, router]);

  const handleArrival = useCallback(async () => {
    if (!reportId) {
      return;
    }
    await acknowledgement.mutateAsync({
      reportId,
      type: "HELP_VISIBLE",
    });
  }, [acknowledgement, reportId]);

  const handleOpenChat = useCallback(() => {
    router.push("/chat");
  }, [router]);

  return (
    <SiagaScreen contentClassName="gap-5 pt-16 pb-8" isScrollable>
      <View className="gap-1">
        <Text className="font-bold text-[26px] text-siaga-ink leading-9">
          Bantuan sedang dikirim
        </Text>
        <Text className="text-[12px] text-siaga-muted">
          {dispatch
            ? `${agencyName} · unit ${unitCode}`
            : "Laporan aktif dan menunggu konfirmasi dispatch operator."}
        </Text>
      </View>

      <View className="gap-2 rounded-2xl bg-siaga-primary-dark p-4">
        <Text className="font-semibold text-[10px] text-white">
          {report ? REPORT_STATUS_LABELS[report.status] : "AKTIF"}
        </Text>
        <Text className="font-extrabold text-[16px] text-white leading-6">
          {report?.recommendation ??
            "Tetap berada di tempat aman dan kirim perubahan situasi melalui chat."}
        </Text>
      </View>

      <View className="gap-3 rounded-2xl border border-siaga-border bg-siaga-panel p-5">
        <DispatchTimeline status={dispatch?.status} />
      </View>

      <View className="gap-3">
        {SAFETY_INSTRUCTIONS.map((instruction, index) => (
          <View
            className="flex-row items-center gap-3 rounded-2xl border border-siaga-border bg-siaga-panel p-4"
            key={instruction.id}
          >
            <View className="size-9 items-center justify-center rounded-full bg-siaga-soft">
              <Text className="font-extrabold text-[13px] text-siaga-primary">
                {index + 1}
              </Text>
            </View>
            <Text className="flex-1 text-[11px] text-siaga-body leading-4">
              {instruction.text}
            </Text>
          </View>
        ))}
      </View>

      <View className="flex-row items-center gap-3">
        <Pressable
          accessibilityLabel="Buka chat"
          accessibilityRole="button"
          className="size-14 items-center justify-center rounded-xl border border-siaga-primary bg-siaga-panel"
          onPress={handleOpenChat}
        >
          <Ionicons color={primary} name="chatbox-outline" size={26} />
        </Pressable>
        <View className="flex-1">
          <SiagaButton
            isDisabled={acknowledgement.isPending || isHelpVisible}
            onPress={handleArrival}
          >
            {isHelpVisible
              ? "Konfirmasi sudah dikirim"
              : "Saya melihat bantuan datang"}
          </SiagaButton>
        </View>
      </View>
    </SiagaScreen>
  );
}

export function ArrivalScreen() {
  const router = useRouter();
  const { reportId } = useIncident();
  const primary = useSiagaColor("primary");
  const { phase, reportQuery } = useReportPhaseNavigation(reportId);
  const acknowledgement = useAcknowledgeReportMutation();
  const report = reportQuery.data;
  const dispatch = report?.latestDispatch;
  const agencyName = dispatch?.agencyName ?? "Tim bantuan";
  const unitCode = dispatch?.unitCode ?? "unit lapangan";
  const isWithResponder = report?.acknowledgements.includes("WITH_RESPONDER");

  useEffect(() => {
    if (phase === "completed") {
      router.replace("/complete");
    }
  }, [phase, router]);

  const handleComplete = useCallback(async () => {
    if (!reportId) {
      return;
    }
    await acknowledgement.mutateAsync({
      reportId,
      type: "WITH_RESPONDER",
    });
  }, [acknowledgement, reportId]);

  const handleOpenChat = useCallback(() => {
    router.push("/chat");
  }, [router]);

  return (
    <SiagaScreen contentClassName="gap-5 pt-16 pb-8" isScrollable>
      <View className="gap-1">
        <Text className="font-bold text-[26px] text-siaga-ink leading-9">
          Bantuan sudah tiba
        </Text>
        <Text className="text-[12px] text-siaga-muted">
          {agencyName} telah ditandai tiba oleh backend.
        </Text>
      </View>

      <View className="flex-row items-center gap-3 rounded-lg border border-siaga-success bg-siaga-success-soft px-3 py-2.5">
        <View className="size-2.5 rounded-full bg-siaga-success" />
        <Text className="font-semibold text-[11px] text-siaga-success">
          {agencyName} · {unitCode}
        </Text>
      </View>

      <View className="gap-3 rounded-2xl border border-siaga-border bg-siaga-panel p-5">
        <View className="flex-row items-center gap-4">
          <View className="size-12 items-center justify-center rounded-full bg-siaga-primary">
            <Text className="font-extrabold text-lg text-white">P</Text>
          </View>
          <View className="gap-1">
            <Text className="font-extrabold text-[15px] text-siaga-body">
              {agencyName}
            </Text>
            <Text className="text-[10px] text-siaga-muted-strong">
              Kode unit: {unitCode}
            </Text>
          </View>
        </View>
        <Text className="font-semibold text-[9px] text-siaga-primary leading-4">
          Pastikan identitas petugas sebelum membuka pintu.
        </Text>
      </View>

      <View className="gap-3 rounded-2xl border border-siaga-border bg-siaga-panel p-5">
        <DispatchTimeline status={dispatch?.status ?? "ARRIVED"} />
      </View>

      <View className="flex-row items-center gap-3">
        <Pressable
          accessibilityLabel="Buka chat"
          accessibilityRole="button"
          className="size-14 items-center justify-center rounded-xl border border-siaga-primary bg-siaga-panel"
          onPress={handleOpenChat}
        >
          <Ionicons color={primary} name="chatbox-outline" size={26} />
        </Pressable>
        <View className="flex-1">
          <SiagaButton
            isDisabled={acknowledgement.isPending || isWithResponder}
            onPress={handleComplete}
          >
            {isWithResponder
              ? "Konfirmasi sudah dikirim"
              : "Saya sudah bersama petugas"}
          </SiagaButton>
        </View>
      </View>
    </SiagaScreen>
  );
}

export function CompleteScreen() {
  const router = useRouter();
  const { cancelIncident, reportId } = useIncident();
  const reportQuery = useReporterReportQuery(reportId);
  const report = reportQuery.data;

  const handleHome = useCallback(() => {
    cancelIncident();
    router.replace("/");
  }, [cancelIncident, router]);

  const handleHistory = useCallback(() => {
    cancelIncident();
    router.replace("/history");
  }, [cancelIncident, router]);

  if (reportQuery.isPending) {
    return (
      <SiagaScreen contentClassName="items-center justify-center">
        <ActivityIndicator />
      </SiagaScreen>
    );
  }

  return (
    <SiagaScreen contentClassName="items-center gap-6 pt-16 pb-8" isScrollable>
      <View className="items-center justify-center rounded-full bg-siaga-success-soft p-8">
        <View className="size-[100px] items-center justify-center rounded-full bg-siaga-success">
          <Ionicons color="#fff" name="checkmark" size={58} />
        </View>
      </View>
      <Text className="text-center font-bold text-[26px] text-siaga-ink">
        Kamu sudah aman
      </Text>
      <Text className="text-center text-[12px] text-siaga-muted leading-5">
        Laporan {report?.id.slice(0, 8).toUpperCase() ?? "darurat"} berstatus{" "}
        {report ? REPORT_STATUS_LABELS[report.status] : "tersimpan"}.
      </Text>

      <View className="w-full gap-4 rounded-2xl border border-siaga-border bg-siaga-panel p-5">
        <Text className="font-semibold text-[10px] text-siaga-muted-strong">
          RINGKASAN
        </Text>
        <View className="flex-row justify-between">
          <Text className="text-[11px] text-siaga-muted-strong">Jenis</Text>
          <Text className="font-semibold text-[11px] text-siaga-body">
            {report?.incidentType
              ? INCIDENT_TYPE_LABELS[report.incidentType]
              : "Belum diklasifikasi"}
          </Text>
        </View>
        <View className="flex-row justify-between">
          <Text className="text-[11px] text-siaga-muted-strong">Bantuan</Text>
          <Text className="font-semibold text-[11px] text-siaga-body">
            {report?.latestDispatch?.agencyName ?? "Belum ditetapkan"}
          </Text>
        </View>
        <View className="flex-row justify-between">
          <Text className="text-[11px] text-siaga-muted-strong">Status</Text>
          <Text className="font-semibold text-[11px] text-siaga-body">
            {report ? REPORT_STATUS_LABELS[report.status] : "Memuat"}
          </Text>
        </View>
      </View>

      <View className="w-full gap-3">
        <SiagaButton onPress={handleHome}>Kembali ke halaman utama</SiagaButton>
        <SiagaButton onPress={handleHistory} tone="outline">
          Lihat riwayat laporan
        </SiagaButton>
      </View>
    </SiagaScreen>
  );
}
