import { useQuery } from "@tanstack/react-query";

import { requireOperatorSession } from "@/features/auth/guards";
import { trpc } from "@/utils/trpc";

import type { Route } from "./+types/dashboard";

export function loader({ request }: Route.LoaderArgs) {
  return requireOperatorSession(request);
}

export default function Dashboard({ loaderData }: Route.ComponentProps) {
  const privateData = useQuery(trpc.privateData.queryOptions());

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome {loaderData.user?.name}</p>
      <p>API: {privateData.data?.message}</p>
    </div>
  );
}
