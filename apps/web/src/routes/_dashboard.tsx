import { Outlet, useMatches } from "react-router";

import { DashboardShell } from "@/components/dashboard-shell";
import { requireOperatorSession } from "@/features/auth/guards";

import type { Route } from "./+types/_dashboard";

export function loader({ request }: Route.LoaderArgs) {
  return requireOperatorSession(request);
}

export default function DashboardLayout({ loaderData }: Route.ComponentProps) {
  const matches = useMatches();
  const isFullBleed = matches.some((match) => {
    const { handle } = match;

    return (
      typeof handle === "object" &&
      handle !== null &&
      "fullBleed" in handle &&
      handle.fullBleed === true
    );
  });

  return (
    <DashboardShell fullBleed={isFullBleed} user={loaderData.user}>
      <Outlet />
    </DashboardShell>
  );
}
