import { useRouter, useSegments } from "expo-router";
import type { PropsWithChildren } from "react";
import { useEffect } from "react";
import { ActivityIndicator, Text, View } from "react-native";

import { authClient } from "@/lib/auth-client";

const AUTH_ROUTES = new Set(["sign-in", "sign-up"]);

export function AuthGate({ children }: PropsWithChildren) {
  const router = useRouter();
  const segments = useSegments();
  const session = authClient.useSession();
  const isAuthRoute = AUTH_ROUTES.has(segments[0] ?? "");
  const isReporter =
    session.data?.user &&
    "role" in session.data.user &&
    session.data.user.role === "REPORTER";
  const shouldOpenSignIn = !(session.isPending || session.data || isAuthRoute);
  const shouldOpenApp =
    !session.isPending && Boolean(session.data) && isAuthRoute;

  useEffect(() => {
    if (shouldOpenSignIn) {
      router.replace("/sign-in");
      return;
    }
    if (shouldOpenApp) {
      router.replace("/");
    }
  }, [router, shouldOpenApp, shouldOpenSignIn]);

  if (session.isPending || shouldOpenSignIn || shouldOpenApp) {
    return (
      <View className="flex-1 items-center justify-center bg-siaga-surface">
        <ActivityIndicator colorClassName="text-siaga-primary" size="large" />
      </View>
    );
  }

  if (session.data && !isReporter) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-siaga-surface px-8">
        <Text className="text-center font-bold text-lg text-siaga-ink">
          Akun ini bukan akun pelapor
        </Text>
        <Text className="text-center text-siaga-muted text-sm">
          Gunakan dashboard web untuk akun operator.
        </Text>
      </View>
    );
  }

  return children;
}
