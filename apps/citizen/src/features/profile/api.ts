import type { AppRouter } from "@siaga-app/api/routers/index";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { inferRouterInputs } from "@trpc/server";

import { trpc } from "@/utils/trpc";

import type { EmergencyProfile } from "./types";

type ProfileUpdateInput = inferRouterInputs<AppRouter>["profile"]["update"];

export const useReporterProfileQuery = () =>
  useQuery({ ...trpc.profile.get.queryOptions(), retry: false });

export const useUpdateReporterProfileMutation = () => {
  const queryClient = useQueryClient();
  const mutation = useMutation(trpc.profile.update.mutationOptions());

  const mutateAsync = async (profile: EmergencyProfile) => {
    const result = await mutation.mutateAsync(profile as ProfileUpdateInput);
    await queryClient.invalidateQueries({
      queryKey: trpc.profile.get.queryKey(),
    });
    return result;
  };

  return { ...mutation, mutateAsync };
};
