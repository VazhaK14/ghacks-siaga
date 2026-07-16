import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import { useCSSVariable } from "uniwind";

import { SiagaButton } from "@/components/siaga-button";
import { SiagaScreen } from "@/components/siaga-screen";
import {
  useAppendReporterTextMutation,
  useEndReporterSessionMutation,
  useReporterReportQuery,
  useSwitchReporterModeMutation,
} from "@/features/emergency/api";
import { LiveAudioRoom } from "@/features/emergency/components/live-audio-room";
import { useIncident } from "@/features/emergency/context";
import { useLiveLocationReporting } from "@/features/emergency/use-live-location-reporting";

export function SilentSessionScreen() {
  const router = useRouter();
  const { reportId } = useIncident();
  const reportQuery = useReporterReportQuery(reportId);
  const appendText = useAppendReporterTextMutation();
  const endSession = useEndReporterSessionMutation();
  const switchMode = useSwitchReporterModeMutation();
  const [draft, setDraft] = useState("");
  const placeholderColor = useCSSVariable("--color-neutral-600") as string;
  useLiveLocationReporting(reportId);

  const messages = useMemo(
    () => (reportQuery.data?.messages ?? []).slice(-4),
    [reportQuery.data?.messages]
  );

  const handleSend = useCallback(async () => {
    const content = draft.trim();
    if (!(content && reportId)) {
      return;
    }
    setDraft("");
    await appendText.mutateAsync({
      content,
      idempotencyKey: `silent-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      reportId,
    });
  }, [appendText, draft, reportId]);

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

  const handleEnd = useCallback(async () => {
    if (reportId) {
      await endSession.mutateAsync({ reportId });
    }
    router.replace("/dispatch");
  }, [endSession, reportId, router]);

  const content = (
    <SiagaScreen contentClassName="gap-5 pt-20 pb-12" isScrollable>
      <View className="gap-3 rounded-2xl border border-red-200 bg-red-50 p-5">
        <View className="flex-row items-center gap-3">
          <View className="size-11 items-center justify-center rounded-full bg-siaga-primary">
            <Ionicons color="#fff" name="mic" size={22} />
          </View>
          <View className="flex-1 gap-1">
            <Text className="font-extrabold text-lg text-siaga-ink">
              Mode senyap aktif
            </Text>
            <Text className="text-siaga-muted text-xs leading-5">
              Mikrofon aktif untuk mendengar lingkungan. Perangkat tidak memutar
              suara AI atau operator.
            </Text>
          </View>
        </View>
      </View>

      <View className="gap-3">
        {messages.map((message) => (
          <View
            className={`rounded-xl p-4 ${
              message.senderType === "REPORTER"
                ? "ml-8 bg-siaga-primary"
                : "mr-8 border border-siaga-border bg-siaga-panel"
            }`}
            key={message.id}
          >
            <Text
              className={
                message.senderType === "REPORTER"
                  ? "text-white"
                  : "text-siaga-body"
              }
            >
              {message.content}
            </Text>
          </View>
        ))}
      </View>

      <View className="flex-row items-center gap-2 rounded-xl border border-siaga-border bg-siaga-panel p-2">
        <TextInput
          accessibilityLabel="Pesan aman untuk SIAGA"
          className="min-h-12 flex-1 px-2 text-siaga-ink"
          multiline
          onChangeText={setDraft}
          placeholder="Ketik bila aman..."
          placeholderTextColor={placeholderColor}
          value={draft}
        />
        <Pressable
          accessibilityLabel="Kirim pesan"
          accessibilityRole="button"
          className="size-11 items-center justify-center rounded-full bg-siaga-primary"
          onPress={handleSend}
        >
          <Ionicons color="#fff" name="arrow-up" size={20} />
        </Pressable>
      </View>

      <View className="gap-3">
        <SiagaButton onPress={handleUseText} tone="outline">
          Pindah ke chat
        </SiagaButton>
        <SiagaButton isDisabled={endSession.isPending} onPress={handleEnd}>
          Akhiri komunikasi
        </SiagaButton>
      </View>
    </SiagaScreen>
  );

  if (!reportId) {
    return content;
  }

  return <LiveAudioRoom reportId={reportId}>{content}</LiveAudioRoom>;
}
