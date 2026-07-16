import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { FieldError, Input, Label, TextField } from "heroui-native";
import { useCallback, useState } from "react";
import { Text, View } from "react-native";

import { SiagaButton } from "@/components/siaga-button";
import { SiagaScreen } from "@/components/siaga-screen";
import { NEUTRAL_600, SIAGA_PRIMARY } from "@/constants/colors";
import { useProfile } from "@/features/profile/context";
import type { EmergencyProfile } from "@/features/profile/types";
import {
  type ProfileFieldErrors,
  validateEmergencyProfile,
} from "@/features/profile/validation";

interface ProfileFieldProps {
  error?: string;
  field: keyof EmergencyProfile;
  keyboardType?: "default" | "number-pad" | "phone-pad";
  label: string;
  multiline?: boolean;
  onChange: (field: keyof EmergencyProfile, value: string) => void;
  placeholder: string;
  required?: boolean;
  value: string;
}

function ProfileField({
  field,
  error,
  keyboardType = "default",
  label,
  multiline = false,
  onChange,
  placeholder,
  required = false,
  value,
}: ProfileFieldProps) {
  const handleChangeText = useCallback(
    (nextValue: string) => {
      onChange(field, nextValue);
    },
    [field, onChange]
  );

  return (
    <TextField isInvalid={Boolean(error)} isRequired={required}>
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
        placeholderTextColor={NEUTRAL_600}
        testID={`${field}-input`}
        textAlignVertical={multiline ? "top" : "center"}
        value={value}
      />
      {error ? <FieldError>{error}</FieldError> : null}
    </TextField>
  );
}

interface ProfileSectionProps {
  children: React.ReactNode;
  icon: "heart-outline" | "person" | "people";
  subtitle?: string;
  title: string;
}

