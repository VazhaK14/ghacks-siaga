import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import arrivalMap from "@/assets/images/arrival-map.png";
import dispatchMap from "@/assets/images/dispatch-map.png";
import { ReferenceCanvas } from "@/components/reference-canvas";
import { SiagaButton } from "@/components/siaga-button";
import {
  INITIAL_CHAT,
  SAFETY_INSTRUCTIONS,
} from "@/features/emergency/content";
import { useIncident } from "@/features/emergency/context";
import type { ChatMessage } from "@/features/emergency/types";

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
              <Ionicons color="#d72638" name="headset-outline" size={44} />
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
  const { cancelIncident, connectionTarget, mode, setPhase } = useIncident();
  const isOperator = connectionTarget === "operator";

  useEffect(() => {
    const timeout = setTimeout(() => {
      setPhase("active");
      router.replace(mode === "voice" ? "/voice-session" : "/chat");
    }, 2600);
    return () => clearTimeout(timeout);
  }, [mode, router, setPhase]);

  const handleCancel = useCallback(() => {
    cancelIncident();
    router.replace("/");
  }, [cancelIncident, router]);

  return (
    <ReferenceCanvas backgroundColor="#850817" testID="connecting-screen">
      <StatusBar style="light" />
      <PulseCore isOperator={isOperator} />
      <Text style={styles.connectingTitle}>
        {isOperator
          ? "Menghubungkan ke operator..."
          : "Menghubungkan ke\nSIAGA AI..."}
      </Text>
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
  const { connectionTarget, setPhase } = useIncident();
  const [seconds, setSeconds] = useState(18);
  const isOperator = connectionTarget === "operator";

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((current) => current + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleEndCall = useCallback(() => {
    setPhase("dispatched");
    router.replace("/dispatch");
  }, [router, setPhase]);

  return (
    <ReferenceCanvas backgroundColor="#12090b" testID="voice-session-screen">
      <StatusBar style="light" />
      <Text style={styles.timer}>{formatDuration(seconds)}</Text>
      {isOperator ? null : (
        <View style={styles.emergencyPrompt}>
          <Text style={styles.promptEyebrow}>PERTANYAAN PERTAMA</Text>
          <Text style={styles.promptQuestion}>Apa emergency kamu?</Text>
          <Text style={styles.promptInstruction}>
            Bicara senatural mungkin.
          </Text>
        </View>
      )}
      <Text
        style={[
          styles.listeningState,
          isOperator ? styles.operatorListeningState : null,
        ]}
      >
        {isOperator
          ? "KAMU SEDANG BERBICARA DENGAN OPERATOR"
          : "SIAGA AI SEDANG MENDENGARKAN"}
      </Text>
      <Waveform />
      {isOperator ? null : (
        <View style={styles.transcriptCard}>
          <Text style={styles.transcriptLabel}>TRANSKRIP LANGSUNG</Text>
          <Text style={styles.transcriptBody}>
            “Ada orang masuk rumah saya. Dia bawa pisau...”
          </Text>
        </View>
      )}
      <View style={styles.endCallAction}>
        <SiagaButton className="h-[52px]" onPress={handleEndCall}>
          Akhiri panggilan
        </SiagaButton>
      </View>
    </ReferenceCanvas>
  );
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
  const { setPhase } = useIncident();
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState(INITIAL_CHAT);

  const handleSend = useCallback(() => {
    const nextMessage = draft.trim();
    if (!nextMessage) {
      return;
    }
    setMessages((current) => [
      ...current,
      { id: `message-${current.length}`, message: nextMessage, sender: "KAMU" },
    ]);
    setDraft("");
  }, [draft]);

  const handleDispatch = useCallback(() => {
    setPhase("dispatched");
    router.replace("/dispatch");
  }, [router, setPhase]);

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
            <Text style={styles.chatStatus}>Terhubung privat</Text>
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
          placeholderTextColor="#8e8e8e"
          returnKeyType="send"
          style={styles.chatInput}
          value={draft}
        />
        <Pressable
          accessibilityLabel="Kirim pesan"
          accessibilityRole="button"
          onLongPress={handleDispatch}
          onPress={handleSend}
          style={styles.sendAction}
        >
          <Ionicons color="#ffffff" name="arrow-up" size={22} />
        </Pressable>
      </View>
    </ReferenceCanvas>
  );
}

