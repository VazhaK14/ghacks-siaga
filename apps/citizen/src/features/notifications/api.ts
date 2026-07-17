import { useMutation, useQuery } from "@tanstack/react-query";

import { trpc } from "@/utils/trpc";

export const usePushPublicKeyQuery = () =>
  useQuery({
    ...trpc.push.getPublicKey.queryOptions(),
    staleTime: Number.POSITIVE_INFINITY,
  });

export const useSavePushSubscriptionMutation = () =>
  useMutation({ ...trpc.push.save.mutationOptions(), retry: 2 });

export const useRemovePushSubscriptionMutation = () =>
  useMutation(trpc.push.remove.mutationOptions());
