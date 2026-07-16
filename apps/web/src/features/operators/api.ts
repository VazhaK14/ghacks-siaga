import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { authClient } from "@/lib/auth-client";

import type { CreateOperatorInput, Operator } from "./types";

const OPERATORS_QUERY_KEY = ["operators"] as const;

export function useOperatorsQuery() {
  return useQuery({
    queryFn: async (): Promise<Operator[]> => {
      const result = await authClient.admin.listUsers({
        query: {
          filterField: "role",
          filterOperator: "eq",
          filterValue: "OPERATOR",
          sortBy: "createdAt",
          sortDirection: "desc",
        },
      });
      if (result.error) {
        throw new Error(result.error.message ?? result.error.statusText);
      }
      return result.data.users as Operator[];
    },
    queryKey: OPERATORS_QUERY_KEY,
  });
}

export function useCreateOperatorMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateOperatorInput) => {
      const result = await authClient.admin.createUser({
        email: input.email,
        name: input.name,
        password: input.password,
        role: "OPERATOR",
      });
      if (result.error) {
        throw new Error(result.error.message ?? result.error.statusText);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: OPERATORS_QUERY_KEY });
    },
  });
}
