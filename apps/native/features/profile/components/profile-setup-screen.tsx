import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback } from "react";
import { Pressable, Text, View } from "react-native";

import { SiagaButton } from "@/components/siaga-button";
import { SiagaScreen } from "@/components/siaga-screen";

interface SummaryFieldProps {
  icon?: "call-outline";
  label: string;
  value: string;
}

function SummaryField({ icon, label, value }: SummaryFieldProps) {
  return (
    <View className="h-[66px] flex-row items-center gap-3 rounded-[14px] border border-siaga-border bg-white px-4">
      {icon ? (
        <Ionicons color="#d72638" name={icon} size={23} />
      ) : (
        <View className="size-8 items-center justify-center rounded-full bg-siaga-soft">
          <Text className="font-extrabold text-[12px] text-siaga-primary">
            NP
          </Text>
        </View>
      )}
      <View className="flex-1 gap-1">
        <Text className="text-[11px] text-siaga-muted-strong">{label}</Text>
        <Text className="font-semibold text-[14px] text-siaga-body">
          {value}
        </Text>
      </View>
    </View>
  );
}

export function ProfileSetupScreen() {
  const router = useRouter();

  const handleContinue = useCallback(() => {
    router.replace("/");
  }, [router]);

  return (
    <SiagaScreen contentClassName="pt-16">
      <View className="gap-2">
        <Text className="font-bold text-[27px] text-siaga-ink leading-9">
          Siapkan info penting sebelum darurat
        </Text>
        <Text className="font-normal text-[13px] text-siaga-muted leading-[18px]">
          Opsional. Data ini membantu SIAGA dan operator merespons lebih cepat.
        </Text>
      </View>

      <View className="mt-7 gap-3">
        <SummaryField label="Nama lengkap" value="Nadia Pratama" />
        <SummaryField
          icon="call-outline"
          label="Nomor ponsel"
          value="+62 812 3456 7890"
        />
        <SummaryField
          icon="call-outline"
          label="Kontak darurat"
          value="+62 811 9876 5432 (Ibu)"
        />
      </View>

      <View className="mt-7 flex-row gap-3 rounded-[14px] border border-siaga-border bg-siaga-soft p-4">
        <View className="mt-1 size-2.5 rounded-full bg-siaga-primary" />
        <View className="flex-1 gap-2">
          <Text className="font-semibold text-[13px] text-siaga-body">
            Data hanya dipakai saat SOS aktif
          </Text>
          <Text className="text-[11px] text-siaga-muted-strong leading-[15px]">
            Kamu tetap bisa melewati langkah ini dan langsung meminta bantuan.
          </Text>
        </View>
      </View>

      <View className="mt-auto gap-4 pb-1">
        <SiagaButton onPress={handleContinue}>Simpan & lanjut</SiagaButton>
        <Pressable
          accessibilityRole="button"
          className="items-center py-2"
          onPress={handleContinue}
        >
          <Text className="font-semibold text-[12px] text-siaga-muted-strong">
            Lewati untuk sekarang
          </Text>
        </Pressable>
      </View>
    </SiagaScreen>
  );
}
