import prisma from "@siaga-app/db";
import type { BloodType } from "@siaga-app/db/enums";

import type { ReporterProfileDetail } from "../domain/entities";
import type {
  ProfileRepository,
  UpdateReporterProfileInput,
} from "../domain/profile-repository";

const EMPTY_PROFILE: Omit<ReporterProfileDetail, "fullName"> = {
  address: "",
  age: "",
  allergies: "",
  bloodType: "",
  conditions: "",
  contactName: "",
  contactPhone: "",
  medications: "",
  phoneNumber: "",
  specialNeeds: "",
};

const toProfileDetail = (user: {
  name: string;
  reporterProfile: {
    age: number | null;
    allergies: string | null;
    bloodType: BloodType | null;
    conditions: string | null;
    emergencyContactName: string | null;
    emergencyContactPhone: string | null;
    homeAddress: string | null;
    medications: string | null;
    phoneNumber: string | null;
    specialNeeds: string | null;
  } | null;
}): ReporterProfileDetail => {
  const profile = user.reporterProfile;
  if (!profile) {
    return { ...EMPTY_PROFILE, fullName: user.name };
  }

  return {
    address: profile.homeAddress ?? "",
    age: profile.age?.toString() ?? "",
    allergies: profile.allergies ?? "",
    bloodType: profile.bloodType ?? "",
    conditions: profile.conditions ?? "",
    contactName: profile.emergencyContactName ?? "",
    contactPhone: profile.emergencyContactPhone ?? "",
    fullName: user.name,
    medications: profile.medications ?? "",
    phoneNumber: profile.phoneNumber ?? "",
    specialNeeds: profile.specialNeeds ?? "",
  };
};

const profileSelect = {
  name: true,
  reporterProfile: {
    select: {
      age: true,
      allergies: true,
      bloodType: true,
      conditions: true,
      emergencyContactName: true,
      emergencyContactPhone: true,
      homeAddress: true,
      medications: true,
      phoneNumber: true,
      specialNeeds: true,
    },
  },
} as const;

export class PrismaProfileRepository implements ProfileRepository {
  async findByUserId(userId: string): Promise<ReporterProfileDetail> {
    const user = await prisma.user.findUniqueOrThrow({
      select: profileSelect,
      where: { id: userId },
    });
    return toProfileDetail(user);
  }

  async update({
    profile,
    userId,
  }: UpdateReporterProfileInput): Promise<ReporterProfileDetail> {
    const age = Number(profile.age);
    const updated = await prisma.user.update({
      data: {
        name: profile.fullName,
        reporterProfile: {
          upsert: {
            create: {
              age,
              allergies: profile.allergies || null,
              bloodType: profile.bloodType || null,
              conditions: profile.conditions || null,
              emergencyContactName: profile.contactName,
              emergencyContactPhone: profile.contactPhone,
              homeAddress: profile.address,
              medications: profile.medications || null,
              phoneNumber: profile.phoneNumber || null,
              specialNeeds: profile.specialNeeds || null,
            },
            update: {
              age,
              allergies: profile.allergies || null,
              bloodType: profile.bloodType || null,
              conditions: profile.conditions || null,
              emergencyContactName: profile.contactName,
              emergencyContactPhone: profile.contactPhone,
              homeAddress: profile.address,
              medications: profile.medications || null,
              phoneNumber: profile.phoneNumber || null,
              specialNeeds: profile.specialNeeds || null,
            },
          },
        },
      },
      select: profileSelect,
      where: { id: userId },
    });
    return toProfileDetail(updated);
  }
}
