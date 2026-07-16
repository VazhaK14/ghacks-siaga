import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { SiagaScreen } from "@/components/siaga-screen";

export function HistoryScreen() {
  return (
    <SiagaScreen contentClassName="pt-[88px] pb-[140px]" isScrollable>
      <View className="gap-2">
        <Text className="font-bold text-[27px] text-siaga-ink leading-9">
          Riwayat laporan
        </Text>
        <Text className="text-[12px] text-siaga-muted">
          Laporan tersimpan di perangkat ini.
        </Text>
      </View>

      <View className="mt-8 gap-4">
        <View className="gap-4 rounded-[14px] border border-siaga-border bg-white p-5">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <View className="size-11 items-center justify-center rounded-full bg-siaga-success-soft">
                <Ionicons color="#2e8b64" name="checkmark" size={24} />
              </View>
              <View className="gap-1">
                <Text className="font-extrabold text-[15px] text-siaga-body">
                  SOS-1048
                </Text>
                <Text className="text-[11px] text-siaga-muted-strong">
                  Kriminal · 4 menit
                </Text>
              </View>
            </View>
            <Text className="font-semibold text-[11px] text-siaga-success">
              Selesai
            </Text>
          </View>
          <View className="h-px bg-siaga-border-soft" />
          <Text className="text-[12px] text-siaga-muted-strong leading-5">
            Bantuan Polisi 07 tiba dan laporan diselesaikan pada 19:47.
          </Text>
        </View>
      </View>
    </SiagaScreen>
  );
}