export function DispatchScreen() {
  const router = useRouter();
  const { setPhase } = useIncident();

  const handleArrival = useCallback(() => {
    setPhase("arrived");
    router.replace("/arrival");
  }, [router, setPhase]);

  const handleOpenChat = useCallback(() => {
    router.push("/chat");
  }, [router]);

  return (
    <ReferenceCanvas testID="dispatch-screen">
      <Text style={styles.flowTitle}>Bantuan sedang dikirim</Text>
      <Text style={styles.dispatchSubtitle}>
        Polisi 07 sedang menuju lokasi Anda.
      </Text>
      <View style={styles.priorityAlert}>
        <Text style={styles.priorityEyebrow}>PRIORITAS TINGGI</Text>
        <Text style={styles.priorityBody}>Jangan keluar dari kamar.</Text>
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
          <Text style={styles.etaText}>ETA: 4 menit</Text>
        </View>
      </View>
      <Pressable
        accessibilityLabel="Buka chat"
        accessibilityRole="button"
        onPress={handleOpenChat}
        style={styles.chatShortcut}
      >
        <Ionicons color="#d72638" name="chatbox-outline" size={30} />
      </Pressable>
      <View style={styles.dispatchAction}>
        <SiagaButton onPress={handleArrival}>
          Saya melihat bantuan datang
        </SiagaButton>
      </View>
    </ReferenceCanvas>
  );
}

export function ArrivalScreen() {
  const router = useRouter();
  const { completeIncident } = useIncident();

  const handleComplete = useCallback(() => {
    completeIncident();
    router.replace("/complete");
  }, [completeIncident, router]);

  const handleOpenChat = useCallback(() => {
    router.push("/chat");
  }, [router]);

  return (
    <ReferenceCanvas testID="arrival-screen">
      <Text style={styles.flowTitle}>Bantuan sudah tiba</Text>
      <Text style={styles.arrivalSubtitle}>
        Polisi 07 berada di depan lokasi.
      </Text>
      <View style={styles.arrivedBadge}>
        <View style={styles.arrivedDot} />
        <Text style={styles.arrivedText}>Polisi 07 · tiba 19:46</Text>
      </View>
      <View style={styles.unitCard}>
        <View style={styles.unitTopRow}>
          <View style={styles.unitAvatar}>
            <Text style={styles.unitMark}>P</Text>
          </View>
          <View style={styles.unitCopy}>
            <Text style={styles.unitTitle}>Polisi 07</Text>
            <Text style={styles.unitMeta}>Petugas: A. Putra · unit P-12</Text>
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
        <Ionicons color="#d72638" name="chatbox-outline" size={30} />
      </Pressable>
      <View style={styles.dispatchAction}>
        <SiagaButton onPress={handleComplete}>
          Saya sudah bersama petugas
        </SiagaButton>
      </View>
    </ReferenceCanvas>
  );
}