function ProfileSection({
  children,
  icon,
  subtitle,
  title,
}: ProfileSectionProps) {
  return (
    <View className="gap-4 rounded-[14px] border border-siaga-border bg-siaga-panel p-6">
      <View className="gap-1 border-siaga-border border-b pb-3">
        <View className="flex-row items-center gap-2">
          <Ionicons color={SIAGA_PRIMARY} name={icon} size={20} />
          <Text className="font-semibold text-[22px] text-siaga-body">
            {title}
          </Text>
        </View>
        {subtitle ? (
          <Text className="text-[12px] text-siaga-muted leading-5">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {children}
    </View>
  );
}

interface ProfileScreenProps {
  isOnboarding?: boolean;
}

export function ProfileScreen({ isOnboarding = false }: ProfileScreenProps) {
  const router = useRouter();
  const { profile: savedProfile, saveProfile } = useProfile();
  const [draftProfile, setDraftProfile] = useState<
    EmergencyProfile | undefined
  >();
  const [fieldErrors, setFieldErrors] = useState<ProfileFieldErrors>({});
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const profile = draftProfile ?? savedProfile;
  const readyButtonLabel = isOnboarding
    ? "Simpan & masuk ke SIAGA"
    : "Simpan Profil Darurat";
  const saveButtonLabel = isSaving ? "Menyimpan..." : readyButtonLabel;

  const updateProfile = useCallback(
    (key: keyof EmergencyProfile, value: string) => {
      setIsSaved(false);
      setSaveError(null);
      setFieldErrors((current) => ({ ...current, [key]: undefined }));
      setDraftProfile((current) => ({
        ...(current ?? savedProfile),
        [key]: value,
      }));
    },
    [savedProfile]
  );

  const handleSave = useCallback(async () => {
    const validation = validateEmergencyProfile(profile);
    if (!validation.success) {
      setFieldErrors(validation.errors);
      setSaveError("Lengkapi semua data wajib sebelum masuk ke SIAGA.");
      setIsSaved(false);
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    try {
      await saveProfile(validation.profile);
      setDraftProfile(validation.profile);
      setFieldErrors({});
      setIsSaved(true);
      if (isOnboarding) {
        router.replace("/");
      }
    } catch {
      setSaveError(
        "Profil belum dapat disimpan. Periksa perangkat lalu coba lagi."
      );
      setIsSaved(false);
    } finally {
      setIsSaving(false);
    }
  }, [isOnboarding, profile, router, saveProfile]);

  return (
    <SiagaScreen
      contentClassName={
        isOnboarding
          ? "gap-6 px-5 pt-14 pb-12"
          : "gap-6 px-5 pt-[104px] pb-[140px]"
      }
      isScrollable
    >
      <View className="gap-2">
        <Text className="font-bold text-[27px] text-siaga-ink leading-9">
          Siapkan info penting sebelum darurat
        </Text>
        <Text className="text-[13px] text-siaga-muted leading-5">
          {isOnboarding
            ? "Lengkapi data wajib agar bantuan dapat dikirim dengan cepat dan tepat."
            : "Perbarui data yang akan membantu SIAGA saat keadaan darurat."}
        </Text>
      </View>

      <ProfileSection
        icon="person"
        subtitle="Semua data pada bagian ini wajib diisi."
        title="Info Pribadi"
      >
        <ProfileField
          error={fieldErrors.fullName}
          field="fullName"
          label="Nama Lengkap"
          onChange={updateProfile}
          placeholder="Nama sesuai KTP"
          required
          value={profile.fullName}
        />
        <ProfileField
          error={fieldErrors.age}
          field="age"
          keyboardType="number-pad"
          label="Umur"
          onChange={updateProfile}
          placeholder="Tahun"
          required
          value={profile.age}
        />
        <ProfileField
          error={fieldErrors.address}
          field="address"
          label="Alamat Rumah"
          multiline
          onChange={updateProfile}
          placeholder="Alamat lengkap"
          required
          value={profile.address}
        />
      </ProfileSection>

      <ProfileSection
        icon="heart-outline"
        subtitle="Opsional, tetapi membantu petugas memberi penanganan yang aman."
        title="Info Medis"
      >
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

      <ProfileSection
        icon="people"
        subtitle="Satu kontak aktif wajib diisi."
        title="Kontak Darurat"
      >
        <View className="gap-4 rounded-[14px] border border-siaga-border bg-siaga-surface p-4">
          <ProfileField
            error={fieldErrors.contactName}
            field="contactName"
            label="Nama Kontak 1"
            onChange={updateProfile}
            placeholder="Nama"
            required
            value={profile.contactName}
          />
          <ProfileField
            field="phoneNumber"
            keyboardType="phone-pad"
            label="Nomor Telepon Anda (Opsional)"
            onChange={updateProfile}
            placeholder="08xx..."
            value={profile.phoneNumber}
          />
          <ProfileField
            error={fieldErrors.contactPhone}
            field="contactPhone"
            keyboardType="phone-pad"
            label="Nomor Telepon"
            onChange={updateProfile}
            placeholder="08xx..."
            required
            value={profile.contactPhone}
          />
        </View>
      </ProfileSection>

      <View className="flex-row items-center gap-3 rounded-[14px] border border-siaga-border bg-siaga-soft p-4">
        <Ionicons color={SIAGA_PRIMARY} name="information-circle" size={21} />
        <Text className="flex-1 text-[13px] text-siaga-primary leading-5">
          Data ini hanya dikirim saat Anda menekan SOS.
        </Text>
      </View>

      {saveError ? (
        <Text
          accessibilityLiveRegion="polite"
          className="text-center font-semibold text-[12px] text-red-200 leading-5"
        >
          {saveError}
        </Text>
      ) : null}
      <SiagaButton
        accessibilityLabel={
          isOnboarding ? "Simpan dan masuk ke SIAGA" : "Simpan Profil Darurat"
        }
        isDisabled={isSaving}
        onPress={handleSave}
      >
        {saveButtonLabel}
      </SiagaButton>
      {isSaved ? (
        <Text
          accessibilityLiveRegion="polite"
          className="text-center font-semibold text-[12px] text-siaga-success"
        >
          Profil darurat tersimpan di perangkat.
        </Text>
      ) : null}
    </SiagaScreen>
  );
}
