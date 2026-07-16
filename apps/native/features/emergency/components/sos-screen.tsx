import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ReferenceCanvas } from "@/components/reference-canvas";
import { EMERGENCY_CATEGORIES } from "@/features/emergency/content";
import { useIncident } from "@/features/emergency/context";
import type { EmergencyCategory } from "@/features/emergency/types";
import {
  type LocationStatus,
  useCurrentLocation,
} from "@/features/location/use-current-location";

const CATEGORY_POSITIONS = [
  { left: 28, top: 620 },
  { left: 142, top: 620 },
  { left: 256, top: 620 },
  { left: 84, top: 668 },
  { left: 198, top: 668 },
] as const;

interface CategoryButtonProps {
  category: EmergencyCategory;
  index: number;
  isSelected: boolean;
  onSelect: (category: EmergencyCategory) => void;
}

function CategoryButton({
  category,
  index,
  isSelected,
  onSelect,
}: CategoryButtonProps) {
  const handlePress = useCallback(() => {
    onSelect(category);
  }, [category, onSelect]);
  const position = CATEGORY_POSITIONS[index];

  if (!position) {
    return null;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      onPress={handlePress}
      style={[
        styles.category,
        position,
        isSelected ? styles.categorySelected : styles.categoryDefault,
      ]}
    >
      <Text
        style={[
          styles.categoryLabel,
          isSelected ? styles.categoryLabelSelected : null,
        ]}
      >
        {category}
      </Text>
    </Pressable>
  );
}

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

export function SosScreen() {
  const router = useRouter();
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

  const handleCategoryPress = useCallback(
    (nextCategory: EmergencyCategory) => {
      setCategory(nextCategory);
    },
    [setCategory]
  );

  const handleLocationPress = useCallback(() => {
    if (locationStatus !== "locating") {
      refreshLocation();
    }
  }, [locationStatus, refreshLocation]);

  return (
    <ReferenceCanvas referenceHeight={747} testID="sos-screen">
      <Pressable
        accessibilityHint="Mendeteksi ulang lokasi perangkat"
        accessibilityLabel={`${locationCopy.title}. ${locationCopy.body}`}
        accessibilityRole="button"
        disabled={locationStatus === "locating"}
        onPress={handleLocationPress}
        style={styles.locationCard}
      >
        <Ionicons color="#a90010" name="locate-outline" size={22} />
        <View style={styles.locationCopy}>
          <Text style={styles.locationTitle}>{locationCopy.title}</Text>
          <Text numberOfLines={2} style={styles.locationBody}>
            {locationCopy.body}
          </Text>
        </View>
        {locationStatus === "locating" ? (
          <ActivityIndicator color="#a90010" size="small" />
        ) : (
          <Ionicons color="#a90010" name="refresh" size={18} />
        )}
      </Pressable>

      <Text style={styles.prompt}>Tekan untuk SOS</Text>
      <Text style={styles.promptHint}>
        Setelah ini kamu bisa memilih voice, text, atau mode senyap.
      </Text>

      <View style={styles.sosHalo}>
        <View style={styles.sosRing}>
          <Pressable
            accessibilityHint="Membuka pilihan cara melapor"
            accessibilityLabel="Aktifkan SOS"
            accessibilityRole="button"
            onPress={handleSos}
            style={styles.sosAction}
          >
            <Text style={styles.sosLabel}>SOS</Text>
          </Pressable>
        </View>
      </View>

      <Text style={styles.categoryTitle}>Pilih kategori jika sempat</Text>
      <Text style={styles.categoryHint}>Opsional</Text>
      {EMERGENCY_CATEGORIES.map((item, index) => (
        <CategoryButton
          category={item}
          index={index}
          isSelected={item === category}
          key={item}
          onSelect={handleCategoryPress}
        />
      ))}
    </ReferenceCanvas>
  );
}

const styles = StyleSheet.create({
  category: {
    alignItems: "center",
    borderCurve: "continuous",
    borderRadius: 8,
    height: 38,
    justifyContent: "center",
    position: "absolute",
    width: 104,
  },
  categoryDefault: {
    backgroundColor: "#ffffff",
    borderColor: "#e9e3df",
    borderWidth: 1,
  },
  categoryHint: {
    color: "#776f72",
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 10,
    left: 28,
    lineHeight: 14,
    position: "absolute",
    top: 584,
  },
  categoryLabel: {
    color: "#241f20",
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 9,
    lineHeight: 12,
  },
  categoryLabelSelected: {
    color: "#ffffff",
  },
  categorySelected: {
    backgroundColor: "#d72638",
  },
  categoryTitle: {
    color: "#241f20",
    fontFamily: "PlusJakartaSans_800ExtraBold",
    fontSize: 15,
    left: 28,
    lineHeight: 20,
    position: "absolute",
    top: 560,
  },
  locationBody: {
    color: "#333333",
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 12,
    letterSpacing: 0.24,
    lineHeight: 15,
  },
  locationCard: {
    alignItems: "center",
    backgroundColor: "#fff0f1",
    borderColor: "#ded7d3",
    borderCurve: "continuous",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 15,
    height: 88,
    left: 29,
    padding: 17,
    position: "absolute",
    top: 89,
    width: 332,
  },
  locationCopy: {
    flex: 1,
    gap: 4,
  },
  locationTitle: {
    color: "#333333",
    fontFamily: "PlusJakartaSans_800ExtraBold",
    fontSize: 16,
    letterSpacing: 0.16,
    lineHeight: 20,
  },
  prompt: {
    color: "#241f20",
    fontFamily: "PlusJakartaSans_800ExtraBold",
    fontSize: 21,
    left: 24,
    lineHeight: 28,
    position: "absolute",
    textAlign: "center",
    top: 214,
    width: 342,
  },
  promptHint: {
    color: "#776f72",
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 10,
    left: 24,
    lineHeight: 14,
    position: "absolute",
    textAlign: "center",
    top: 246,
    width: 342,
  },
  sosAction: {
    alignItems: "center",
    backgroundColor: "#d72638",
    borderCurve: "continuous",
    borderRadius: 79,
    boxShadow: "0 12px 18px rgba(126, 14, 26, 0.18)",
    height: 158,
    justifyContent: "center",
    width: 158,
  },
  sosHalo: {
    alignItems: "center",
    backgroundColor: "#f9e7e8",
    borderCurve: "continuous",
    borderRadius: 115,
    height: 230,
    justifyContent: "center",
    left: 79,
    position: "absolute",
    top: 286,
    width: 230,
  },
  sosLabel: {
    color: "#ffffff",
    fontFamily: "PlusJakartaSans_800ExtraBold",
    fontSize: 42,
    lineHeight: 57,
  },
  sosRing: {
    alignItems: "center",
    backgroundColor: "#f5d1d5",
    borderCurve: "continuous",
    borderRadius: 97,
    height: 194,
    justifyContent: "center",
    width: 194,
  },
});
