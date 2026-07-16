import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback } from "react";
import { Pressable, Text, View } from "react-native";

import { SiagaScreen } from "@/components/siaga-screen";
import { REPORT_MODES } from "@/features/emergency/content";
import { useIncident } from "@/features/emergency/context";
import type { ReportMode, ReportModeOption } from "@/features/emergency/types";

interface ReportModeCardProps {
  onSelect: (mode: ReportMode) => void;
  option: ReportModeOption;
}

function ReportModeCard({ onSelect, option }: ReportModeCardProps) {
  const isSilent = option.id === "silent";
  const handlePress = useCallback(() => {
    onSelect(option.id);
  }, [onSelect, option.id]);

  return (
    <Pressable
      accessibilityHint={option.body}
      accessibilityLabel={option.title}
      accessibilityRole="button"
      className={
        isSilent
          ? "h-[118px] flex-row items-center gap-5 rounded-[14px] border-[1.5px] border-siaga-primary bg-[#fff3f4] px-6"
          : "h-[118px] flex-row items-center gap-5 rounded-[14px] border border-siaga-border bg-white px-6"
      }
      onPress={handlePress}
    >
      <Ionicons color="#111111" name={option.icon} size={34} />
      <View className="flex-1 gap-2">
        <Text className="font-extrabold text-[16px] text-siaga-body">
          {option.title}
        </Text>
        <Text className="font-normal text-[10px] text-siaga-muted-strong leading-[14px]">
          {option.body}
        </Text>
      </View>
    </Pressable>
  );
}

export function ReportModeScreen() {
  const router = useRouter();
  const { setConnectionTarget, setMode } = useIncident();

  const handleSelectMode = useCallback(
    (mode: ReportMode) => {
      setConnectionTarget("ai");
      setMode(mode);
      router.push("/connecting");
    },
    [router, setConnectionTarget, setMode]
  );

  return (
    <SiagaScreen contentClassName="pt-16">
      <View className="gap-2">
        <Text className="font-bold text-[27px] text-siaga-ink leading-9">
          Bagaimana kamu ingin melapor?
        </Text>
        <Text className="font-normal text-[12px] text-siaga-muted">
          Pilih cara yang paling aman
        </Text>
      </View>

      <View className="mt-16 gap-4">
        {REPORT_MODES.map((option) => (
          <ReportModeCard
            key={option.id}
            onSelect={handleSelectMode}
            option={option}
          />
        ))}
      </View>
    </SiagaScreen>
  );
}
