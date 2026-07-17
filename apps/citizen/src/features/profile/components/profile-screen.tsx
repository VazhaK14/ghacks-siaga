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
import { LogOutIcon, SaveIcon } from "lucide-react";
import type { FormEvent } from "react";
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
import type { EmergencyProfile, ProfileFieldErrors } from "../types";
import {
  EMPTY_PROFILE,
  PROFILE_FIELD_FOCUS_ORDER,
  toEmergencyProfile,
  validateEmergencyProfile,
} from "../validation";
import { ProfileFields } from "./profile-fields";

const focusFirstErrorField = (errors: ProfileFieldErrors) => {
  const firstField = PROFILE_FIELD_FOCUS_ORDER.find((field) => errors[field]);
  if (!firstField) {
    return;
  }
  const element = document.getElementById(firstField);
  element?.scrollIntoView({ behavior: "smooth", block: "center" });
  element?.focus({ preventScroll: true });
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
      setProfile(toEmergencyProfile(profileQuery.data));
      hasHydrated.current = true;
    }
  }, [profileQuery.data]);

  const handleChange = (field: keyof EmergencyProfile, value: string) => {
    setProfile((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const validation = validateEmergencyProfile(profile);
      if (!validation.success) {
        setErrors(validation.errors);
        focusFirstErrorField(validation.errors);
        const firstError = Object.values(validation.errors).find(Boolean);
        toast.error(firstError ?? "Periksa kembali data profil.");
        return;
      }
      const saved = await updateProfile.mutateAsync(validation.profile);
      setProfile(toEmergencyProfile(saved));
      setErrors({});
      toast.success("Profil darurat tersimpan.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Profil belum dapat disimpan."
      );
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut.mutateAsync();
      toast.success("Berhasil keluar dari akun.");
      navigate("/sign-in", { replace: true });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Belum dapat keluar dari akun."
      );
    }
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
            Tanda * wajib diisi. Data medis lainnya bersifat opsional.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form id="profile-form" onSubmit={handleSubmit}>
            <ProfileFields
              errors={errors}
              onChange={handleChange}
              profile={profile}
            />
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

      <Card>
        <CardHeader>
          <CardTitle>Akun</CardTitle>
          <CardDescription>
            Keluar dari SIAGA pada perangkat ini.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button
            className="w-full"
            disabled={signOut.isPending}
            onClick={handleSignOut}
            variant="destructive"
          >
            <LogOutIcon data-icon="inline-start" />
            {signOut.isPending ? "Sedang keluar..." : "Keluar dari akun"}
          </Button>
        </CardFooter>
      </Card>
    </MobilePage>
  );
};
