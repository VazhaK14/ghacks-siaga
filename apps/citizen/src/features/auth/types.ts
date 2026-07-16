import { z } from "zod";

export const signInSchema = z.object({
  email: z.email("Masukkan alamat email yang valid."),
  password: z.string().min(8, "Kata sandi minimal 8 karakter."),
});

export const signUpSchema = signInSchema
  .extend({
    confirmPassword: z
      .string()
      .min(8, "Konfirmasi kata sandi minimal 8 karakter."),
    name: z.string().trim().min(2, "Masukkan nama lengkap."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Konfirmasi kata sandi tidak cocok.",
    path: ["confirmPassword"],
  });

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
