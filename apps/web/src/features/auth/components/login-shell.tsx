import type { ReactNode } from "react";

import { BrandingPanel } from "./branding-panel";

export function LoginShell({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-svh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="mb-6 flex items-center justify-center gap-3 lg:hidden">
            <img
              alt=""
              aria-hidden="true"
              className="size-14 rounded-2xl object-contain"
              height={623}
              src="logo.png"
              width={623}
            />
            <span>
              <span className="block font-extrabold text-foreground text-lg">
                SIAGA
              </span>
              <span className="block text-muted-foreground text-xs">
                Command Center
              </span>
            </span>
          </div>
          {children}
        </div>
      </div>
      <BrandingPanel />
    </div>
  );
}
