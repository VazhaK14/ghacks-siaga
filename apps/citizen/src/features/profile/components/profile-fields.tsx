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
import type { ChangeEvent } from "react";

import type { BloodType, EmergencyProfile, ProfileFieldErrors } from "../types";

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

interface ProfileControlProps {
  autoComplete?: string;
  error?: string;
  field: keyof EmergencyProfile;
  inputMode?: "numeric" | "tel" | "text";
  label: string;
  onChange: (field: keyof EmergencyProfile, value: string) => void;
  required?: boolean;
  value: string;
}

const ProfileInput = ({
  autoComplete,
  error,
  field,
  inputMode = "text",
  label,
  onChange,
  required = false,
  value,
}: ProfileControlProps) => {
  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(field, event.target.value);
  };
  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor={field}>{label}</FieldLabel>
      <Input
        aria-invalid={Boolean(error)}
        aria-required={required}
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
  ProfileControlProps,
  "autoComplete" | "inputMode"
>;

const ProfileTextarea = ({
  error,
  field,
  label,
  onChange,
  required = false,
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
        aria-required={required}
        id={field}
        onChange={handleTextareaChange}
        value={value}
      />
      <FieldError>{error}</FieldError>
    </Field>
  );
};

interface ProfileFieldsProps {
  errors: ProfileFieldErrors;
  onChange: (field: keyof EmergencyProfile, value: string) => void;
  profile: EmergencyProfile;
  showFullName?: boolean;
}

export const ProfileFields = ({
  errors,
  onChange,
  profile,
  showFullName = true,
}: ProfileFieldsProps) => {
  const handleBloodTypeChange = (value: BloodType | null) => {
    onChange("bloodType", value ?? "");
  };

  return (
    <FieldGroup>
      {showFullName ? (
        <ProfileInput
          autoComplete="name"
          error={errors.fullName}
          field="fullName"
          label="Nama lengkap *"
          onChange={onChange}
          required
          value={profile.fullName}
        />
      ) : null}
      <ProfileInput
        error={errors.age}
        field="age"
        inputMode="numeric"
        label="Umur *"
        onChange={onChange}
        required
        value={profile.age}
      />
      <ProfileInput
        autoComplete="tel"
        error={errors.phoneNumber}
        field="phoneNumber"
        inputMode="tel"
        label="Nomor telepon pribadi *"
        onChange={onChange}
        required
        value={profile.phoneNumber}
      />
      <ProfileTextarea
        error={errors.address}
        field="address"
        label="Alamat rumah *"
        onChange={onChange}
        required
        value={profile.address}
      />
      <ProfileInput
        error={errors.contactName}
        field="contactName"
        label="Nama kontak darurat *"
        onChange={onChange}
        required
        value={profile.contactName}
      />
      <ProfileInput
        autoComplete="tel"
        error={errors.contactPhone}
        field="contactPhone"
        inputMode="tel"
        label="Telepon kontak darurat *"
        onChange={onChange}
        required
        value={profile.contactPhone}
      />
      <Field>
        <FieldLabel htmlFor="blood-type">Golongan darah (opsional)</FieldLabel>
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
                <SelectItem key={option.value ?? "empty"} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </Field>
      <ProfileTextarea
        field="allergies"
        label="Alergi (opsional)"
        onChange={onChange}
        value={profile.allergies}
      />
      <ProfileTextarea
        field="conditions"
        label="Kondisi medis (opsional)"
        onChange={onChange}
        value={profile.conditions}
      />
      <ProfileTextarea
        field="medications"
        label="Obat rutin (opsional)"
        onChange={onChange}
        value={profile.medications}
      />
      <ProfileTextarea
        field="specialNeeds"
        label="Kebutuhan khusus (opsional)"
        onChange={onChange}
        value={profile.specialNeeds}
      />
    </FieldGroup>
  );
};
