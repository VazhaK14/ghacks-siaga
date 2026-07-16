import { Alert, AlertDescription } from "@siaga-app/ui/components/alert";
import { Button } from "@siaga-app/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@siaga-app/ui/components/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@siaga-app/ui/components/field";
import { Input } from "@siaga-app/ui/components/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@siaga-app/ui/components/select";
import { Textarea } from "@siaga-app/ui/components/textarea";
import { LogOutIcon, SaveIcon } from "lucide-react";
import type { ChangeEvent, FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import { MobilePage } from "@/components/mobile-page";
import { useSignOutMutation } from "@/features/auth/api";
import { PwaSettingsCard } from "@/features/notifications/components/pwa-settings-card";

import {
  useReporterProfileQuery,
  useUpdateReporterProfileMutation,
} from "../api";
import type { BloodType, EmergencyProfile, ProfileFieldErrors } from "../types";
import { EMPTY_PROFILE, validateEmergencyProfile } from "../validation";

const BLOOD_TYPE_OPTIONS: Array<{
  label: string;
  value: BloodType | null;
}> = [
  { label: "Belum diketahui", value: null },
  { label: "A+", value: "A_POSITIVE" },
  { label: "A-", value: "A_NEGATIVE" },
  { label: "B+", value: "B_POSITIVE" },
  { label: "B-", value: "B_NEGATIVE" },
  { label: "AB+", value: "AB_POSITIVE" },
  { label: "AB-", value: "AB_NEGATIVE" },
  { label: "O+", value: "O_POSITIVE" },
  { label: "O-", value: "O_NEGATIVE" },
  { label: "Tidak tahu", value: "UNKNOWN" },
];

interface ProfileInputProps {
  autoComplete?: string;
  error?: string;
  field: keyof EmergencyProfile;
  inputMode?: "numeric" | "tel" | "text";
  label: string;
  onChange: (field: keyof EmergencyProfile, value: string) => void;
  value: string;
}

const ProfileInput = ({
  autoComplete,
  error,
  field,
  inputMode = "text",
  label,
  onChange,
  value,
}: ProfileInputProps) => {
  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(field, event.target.value);
  };
  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor={field}>{label}</FieldLabel>
      <Input
        aria-invalid={Boolean(error)}
        autoComplete={autoComplete}
        id={field}
        inputMode={inputMode}
        onChange={handleInputChange}
        value={value}
      />
      <FieldError>{error}</FieldError>
    </Field>
  );
};

type ProfileTextareaProps = Omit<
  ProfileInputProps,
  "autoComplete" | "inputMode"
>;

const ProfileTextarea = ({
  error,
  field,
  label,
  onChange,
  value,
}: ProfileTextareaProps) => {
  const handleTextareaChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(field, event.target.value);
  };
  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor={field}>{label}</FieldLabel>
      <Textarea
        aria-invalid={Boolean(error)}
        id={field}
        onChange={handleTextareaChange}
        value={value}
      />
      <FieldError>{error}</FieldError>
    </Field>
  );
};

