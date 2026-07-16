import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Text, View } from "react-native";

import { SiagaScreen } from "@/components/siaga-screen";
import { useReporterReportsQuery } from "@/features/emergency/api";
import { TERMINAL_REPORT_STATUSES } from "@/features/emergency/derive-phase";
import {
  INCIDENT_TYPE_LABELS,
  REPORT_STATUS_LABELS,
} from "@/features/emergency/status-content";
import { useSiagaColor } from "@/lib/use-siaga-color";

const formatReportDate = (value: string): string =>
  new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

export function HistoryScreen() {
  const reportsQuery = useReporterReportsQuery();
  const primary = useSiagaColor("primary");
  const success = useSiagaColor("success");

  return (
    <SiagaScreen contentClassName="pt-[88px] pb-[140px]" isScrollable>
      <View className="gap-2">
        <Text className="font-bold text-[27px] text-siaga-ink leading-9">
          Riwayat laporan
        </Text>
        <Text className="text-[12px] text-siaga-muted">
          Laporan tersimpan aman di akun kamu.
        </Text>
      </View>

      <View className="mt-8 gap-4">
        {reportsQuery.isPending ? <ActivityIndicator color={primary} /> : null}
        {reportsQuery.isError ? (
          <Text className="text-center text-red-600 text-sm">
            Riwayat belum dapat dimuat. Periksa koneksi lalu coba lagi.
          </Text>
        ) : null}
        {reportsQuery.data?.length === 0 ? (
          <Text className="text-center text-siaga-muted text-sm">
            Belum ada laporan pada akun ini.
          </Text>
        ) : null}
        {reportsQuery.data?.map((report) => {
          const isTerminal = TERMINAL_REPORT_STATUSES.has(report.status);
          return (
            <View
              className="gap-4 rounded-[14px] border border-siaga-border bg-siaga-panel p-5"
              key={report.id}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                  <View
                    className={`size-11 items-center justify-center rounded-full ${
                      isTerminal ? "bg-siaga-success-soft" : "bg-red-50"
                    }`}
                  >
                    <Ionicons
                      color={isTerminal ? success : primary}
                      name={isTerminal ? "checkmark" : "alert"}
                      size={24}
                    />
                  </View>
                  <View className="max-w-[210px] gap-1">
                    <Text className="font-extrabold text-[15px] text-siaga-body">
                      {report.title ??
                        `Laporan ${report.id.slice(0, 8).toUpperCase()}`}
                    </Text>
                    <Text className="text-[11px] text-siaga-muted-strong">
                      {report.incidentType
                        ? INCIDENT_TYPE_LABELS[report.incidentType]
                        : "Belum diklasifikasi"}{" "}
                      · {formatReportDate(report.createdAt)}
                    </Text>
                  </View>
                </View>
                <Text
                  className={`font-semibold text-[11px] ${
                    isTerminal ? "text-siaga-success" : "text-siaga-primary"
                  }`}
                >
                  {REPORT_STATUS_LABELS[report.status]}
                </Text>
              </View>
              <View className="h-px bg-siaga-border-soft" />
              <Text className="text-[12px] text-siaga-muted-strong leading-5">
                {report.summary ??
                  "Laporan sudah diterima dan menunggu pembaruan penanganan."}
              </Text>
            </View>
          );
        })}
      </View>
    </SiagaScreen>
  );
}
