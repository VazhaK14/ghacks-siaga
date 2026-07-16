import { useMutation } from "@tanstack/react-query";

import { authClient } from "@/lib/auth-client";

import type { LoginInput } from "./types";

export function useLoginMutation() {
  return useMutation({
    mutationFn: async (input: LoginInput) => {
      const result = await authClient.signIn.email({
        email: input.email,
        password: input.password,
      });
      if (result.error) {
        throw new Error(result.error.message ?? result.error.statusText);
      }
      return result.data;
    },
  });
}
