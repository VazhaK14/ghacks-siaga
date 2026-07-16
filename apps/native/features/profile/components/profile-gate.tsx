import { useRouter, useSegments } from "expo-router";
import type { PropsWithChildren } from "react";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

import { useProfile } from "../context";

export function ProfileGate({ children }: PropsWithChildren) {
  const { hasCompletedSetup, isHydrated } = useProfile();
  const router = useRouter();
  const segments = useSegments();
  const isSetupRoute = segments[0] === "profile-setup";
  const shouldOpenSetup = isHydrated && !hasCompletedSetup && !isSetupRoute;
  const shouldOpenApp = isHydrated && hasCompletedSetup && isSetupRoute;

  useEffect(() => {
    if (shouldOpenSetup) {
      router.replace("/profile-setup");
      return;
    }

    if (shouldOpenApp) {
      router.replace("/");
    }
  }, [router, shouldOpenApp, shouldOpenSetup]);

  if (!isHydrated || shouldOpenSetup || shouldOpenApp) {
    return (
      <View className="flex-1 items-center justify-center bg-siaga-surface">
        <ActivityIndicator color="#d72638" size="large" />
      </View>
    );
  }

  return children;
}
