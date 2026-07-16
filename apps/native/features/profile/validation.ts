import type { EmergencyProfile } from "./types";

const MINIMUM_NAME_LENGTH = 2;
const MINIMUM_ADDRESS_LENGTH = 5;
const MINIMUM_PHONE_DIGITS = 8;
const MAXIMUM_PHONE_DIGITS = 15;
const MINIMUM_AGE = 1;
const MAXIMUM_AGE = 120;
const AGE_PATTERN = /^\d+$/;
const NON_DIGIT_PATTERN = /\D/g;

export const EMPTY_PROFILE: EmergencyProfile = {
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

const PROFILE_FIELDS = Object.keys(EMPTY_PROFILE) as (keyof EmergencyProfile)[];

export type ProfileFieldErrors = Partial<
  Record<keyof EmergencyProfile, string>
>;

type ProfileValidationResult =
  | {
      errors: ProfileFieldErrors;
      success: false;
    }
  | {
      profile: EmergencyProfile;
      success: true;
    };

const trimProfile = (profile: EmergencyProfile): EmergencyProfile => ({
  address: profile.address.trim(),
  age: profile.age.trim(),
  allergies: profile.allergies.trim(),
  bloodType: profile.bloodType.trim(),
  conditions: profile.conditions.trim(),
  contactName: profile.contactName.trim(),
  contactPhone: profile.contactPhone.trim(),
  fullName: profile.fullName.trim(),
  language: profile.language.trim(),
  medications: profile.medications.trim(),
  specialNeeds: profile.specialNeeds.trim(),
});

export const validateEmergencyProfile = (
  input: EmergencyProfile
): ProfileValidationResult => {
  const profile = trimProfile(input);
  const errors: ProfileFieldErrors = {};

  if (profile.fullName.length < MINIMUM_NAME_LENGTH) {
    errors.fullName = "Masukkan nama lengkap sesuai identitas.";
  }

  const age = Number(profile.age);
  const isValidAge =
    AGE_PATTERN.test(profile.age) && age >= MINIMUM_AGE && age <= MAXIMUM_AGE;
  if (!isValidAge) {
    errors.age = `Masukkan umur ${MINIMUM_AGE}–${MAXIMUM_AGE} tahun.`;
  }

  if (profile.address.length < MINIMUM_ADDRESS_LENGTH) {
    errors.address = "Masukkan alamat rumah yang lengkap.";
  }

  if (profile.language.length < MINIMUM_NAME_LENGTH) {
    errors.language = "Masukkan bahasa utama yang digunakan.";
  }

  if (profile.contactName.length < MINIMUM_NAME_LENGTH) {
    errors.contactName = "Masukkan nama kontak darurat.";
  }

  const phoneDigitCount = profile.contactPhone.replace(
    NON_DIGIT_PATTERN,
    ""
  ).length;
  const isValidPhone =
    phoneDigitCount >= MINIMUM_PHONE_DIGITS &&
    phoneDigitCount <= MAXIMUM_PHONE_DIGITS;
  if (!isValidPhone) {
    errors.contactPhone = "Masukkan nomor telepon aktif (8–15 digit).";
  }

  if (Object.keys(errors).length > 0) {
    return { errors, success: false };
  }

  return { profile, success: true };
};

export const isEmergencyProfile = (
  value: unknown
): value is EmergencyProfile => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return PROFILE_FIELDS.every((field) => typeof candidate[field] === "string");
};
