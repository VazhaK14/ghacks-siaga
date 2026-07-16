import type { EmergencyProfile, ProfileFieldErrors } from "./types";

const AGE_PATTERN = /^\d+$/;
const NON_DIGIT_PATTERN = /\D/g;
const MINIMUM_PHONE_DIGITS = 8;
const MAXIMUM_PHONE_DIGITS = 15;

export const EMPTY_PROFILE: EmergencyProfile = {
  address: "",
  age: "",
  allergies: "",
  bloodType: "",
  conditions: "",
  contactName: "",
  contactPhone: "",
  fullName: "",
  medications: "",
  phoneNumber: "",
  specialNeeds: "",
};

type ProfileValidationResult =
  | { errors: ProfileFieldErrors; success: false }
  | { profile: EmergencyProfile; success: true };

export const validateEmergencyProfile = (
  input: EmergencyProfile
): ProfileValidationResult => {
  const profile = Object.fromEntries(
    Object.entries(input).map(([key, value]) => [key, value.trim()])
  ) as unknown as EmergencyProfile;
  const errors: ProfileFieldErrors = {};
  const age = Number(profile.age);
  const contactPhoneDigits = profile.contactPhone.replace(
    NON_DIGIT_PATTERN,
    ""
  ).length;

  if (profile.fullName.length < 2) {
    errors.fullName = "Masukkan nama lengkap sesuai identitas.";
  }
  if (!(AGE_PATTERN.test(profile.age) && age >= 1 && age <= 120)) {
    errors.age = "Masukkan umur 1–120 tahun.";
  }
  if (profile.address.length < 5) {
    errors.address = "Masukkan alamat rumah yang lengkap.";
  }
  if (profile.contactName.length < 2) {
    errors.contactName = "Masukkan nama kontak darurat.";
  }
  if (
    contactPhoneDigits < MINIMUM_PHONE_DIGITS ||
    contactPhoneDigits > MAXIMUM_PHONE_DIGITS
  ) {
    errors.contactPhone = "Masukkan nomor telepon aktif (8–15 digit).";
  }

  return Object.keys(errors).length > 0
    ? { errors, success: false }
    : { profile, success: true };
};
