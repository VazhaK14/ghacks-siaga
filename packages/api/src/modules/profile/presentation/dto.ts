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

export const reporterProfileOutputSchema = z.object({
  address: z.string(),
  age: z.string(),
  allergies: z.string(),
  bloodType: bloodTypeSchema,
  conditions: z.string(),
  contactName: z.string(),
  contactPhone: z.string(),
  fullName: z.string(),
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
  contactPhone: z.string().trim().min(8).max(30),
  fullName: z.string().trim().min(2).max(200),
  medications: z.string().trim().max(1000),
  phoneNumber: z.string().trim().max(30),
  specialNeeds: z.string().trim().max(1000),
});
