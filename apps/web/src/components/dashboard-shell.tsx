import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@siaga-app/ui/components/sidebar";
import type { ReactNode } from "react";

import { DashboardSidebar } from "./dashboard-sidebar";

interface DashboardShellUser {
  email: string;
  name: string;
  role: string;
}

export function DashboardShell({
  user,
  children,
}: {
  user: DashboardShellUser;
  children: ReactNode;
}) {
  return (
    <SidebarProvider className="bg-neutral-200">
      <DashboardSidebar user={user} />
      <SidebarInset className="bg-neutral-200">
        <SidebarTrigger className="m-2 self-start md:hidden" />
        <div className="flex-1 overflow-y-auto p-6 md:p-10">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
