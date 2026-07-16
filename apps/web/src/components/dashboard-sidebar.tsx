import {
  DropdownMenu,
  DropdownMenuContent,
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
import { useCallback } from "react";
import { NavLink, useLocation, useNavigate } from "react-router";

import { authClient } from "@/lib/auth-client";
import { getInitials } from "@/lib/get-initials";

const NAV_ITEMS = [
  { label: "Dashboard", to: "/" },
  { label: "Map Monitor", to: "/map-monitor" },
  { label: "Laporan", to: "/laporan" },
  { label: "Unit Respons", to: "/unit-respons" },
  { label: "Operator", to: "/operators" },
  { label: "Pengaturan", to: "/pengaturan" },
] as const;

interface DashboardSidebarUser {
  email: string;
  name: string;
  role: string;
}

const NAV_MENU_BUTTON_CLASSNAME =
  "rounded-md text-primary-foreground hover:bg-primary-300/40 hover:text-primary-foreground data-active:bg-primary-300 data-active:text-primary-foreground data-active:hover:bg-primary-300";

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
      className="border-none bg-gradient-to-b from-primary-400 to-primary-500"
      collapsible="offcanvas"
    >
      <SidebarHeader className="px-4 py-6">
        <p className="font-extrabold font-sans text-primary-foreground text-xl tracking-tight">
          SIAGA
        </p>
        <p className="-mt-2 font-sans text-[10px] text-primary-foreground/70 tracking-widest">
          COMMAND CENTER
        </p>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup className="gap-1 p-0">
          <SidebarMenu className="gap-3">
            {NAV_ITEMS.map((item) => (
              <SidebarMenuItem key={item.to}>
                <SidebarMenuButton
                  className={NAV_MENU_BUTTON_CLASSNAME}
                  isActive={
                    item.to === "/"
                      ? location.pathname === "/"
                      : location.pathname.startsWith(item.to)
                  }
                  render={<NavLink end={item.to === "/"} to={item.to} />}
                  size="lg"
                >
                  {item.label}
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                className="flex w-full items-center gap-3 rounded-xl bg-neutral-100 p-3 text-left"
                type="button"
              />
            }
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-10 font-extrabold text-primary-300 text-xs">
              {getInitials(user.name)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold text-neutral-1000 text-xs">
                {user.name}
              </span>
              <span className="block truncate text-[9px] text-neutral-700">
                {user.role === "OPERATOR" ? "Operator" : user.role}
              </span>
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="top">
            <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} variant="destructive">
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
