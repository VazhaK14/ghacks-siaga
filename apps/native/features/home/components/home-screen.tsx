import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useMemo } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { SiagaButton } from "@/components/siaga-button";
import { SiagaScreen } from "@/components/siaga-screen";
import { useReporterReportsQuery } from "@/features/emergency/api";
import { REPORT_MODES } from "@/features/emergency/content";
import { useIncident } from "@/features/emergency/context";
import { ACTIVE_REPORT_STATUSES } from "@/features/emergency/derive-phase";
import { resumeActiveReport } from "@/features/emergency/resume-active-report";
import { REPORT_STATUS_LABELS } from "@/features/emergency/status-content";
import { useProfile } from "@/features/profile/context";
import { authClient } from "@/lib/auth-client";
import { useSiagaColor } from "@/lib/use-siaga-color";

const MORNING_HOUR_END = 11;
const AFTERNOON_HOUR_END = 15;
const EVENING_HOUR_END = 19;

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < MORNING_HOUR_END) {
    return "Selamat pagi";
  }
  if (hour < AFTERNOON_HOUR_END) {
    return "Selamat siang";
  }
  if (hour < EVENING_HOUR_END) {
    return "Selamat sore";
  }
  return "Selamat malam";
}

export function HomeScreen() {
  const router = useRouter();
  const session = authClient.useSession();
  const incident = useIncident();
  const { hasCompletedSetup, isHydrated } = useProfile();
  const reportsQuery = useReporterReportsQuery();
  const primary = useSiagaColor("primary");

  const activeReport = useMemo(
    () =>
      reportsQuery.data?.find((report) =>
        ACTIVE_REPORT_STATUSES.has(report.status)
      ) ?? null,
    [reportsQuery.data]
  );

  const handleResumeActiveReport = useCallback(() => {
    if (activeReport) {
      resumeActiveReport(activeReport, incident, router);
    }
  }, [activeReport, incident, router]);

  const handleCompleteProfile = useCallback(() => {
    router.push("/(tabs)/profile");
  }, [router]);

  const handleStartSos = useCallback(() => {
    router.push("/sos");
  }, [router]);

  const firstName = session.data?.user.name?.split(" ")[0];
  const greeting = firstName ? `${getGreeting()}, ${firstName}` : getGreeting();

  return (
    <SiagaScreen contentClassName="gap-6 pt-[88px] pb-[160px]" isScrollable>
      <View className="gap-1">
        <Text className="text-[13px] text-siaga-muted">{greeting}</Text>
        <Text className="font-bold text-[27px] text-siaga-ink leading-9">
          Selamat datang di SIAGA
        </Text>
      </View>

      {reportsQuery.isPending ? <ActivityIndicator color={primary} /> : null}

      {activeReport ? (
        <View className="gap-4 rounded-[14px] border border-siaga-border bg-siaga-panel p-5">
          <View className="flex-row items-center gap-3">
            <View className="size-11 items-center justify-center rounded-full bg-red-50">
              <Ionicons color={primary} name="pulse" size={24} />
            </View>
            <View className="flex-1 gap-1">
              <Text className="font-extrabold text-[15px] text-siaga-body">
                {activeReport.title ??
                  `Laporan ${activeReport.id.slice(0, 8).toUpperCase()}`}
              </Text>
              <Text className="text-[11px] text-siaga-muted-strong">
                Status: {REPORT_STATUS_LABELS[activeReport.status]}
              </Text>
            </View>
          </View>
          <Text className="text-[12px] text-siaga-muted-strong leading-5">
            {activeReport.summary ??
              "Laporan sedang diproses. Ketuk untuk melihat status terbaru."}
          </Text>
          <SiagaButton onPress={handleResumeActiveReport}>
            Lihat Status
          </SiagaButton>
        </View>
      ) : null}

      {isHydrated && !hasCompletedSetup ? (
        <View className="gap-3 rounded-[14px] border border-siaga-border bg-siaga-soft p-5">
          <View className="flex-row items-center gap-3">
            <Ionicons color={primary} name="person-add" size={22} />
            <Text className="flex-1 font-extrabold text-[15px] text-siaga-primary">
              Lengkapi profil darurat kamu
            </Text>
          </View>
          <Text className="text-[12px] text-siaga-primary leading-5">
            Data ini membantu petugas memberi bantuan yang tepat saat darurat.
          </Text>
          <SiagaButton onPress={handleCompleteProfile} tone="outline">
            Lengkapi Sekarang
          </SiagaButton>
        </View>
      ) : null}

      <View className="gap-3">
        <Text className="font-bold text-[18px] text-siaga-ink">
          Cara melapor darurat
        </Text>
        {REPORT_MODES.map((mode) => (
          <Pressable
            accessibilityRole="button"
            className="flex-row items-center gap-4 rounded-[14px] border border-siaga-border bg-siaga-panel p-4"
            key={mode.id}
            onPress={handleStartSos}
          >
            <View className="size-11 items-center justify-center rounded-full bg-siaga-soft">
              <Ionicons color={primary} name={mode.icon} size={22} />
            </View>
            <View className="flex-1 gap-1">
              <Text className="font-extrabold text-[14px] text-siaga-body">
                {mode.title}
              </Text>
              <Text className="text-[11px] text-siaga-muted-strong leading-4">
                {mode.body}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>
    </SiagaScreen>
  );
}
