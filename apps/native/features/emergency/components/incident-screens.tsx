import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import arrivalMap from "@/assets/images/arrival-map.png";
import dispatchMap from "@/assets/images/dispatch-map.png";
import { ReferenceCanvas } from "@/components/reference-canvas";
import { SiagaButton } from "@/components/siaga-button";
import {
  NEUTRAL_600,
  SIAGA_BODY,
  SIAGA_BORDER,
  SIAGA_CALL_BG,
  SIAGA_INK,
  SIAGA_MUTED,
  SIAGA_MUTED_STRONG,
  SIAGA_PANEL,
  SIAGA_PRIMARY,
  SIAGA_PRIMARY_DARK,
  SIAGA_PRIORITY,
  SIAGA_SOFT,
  SIAGA_SUCCESS,
  SIAGA_SUCCESS_BORDER,
  SIAGA_SUCCESS_SOFT,
  WHITE,
} from "@/constants/colors";
import {
  useAcknowledgeReportMutation,
  useAppendReporterTextMutation,
  useCreateReporterReportMutation,
  useEndReporterSessionMutation,
  useReporterReportQuery,
  useRequestCancellationMutation,
  useSwitchReporterModeMutation,
} from "@/features/emergency/api";
import { LiveAudioRoom } from "@/features/emergency/components/live-audio-room";
import { SAFETY_INSTRUCTIONS } from "@/features/emergency/content";
import { useIncident } from "@/features/emergency/context";
import type {
  ChatMessage,
  EmergencyCategory,
  ReportMode,
} from "@/features/emergency/types";
import { useLiveLocationReporting } from "@/features/emergency/use-live-location-reporting";

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
  ReportMode,
  "VOICE" | "TEXT" | "SILENT"
> = {
  silent: "SILENT",
  text: "TEXT",
  voice: "VOICE",
};

const WAVE_BARS = [
  { height: 28, id: "a" },
  { height: 45, id: "b" },
  { height: 62, id: "c" },
  { height: 79, id: "d" },
  { height: 96, id: "e" },
  { height: 99, id: "f" },
  { height: 82, id: "g" },
  { height: 65, id: "h" },
  { height: 48, id: "i" },
  { height: 31, id: "j" },
  { height: 34, id: "k" },
  { height: 51, id: "l" },
  { height: 68, id: "m" },
  { height: 85, id: "n" },
  { height: 102, id: "o" },
] as const;

const MESSAGE_POSITIONS = [
  { left: 16, minHeight: 82, top: 163, width: 278 },
  { left: 90, minHeight: 114, top: 259, width: 284 },
  { left: 16, minHeight: 100, top: 387, width: 304 },
] as const;

