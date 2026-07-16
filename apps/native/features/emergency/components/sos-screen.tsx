import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback } from "react";
import { Pressable, Text, View } from "react-native";
import { EMERGENCY_CATEGORIES } from "@/features/emergency/content";
import { useIncident } from "@/features/emergency/context";
import type { EmergencyCategory } from "@/features/emergency/types";

interface CategoryButtonProps {
  category: EmergencyCategory;
  isSelected: boolean;
  onSelect: (category: EmergencyCategory) => void;
}

function CategoryButton({
  category,
  isSelected,
  onSelect,
}: CategoryButtonProps) {
  const handlePress = useCallback(() => {
    onSelect(category);
  }, [category, onSelect]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      className={
        isSelected
          ? "h-[38px] w-[104px] items-center justify-center rounded-lg bg-siaga-primary"
          : "h-[38px] w-[104px] items-center justify-center rounded-lg border border-siaga-border-soft bg-white"
      }
      onPress={handlePress}
    >
      <Text
        className={
          isSelected
            ? "font-semibold text-[10px] text-white"
            : "font-semibold text-[10px] text-siaga-body"
        }
      >
        {category}
      </Text>
    </Pressable>
  );
}

export function SosScreen() {
  const router = useRouter();
  const { beginIncident, category, setCategory } = useIncident();

  const handleSos = useCallback(() => {
    beginIncident();
    router.push("/report-mode");
  }, [beginIncident, router]);

  const handleCategoryPress = useCallback(
    (nextCategory: EmergencyCategory) => {
      setCategory(nextCategory);
    },
    [setCategory]
  );

  return (
    <View className="flex-1 bg-siaga-surface px-6 pt-7">
      <View className="flex-row items-center gap-4 rounded-[14px] border border-siaga-border bg-siaga-soft p-4">
        <Ionicons color="#a90010" name="locate-outline" size={24} />
        <View className="flex-1 gap-1">
          <Text className="font-extrabold text-[16px] text-siaga-body">
            Lokasi terdeteksi
          </Text>
          <Text
            className="font-normal text-[12px] text-siaga-muted-strong"
            numberOfLines={2}
          >
            Jl. Jend. Sudirman Kav. 52–53, Senayan, Kebayoran Baru, Jakarta
            Tenggara
          </Text>
        </View>
      </View>

      <View className="mt-8 items-center gap-1">
        <Text className="font-extrabold text-[21px] text-siaga-body">
          Tekan untuk SOS
        </Text>
        <Text className="text-center font-normal text-[10px] text-siaga-muted-strong">
          Setelah ini kamu bisa memilih voice, text, atau mode senyap.
        </Text>
      </View>

      <View className="flex-1 items-center justify-center">
        <View className="size-[230px] items-center justify-center rounded-full bg-[#f9e7e8]">
          <View className="size-[194px] items-center justify-center rounded-full bg-[#f5d1d5]">
            <Pressable
              accessibilityHint="Membuka pilihan cara melapor"
              accessibilityLabel="Aktifkan SOS"
              accessibilityRole="button"
              className="size-[158px] items-center justify-center rounded-full bg-siaga-primary"
              onPress={handleSos}
            >
              <Text className="font-extrabold text-[42px] text-white">SOS</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <View className="mb-5 gap-3">
        <View className="gap-1">
          <Text className="font-extrabold text-[15px] text-siaga-body">
            Pilih kategori jika sempat
          </Text>
          <Text className="font-normal text-[10px] text-siaga-muted-strong">
            Opsional
          </Text>
        </View>
        <View className="flex-row flex-wrap justify-center gap-2">
          {EMERGENCY_CATEGORIES.map((item) => {
            const isSelected = item === category;
            return (
              <CategoryButton
                category={item}
                isSelected={isSelected}
                key={item}
                onSelect={handleCategoryPress}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}
