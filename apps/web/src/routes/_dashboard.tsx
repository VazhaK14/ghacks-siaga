import { Outlet } from "react-router";

import { DashboardShell } from "@/components/dashboard-shell";
import { requireOperatorSession } from "@/features/auth/guards";

import type { Route } from "./+types/_dashboard";

export function loader({ request }: Route.LoaderArgs) {
  return requireOperatorSession(request);
}

export default function DashboardLayout({ loaderData }: Route.ComponentProps) {
  return (
    <DashboardShell user={loaderData.user}>
      <Outlet />
    </DashboardShell>
  );
}