const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const remainingSeconds = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainingSeconds}`;
};

function PulseCore({ isOperator }: { isOperator: boolean }) {
  return (
    <View style={styles.pulseOuter}>
      <View style={styles.pulseMiddle}>
        <View style={styles.pulseInner}>
          <View style={styles.pulseCore}>
            {isOperator ? (
              <Ionicons
                color={SIAGA_PRIMARY}
                name="headset-outline"
                size={44}
              />
            ) : (
              <Text style={styles.aiMark}>✦</Text>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

function Waveform() {
  return (
    <View accessibilityLabel="Visualisasi suara aktif" style={styles.waveform}>
      {WAVE_BARS.map((bar) => (
        <View key={bar.id} style={[styles.waveBar, { height: bar.height }]} />
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
    setPhase,
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
        setPhase("active");
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
    setPhase,
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
    <ReferenceCanvas
      backgroundColor={SIAGA_PRIMARY_DARK}
      testID="connecting-screen"
    >
      <StatusBar style="light" />
      <PulseCore isOperator={isOperator} />
      <Text style={styles.connectingTitle}>
        {isOperator
          ? "Menghubungkan ke operator..."
          : "Menghubungkan ke\nSIAGA AI..."}
      </Text>
      {connectionError ? (
        <Text style={styles.connectionError}>{connectionError}</Text>
      ) : null}
      <Pressable
        accessibilityRole="button"
        onPress={handleCancel}
        style={styles.cancelAction}
      >
        <Text style={styles.cancelLabel}>Batalkan SOS</Text>
      </Pressable>
    </ReferenceCanvas>
  );
}

export function VoiceSessionScreen() {
  const router = useRouter();
  const { connectionTarget, reportId } = useIncident();
  const reportQuery = useReporterReportQuery(reportId);
  const endSession = useEndReporterSessionMutation();
  const switchMode = useSwitchReporterModeMutation();
  const [seconds, setSeconds] = useState(0);
  const isOperator = connectionTarget === "operator";
  useLiveLocationReporting(reportId);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((current) => current + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

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

  const content = (
    <ReferenceCanvas
      backgroundColor={SIAGA_CALL_BG}
      testID="voice-session-screen"
    >
      <StatusBar style="light" />
      <Text style={styles.timer}>{formatDuration(seconds)}</Text>
      {isOperator ? null : (
        <View style={styles.emergencyPrompt}>
          <Text style={styles.promptEyebrow}>SIAGA AKTIF</Text>
          <Text style={styles.promptQuestion}>
            {reportQuery.data?.assignedOperator
              ? "Operator sudah mengambil alih"
              : "Ceritakan keadaan daruratnya"}
          </Text>
          <Text style={styles.promptInstruction}>
            Mikrofon dikirim melalui ruang laporan privat.
          </Text>
        </View>
      )}
      <Text
        style={[
          styles.listeningState,
          isOperator ? styles.operatorListeningState : null,
        ]}
      >
        {reportQuery.data?.assignedOperator
          ? `DITANGANI ${reportQuery.data.assignedOperator.name.toUpperCase()}`
          : "SIAGA SEDANG MENDENGARKAN"}
      </Text>
      <Waveform />
      <View style={styles.transcriptCard}>
        <Text style={styles.transcriptLabel}>TRANSKRIP FINAL TERAKHIR</Text>
        <Text style={styles.transcriptBody}>
          {latestTranscript?.content ??
            "Transkrip akan muncul setelah layanan suara mengirim hasil final."}
        </Text>
      </View>
      <View style={styles.voiceTextAction}>
        <SiagaButton onPress={handleUseText} tone="outline">
          Pindah ke chat
        </SiagaButton>
      </View>
      <View style={styles.endCallAction}>
        <SiagaButton
          className="h-[52px]"
          isDisabled={endSession.isPending}
          onPress={handleEndCall}
        >
          Akhiri komunikasi
        </SiagaButton>
      </View>
    </ReferenceCanvas>
  );

  if (!reportId) {
    return content;
  }

  return <LiveAudioRoom reportId={reportId}>{content}</LiveAudioRoom>;
}

interface MessageBubbleProps {
  index: number;
  message: ChatMessage;
}

function MessageBubble({ index, message }: MessageBubbleProps) {
  const isUser = message.sender === "KAMU";
  const position = MESSAGE_POSITIONS[index] ?? {
    left: 90,
    minHeight: 82,
    top: 501 + (index - MESSAGE_POSITIONS.length) * 92,
    width: 284,
  };

  return (
    <View
      style={[
        styles.messageBubble,
        position,
        isUser ? styles.userBubble : styles.aiBubble,
      ]}
    >
      <Text style={styles.messageSender}>{message.sender}</Text>
      <Text style={styles.messageBody}>{message.message}</Text>
    </View>
  );
}

export function ChatScreen() {
  const router = useRouter();
  const { reportId } = useIncident();
  const reportQuery = useReporterReportQuery(reportId);
  const appendText = useAppendReporterTextMutation();
  const endSession = useEndReporterSessionMutation();
  const switchMode = useSwitchReporterModeMutation();
  const [draft, setDraft] = useState("");
  useLiveLocationReporting(reportId);
  const messages = useMemo<ChatMessage[]>(
    () =>
      (reportQuery.data?.messages ?? []).slice(-5).map((message) => ({
        id: message.id,
        message: message.content,
        sender: message.senderType === "REPORTER" ? "KAMU" : "SIAGA",
      })),
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
    <ReferenceCanvas testID="chat-screen">
      <View style={styles.chatHeader}>
        <View style={styles.chatAvatar}>
          <Text style={styles.chatMark}>✦</Text>
        </View>
        <View style={styles.chatHeaderCopy}>
          <Text style={styles.chatTitle}>SIAGA</Text>
          <View style={styles.chatStatusRow}>
            <View style={styles.onlineDot} />
            <Text style={styles.chatStatus}>{chatStatusText}</Text>
          </View>
        </View>
      </View>
      {messages.map((message, index) => (
        <MessageBubble index={index} key={message.id} message={message} />
      ))}
      <View style={styles.chatComposer}>
        <TextInput
          accessibilityLabel="Perubahan situasi"
          onChangeText={setDraft}
          onSubmitEditing={handleSend}
          placeholder="Tulis perubahan situasi..."
          placeholderTextColor={NEUTRAL_600}
          returnKeyType="send"
          style={styles.chatInput}
          value={draft}
        />
        <Pressable
          accessibilityLabel="Kirim pesan"
          accessibilityRole="button"
          onPress={handleSend}
          style={styles.sendAction}
        >
          <Ionicons color={WHITE} name="arrow-up" size={22} />
        </Pressable>
      </View>
      <View style={styles.chatModeActions}>
        <Pressable
          accessibilityRole="button"
          onPress={handleUseVoice}
          style={styles.secondaryChatAction}
        >
          <Text style={styles.secondaryChatActionText}>Gunakan suara</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={handleEndSession}
          style={styles.secondaryChatAction}
        >
          <Text style={styles.secondaryChatActionText}>Akhiri komunikasi</Text>
        </Pressable>
      </View>
    </ReferenceCanvas>
  );
}

export function DispatchScreen() {
  const router = useRouter();
  const { reportId } = useIncident();
  const reportQuery = useReporterReportQuery(reportId);
  const acknowledgement = useAcknowledgeReportMutation();
  const report = reportQuery.data;
  const dispatch = report?.latestDispatch;
  const agencyName = dispatch?.agencyName ?? "Tim bantuan";
  const unitCode = dispatch?.unitCode ?? "belum ditetapkan";
  const isHelpVisible = report?.acknowledgements.includes("HELP_VISIBLE");

  useEffect(() => {
    if (report?.status === "HELP_ARRIVED") {
      router.replace("/arrival");
      return;
    }
    if (
      report?.status === "RESOLVED" ||
      report?.status === "CLOSED" ||
      report?.status === "CANCELLED"
    ) {
      router.replace("/complete");
    }
  }, [report?.status, router]);

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
    <ReferenceCanvas testID="dispatch-screen">
      <Text style={styles.flowTitle}>Bantuan sedang dikirim</Text>
      <Text style={styles.dispatchSubtitle}>
        {dispatch
          ? `${agencyName} · unit ${unitCode}`
          : "Laporan aktif dan menunggu konfirmasi dispatch operator."}
      </Text>
      <View style={styles.priorityAlert}>
        <Text style={styles.priorityEyebrow}>{report?.status ?? "AKTIF"}</Text>
        <Text style={styles.priorityBody}>
          {report?.recommendation ??
            "Tetap berada di tempat aman dan kirim perubahan situasi melalui chat."}
        </Text>
      </View>
      {SAFETY_INSTRUCTIONS.map((instruction, index) => (
        <View
          key={instruction.id}
          style={[styles.instructionCard, { top: 255 + index * 86 }]}
        >
          <View style={styles.instructionNumber}>
            <Text style={styles.instructionNumberText}>{index + 1}</Text>
          </View>
          <Text style={styles.instructionText}>{instruction.text}</Text>
        </View>
      ))}
      <View style={styles.dispatchMapFrame}>
        <Image
          contentFit="cover"
          source={dispatchMap}
          style={styles.mapImage}
        />
        <View style={styles.etaBadge}>
          <Text style={styles.etaText}>
            {dispatch?.estimatedArrivalAt
              ? `Estimasi ${new Date(
                  dispatch.estimatedArrivalAt
                ).toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}`
              : "ETA belum tersedia"}
          </Text>
        </View>
      </View>
      <Pressable
        accessibilityLabel="Buka chat"
        accessibilityRole="button"
        onPress={handleOpenChat}
        style={styles.chatShortcut}
      >
        <Ionicons color={SIAGA_PRIMARY} name="chatbox-outline" size={30} />
      </Pressable>
      <View style={styles.dispatchAction}>
        <SiagaButton
          isDisabled={acknowledgement.isPending || isHelpVisible}
          onPress={handleArrival}
        >
          {isHelpVisible
            ? "Konfirmasi sudah dikirim"
            : "Saya melihat bantuan datang"}
        </SiagaButton>
      </View>
    </ReferenceCanvas>
  );
}

export function ArrivalScreen() {
  const router = useRouter();
  const { reportId } = useIncident();
  const reportQuery = useReporterReportQuery(reportId);
  const acknowledgement = useAcknowledgeReportMutation();
  const report = reportQuery.data;
  const dispatch = report?.latestDispatch;
  const agencyName = dispatch?.agencyName ?? "Tim bantuan";
  const unitCode = dispatch?.unitCode ?? "unit lapangan";
  const isWithResponder = report?.acknowledgements.includes("WITH_RESPONDER");

  useEffect(() => {
    if (
      report?.status === "RESOLVED" ||
      report?.status === "CLOSED" ||
      report?.status === "CANCELLED"
    ) {
      router.replace("/complete");
    }
  }, [report?.status, router]);

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
    <ReferenceCanvas testID="arrival-screen">
      <Text style={styles.flowTitle}>Bantuan sudah tiba</Text>
      <Text style={styles.arrivalSubtitle}>
        {agencyName} telah ditandai tiba oleh backend.
      </Text>
      <View style={styles.arrivedBadge}>
        <View style={styles.arrivedDot} />
        <Text style={styles.arrivedText}>
          {agencyName} · {unitCode}
        </Text>
      </View>
      <View style={styles.unitCard}>
        <View style={styles.unitTopRow}>
          <View style={styles.unitAvatar}>
            <Text style={styles.unitMark}>P</Text>
          </View>
          <View style={styles.unitCopy}>
            <Text style={styles.unitTitle}>{agencyName}</Text>
            <Text style={styles.unitMeta}>Kode unit: {unitCode}</Text>
          </View>
        </View>
        <Text style={styles.unitAdvice}>
          Pastikan identitas petugas sebelum membuka pintu.
        </Text>
      </View>
      <View style={styles.arrivalMapFrame}>
        <Image contentFit="cover" source={arrivalMap} style={styles.mapImage} />
      </View>
      <Pressable
        accessibilityLabel="Buka chat"
        accessibilityRole="button"
        onPress={handleOpenChat}
        style={styles.chatShortcut}
      >
        <Ionicons color={SIAGA_PRIMARY} name="chatbox-outline" size={30} />
      </Pressable>
      <View style={styles.dispatchAction}>
        <SiagaButton
          isDisabled={acknowledgement.isPending || isWithResponder}
          onPress={handleComplete}
        >
          {isWithResponder
            ? "Konfirmasi sudah dikirim"
            : "Saya sudah bersama petugas"}
        </SiagaButton>
      </View>
    </ReferenceCanvas>
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

  return (
    <ReferenceCanvas testID="complete-screen">
      <View style={styles.completeHalo}>
        <View style={styles.completeCore}>
          <Ionicons color={WHITE} name="checkmark" size={58} />
        </View>
      </View>
      <Text style={styles.completeTitle}>Kamu sudah aman</Text>
      <Text style={styles.completeSubtitle}>
        Laporan {report?.id.slice(0, 8).toUpperCase() ?? "darurat"} berstatus{" "}
        {report?.status ?? "tersimpan"}.
      </Text>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>RINGKASAN</Text>
        <SummaryRow
          label="Jenis"
          top={48}
          value={report?.incidentType ?? "Belum diklasifikasi"}
        />
        <SummaryRow
          label="Bantuan"
          top={84}
          value={report?.latestDispatch?.agencyName ?? "Belum ditetapkan"}
        />
        <SummaryRow
          label="Status"
          top={120}
          value={report?.status ?? "Memuat"}
        />
      </View>
      <View style={styles.homeAction}>
        <SiagaButton onPress={handleHome}>Kembali ke halaman utama</SiagaButton>
      </View>
      <View style={styles.historyAction}>
        <SiagaButton onPress={handleHistory} tone="outline">
          Lihat riwayat laporan
        </SiagaButton>
      </View>
    </ReferenceCanvas>
  );
}

interface SummaryRowProps {
  label: string;
  top: number;
  value: string;
}

function SummaryRow({ label, top, value }: SummaryRowProps) {
  return (
    <View style={[styles.summaryRow, { top }]}>
      <Text style={styles.summaryRowLabel}>{label}</Text>
      <Text style={styles.summaryRowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  aiBubble: {
    backgroundColor: SIAGA_PANEL,
  },
  aiMark: {
    color: SIAGA_PRIMARY,
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 34,
    lineHeight: 46,
  },
  arrivalMapFrame: {
    borderCurve: "continuous",
    borderRadius: 14,
    height: 325,
    left: 24,
    overflow: "hidden",
    position: "absolute",
    top: 385,
    width: 342,
  },
  arrivalSubtitle: {
    color: SIAGA_MUTED,
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 12,
    left: 24,
    lineHeight: 16,
    position: "absolute",
    top: 130,
  },
  arrivedBadge: {
    alignItems: "center",
    backgroundColor: SIAGA_SUCCESS_SOFT,
    borderColor: SIAGA_SUCCESS_BORDER,
    borderCurve: "continuous",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    height: 40,
    left: 24,
    paddingHorizontal: 12,
    position: "absolute",
    top: 175,
    width: 342,
  },
  arrivedDot: {
    backgroundColor: SIAGA_SUCCESS,
    borderCurve: "continuous",
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  arrivedText: {
    color: SIAGA_SUCCESS,
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 11,
  },
  cancelAction: {
    alignItems: "center",
    borderColor: WHITE,
    borderCurve: "continuous",
    borderRadius: 12,
    borderWidth: 1,
    height: 50,
    justifyContent: "center",
    left: 64,
    position: "absolute",
    top: 760,
    width: 262,
  },
  cancelLabel: {
    color: WHITE,
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 13,
    lineHeight: 18,
  },
  chatAvatar: {
    alignItems: "center",
    backgroundColor: SIAGA_PRIMARY,
    borderCurve: "continuous",
    borderRadius: 22,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  chatComposer: {
    alignItems: "center",
    backgroundColor: SIAGA_PANEL,
    borderColor: SIAGA_BORDER,
    borderCurve: "continuous",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    height: 62,
    left: 16,
    paddingHorizontal: 12,
    position: "absolute",
    top: 736,
    width: 358,
  },
  chatHeader: {
    alignItems: "center",
    backgroundColor: SIAGA_PANEL,
    borderColor: SIAGA_BORDER,
    borderCurve: "continuous",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 14,
    height: 74,
    left: 16,
    paddingHorizontal: 16,
    position: "absolute",
    top: 71,
    width: 358,
  },
  chatHeaderCopy: {
    gap: 5,
  },
  chatInput: {
    color: SIAGA_BODY,
    flex: 1,
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 11,
    height: 44,
    paddingHorizontal: 6,
  },
  chatMark: {
    color: WHITE,
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 24,
  },
  chatModeActions: {
    flexDirection: "row",
    gap: 10,
    left: 16,
    position: "absolute",
    top: 676,
    width: 358,
  },
  chatShortcut: {
    alignItems: "center",
    backgroundColor: SIAGA_PANEL,
    borderColor: SIAGA_PRIMARY,
    borderCurve: "continuous",
    borderRadius: 12,
    borderWidth: 1,
    height: 54,
    justifyContent: "center",
    left: 24,
    position: "absolute",
    top: 744,
    width: 54,
  },
  chatStatus: {
    color: SIAGA_MUTED_STRONG,
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 10,
    lineHeight: 14,
  },
  chatStatusRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
  },
  chatTitle: {
    color: SIAGA_BODY,
    fontFamily: "PlusJakartaSans_800ExtraBold",
    fontSize: 16,
    lineHeight: 20,
  },
  completeCore: {
    alignItems: "center",
    backgroundColor: SIAGA_SUCCESS,
    borderCurve: "continuous",
    borderRadius: 50,
    height: 100,
    justifyContent: "center",
    width: 100,
  },
  completeHalo: {
    alignItems: "center",
    backgroundColor: SIAGA_SUCCESS_SOFT,
    borderCurve: "continuous",
    borderRadius: 80,
    height: 160,
    justifyContent: "center",
    left: 115,
    position: "absolute",
    top: 72,
    width: 160,
  },
  completeSubtitle: {
    color: SIAGA_MUTED,
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 12,
    left: 24,
    lineHeight: 16,
    position: "absolute",
    textAlign: "center",
    top: 306,
    width: 342,
  },
  completeTitle: {
    color: SIAGA_INK,
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 28,
    left: 24,
    lineHeight: 41,
    position: "absolute",
    textAlign: "center",
    top: 258,
    width: 342,
  },
  connectingTitle: {
    color: WHITE,
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 26,
    left: 32,
    lineHeight: 35,
    position: "absolute",
    textAlign: "center",
    top: 488,
    width: 326,
  },
  connectionError: {
    color: WHITE,
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 11,
    left: 44,
    lineHeight: 17,
    position: "absolute",
    textAlign: "center",
    top: 570,
    width: 302,
  },
  dispatchAction: {
    height: 54,
    left: 86,
    position: "absolute",
    top: 744,
    width: 280,
  },
  dispatchMapFrame: {
    borderCurve: "continuous",
    borderRadius: 14,
    height: 197,
    left: 24,
    overflow: "hidden",
    position: "absolute",
    top: 514,
    width: 342,
  },
  dispatchSubtitle: {
    color: SIAGA_MUTED,
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 12,
    left: 24,
    lineHeight: 16,
    position: "absolute",
    top: 128,
  },
  emergencyPrompt: {
    backgroundColor: SIAGA_PRIMARY,
    borderCurve: "continuous",
    borderRadius: 14,
    experimental_backgroundImage: `linear-gradient(135deg, ${SIAGA_PRIMARY} 0%, ${SIAGA_PRIMARY_DARK} 100%)`,
    height: 166,
    left: 24,
    padding: 18,
    position: "absolute",
    top: 102,
    width: 342,
  },
  endCallAction: {
    height: 52,
    left: 24,
    position: "absolute",
    top: 756,
    width: 342,
  },
  etaBadge: {
    backgroundColor: SIAGA_PANEL,
    borderCurve: "continuous",
    borderRadius: 8,
    left: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    position: "absolute",
    top: 12,
  },
  etaText: {
    color: SIAGA_BODY,
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 10,
  },
  flowTitle: {
    color: SIAGA_INK,
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 28,
    left: 24,
    lineHeight: 38,
    position: "absolute",
    top: 88,
    width: 342,
  },
  historyAction: {
    height: 54,
    left: 24,
    position: "absolute",
    top: 748,
    width: 342,
  },
  homeAction: {
    height: 54,
    left: 24,
    position: "absolute",
    top: 682,
    width: 342,
  },
  instructionCard: {
    alignItems: "center",
    backgroundColor: SIAGA_PANEL,
    borderColor: SIAGA_BORDER,
    borderCurve: "continuous",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 13,
    height: 66,
    left: 24,
    paddingHorizontal: 14,
    position: "absolute",
    width: 342,
  },
  instructionNumber: {
    alignItems: "center",
    backgroundColor: SIAGA_SOFT,
    borderCurve: "continuous",
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  instructionNumberText: {
    color: SIAGA_PRIMARY,
    fontFamily: "PlusJakartaSans_800ExtraBold",
    fontSize: 14,
  },
  instructionText: {
    color: SIAGA_BODY,
    flex: 1,
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 11,
    lineHeight: 16,
  },
  listeningState: {
    color: SIAGA_PRIMARY,
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 10,
    left: 24,
    lineHeight: 15,
    position: "absolute",
    textAlign: "center",
    top: 309,
    width: 342,
  },
  mapImage: {
    height: "100%",
    width: "100%",
  },
  messageBody: {
    color: SIAGA_BODY,
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 12,
    lineHeight: 18,
  },
  messageBubble: {
    borderColor: SIAGA_BORDER,
    borderCurve: "continuous",
    borderRadius: 14,
    borderWidth: 1,
    gap: 9,
    padding: 14,
    position: "absolute",
  },
  messageSender: {
    color: SIAGA_PRIMARY,
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 10,
    lineHeight: 14,
  },
  onlineDot: {
    backgroundColor: SIAGA_SUCCESS,
    borderCurve: "continuous",
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  operatorListeningState: {
    top: 91,
  },
  priorityAlert: {
    backgroundColor: SIAGA_PRIMARY_DARK,
    borderCurve: "continuous",
    borderRadius: 14,
    height: 67,
    left: 24,
    paddingHorizontal: 17,
    paddingVertical: 12,
    position: "absolute",
    top: 165,
    width: 342,
  },
  priorityBody: {
    color: WHITE,
    fontFamily: "PlusJakartaSans_800ExtraBold",
    fontSize: 17,
    lineHeight: 24,
  },
  priorityEyebrow: {
    color: WHITE,
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 10,
    lineHeight: 14,
  },
  promptEyebrow: {
    color: WHITE,
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 10,
    lineHeight: 14,
  },
  promptInstruction: {
    color: WHITE,
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 10,
    lineHeight: 15,
    marginTop: 6,
  },
  promptQuestion: {
    color: WHITE,
    fontFamily: "PlusJakartaSans_800ExtraBold",
    fontSize: 25,
    lineHeight: 38,
    marginTop: 10,
    maxWidth: 296,
  },
  pulseCore: {
    alignItems: "center",
    backgroundColor: WHITE,
    borderCurve: "continuous",
    borderRadius: 50,
    height: 100,
    justifyContent: "center",
    width: 100,
  },
  pulseInner: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.24)",
    borderCurve: "continuous",
    borderRadius: 79,
    height: 158,
    justifyContent: "center",
    width: 158,
  },
  pulseMiddle: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.16)",
    borderCurve: "continuous",
    borderRadius: 110,
    height: 220,
    justifyContent: "center",
    width: 220,
  },
  pulseOuter: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.09)",
    borderCurve: "continuous",
    borderRadius: 140,
    height: 280,
    justifyContent: "center",
    left: 55,
    position: "absolute",
    top: 176,
    width: 280,
  },
  secondaryChatAction: {
    alignItems: "center",
    borderColor: SIAGA_PRIMARY,
    borderCurve: "continuous",
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    height: 44,
    justifyContent: "center",
  },
  secondaryChatActionText: {
    color: SIAGA_PRIMARY,
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 10,
  },
  sendAction: {
    alignItems: "center",
    backgroundColor: SIAGA_PRIMARY,
    borderCurve: "continuous",
    borderRadius: 22,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  summaryCard: {
    backgroundColor: SIAGA_PANEL,
    borderColor: SIAGA_BORDER,
    borderCurve: "continuous",
    borderRadius: 14,
    borderWidth: 1,
    height: 172,
    left: 24,
    position: "absolute",
    top: 362,
    width: 342,
  },
  summaryLabel: {
    color: SIAGA_MUTED_STRONG,
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 10,
    left: 16,
    lineHeight: 14,
    position: "absolute",
    top: 14,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    left: 16,
    position: "absolute",
    width: 310,
  },
  summaryRowLabel: {
    color: SIAGA_MUTED_STRONG,
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 11,
    lineHeight: 16,
  },
  summaryRowValue: {
    color: SIAGA_BODY,
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 11,
    lineHeight: 16,
  },
  timer: {
    color: WHITE,
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 12,
    left: 164,
    lineHeight: 16,
    position: "absolute",
    textAlign: "center",
    top: 56,
    width: 62,
  },
  transcriptBody: {
    color: WHITE,
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 11,
    lineHeight: 18,
    marginTop: 14,
  },
  transcriptCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderColor: "rgba(255,255,255,0.14)",
    borderCurve: "continuous",
    borderRadius: 12,
    borderWidth: 1,
    height: 166,
    left: 24,
    padding: 16,
    position: "absolute",
    top: 500,
    width: 342,
  },
  transcriptLabel: {
    color: SIAGA_PRIMARY,
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 10,
    lineHeight: 14,
  },
  unitAdvice: {
    color: SIAGA_PRIMARY,
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 9,
    lineHeight: 14,
  },
  unitAvatar: {
    alignItems: "center",
    backgroundColor: SIAGA_PRIMARY,
    borderCurve: "continuous",
    borderRadius: 24,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  unitCard: {
    backgroundColor: SIAGA_PANEL,
    borderColor: SIAGA_BORDER,
    borderCurve: "continuous",
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
    height: 116,
    left: 24,
    padding: 18,
    position: "absolute",
    top: 242,
    width: 342,
  },
  unitCopy: {
    gap: 4,
  },
  unitMark: {
    color: WHITE,
    fontFamily: "PlusJakartaSans_800ExtraBold",
    fontSize: 18,
  },
  unitMeta: {
    color: SIAGA_MUTED_STRONG,
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 10,
    lineHeight: 15,
  },
  unitTitle: {
    color: SIAGA_BODY,
    fontFamily: "PlusJakartaSans_800ExtraBold",
    fontSize: 15,
    lineHeight: 20,
  },
  unitTopRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 16,
  },
  userBubble: {
    backgroundColor: SIAGA_SOFT,
  },
  voiceTextAction: {
    height: 48,
    left: 24,
    position: "absolute",
    top: 690,
    width: 342,
  },
  waveBar: {
    backgroundColor: SIAGA_PRIORITY,
    borderCurve: "continuous",
    borderRadius: 4,
    width: 8,
  },
  waveform: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    height: 102,
    left: 48,
    position: "absolute",
    top: 348,
    width: 288,
  },
});
