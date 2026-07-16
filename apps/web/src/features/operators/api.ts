import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { authClient } from "@/lib/auth-client";

import type { CreateOperatorInput, Operator, OperatorPage } from "./types";

const OPERATORS_QUERY_KEY = ["operators"] as const;

export function useOperatorsQuery({
  page,
  pageSize,
}: {
  page: number;
  pageSize: number;
}) {
  return useQuery({
    queryFn: async (): Promise<OperatorPage> => {
      const result = await authClient.admin.listUsers({
        query: {
          filterField: "role",
          filterOperator: "eq",
          filterValue: "OPERATOR",
          limit: pageSize,
          offset: (page - 1) * pageSize,
          sortBy: "createdAt",
          sortDirection: "desc",
        },
      });
      if (result.error) {
        throw new Error(result.error.message ?? result.error.statusText);
      }
      return {
        items: result.data.users as Operator[],
        page,
        pageSize,
        total: result.data.total,
        totalPages: Math.ceil(result.data.total / pageSize),
      };
    },
    queryKey: [...OPERATORS_QUERY_KEY, page, pageSize],
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
