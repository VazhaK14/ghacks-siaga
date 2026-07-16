import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@siaga-app/ui/components/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@siaga-app/ui/components/sidebar";
import {
  ClipboardListIcon,
  GaugeIcon,
  LogOutIcon,
  MapPinnedIcon,
  SettingsIcon,
  ShieldCheckIcon,
  SirenIcon,
  UsersIcon,
} from "lucide-react";
import { useCallback } from "react";
import { NavLink, useLocation, useNavigate } from "react-router";

import { authClient } from "@/lib/auth-client";
import { getInitials } from "@/lib/get-initials";

const NAV_ITEMS = [
  { icon: GaugeIcon, label: "Dashboard", to: "/" },
  { icon: MapPinnedIcon, label: "Laporan Aktif", to: "/map-monitor" },
  { icon: ClipboardListIcon, label: "Riwayat Laporan", to: "/laporan" },
  { icon: SirenIcon, label: "Unit Respons", to: "/unit-respons" },
  { icon: UsersIcon, label: "Operator", to: "/operators" },
  { icon: SettingsIcon, label: "Pengaturan", to: "/pengaturan" },
] as const;

interface DashboardSidebarUser {
  email: string;
  name: string;
  role: string;
}

const NAV_MENU_BUTTON_CLASSNAME =
  "rounded-md px-3 text-sidebar-foreground hover:bg-muted hover:text-foreground data-active:bg-primary-10 data-active:font-semibold data-active:text-primary-300 data-active:hover:bg-primary-10 data-active:hover:text-primary-300";

export function DashboardSidebar({ user }: { user: DashboardSidebarUser }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = useCallback(() => {
    authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          navigate("/login");
        },
      },
    });
  }, [navigate]);

  return (
    <Sidebar
      className="z-20 border-none bg-transparent p-4 [&_[data-slot=sidebar-inner]]:rounded-md [&_[data-slot=sidebar-inner]]:bg-popover/95 [&_[data-slot=sidebar-inner]]:shadow-xl [&_[data-slot=sidebar-inner]]:ring-1 [&_[data-slot=sidebar-inner]]:ring-foreground/10 [&_[data-slot=sidebar-inner]]:backdrop-blur-sm"
      collapsible="offcanvas"
      variant="floating"
    >
      <SidebarHeader className="border-b px-4 py-4">
        <span className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-md bg-primary-10 text-primary-300">
            <ShieldCheckIcon aria-hidden />
          </span>
          <span>
            <span className="block font-extrabold text-base text-foreground">
              SIAGA
            </span>
            <span className="block text-[9px] text-muted-foreground">
              Command Center
            </span>
          </span>
        </span>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4">
        <SidebarGroup className="gap-1 p-0">
          <SidebarMenu className="gap-1">
            {NAV_ITEMS.map(({ icon: Icon, label, to }) => (
              <SidebarMenuItem key={to}>
                <SidebarMenuButton
                  className={NAV_MENU_BUTTON_CLASSNAME}
                  isActive={
                    to === "/"
                      ? location.pathname === "/"
                      : location.pathname.startsWith(to)
                  }
                  render={<NavLink end={to === "/"} to={to} />}
                  size="default"
                >
                  <Icon aria-hidden />
                  <span>{label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-3">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                className="flex w-full items-center gap-3 rounded-md bg-muted/70 p-2 text-left outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                type="button"
              />
            }
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-10 font-extrabold text-primary-300 text-xs">
              {getInitials(user.name)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold text-foreground text-xs">
                {user.name}
              </span>
              <span className="block truncate text-[9px] text-muted-foreground">
                {user.role === "OPERATOR" ? "Operator" : user.role}
              </span>
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="rounded-md"
            side="top"
            sideOffset={8}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={handleSignOut} variant="destructive">
                <LogOutIcon aria-hidden />
                Keluar
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
