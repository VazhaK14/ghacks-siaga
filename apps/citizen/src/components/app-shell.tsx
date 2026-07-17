import { cn } from "@siaga-app/ui/lib/utils";
import { Clock3Icon, SirenIcon, UserRoundIcon } from "lucide-react";
import type { PropsWithChildren } from "react";
import { NavLink, type NavLinkRenderProps, useLocation } from "react-router";

import { useIncident } from "@/features/emergency/context";

const NAVIGATION_HIDDEN_PATHS = new Set([
  "/complete-registration",
  "/offline-call",
  "/sign-in",
  "/sign-up",
]);

const NAV_ITEMS = [
  { icon: Clock3Icon, label: "Riwayat", to: "/history" },
  { icon: UserRoundIcon, label: "Profil", to: "/profile" },
] as const;

const getNavClassName = ({ isActive }: NavLinkRenderProps): string =>
  cn(
    "flex min-w-0 flex-col items-center gap-1 rounded-lg px-1 py-2 text-muted-foreground text-xs transition-all duration-200",
    isActive && "bg-primary/15 text-primary-foreground shadow-sm"
  );

const renderNavItem = ({
  icon: Icon,
  label,
  to,
}: (typeof NAV_ITEMS)[number]) => (
  <NavLink className={getNavClassName} key={to} to={to}>
    <Icon aria-hidden="true" className="size-5" />
    {label}
  </NavLink>
);

export const AppShell = ({ children }: PropsWithChildren) => {
  const location = useLocation();
  const incident = useIncident();
  const isNavigationHidden = NAVIGATION_HIDDEN_PATHS.has(location.pathname);

  const handleStartNewSos = () => {
    incident.cancelIncident();
  };

  if (isNavigationHidden) {
    return children;
  }

  return (
    <div className="min-h-dvh">
      {children}
      <nav
        aria-label="Navigasi utama"
        className="citizen-glass-nav fixed inset-x-4 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] mx-auto grid max-w-md grid-cols-[1fr_4.5rem_1fr] items-center px-2 py-2"
      >
        {renderNavItem(NAV_ITEMS[0])}
        <NavLink
          aria-label="Mulai laporan SOS baru"
          className="citizen-nav-sos mx-auto flex size-16 -translate-y-5 flex-col items-center justify-center rounded-full bg-primary text-primary-foreground"
          onClick={handleStartNewSos}
          to="/sos"
        >
          <SirenIcon aria-hidden="true" className="size-6" />
          <span className="font-bold text-[10px]">SOS</span>
        </NavLink>
        {renderNavItem(NAV_ITEMS[1])}
      </nav>
    </div>
  );
};
