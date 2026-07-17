import { Toaster } from "@siaga-app/ui/components/sonner";
import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";

import { AppShell } from "@/components/app-shell";

import "./index.css";
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import { AuthGate } from "./features/auth/components/auth-gate";
import { IncidentProvider } from "./features/emergency/context";
import { queryClient } from "./utils/trpc";

export const meta: Route.MetaFunction = () => [
  { title: "SIAGA — Bantuan Darurat Warga" },
  {
    content:
      "Laporkan keadaan darurat dan pantau bantuan langsung dari perangkatmu.",
    name: "description",
  },
  { content: "yes", name: "mobile-web-app-capable" },
  { content: "yes", name: "apple-mobile-web-app-capable" },
  { content: "SIAGA", name: "apple-mobile-web-app-title" },
];

export const links: Route.LinksFunction = () => [
  { href: "icons/siaga.svg", rel: "icon", type: "image/svg+xml" },
  { href: "icons/siaga.svg", rel: "apple-touch-icon" },
  { href: "https://fonts.googleapis.com", rel: "preconnect" },
  {
    crossOrigin: "anonymous",
    href: "https://fonts.gstatic.com",
    rel: "preconnect",
  },
  {
    href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&display=swap",
    rel: "stylesheet",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta
          content="width=device-width, initial-scale=1, viewport-fit=cover"
          name="viewport"
        />
        <meta content="#870000" name="theme-color" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark">
        <AuthGate>
          <IncidentProvider>
            <AppShell>
              <Outlet />
            </AppShell>
          </IncidentProvider>
        </AuthGate>
        <Toaster richColors />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Terjadi kesalahan";
  let details = "Ada masalah yang tidak terduga.";
  let stack: string | undefined;
  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "Halaman yang dicari tidak ditemukan."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    const { message: errorMessage, stack: errorStack } = error;
    details = errorMessage;
    stack = errorStack;
  }
  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <section className="citizen-glass-surface w-full max-w-md p-6">
        <h1 className="font-bold text-xl">{message}</h1>
        <p className="mt-2 text-muted-foreground">{details}</p>
        {stack ? (
          <pre className="mt-4 w-full overflow-x-auto rounded-md bg-muted p-4 text-xs">
            <code>{stack}</code>
          </pre>
        ) : null}
      </section>
    </main>
  );
}
