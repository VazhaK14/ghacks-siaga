import { z } from "zod";

const bloodTypeSchema = z.enum([
  "",
  "A_POSITIVE",
  "A_NEGATIVE",
  "B_POSITIVE",
  "B_NEGATIVE",
  "AB_POSITIVE",
  "AB_NEGATIVE",
  "O_POSITIVE",
  "O_NEGATIVE",
  "UNKNOWN",
]);

const phoneSchema = z
  .string()
  .trim()
  .refine((value) => {
    const digitCount = value.replace(/\D/g, "").length;
    return digitCount >= 8 && digitCount <= 15;
  }, "Nomor telepon harus berisi 8–15 digit.");

export const reporterProfileOutputSchema = z.object({
  address: z.string(),
  age: z.string(),
  allergies: z.string(),
  bloodType: bloodTypeSchema,
  conditions: z.string(),
  contactName: z.string(),
  contactPhone: z.string(),
  fullName: z.string(),
  isComplete: z.boolean(),
  medications: z.string(),
  phoneNumber: z.string(),
  specialNeeds: z.string(),
});

export const reporterProfileUpdateSchema = z.object({
  address: z.string().trim().min(5).max(500),
  age: z
    .string()
    .regex(/^\d+$/)
    .refine((value) => {
      const age = Number(value);
      return age >= 1 && age <= 120;
    }),
  allergies: z.string().trim().max(1000),
  bloodType: bloodTypeSchema,
  conditions: z.string().trim().max(1000),
  contactName: z.string().trim().min(2).max(200),
  contactPhone: phoneSchema,
  fullName: z.string().trim().min(2).max(200),
  medications: z.string().trim().max(1000),
  phoneNumber: phoneSchema,
  specialNeeds: z.string().trim().max(1000),
});
