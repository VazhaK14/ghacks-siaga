import { Button } from "@siaga-app/ui/components/button";
import { ShieldXIcon } from "lucide-react";
import type { PropsWithChildren } from "react";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router";

import { useReporterProfileQuery } from "@/features/profile/api";
import { authClient } from "@/lib/auth-client";

import { useSignOutMutation } from "../api";

const AUTH_PATHS = new Set(["/sign-in", "/sign-up"]);
const ONBOARDING_PATH = "/complete-registration";
const PUBLIC_PATHS = new Set(["/offline-call"]);

export const AuthGate = ({ children }: PropsWithChildren) => {
  const location = useLocation();
  const navigate = useNavigate();
  const session = authClient.useSession();
  const signOut = useSignOutMutation();
  const isAuthPath = AUTH_PATHS.has(location.pathname);
  const isOnboardingPath = location.pathname === ONBOARDING_PATH;
  const isPublicPath = PUBLIC_PATHS.has(location.pathname);
  const role = session.data?.user.role;
  const isReporter = role === "REPORTER";
  const shouldCheckProfile = Boolean(
    session.data && isReporter && !isPublicPath
  );
  const profileQuery = useReporterProfileQuery(shouldCheckProfile);
  const isProfileComplete = profileQuery.data?.isComplete === true;
  const shouldOpenSignIn = Boolean(
    !(session.isPending || session.data || isAuthPath || isPublicPath)
  );
  const shouldOpenOnboarding = Boolean(
    shouldCheckProfile &&
      !profileQuery.isPending &&
      !isProfileComplete &&
      !isOnboardingPath
  );
  const shouldOpenApp = Boolean(
    shouldCheckProfile &&
      !profileQuery.isPending &&
      isProfileComplete &&
      (isAuthPath || isOnboardingPath)
  );

  useEffect(() => {
    if (shouldOpenSignIn) {
      navigate("/sign-in", { replace: true });
      return;
    }
    if (shouldOpenOnboarding) {
      navigate(ONBOARDING_PATH, { replace: true });
      return;
    }
    if (shouldOpenApp) {
      navigate("/history", { replace: true });
    }
  }, [navigate, shouldOpenApp, shouldOpenOnboarding, shouldOpenSignIn]);

  const handleSignOut = async () => {
    await signOut.mutateAsync();
    navigate("/sign-in", { replace: true });
  };

  const isChecking = Boolean(
    session.isPending ||
      shouldOpenSignIn ||
      shouldOpenOnboarding ||
      shouldOpenApp ||
      (shouldCheckProfile && profileQuery.isPending)
  );

  if (isChecking) {
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

  if (session.data && !isReporter && !isPublicPath) {
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
