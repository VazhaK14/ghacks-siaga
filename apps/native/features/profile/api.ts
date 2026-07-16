import type { AppRouter } from "@siaga-app/api/routers/index";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { inferRouterInputs } from "@trpc/server";

import { trpc } from "@/utils/trpc";

import type { EmergencyProfile } from "./types";

type RouterInputs = inferRouterInputs<AppRouter>;
type ProfileUpdateInput = RouterInputs["profile"]["update"];
type BloodType = ProfileUpdateInput["bloodType"];

const BLOOD_TYPES = new Set<BloodType>([
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

const normalizeBloodType = (value: string): BloodType =>
  BLOOD_TYPES.has(value as BloodType) ? (value as BloodType) : "";

const toUpdateInput = (profile: EmergencyProfile): ProfileUpdateInput => ({
  ...profile,
  bloodType: normalizeBloodType(profile.bloodType),
});

export function useReporterProfileQuery(enabled: boolean) {
  return useQuery({
    ...trpc.profile.get.queryOptions(),
    enabled,
    retry: false,
  });
}

export function useUpdateReporterProfileMutation() {
  const queryClient = useQueryClient();
  const mutation = useMutation(trpc.profile.update.mutationOptions());

  const mutateAsync = async (profile: EmergencyProfile) => {
    const result = await mutation.mutateAsync(toUpdateInput(profile));
    await queryClient.invalidateQueries({
      queryKey: trpc.profile.get.queryKey(),
    });
    return result;
  };

  return { ...mutation, mutateAsync };
}
