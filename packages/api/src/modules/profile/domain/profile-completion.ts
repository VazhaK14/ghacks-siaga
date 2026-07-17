import prisma from "@siaga-app/db";

interface ProfileCompletionFields {
  age: number | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  homeAddress: string | null;
  phoneNumber: string | null;
}

const PHONE_DIGITS_PATTERN = /^\d{8,15}$/;

const hasValidPhone = (value: string | null): boolean =>
  PHONE_DIGITS_PATTERN.test(value?.replace(/\D/g, "") ?? "");

export const isReporterProfileComplete = (
  profile: ProfileCompletionFields | null
): boolean =>
  Boolean(
    profile?.age &&
      profile.age >= 1 &&
      profile.age <= 120 &&
      profile.homeAddress?.trim() &&
      profile.emergencyContactName?.trim() &&
      hasValidPhone(profile.phoneNumber) &&
      hasValidPhone(profile.emergencyContactPhone)
  );

export const hasCompletedReporterProfile = async (
  userId: string
): Promise<boolean> => {
  const profile = await prisma.reporterProfile.findUnique({
    select: {
      age: true,
      emergencyContactName: true,
      emergencyContactPhone: true,
      homeAddress: true,
      phoneNumber: true,
    },
    where: { userId },
  });
  return isReporterProfileComplete(profile);
};
