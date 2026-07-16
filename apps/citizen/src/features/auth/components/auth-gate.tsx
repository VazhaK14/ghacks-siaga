import { Button } from "@siaga-app/ui/components/button";
import { ShieldXIcon } from "lucide-react";
import type { PropsWithChildren } from "react";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router";

import { authClient } from "@/lib/auth-client";

import { useSignOutMutation } from "../api";

const AUTH_PATHS = new Set(["/sign-in", "/sign-up"]);

export const AuthGate = ({ children }: PropsWithChildren) => {
  const location = useLocation();
  const navigate = useNavigate();
  const session = authClient.useSession();
  const signOut = useSignOutMutation();
  const isAuthPath = AUTH_PATHS.has(location.pathname);
  const role = session.data?.user.role;
  const isReporter = role === "REPORTER";
  const shouldOpenSignIn = !(session.isPending || session.data || isAuthPath);
  const shouldOpenApp =
    !session.isPending && Boolean(session.data) && isAuthPath && isReporter;

  useEffect(() => {
    if (shouldOpenSignIn) {
      navigate("/sign-in", { replace: true });
      return;
    }
    if (shouldOpenApp) {
      navigate("/", { replace: true });
    }
  }, [navigate, shouldOpenApp, shouldOpenSignIn]);

  const handleSignOut = async () => {
    await signOut.mutateAsync();
    navigate("/sign-in", { replace: true });
  };

  if (session.isPending || shouldOpenSignIn || shouldOpenApp) {
    return (
      <main className="flex min-h-dvh items-center justify-center p-6">
        <div
          aria-label="Memeriksa sesi"
          className="size-10 animate-spin rounded-full border-4 border-muted border-t-primary"
          role="status"
        />
      </main>
    );
  }

  if (session.data && !isReporter) {
    return (
      <main className="flex min-h-dvh items-center justify-center p-6">
        <section className="citizen-glass-surface flex max-w-sm flex-col items-center gap-4 p-6 text-center">
          <ShieldXIcon
            aria-hidden="true"
            className="size-12 text-destructive"
          />
          <h1 className="text-h4">Akun ini bukan akun pelapor</h1>
          <p className="text-muted-foreground text-sm">
            Akun operator hanya dapat digunakan melalui dashboard SIAGA.
          </p>
          <Button
            disabled={signOut.isPending}
            onClick={handleSignOut}
            variant="ghost"
          >
            Keluar dari akun
          </Button>
        </section>
      </main>
    );
  }

  return children;
};
