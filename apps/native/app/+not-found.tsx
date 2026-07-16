import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useCallback } from "react";
import { Text, View } from "react-native";

import { SiagaButton } from "@/components/siaga-button";
import { SiagaScreen } from "@/components/siaga-screen";
import { useSiagaColor } from "@/lib/use-siaga-color";

export default function NotFoundScreen() {
  const router = useRouter();
  const primary = useSiagaColor("primary");

  const handleHome = useCallback(() => {
    router.replace("/");
  }, [router]);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SiagaScreen contentClassName="items-center justify-center gap-4">
        <View className="size-16 items-center justify-center rounded-full bg-siaga-soft">
          <Ionicons color={primary} name="alert-circle-outline" size={32} />
        </View>
        <Text className="font-extrabold text-[20px] text-siaga-ink">
          Halaman tidak ditemukan
        </Text>
        <Text className="text-center text-[13px] text-siaga-muted leading-5">
          Halaman yang kamu cari tidak tersedia di aplikasi SIAGA.
        </Text>
        <SiagaButton onPress={handleHome}>Kembali ke beranda</SiagaButton>
      </SiagaScreen>
    </>
  );
}