export function CompleteScreen() {
  const router = useRouter();
  const { cancelIncident } = useIncident();

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
          <Ionicons color="#ffffff" name="checkmark" size={58} />
        </View>
      </View>
      <Text style={styles.completeTitle}>Kamu sudah aman</Text>
      <Text style={styles.completeSubtitle}>
        Laporan SOS-1048 telah selesai dan tersimpan.
      </Text>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>RINGKASAN</Text>
        <SummaryRow label="Durasi" top={48} value="4 menit" />
        <SummaryRow label="Bantuan" top={84} value="Polisi 07" />
        <SummaryRow label="Status" top={120} value="Selesai · 19:47" />
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
    backgroundColor: "#ffffff",
  },
  aiMark: {
    color: "#d72638",
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
    color: "#71696a",
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 12,
    left: 24,
    lineHeight: 16,
    position: "absolute",
    top: 130,
  },
  arrivedBadge: {
    alignItems: "center",
    backgroundColor: "#eaf7f0",
    borderColor: "#cde2d7",
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
    backgroundColor: "#2e8b64",
    borderCurve: "continuous",
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  arrivedText: {
    color: "#2e8b64",
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 11,
  },
  cancelAction: {
    alignItems: "center",
    borderColor: "#ffffff",
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
    color: "#ffffff",
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 13,
    lineHeight: 18,
  },
  chatAvatar: {
    alignItems: "center",
    backgroundColor: "#d72638",
    borderCurve: "continuous",
    borderRadius: 22,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  chatComposer: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#ded7d3",
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
    backgroundColor: "#ffffff",
    borderColor: "#ded7d3",
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
    color: "#241f20",
    flex: 1,
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 11,
    height: 44,
    paddingHorizontal: 6,
  },
  chatMark: {
    color: "#ffffff",
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 24,
  },
  chatShortcut: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#d72638",
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
    color: "#776f72",
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
    color: "#241f20",
    fontFamily: "PlusJakartaSans_800ExtraBold",
    fontSize: 16,
    lineHeight: 20,
  },
  completeCore: {
    alignItems: "center",
    backgroundColor: "#2e8b64",
    borderCurve: "continuous",
    borderRadius: 50,
    height: 100,
    justifyContent: "center",
    width: 100,
  },
  completeHalo: {
    alignItems: "center",
    backgroundColor: "#eaf7f0",
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
    color: "#71696a",
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
    color: "#201b1c",
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
    color: "#ffffff",
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 26,
    left: 32,
    lineHeight: 35,
    position: "absolute",
    textAlign: "center",
    top: 488,
    width: 326,
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
    color: "#71696a",
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 12,
    left: 24,
    lineHeight: 16,
    position: "absolute",
    top: 128,
  },
  emergencyPrompt: {
    backgroundColor: "#d72638",
    borderCurve: "continuous",
    borderRadius: 14,
    experimental_backgroundImage:
      "linear-gradient(135deg, #d72638 0%, #850817 100%)",
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
    backgroundColor: "#ffffff",
    borderCurve: "continuous",
    borderRadius: 8,
    left: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    position: "absolute",
    top: 12,
  },
  etaText: {
    color: "#241f20",
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 10,
  },
  flowTitle: {
    color: "#201b1c",
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
    backgroundColor: "#ffffff",
    borderColor: "#ded7d3",
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
    backgroundColor: "#fff0f1",
    borderCurve: "continuous",
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  instructionNumberText: {
    color: "#d72638",
    fontFamily: "PlusJakartaSans_800ExtraBold",
    fontSize: 14,
  },
  instructionText: {
    color: "#241f20",
    flex: 1,
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 11,
    lineHeight: 16,
  },
  listeningState: {
    color: "#d72638",
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
    color: "#241f20",
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 12,
    lineHeight: 18,
  },
  messageBubble: {
    borderColor: "#ded7d3",
    borderCurve: "continuous",
    borderRadius: 14,
    borderWidth: 1,
    gap: 9,
    padding: 14,
    position: "absolute",
  },
  messageSender: {
    color: "#d72638",
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 10,
    lineHeight: 14,
  },
  onlineDot: {
    backgroundColor: "#2e8b64",
    borderCurve: "continuous",
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  operatorListeningState: {
    top: 91,
  },
  priorityAlert: {
    backgroundColor: "#7a0c18",
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
    color: "#ffffff",
    fontFamily: "PlusJakartaSans_800ExtraBold",
    fontSize: 17,
    lineHeight: 24,
  },
  priorityEyebrow: {
    color: "#ffffff",
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 10,
    lineHeight: 14,
  },
  promptEyebrow: {
    color: "#ffffff",
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 10,
    lineHeight: 14,
  },
  promptInstruction: {
    color: "#ffffff",
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 10,
    lineHeight: 15,
    marginTop: 6,
  },
  promptQuestion: {
    color: "#ffffff",
    fontFamily: "PlusJakartaSans_800ExtraBold",
    fontSize: 25,
    lineHeight: 38,
    marginTop: 10,
    maxWidth: 296,
  },
  pulseCore: {
    alignItems: "center",
    backgroundColor: "#ffffff",
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
  sendAction: {
    alignItems: "center",
    backgroundColor: "#d72638",
    borderCurve: "continuous",
    borderRadius: 22,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  summaryCard: {
    backgroundColor: "#ffffff",
    borderColor: "#ded7d3",
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
    color: "#776f72",
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
    color: "#776f72",
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 11,
    lineHeight: 16,
  },
  summaryRowValue: {
    color: "#241f20",
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 11,
    lineHeight: 16,
  },
  timer: {
    color: "#ffffff",
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
    color: "#ffffff",
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
    height: 221,
    left: 24,
    padding: 16,
    position: "absolute",
    top: 500,
    width: 342,
  },
  transcriptLabel: {
    color: "#d72638",
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 10,
    lineHeight: 14,
  },
  unitAdvice: {
    color: "#d72638",
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 9,
    lineHeight: 14,
  },
  unitAvatar: {
    alignItems: "center",
    backgroundColor: "#920b1a",
    borderCurve: "continuous",
    borderRadius: 24,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  unitCard: {
    backgroundColor: "#ffffff",
    borderColor: "#ded7d3",
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
    color: "#ffffff",
    fontFamily: "PlusJakartaSans_800ExtraBold",
    fontSize: 18,
  },
  unitMeta: {
    color: "#776f72",
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 10,
    lineHeight: 15,
  },
  unitTitle: {
    color: "#241f20",
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
    backgroundColor: "#fff0f1",
  },
  waveBar: {
    backgroundColor: "#e5161c",
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
