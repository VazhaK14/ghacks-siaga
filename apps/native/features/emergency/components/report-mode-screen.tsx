import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback } from "react";
import { Pressable, Text, View } from "react-native";

import { SiagaScreen } from "@/components/siaga-screen";
import { REPORT_MODES } from "@/features/emergency/content";
import { useIncident } from "@/features/emergency/context";
import type { ReportMode, ReportModeOption } from "@/features/emergency/types";
import { useSiagaColor } from "@/lib/use-siaga-color";

interface ReportModeCardProps {
  onSelect: (mode: ReportMode) => void;
  option: ReportModeOption;
}

function ReportModeCard({ onSelect, option }: ReportModeCardProps) {
  const bodyColor = useSiagaColor("body");
  const handlePress = useCallback(() => {
    onSelect(option.id);
  }, [onSelect, option.id]);

  return (
    <Pressable
      accessibilityHint={option.body}
      accessibilityLabel={option.title}
      accessibilityRole="button"
      className={`flex-row items-center gap-5 rounded-2xl border bg-siaga-panel px-6 py-6 ${
        option.id === "silent"
          ? "border-[1.5px] border-siaga-primary bg-siaga-soft"
          : "border-siaga-border"
      }`}
      onPress={handlePress}
    >
      <Ionicons color={bodyColor} name={option.icon} size={34} />
      <View className="flex-1 gap-2">
        <Text className="font-extrabold text-[16px] text-siaga-body">
          {option.title}
        </Text>
        <Text className="text-[11px] text-siaga-muted-strong leading-4">
          {option.body}
        </Text>
      </View>
    </Pressable>
  );
}

export function ReportModeScreen() {
  const router = useRouter();
  const primary = useSiagaColor("primary");
  const { setConnectionTarget, setMode } = useIncident();

  const handleSelectMode = useCallback(
    (mode: ReportMode) => {
      setConnectionTarget("ai");
      setMode(mode);
      router.push("/connecting");
    },
    [router, setConnectionTarget, setMode]
  );

  const handleOperator = useCallback(() => {
    setConnectionTarget("operator");
    setMode("voice");
    router.push("/connecting");
  }, [router, setConnectionTarget, setMode]);

  return (
    <SiagaScreen contentClassName="gap-6 pt-16 pb-12" isScrollable>
      <View className="gap-1">
        <Text className="font-bold text-[27px] text-siaga-ink leading-9">
          Bagaimana kamu ingin melapor?
        </Text>
        <Text className="text-[12px] text-siaga-muted">
          Pilih cara yang paling aman
        </Text>
      </View>

      <View className="gap-4">
        {REPORT_MODES.map((option) => (
          <ReportModeCard
            key={option.id}
            onSelect={handleSelectMode}
            option={option}
          />
        ))}
      </View>

      <Pressable
        accessibilityHint="Melewati SIAGA AI dan menghubungkan panggilan suara"
        accessibilityRole="button"
        className="flex-row items-center justify-center gap-2 py-3"
        onPress={handleOperator}
      >
        <Ionicons color={primary} name="headset-outline" size={19} />
        <Text className="font-semibold text-[12px] text-siaga-primary">
          Hubungkan ke operator 112
        </Text>
      </Pressable>
    </SiagaScreen>
  );
}
