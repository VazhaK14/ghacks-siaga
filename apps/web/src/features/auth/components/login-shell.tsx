import type { ReactNode } from "react";

import { BrandingPanel } from "./branding-panel";

export function LoginShell({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-svh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">{children}</div>
      </div>
      <BrandingPanel />
    </div>
  );
}
