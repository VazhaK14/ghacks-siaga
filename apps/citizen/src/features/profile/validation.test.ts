import { describe, expect, it } from "bun:test";

import type { EmergencyProfile, ReporterProfile } from "./types";
import { validateEmergencyProfile } from "./validation";

const COMPLETE_PROFILE: EmergencyProfile = {
  address: "Jalan Melati Nomor 10, Bandung",
  age: "31",
  allergies: "",
  bloodType: "",
  conditions: "",
  contactName: "Budi Darmawan",
  contactPhone: "0812-3456-7890",
  fullName: "Ayu Lestari",
  medications: "",
  phoneNumber: "+62 812 3456 7891",
  specialNeeds: "",
};

describe("validateEmergencyProfile", () => {
  it("menerima field wajib dengan field medis kosong", () => {
    const result = validateEmergencyProfile(COMPLETE_PROFILE);
    expect(result.success).toBe(true);
  });

  it("mengabaikan metadata kelengkapan dari respons API", () => {
    const profileFromApi: ReporterProfile = {
      ...COMPLETE_PROFILE,
      isComplete: false,
    };
    const result = validateEmergencyProfile(profileFromApi);
    expect(result.success).toBe(true);
  });

  it("menolak nomor pribadi dan kontak darurat yang tidak valid", () => {
    const result = validateEmergencyProfile({
      ...COMPLETE_PROFILE,
      contactPhone: "123",
      phoneNumber: "456",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.contactPhone).toBeDefined();
      expect(result.errors.phoneNumber).toBeDefined();
    }
  });

  it("menolak field yang melebihi batas panjang server", () => {
    const result = validateEmergencyProfile({
      ...COMPLETE_PROFILE,
      address: "a".repeat(501),
      allergies: "b".repeat(1001),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.address).toBeDefined();
      expect(result.errors.allergies).toBeDefined();
    }
  });

  it("menolak data identitas utama yang kosong", () => {
    const result = validateEmergencyProfile({
      ...COMPLETE_PROFILE,
      address: "",
      age: "",
      contactName: "",
      fullName: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(Object.keys(result.errors)).toEqual(
        expect.arrayContaining(["address", "age", "contactName", "fullName"])
      );
    }
  });
});
