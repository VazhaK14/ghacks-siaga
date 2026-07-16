import { cn } from "@siaga-app/ui/lib/utils";
import type { PropsWithChildren } from "react";

interface MobilePageProps extends PropsWithChildren {
  className?: string;
  title?: string;
}

export const MobilePage = ({ children, className, title }: MobilePageProps) => (
  <main
    className={cn(
      "relative mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-[calc(7.5rem+env(safe-area-inset-bottom))] text-foreground",
      className
    )}
  >
    {title ? <h1 className="sr-only">{title}</h1> : null}
    {children}
  </main>
);
