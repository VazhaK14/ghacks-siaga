import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";

import arrivalMap from "@/assets/images/arrival-map.png";
import dispatchMap from "@/assets/images/dispatch-map.png";
import { SiagaButton } from "@/components/siaga-button";
import { SiagaScreen } from "@/components/siaga-screen";
import {
  INITIAL_CHAT,
  SAFETY_INSTRUCTIONS,
} from "@/features/emergency/content";
import { useIncident } from "@/features/emergency/context";
import type { ChatMessage } from "@/features/emergency/types";

const WAVE_BARS = [
  { height: 30, id: "a" },
  { height: 48, id: "b" },
  { height: 66, id: "c" },
  { height: 82, id: "d" },
  { height: 98, id: "e" },
  { height: 72, id: "f" },
  { height: 54, id: "g" },
  { height: 38, id: "h" },
  { height: 45, id: "i" },
  { height: 64, id: "j" },
  { height: 86, id: "k" },
  { height: 100, id: "l" },
  { height: 78, id: "m" },
  { height: 55, id: "n" },
  { height: 34, id: "o" },
];

const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const remainingSeconds = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainingSeconds}`;
};

function PulseCore({ isOperator }: { isOperator: boolean }) {
  return (
    <View className="size-[280px] items-center justify-center rounded-full bg-white/10">
      <View className="size-[220px] items-center justify-center rounded-full bg-white/15">
        <View className="size-[158px] items-center justify-center rounded-full bg-white/20">
          <View className="size-[100px] items-center justify-center rounded-full bg-white">
            <Ionicons
              color="#d72638"
              name={isOperator ? "headset-outline" : "sparkles"}
              size={44}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

function Waveform() {
  return (
    <View
      accessibilityLabel="Visualisasi suara aktif"
      className="h-[120px] flex-row items-center justify-center gap-2"
    >
      {WAVE_BARS.map((bar) => (
        <View
          className="w-2 rounded-full bg-siaga-primary"
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
    connectionTarget,
    mode,
    setConnectionTarget,
    setPhase,
  } = useIncident();
  const isOperator = connectionTarget === "operator";

  useEffect(() => {
    const timeout = setTimeout(() => {
      setPhase("active");
      router.replace(mode === "voice" ? "/voice-session" : "/chat");
    }, 1800);
    return () => clearTimeout(timeout);
  }, [mode, router, setPhase]);

  const handleCancel = useCallback(() => {
    cancelIncident();
    router.replace("/");
  }, [cancelIncident, router]);

  const handleOperatorFallback = useCallback(() => {
    setConnectionTarget("operator");
  }, [setConnectionTarget]);

  return (
    <SiagaScreen
      contentClassName="items-center justify-center"
      footer={
        <View className="gap-2 px-16 pb-6">
          <SiagaButton onPress={handleCancel} tone="outline">
            Batalkan SOS
          </SiagaButton>
          {isOperator ? null : (
            <Pressable
              accessibilityRole="button"
              className="items-center py-2"
              onPress={handleOperatorFallback}
            >
              <Text className="font-semibold text-[12px] text-white/80">
                Hubungkan ke operator manusia
              </Text>
            </Pressable>
          )}
        </View>
      }
      isDark
    >
      <StatusBar style="light" />
      <PulseCore isOperator={isOperator} />
      <Text className="mt-8 max-w-[326px] text-center font-bold text-[26px] text-white leading-[35px]">
        {isOperator
          ? "Menghubungkan ke operator..."
          : "Menghubungkan ke SIAGA AI..."}
      </Text>
    </SiagaScreen>
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
    <SiagaScreen
      className="bg-[#12090b]"
      contentClassName="items-center"
      footer={
        <View className="px-6 pb-6">
          <SiagaButton onPress={handleEndCall}>Akhiri panggilan</SiagaButton>
        </View>
      }
      isDark
    >
      <StatusBar style="light" />
      <Text className="font-semibold text-[12px] text-white">
        {formatDuration(seconds)}
      </Text>

      {isOperator ? null : (
        <View className="mt-6 w-full gap-3 rounded-[14px] bg-gradient-to-br from-[#d72638] to-[#850817] p-5">
          <Text className="font-semibold text-[10px] text-white">
            PERTANYAAN PERTAMA
          </Text>
          <Text className="font-extrabold text-[25px] text-white leading-8">
            Apa emergency kamu?
          </Text>
          <Text className="text-[10px] text-white">
            Bicara senatural mungkin.
          </Text>
        </View>
      )}

      <Text className="mt-8 font-semibold text-[10px] text-siaga-primary">
        {isOperator
          ? "KAMU SEDANG BERBICARA DENGAN OPERATOR"
          : "SIAGA AI SEDANG MENDENGARKAN"}
      </Text>

      <View className="flex-1 items-center justify-center">
        <Waveform />
      </View>

      {isOperator ? null : (
        <View className="mb-4 min-h-[150px] w-full gap-4 rounded-[12px] border border-white/10 bg-white/5 p-4">
          <Text className="font-semibold text-[10px] text-siaga-primary">
            TRANSKRIP LANGSUNG
          </Text>
          <Text className="text-[12px] text-white leading-5">
            “Ada orang masuk rumah saya. Dia bawa pisau...”
          </Text>
        </View>
      )}
    </SiagaScreen>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.sender === "KAMU";
  return (
    <View
      className={
        isUser
          ? "ml-16 gap-2 rounded-[14px] border border-siaga-border bg-siaga-soft p-4"
          : "mr-12 gap-2 rounded-[14px] border border-siaga-border bg-white p-4"
      }
    >
      <Text className="font-semibold text-[10px] text-siaga-primary">
        {message.sender}
      </Text>
      <Text className="text-[13px] text-siaga-body leading-5">
        {message.message}
      </Text>
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
    <SiagaScreen
      contentClassName="px-4 py-5"
      footer={
        <View className="gap-3 border-siaga-border border-t bg-siaga-surface px-4 pt-3 pb-4">
          <View className="h-[58px] flex-row items-center gap-3 rounded-[14px] border border-siaga-border bg-white px-4">
            <TextInput
              accessibilityLabel="Tulis perubahan situasi"
              className="flex-1 font-normal text-[13px] text-siaga-body"
              onChangeText={setDraft}
              onSubmitEditing={handleSend}
              placeholder="Tulis perubahan situasi..."
              placeholderTextColor="#8e8e8e"
              returnKeyType="send"
              value={draft}
            />
            <Pressable
              accessibilityLabel="Kirim pesan"
              accessibilityRole="button"
              className="size-11 items-center justify-center rounded-full bg-siaga-primary"
              onPress={handleSend}
            >
              <Ionicons color="#ffffff" name="arrow-up" size={22} />
            </Pressable>
          </View>
          <Pressable
            accessibilityRole="button"
            className="items-center py-1"
            onPress={handleDispatch}
          >
            <Text className="font-semibold text-[12px] text-siaga-primary">
              Lihat status bantuan
            </Text>
          </Pressable>
        </View>
      }
    >
      <View className="mb-4 flex-row items-center gap-3 rounded-[14px] border border-siaga-border bg-white p-4">
        <View className="size-11 items-center justify-center rounded-full bg-siaga-primary">
          <Ionicons color="#ffffff" name="sparkles" size={22} />
        </View>
        <View className="gap-1">
          <Text className="font-extrabold text-[16px] text-siaga-body">
            SIAGA
          </Text>
          <Text className="text-[11px] text-siaga-success">
            ● Terhubung privat
          </Text>
        </View>
      </View>
      <ScrollView
        contentContainerClassName="gap-3 pb-4"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
      </ScrollView>
    </SiagaScreen>
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
    <SiagaScreen contentClassName="pt-10">
      <Text className="font-bold text-[29px] text-siaga-ink leading-9">
        Bantuan sedang dikirim
      </Text>
      <Text className="text-[12px] text-siaga-muted">
        Polisi 07 sedang menuju lokasi Anda.
      </Text>

      <View className="mt-5 gap-0 rounded-[14px] bg-siaga-priority p-4">
        <Text className="font-semibold text-[10px] text-white">
          PRIORITAS TINGGI
        </Text>
        <Text className="font-extrabold text-[18px] text-white leading-6">
          Jangan keluar dari kamar.
        </Text>
      </View>

      <View className="mt-5 gap-3">
        {SAFETY_INSTRUCTIONS.map((instruction, index) => (
          <View
            className="h-[66px] flex-row items-center gap-3 rounded-[14px] border border-siaga-border bg-white px-4"
            key={instruction.id}
          >
            <View className="size-9 items-center justify-center rounded-full bg-siaga-soft">
              <Text className="font-extrabold text-[14px] text-siaga-primary">
                {index + 1}
              </Text>
            </View>
            <Text className="flex-1 font-semibold text-[12px] text-siaga-body">
              {instruction.text}
            </Text>
          </View>
        ))}
      </View>

      <View className="mt-5 flex-1 overflow-hidden rounded-[14px]">
        <Image contentFit="cover" source={dispatchMap} style={{ flex: 1 }} />
        <View className="absolute top-3 left-3 rounded-lg bg-white px-3 py-2">
          <Text className="font-semibold text-[10px] text-siaga-body">
            ETA: 4 menit
          </Text>
        </View>
      </View>

      <View className="mt-5 flex-row gap-2">
        <Pressable
          accessibilityLabel="Buka chat"
          accessibilityRole="button"
          className="size-[54px] items-center justify-center rounded-xl border border-siaga-primary bg-white"
          onPress={handleOpenChat}
        >
          <Ionicons color="#d72638" name="chatbox-outline" size={28} />
        </Pressable>
        <SiagaButton className="flex-1" onPress={handleArrival}>
          Saya melihat bantuan datang
        </SiagaButton>
      </View>
    </SiagaScreen>
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
    <SiagaScreen contentClassName="pt-10">
      <Text className="font-bold text-[28px] text-siaga-ink leading-[38px]">
        Bantuan sudah tiba
      </Text>
      <Text className="text-[12px] text-siaga-muted">
        Polisi 07 berada di depan lokasi.
      </Text>

      <View className="mt-5 h-10 flex-row items-center gap-3 rounded-lg border border-siaga-border bg-siaga-success-soft px-3">
        <View className="size-2.5 rounded-full bg-siaga-success" />
        <Text className="font-semibold text-[11px] text-siaga-success">
          Polisi 07 · tiba 19:46
        </Text>
      </View>

      <View className="mt-5 gap-3 rounded-[14px] border border-siaga-border bg-white p-4">
        <View className="flex-row items-center gap-4">
          <View className="size-12 items-center justify-center rounded-full bg-[#920b1a]">
            <Text className="font-extrabold text-[18px] text-white">P</Text>
          </View>
          <View className="gap-1">
            <Text className="font-extrabold text-[15px] text-siaga-body">
              Polisi 07
            </Text>
            <Text className="text-[11px] text-siaga-muted-strong">
              Petugas: A. Putra · unit P-12
            </Text>
          </View>
        </View>
        <Text className="font-semibold text-[10px] text-siaga-primary">
          Pastikan identitas petugas sebelum membuka pintu.
        </Text>
      </View>

      <View className="mt-5 flex-1 overflow-hidden rounded-[14px]">
        <Image contentFit="cover" source={arrivalMap} style={{ flex: 1 }} />
      </View>

      <View className="mt-5 flex-row gap-2">
        <Pressable
          accessibilityLabel="Buka chat"
          accessibilityRole="button"
          className="size-[54px] items-center justify-center rounded-xl border border-siaga-primary bg-white"
          onPress={handleOpenChat}
        >
          <Ionicons color="#d72638" name="chatbox-outline" size={28} />
        </Pressable>
        <SiagaButton className="flex-1" onPress={handleComplete}>
          Saya sudah bersama petugas
        </SiagaButton>
      </View>
    </SiagaScreen>
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
    <SiagaScreen contentClassName="items-center pt-10">
      <View className="size-40 items-center justify-center rounded-full bg-siaga-success-soft">
        <View className="size-[100px] items-center justify-center rounded-full bg-siaga-success">
          <Ionicons color="#ffffff" name="checkmark" size={58} />
        </View>
      </View>

      <Text className="mt-6 text-center font-bold text-[28px] text-siaga-ink">
        Kamu sudah aman
      </Text>
      <Text className="mt-2 text-center text-[12px] text-siaga-muted">
        Laporan SOS-1048 telah selesai dan tersimpan.
      </Text>

      <View className="mt-8 w-full gap-5 rounded-[14px] border border-siaga-border bg-white p-5">
        <Text className="text-[10px] text-siaga-muted-strong">RINGKASAN</Text>
        <View className="flex-row justify-between">
          <Text className="text-[12px] text-siaga-muted-strong">Durasi</Text>
          <Text className="font-semibold text-[12px] text-siaga-body">
            4 menit
          </Text>
        </View>
        <View className="flex-row justify-between">
          <Text className="text-[12px] text-siaga-muted-strong">Bantuan</Text>
          <Text className="font-semibold text-[12px] text-siaga-body">
            Polisi 07
          </Text>
        </View>
        <View className="flex-row justify-between">
          <Text className="text-[12px] text-siaga-muted-strong">Status</Text>
          <Text className="font-semibold text-[12px] text-siaga-body">
            Selesai · 19:47
          </Text>
        </View>
      </View>

      <View className="mt-auto w-full gap-3">
        <SiagaButton onPress={handleHome}>Kembali ke halaman utama</SiagaButton>
        <SiagaButton onPress={handleHistory} tone="outline">
          Lihat riwayat laporan
        </SiagaButton>
      </View>
    </SiagaScreen>
  );
}