export const ProfileScreen = () => {
  const navigate = useNavigate();
  const profileQuery = useReporterProfileQuery();
  const updateProfile = useUpdateReporterProfileMutation();
  const signOut = useSignOutMutation();
  const hasHydrated = useRef(false);
  const [profile, setProfile] = useState<EmergencyProfile>(EMPTY_PROFILE);
  const [errors, setErrors] = useState<ProfileFieldErrors>({});

  useEffect(() => {
    if (profileQuery.data && !hasHydrated.current) {
      setProfile(profileQuery.data);
      hasHydrated.current = true;
    }
  }, [profileQuery.data]);

  const handleChange = (field: keyof EmergencyProfile, value: string) => {
    setProfile((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validateEmergencyProfile(profile);
    if (!validation.success) {
      setErrors(validation.errors);
      return;
    }
    try {
      const saved = await updateProfile.mutateAsync(validation.profile);
      setProfile(saved);
      setErrors({});
      toast.success("Profil darurat tersimpan.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Profil belum dapat disimpan."
      );
    }
  };

  const handleSignOut = async () => {
    await signOut.mutateAsync();
    navigate("/sign-in", { replace: true });
  };
  const handleBloodTypeChange = (value: BloodType | null) => {
    handleChange("bloodType", value ?? "");
  };

  return (
    <MobilePage className="gap-5" title="Profil darurat">
      <header className="flex flex-col gap-1">
        <h1 className="text-h3">Profil darurat</h1>
        <p className="text-muted-foreground text-sm">
          Data ini membantu petugas memberi penanganan yang tepat.
        </p>
      </header>

      {profileQuery.isError ? (
        <Alert variant="destructive">
          <AlertDescription>
            Profil belum dapat dimuat. Periksa koneksi lalu muat ulang halaman.
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Identitas & kontak</CardTitle>
          <CardDescription>
            Informasi utama untuk petugas darurat.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form id="profile-form" onSubmit={handleSubmit}>
            <FieldGroup>
              <ProfileInput
                autoComplete="name"
                error={errors.fullName}
                field="fullName"
                label="Nama lengkap"
                onChange={handleChange}
                value={profile.fullName}
              />
              <ProfileInput
                error={errors.age}
                field="age"
                inputMode="numeric"
                label="Umur"
                onChange={handleChange}
                value={profile.age}
              />
              <ProfileInput
                autoComplete="tel"
                field="phoneNumber"
                inputMode="tel"
                label="Nomor telepon"
                onChange={handleChange}
                value={profile.phoneNumber}
              />
              <ProfileTextarea
                error={errors.address}
                field="address"
                label="Alamat rumah"
                onChange={handleChange}
                value={profile.address}
              />
              <ProfileInput
                error={errors.contactName}
                field="contactName"
                label="Nama kontak darurat"
                onChange={handleChange}
                value={profile.contactName}
              />
              <ProfileInput
                autoComplete="tel"
                error={errors.contactPhone}
                field="contactPhone"
                inputMode="tel"
                label="Telepon kontak darurat"
                onChange={handleChange}
                value={profile.contactPhone}
              />
              <Field>
                <FieldLabel htmlFor="blood-type">Golongan darah</FieldLabel>
                <Select
                  items={BLOOD_TYPE_OPTIONS}
                  onValueChange={handleBloodTypeChange}
                  value={profile.bloodType || null}
                >
                  <SelectTrigger className="w-full" id="blood-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent alignItemWithTrigger={false}>
                    <SelectGroup>
                      {BLOOD_TYPE_OPTIONS.map((option) => (
                        <SelectItem
                          key={option.value ?? "empty"}
                          value={option.value}
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <ProfileTextarea
                field="allergies"
                label="Alergi"
                onChange={handleChange}
                value={profile.allergies}
              />
              <ProfileTextarea
                field="conditions"
                label="Kondisi medis"
                onChange={handleChange}
                value={profile.conditions}
              />
              <ProfileTextarea
                field="medications"
                label="Obat rutin"
                onChange={handleChange}
                value={profile.medications}
              />
              <ProfileTextarea
                field="specialNeeds"
                label="Kebutuhan khusus"
                onChange={handleChange}
                value={profile.specialNeeds}
              />
            </FieldGroup>
          </form>
        </CardContent>
        <CardFooter>
          <Button
            disabled={profileQuery.isPending || updateProfile.isPending}
            form="profile-form"
            type="submit"
          >
            <SaveIcon data-icon="inline-start" />
            {updateProfile.isPending ? "Menyimpan..." : "Simpan profil"}
          </Button>
        </CardFooter>
      </Card>

      <PwaSettingsCard />

      <Button
        disabled={signOut.isPending}
        onClick={handleSignOut}
        variant="ghost"
      >
        <LogOutIcon data-icon="inline-start" />
        Keluar
      </Button>
    </MobilePage>
  );
};
