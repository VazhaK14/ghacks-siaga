import { Alert, AlertDescription } from "@siaga-app/ui/components/alert";
import { Badge } from "@siaga-app/ui/components/badge";
import { Button, buttonVariants } from "@siaga-app/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@siaga-app/ui/components/card";
import { ArrowRightIcon, PhoneCallIcon, ShieldCheckIcon } from "lucide-react";
import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";

import { MobilePage } from "@/components/mobile-page";

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

export const CompleteRegistrationScreen = () => {
  const navigate = useNavigate();
  const profileQuery = useReporterProfileQuery();
  const updateProfile = useUpdateReporterProfileMutation();
  const hasHydrated = useRef(false);
  const [profile, setProfile] = useState<EmergencyProfile>(EMPTY_PROFILE);
  const [errors, setErrors] = useState<ProfileFieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

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
    setSubmitError(null);
    try {
      const validation = validateEmergencyProfile(profile);
      if (!validation.success) {
        setErrors(validation.errors);
        focusFirstErrorField(validation.errors);
        const firstError = Object.values(validation.errors).find(Boolean);
        setSubmitError(
          firstError
            ? `Periksa kembali data wajib: ${firstError}`
            : "Periksa kembali seluruh data wajib."
        );
        toast.error(firstError ?? "Periksa kembali seluruh data wajib.");
        return;
      }
      const savedProfile = await updateProfile.mutateAsync(validation.profile);
      if (!savedProfile.isComplete) {
        setSubmitError(
          "Profil tersimpan, tetapi masih ada data wajib yang belum lengkap. Periksa kembali tanda *."
        );
        toast.error("Masih ada data wajib yang belum lengkap.");
        return;
      }
      toast.success("Pendaftaran selesai. Selamat datang di SIAGA.");
      navigate("/history", { replace: true });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Profil belum dapat disimpan.";
      setSubmitError(message);
      toast.error(message);
    }
  };

  return (
    <MobilePage className="gap-5 pb-8" title="Lengkapi pendaftaran">
      <header className="flex flex-col gap-3 pt-2">
        <div className="flex items-center justify-between gap-3">
          <Badge variant="secondary">Tahap 2 dari 2</Badge>
          <ShieldCheckIcon aria-hidden="true" className="text-primary" />
        </div>
        <div className="flex flex-col gap-1">
          <h1 className="text-h3">Lengkapi profil darurat</h1>
          <p className="text-muted-foreground text-sm">
            Data wajib membantu operator mengenali kebutuhanmu saat kondisi
            darurat. Tanda * wajib diisi sebelum memakai SIAGA.
          </p>
        </div>
      </header>

      {profileQuery.isError || submitError ? (
        <Alert variant="destructive">
          <AlertDescription>
            {submitError ?? "Profil belum dapat dimuat. Periksa koneksimu."}
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Data pribadi & medis</CardTitle>
          <CardDescription>
            Data medis boleh dikosongkan jika tidak diketahui.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form id="complete-registration-form" onSubmit={handleSubmit}>
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
            form="complete-registration-form"
            type="submit"
          >
            {updateProfile.isPending
              ? "Menyimpan..."
              : "Selesaikan pendaftaran"}
            <ArrowRightIcon data-icon="inline-end" />
          </Button>
        </CardFooter>
      </Card>

      <Link
        className={buttonVariants({ className: "w-full", variant: "stroke" })}
        to="/offline-call"
      >
        <PhoneCallIcon data-icon="inline-start" />
        Panggilan Tanpa Akun
      </Link>
    </MobilePage>
  );
};
