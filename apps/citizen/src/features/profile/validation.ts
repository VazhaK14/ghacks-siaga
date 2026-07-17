import type {
  EmergencyProfile,
  ProfileFieldErrors,
  ReporterProfile,
} from "./types";

const AGE_PATTERN = /^\d+$/;
const NON_DIGIT_PATTERN = /\D/g;
const MINIMUM_PHONE_DIGITS = 8;
const MAXIMUM_PHONE_DIGITS = 15;
const MAXIMUM_NAME_LENGTH = 200;
const MAXIMUM_ADDRESS_LENGTH = 500;
const MAXIMUM_NOTE_LENGTH = 1000;

// Urutan tampil field pada ProfileFields — dipakai untuk memfokuskan error pertama.
export const PROFILE_FIELD_FOCUS_ORDER: Array<keyof EmergencyProfile> = [
  "fullName",
  "age",
  "phoneNumber",
  "address",
  "contactName",
  "contactPhone",
  "allergies",
  "conditions",
  "medications",
  "specialNeeds",
];

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

export const toEmergencyProfile = (
  input: EmergencyProfile | ReporterProfile
): EmergencyProfile => ({
  address: input.address,
  age: input.age,
  allergies: input.allergies,
  bloodType: input.bloodType,
  conditions: input.conditions,
  contactName: input.contactName,
  contactPhone: input.contactPhone,
  fullName: input.fullName,
  medications: input.medications,
  phoneNumber: input.phoneNumber,
  specialNeeds: input.specialNeeds,
});

type ProfileValidationResult =
  | { errors: ProfileFieldErrors; success: false }
  | { profile: EmergencyProfile; success: true };

export const validateEmergencyProfile = (
  input: EmergencyProfile
): ProfileValidationResult => {
  const profile: EmergencyProfile = {
    address: input.address.trim(),
    age: input.age.trim(),
    allergies: input.allergies.trim(),
    bloodType: input.bloodType,
    conditions: input.conditions.trim(),
    contactName: input.contactName.trim(),
    contactPhone: input.contactPhone.trim(),
    fullName: input.fullName.trim(),
    medications: input.medications.trim(),
    phoneNumber: input.phoneNumber.trim(),
    specialNeeds: input.specialNeeds.trim(),
  };
  const errors: ProfileFieldErrors = {};
  const age = Number(profile.age);
  const contactPhoneDigits = profile.contactPhone.replace(
    NON_DIGIT_PATTERN,
    ""
  ).length;
  const phoneNumberDigits = profile.phoneNumber.replace(
    NON_DIGIT_PATTERN,
    ""
  ).length;

  if (profile.fullName.length < 2) {
    errors.fullName = "Masukkan nama lengkap sesuai identitas.";
  } else if (profile.fullName.length > MAXIMUM_NAME_LENGTH) {
    errors.fullName = "Nama lengkap maksimal 200 karakter.";
  }
  if (!(AGE_PATTERN.test(profile.age) && age >= 1 && age <= 120)) {
    errors.age = "Masukkan umur 1–120 tahun.";
  }
  if (profile.address.length < 5) {
    errors.address = "Masukkan alamat rumah yang lengkap.";
  } else if (profile.address.length > MAXIMUM_ADDRESS_LENGTH) {
    errors.address = "Alamat rumah maksimal 500 karakter.";
  }
  if (
    phoneNumberDigits < MINIMUM_PHONE_DIGITS ||
    phoneNumberDigits > MAXIMUM_PHONE_DIGITS
  ) {
    errors.phoneNumber = "Masukkan nomor telepon aktif (8–15 digit).";
  }
  if (profile.contactName.length < 2) {
    errors.contactName = "Masukkan nama kontak darurat.";
  } else if (profile.contactName.length > MAXIMUM_NAME_LENGTH) {
    errors.contactName = "Nama kontak darurat maksimal 200 karakter.";
  }
  if (
    contactPhoneDigits < MINIMUM_PHONE_DIGITS ||
    contactPhoneDigits > MAXIMUM_PHONE_DIGITS
  ) {
    errors.contactPhone = "Masukkan nomor telepon aktif (8–15 digit).";
  }
  if (profile.allergies.length > MAXIMUM_NOTE_LENGTH) {
    errors.allergies = "Catatan alergi maksimal 1000 karakter.";
  }
  if (profile.conditions.length > MAXIMUM_NOTE_LENGTH) {
    errors.conditions = "Catatan kondisi medis maksimal 1000 karakter.";
  }
  if (profile.medications.length > MAXIMUM_NOTE_LENGTH) {
    errors.medications = "Catatan obat rutin maksimal 1000 karakter.";
  }
  if (profile.specialNeeds.length > MAXIMUM_NOTE_LENGTH) {
    errors.specialNeeds = "Catatan kebutuhan khusus maksimal 1000 karakter.";
  }

  return Object.keys(errors).length > 0
    ? { errors, success: false }
    : { profile, success: true };
};
