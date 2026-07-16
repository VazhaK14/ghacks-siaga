import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@siaga-app/ui/components/sidebar";
import { type CSSProperties, type ReactNode, useEffect, useState } from "react";

import { MapWorkspace } from "@/features/map/components/map-workspace";
import type { MapWorkspaceLayout } from "@/features/map/types";
import { DashboardSidebar } from "./dashboard-sidebar";

interface DashboardShellUser {
  email: string;
  name: string;
  role: string;
}

export function DashboardShell({
  user,
  children,
  mapLayout,
  surface,
}: {
  user: DashboardShellUser;
  children: ReactNode;
  mapLayout: MapWorkspaceLayout;
  surface: "map" | "standard";
}) {
  const [isMapFocusMode, setIsMapFocusMode] = useState(false);

  useEffect(() => {
    if (mapLayout !== "monitor" || surface !== "map") {
      setIsMapFocusMode(false);
    }
  }, [mapLayout, surface]);

  return (
    <SidebarProvider
      className="relative h-svh min-h-0 overflow-hidden bg-background text-foreground [&_[data-slot=sidebar-gap]]:w-0!"
      style={{ "--sidebar-width": "15rem" } as CSSProperties}
    >
      <DashboardSidebar user={user} />
      <SidebarInset className="h-svh min-w-0 overflow-hidden bg-background">
        {isMapFocusMode ? null : (
          <SidebarTrigger
            className="fixed top-3 left-3 z-30 bg-popover text-popover-foreground shadow-lg md:hidden"
            variant="secondary"
          />
        )}
        {surface === "map" ? (
          <MapWorkspace
            isMapFocusMode={isMapFocusMode}
            layout={mapLayout}
            onMapFocusChange={setIsMapFocusMode}
          >
            {children}
          </MapWorkspace>
        ) : (
          <div className="size-full overflow-y-auto p-6 pt-16 md:py-10 md:pr-10 md:pl-[17rem]">
            {children}
          </div>
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}
