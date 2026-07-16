import { Outlet, useMatches } from "react-router";

import { DashboardShell } from "@/components/dashboard-shell";
import { requireOperatorSession } from "@/features/auth/guards";

import type { Route } from "./+types/_dashboard";

export function loader({ request }: Route.LoaderArgs) {
  return requireOperatorSession(request);
}

export default function DashboardLayout({ loaderData }: Route.ComponentProps) {
  const matches = useMatches();
  const hasStandardSurface = matches.some((match) => {
    const { handle } = match;

    return (
      typeof handle === "object" &&
      handle !== null &&
      "dashboardSurface" in handle &&
      handle.dashboardSurface === "standard"
    );
  });
  const hasMonitorLayout = matches.some((match) => {
    const { handle } = match;

    return (
      typeof handle === "object" &&
      handle !== null &&
      "mapLayout" in handle &&
      handle.mapLayout === "monitor"
    );
  });

  return (
    <DashboardShell
      mapLayout={hasMonitorLayout ? "monitor" : "default"}
      surface={hasStandardSurface ? "standard" : "map"}
      user={loaderData.user}
    >
      <Outlet />
    </DashboardShell>
  );
}
