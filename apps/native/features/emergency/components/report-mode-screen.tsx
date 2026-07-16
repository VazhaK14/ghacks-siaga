import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ReferenceCanvas } from "@/components/reference-canvas";
import { REPORT_MODES } from "@/features/emergency/content";
import { useIncident } from "@/features/emergency/context";
import type { ReportMode, ReportModeOption } from "@/features/emergency/types";

const CARD_TOPS = [270, 404, 538] as const;

interface ReportModeCardProps {
  index: number;
  onSelect: (mode: ReportMode) => void;
  option: ReportModeOption;
}

function ReportModeCard({ index, onSelect, option }: ReportModeCardProps) {
  const handlePress = useCallback(() => {
    onSelect(option.id);
  }, [onSelect, option.id]);
  const top = CARD_TOPS[index];

  if (top === undefined) {
    return null;
  }

  return (
    <Pressable
      accessibilityHint={option.body}
      accessibilityLabel={option.title}
      accessibilityRole="button"
      onPress={handlePress}
      style={[
        styles.card,
        { top },
        option.id === "silent" ? styles.silentCard : null,
      ]}
    >
      <Ionicons color="#111111" name={option.icon} size={34} />
      <View style={styles.cardCopy}>
        <Text style={styles.cardTitle}>{option.title}</Text>
        <Text style={styles.cardBody}>{option.body}</Text>
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

  const handleOperator = useCallback(() => {
    setConnectionTarget("operator");
    setMode("voice");
    router.push("/connecting");
  }, [router, setConnectionTarget, setMode]);

  return (
    <ReferenceCanvas testID="report-mode-screen">
      <Text style={styles.title}>Bagaimana kamu ingin melapor?</Text>
      <Text style={styles.subtitle}>Pilih cara yang paling aman</Text>
      {REPORT_MODES.map((option, index) => (
        <ReportModeCard
          index={index}
          key={option.id}
          onSelect={handleSelectMode}
          option={option}
        />
      ))}
      <Pressable
        accessibilityHint="Melewati SIAGA AI dan menghubungkan panggilan suara"
        accessibilityRole="button"
        onPress={handleOperator}
        style={styles.operatorAction}
      >
        <Ionicons color="#870000" name="headset-outline" size={19} />
        <Text style={styles.operatorLabel}>Hubungkan ke operator 112</Text>
      </Pressable>
    </ReferenceCanvas>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#ded7d3",
    borderCurve: "continuous",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 20,
    height: 118,
    left: 24,
    paddingHorizontal: 24,
    position: "absolute",
    width: 342,
  },
  cardBody: {
    color: "#776f72",
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 10,
    lineHeight: 14,
    maxWidth: 210,
  },
  cardCopy: {
    flex: 1,
    gap: 7,
  },
  cardTitle: {
    color: "#241f20",
    fontFamily: "PlusJakartaSans_800ExtraBold",
    fontSize: 16,
    lineHeight: 22,
  },
  operatorAction: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    height: 48,
    justifyContent: "center",
    left: 24,
    position: "absolute",
    top: 682,
    width: 342,
  },
  operatorLabel: {
    color: "#870000",
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 12,
    lineHeight: 18,
  },
  silentCard: {
    backgroundColor: "#fff3f4",
    borderColor: "#d72638",
    borderWidth: 1.5,
  },
  subtitle: {
    color: "#71696a",
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 12,
    left: 24,
    lineHeight: 16,
    position: "absolute",
    top: 190,
    width: 342,
  },
  title: {
    color: "#201b1c",
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 27,
    left: 24,
    lineHeight: 36,
    position: "absolute",
    top: 112,
    width: 342,
  },
});
