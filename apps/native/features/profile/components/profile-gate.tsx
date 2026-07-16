import { useRouter, useSegments } from "expo-router";
import type { PropsWithChildren } from "react";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

import { useProfile } from "@/features/profile/context";

const PROFILE_SETUP_ROUTE = "profile-setup";

export function ProfileGate({ children }: PropsWithChildren) {
  const router = useRouter();
  const segments = useSegments();
  const { hasCompletedSetup, isHydrated } = useProfile();
  const isOnProfileSetup = segments[0] === PROFILE_SETUP_ROUTE;
  const shouldRedirect = isHydrated && !hasCompletedSetup && !isOnProfileSetup;

  useEffect(() => {
    if (shouldRedirect) {
      router.replace("/profile-setup");
    }
  }, [router, shouldRedirect]);

  if (!isHydrated || shouldRedirect) {
    return (
      <View className="flex-1 items-center justify-center bg-siaga-surface">
        <ActivityIndicator colorClassName="text-siaga-primary" size="large" />
      </View>
    );
  }

  return children;
}
