import { Ionicons } from "@expo/vector-icons";
import { Input, Label, TextField } from "heroui-native";
import { useCallback, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { SiagaButton } from "@/components/siaga-button";
import { SiagaScreen } from "@/components/siaga-screen";
import type { EmergencyProfile } from "@/features/profile/types";

const INITIAL_PROFILE: EmergencyProfile = {
  address: "",
  age: "",
  allergies: "",
  bloodType: "",
  conditions: "",
  contactName: "",
  contactPhone: "",
  fullName: "",
  language: "",
  medications: "",
  specialNeeds: "",
};

interface ProfileFieldProps {
  field: keyof EmergencyProfile;
  keyboardType?: "default" | "number-pad" | "phone-pad";
  label: string;
  multiline?: boolean;
  onChange: (field: keyof EmergencyProfile, value: string) => void;
  placeholder: string;
  value: string;
}

function ProfileField({
  field,
  keyboardType = "default",
  label,
  multiline = false,
  onChange,
  placeholder,
  value,
}: ProfileFieldProps) {
  const handleChangeText = useCallback(
    (nextValue: string) => {
      onChange(field, nextValue);
    },
    [field, onChange]
  );

  return (
    <TextField>
      <Label className="font-bold text-[13px] text-siaga-body">{label}</Label>
      <Input
        className={
          multiline
            ? "min-h-[100px] rounded-[14px] border-siaga-border bg-siaga-input px-4 py-3"
            : "h-14 rounded-[14px] border-siaga-border bg-siaga-input px-4"
        }
        keyboardType={keyboardType}
        multiline={multiline}
        onChangeText={handleChangeText}
        placeholder={placeholder}
        placeholderTextColor="#8e8e8e"
        textAlignVertical={multiline ? "top" : "center"}
        value={value}
      />
    </TextField>
  );
}

interface ProfileSectionProps {
  children: React.ReactNode;
  icon: "heart-outline" | "person" | "people";
  title: string;
}

function ProfileSection({ children, icon, title }: ProfileSectionProps) {
  return (
    <View className="gap-4 rounded-[14px] border border-siaga-border bg-white p-6">
      <View className="flex-row items-center gap-2 border-siaga-border border-b pb-3">
        <Ionicons color="#870000" name={icon} size={20} />
        <Text className="font-semibold text-[22px] text-siaga-body">
          {title}
        </Text>
      </View>
      {children}
    </View>
  );
}

export function ProfileScreen() {
  const [profile, setProfile] = useState(INITIAL_PROFILE);
  const [isSaved, setIsSaved] = useState(false);

  const updateProfile = useCallback(
    (key: keyof EmergencyProfile, value: string) => {
      setIsSaved(false);
      setProfile((current) => ({ ...current, [key]: value }));
    },
    []
  );

  const handleSave = useCallback(() => {
    setIsSaved(true);
  }, []);

  return (
    <SiagaScreen contentClassName="gap-6 pb-10" isScrollable>
      <Text className="pt-4 font-bold text-[27px] text-siaga-ink leading-9">
        Siapkan info penting sebelum darurat
      </Text>

      <ProfileSection icon="person" title="Info Pribadi">
        <ProfileField
          field="fullName"
          label="Nama Lengkap"
          onChange={updateProfile}
          placeholder="Nama sesuai KTP"
          value={profile.fullName}
        />
        <ProfileField
          field="age"
          keyboardType="number-pad"
          label="Umur"
          onChange={updateProfile}
          placeholder="Tahun"
          value={profile.age}
        />
        <ProfileField
          field="address"
          label="Alamat Rumah"
          multiline
          onChange={updateProfile}
          placeholder="Alamat lengkap"
          value={profile.address}
        />
        <ProfileField
          field="language"
          label="Bahasa Utama"
          onChange={updateProfile}
          placeholder="Contoh: Bahasa Indonesia"
          value={profile.language}
        />
      </ProfileSection>

      <ProfileSection icon="heart-outline" title="Info Medis">
        <ProfileField
          field="bloodType"
          label="Golongan Darah"
          onChange={updateProfile}
          placeholder="Pilih Golongan Darah"
          value={profile.bloodType}
        />
        <ProfileField
          field="allergies"
          label="Alergi (Opsional)"
          onChange={updateProfile}
          placeholder="Contoh: Penisilin, Kacang"
          value={profile.allergies}
        />
        <ProfileField
          field="conditions"
          label="Penyakit Bawaan (Opsional)"
          onChange={updateProfile}
          placeholder="Contoh: Asma, Diabetes"
          value={profile.conditions}
        />
        <ProfileField
          field="medications"
          label="Obat Rutin (Opsional)"
          onChange={updateProfile}
          placeholder="Obat yang sedang dikonsumsi"
          value={profile.medications}
        />
        <ProfileField
          field="specialNeeds"
          label="Kebutuhan Khusus / Disabilitas (Opsional)"
          onChange={updateProfile}
          placeholder="Tuliskan jika ada"
          value={profile.specialNeeds}
        />
      </ProfileSection>

      <ProfileSection icon="people" title="Kontak Darurat">
        <View className="gap-4 rounded-[14px] border border-siaga-border bg-siaga-surface p-4">
          <ProfileField
            field="contactName"
            label="Nama Kontak 1"
            onChange={updateProfile}
            placeholder="Nama"
            value={profile.contactName}
          />
          <ProfileField
            field="contactPhone"
            keyboardType="phone-pad"
            label="Nomor Telepon"
            onChange={updateProfile}
            placeholder="08xx..."
            value={profile.contactPhone}
          />
        </View>
        <Pressable
          accessibilityRole="button"
          className="h-14 flex-row items-center justify-center gap-2 rounded-[14px] border-2 border-siaga-border border-dashed"
        >
          <Ionicons color="#870000" name="add" size={18} />
          <Text className="font-bold text-[#870000] text-[13px]">
            Tambah Kontak Darurat Lain
          </Text>
        </Pressable>
      </ProfileSection>

      <View className="flex-row items-center gap-3 rounded-[14px] border border-siaga-border bg-siaga-soft p-4">
        <Ionicons color="#870000" name="information-circle" size={21} />
        <Text className="flex-1 text-[#870000] text-[13px] leading-5">
          Data ini hanya dikirim saat Anda menekan SOS.
        </Text>
      </View>

      <SiagaButton onPress={handleSave}>Simpan Profil Darurat</SiagaButton>
      {isSaved ? (
        <Text className="text-center font-semibold text-[12px] text-siaga-success">
          Profil darurat tersimpan di perangkat.
        </Text>
      ) : null}
    </SiagaScreen>
  );
}
