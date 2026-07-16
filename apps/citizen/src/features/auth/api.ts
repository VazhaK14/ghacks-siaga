import { useMutation } from "@tanstack/react-query";

import { authClient } from "@/lib/auth-client";

import type { SignInInput, SignUpInput } from "./types";

export const useSignInMutation = () =>
  useMutation({
    mutationFn: async (input: SignInInput) => {
      const result = await authClient.signIn.email(input);
      if (result.error) {
        throw new Error(
          result.error.message ?? "Email atau kata sandi tidak valid."
        );
      }
      return result.data;
    },
  });

export const useSignUpMutation = () =>
  useMutation({
    mutationFn: async (input: SignUpInput) => {
      const result = await authClient.signUp.email({
        email: input.email,
        name: input.name,
        password: input.password,
      });
      if (result.error) {
        throw new Error(
          result.error.message ?? "Akun pelapor belum dapat dibuat."
        );
      }
      return result.data;
    },
  });

export const useSignOutMutation = () =>
  useMutation({
    mutationFn: async () => {
      const result = await authClient.signOut();
      if (result.error) {
        throw new Error(result.error.message ?? "Gagal keluar dari akun.");
      }
    },
  });
