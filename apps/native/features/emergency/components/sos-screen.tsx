import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { SiagaScreen } from "@/components/siaga-screen";
import { EMERGENCY_CATEGORIES } from "@/features/emergency/content";
import { useIncident } from "@/features/emergency/context";
import { INCIDENT_TYPE_LABELS } from "@/features/emergency/status-content";
import type { EmergencyCategory } from "@/features/emergency/types";
import {
  type LocationStatus,
  useCurrentLocation,
} from "@/features/location/use-current-location";
import { SIAGA_PRIMARY_SHADOW, useSiagaColor } from "@/lib/use-siaga-color";

const INCIDENT_TYPE_BY_CATEGORY: Record<
  EmergencyCategory,
  keyof typeof INCIDENT_TYPE_LABELS
> = {
  Bencana: "NATURAL_DISASTER",
  Kebakaran: "FIRE",
  Kecelakaan: "TRAFFIC_ACCIDENT",
  Kriminal: "CRIME",
  Medis: "MEDICAL",
};

const LOCATION_COPY: Record<
  Exclude<LocationStatus, "ready">,
  { body: string; title: string }
> = {
  denied: {
    body: "Ketuk untuk memberi izin lokasi atau coba lagi.",
    title: "Izin lokasi dibutuhkan",
  },
  disabled: {
    body: "Aktifkan GPS perangkat, lalu ketuk untuk mencoba lagi.",
    title: "GPS tidak aktif",
  },
  error: {
    body: "Ketuk untuk mencoba mendeteksi lokasi kembali.",
    title: "Lokasi belum tersedia",
  },
  locating: {
    body: "SIAGA sedang mencari posisi perangkat kamu.",
    title: "Mendeteksi lokasi...",
  },
};

interface CategoryChipProps {
  category: EmergencyCategory;
  isSelected: boolean;
  onSelect: (category: EmergencyCategory) => void;
}

function CategoryChip({ category, isSelected, onSelect }: CategoryChipProps) {
  const handlePress = useCallback(() => {
    onSelect(category);
  }, [category, onSelect]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      className={`items-center justify-center rounded-lg border px-4 py-2 ${
        isSelected
          ? "border-siaga-primary bg-siaga-primary"
          : "border-siaga-border-soft bg-siaga-panel"
      }`}
      onPress={handlePress}
    >
      <Text
        className={`font-semibold text-[11px] ${
          isSelected ? "text-white" : "text-siaga-body"
        }`}
      >
        {INCIDENT_TYPE_LABELS[INCIDENT_TYPE_BY_CATEGORY[category]]}
      </Text>
    </Pressable>
  );
}

export function SosScreen() {
  const router = useRouter();
  const primary = useSiagaColor("primary");
  const { beginIncident, category, setCategory, setLocation } = useIncident();
  const {
    location,
    refreshLocation,
    status: locationStatus,
  } = useCurrentLocation({ onLocationResolved: setLocation });
  const locationCopy =
    locationStatus === "ready"
      ? {
          body: location
            ? location.address
            : "Koordinat lokasi berhasil diperoleh.",
          title: "Lokasi terdeteksi",
        }
      : LOCATION_COPY[locationStatus];

  const handleSos = useCallback(() => {
    beginIncident();
    router.push("/report-mode");
  }, [beginIncident, router]);

  const handleLocationPress = useCallback(() => {
    if (locationStatus !== "locating") {
      refreshLocation();
    }
  }, [locationStatus, refreshLocation]);

  return (
    <SiagaScreen contentClassName="items-center gap-8 pt-16 pb-12" isScrollable>
      <Pressable
        accessibilityHint="Mendeteksi ulang lokasi perangkat"
        accessibilityLabel={`${locationCopy.title}. ${locationCopy.body}`}
        accessibilityRole="button"
        className="w-full flex-row items-center gap-4 rounded-2xl border border-siaga-border bg-siaga-soft p-4"
        disabled={locationStatus === "locating"}
        onPress={handleLocationPress}
      >
        <Ionicons color={primary} name="locate-outline" size={22} />
        <View className="flex-1 gap-1">
          <Text className="font-extrabold text-[15px] text-siaga-ink">
            {locationCopy.title}
          </Text>
          <Text className="text-[12px] text-siaga-muted" numberOfLines={2}>
            {locationCopy.body}
          </Text>
        </View>
        {locationStatus === "locating" ? (
          <ActivityIndicator color={primary} size="small" />
        ) : (
          <Ionicons color={primary} name="refresh" size={18} />
        )}
      </Pressable>

      <View className="items-center gap-2">
        <Text className="text-center font-extrabold text-[20px] text-siaga-body">
          Tekan untuk SOS
        </Text>
        <Text className="text-center text-[12px] text-siaga-muted-strong">
          Setelah ini kamu bisa memilih voice, text, atau mode senyap.
        </Text>
      </View>

      <View className="items-center justify-center rounded-full bg-siaga-primary/10 p-9">
        <View className="items-center justify-center rounded-full bg-siaga-primary/15 p-4">
          <Pressable
            accessibilityHint="Membuka pilihan cara melapor"
            accessibilityLabel="Aktifkan SOS"
            accessibilityRole="button"
            className="size-40 items-center justify-center rounded-full bg-siaga-primary"
            onPress={handleSos}
            style={{ boxShadow: `0 12px 18px ${SIAGA_PRIMARY_SHADOW}` }}
          >
            <Text className="font-extrabold text-5xl text-white">SOS</Text>
          </Pressable>
        </View>
      </View>

      <View className="w-full gap-3">
        <View className="flex-row items-center justify-between">
          <Text className="font-extrabold text-[15px] text-siaga-body">
            Pilih kategori jika sempat
          </Text>
          <Text className="text-[10px] text-siaga-muted-strong">Opsional</Text>
        </View>
        <View className="flex-row flex-wrap gap-2">
          {EMERGENCY_CATEGORIES.map((item) => (
            <CategoryChip
              category={item}
              isSelected={item === category}
              key={item}
              onSelect={setCategory}
            />
          ))}
        </View>
      </View>
    </SiagaScreen>
  );
}
