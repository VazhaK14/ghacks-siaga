import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@siaga-app/ui/components/sidebar";
import { cn } from "@siaga-app/ui/lib/utils";
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
  fullBleed = false,
}: {
  user: DashboardShellUser;
  children: ReactNode;
  fullBleed?: boolean;
}) {
  return (
    <SidebarProvider className="bg-neutral-200">
      <DashboardSidebar user={user} />
      <SidebarInset
        className={cn("bg-neutral-200", fullBleed && "h-svh overflow-hidden")}
      >
        <SidebarTrigger className="m-2 self-start md:hidden" />
        <div
          className={cn(
            "flex-1 overflow-y-auto p-6 md:p-10",
            fullBleed && "min-h-0 overflow-hidden p-0 md:p-0"
          )}
        >
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
