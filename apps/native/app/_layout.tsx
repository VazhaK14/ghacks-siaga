import "@/global.css";
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from "@expo-google-fonts/plus-jakarta-sans";
import { QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { Stack, usePathname } from "expo-router";
import { hideAsync, preventAutoHideAsync } from "expo-splash-screen";
import { HeroUINativeProvider } from "heroui-native";
import { useEffect, useMemo } from "react";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { Uniwind } from "uniwind";

import { AppThemeProvider } from "@/contexts/app-theme-context";
import { AuthGate } from "@/features/auth/guards";
import { IncidentProvider } from "@/features/emergency/context";
import { ProfileGate } from "@/features/profile/components/profile-gate";
import { ProfileProvider } from "@/features/profile/context";
import { registerLiveKitGlobals } from "@/lib/register-livekit-globals";
import { useSiagaColor } from "@/lib/use-siaga-color";
import { queryClient } from "@/utils/trpc";

registerLiveKitGlobals();
preventAutoHideAsync();
// Uniwind has no built-in persistence — every cold start otherwise defaults
// to the device's system color scheme. Force dark by default (matching
// web's defaultTheme="dark"); the theme toggle can still switch to light
// for the rest of the session.
Uniwind.setTheme("dark");

export const unstable_settings = {
  initialRouteName: "profile-setup",
};

function StackLayout({
  surface,
  callBg,
  primaryDark,
}: {
  surface: string;
  callBg: string;
  primaryDark: string;
}) {
  return (
    <Stack
      screenOptions={{
        animation: "fade",
        contentStyle: { backgroundColor: surface },
        headerShown: false,
        navigationBarTranslucent: true,
        statusBarTranslucent: true,
      }}
    >
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="sign-up" />
      <Stack.Screen name="profile-setup" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="sos" options={{ presentation: "modal" }} />
      <Stack.Screen name="report-mode" />
      <Stack.Screen
        name="connecting"
        options={{
          contentStyle: { backgroundColor: primaryDark },
        }}
      />
      <Stack.Screen
        name="voice-session"
        options={{ contentStyle: { backgroundColor: callBg } }}
      />
      <Stack.Screen name="silent-session" />
      <Stack.Screen name="chat" />
      <Stack.Screen name="dispatch" />
      <Stack.Screen name="arrival" />
      <Stack.Screen name="complete" />
    </Stack>
  );
}

export default function Layout() {
  const pathname = usePathname();
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  const surface = useSiagaColor("surface");
  const callBg = useSiagaColor("call-bg");
  const primaryDark = useSiagaColor("primary-dark");

  const rootBackground = useMemo(() => {
    if (pathname === "/connecting") {
      return primaryDark;
    }
    if (pathname === "/voice-session") {
      return callBg;
    }
    return surface;
  }, [pathname, primaryDark, callBg, surface]);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!(fontsLoaded || fontError)) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView
        style={[styles.root, { backgroundColor: rootBackground }]}
      >
        <KeyboardProvider
          navigationBarTranslucent
          preserveEdgeToEdge
          statusBarTranslucent
        >
          <AppThemeProvider>
            <HeroUINativeProvider>
              <AuthGate>
                <ProfileProvider>
                  <IncidentProvider>
                    <ProfileGate>
                      <StackLayout
                        callBg={callBg}
                        primaryDark={primaryDark}
                        surface={surface}
                      />
                    </ProfileGate>
                  </IncidentProvider>
                </ProfileProvider>
              </AuthGate>
            </HeroUINativeProvider>
          </AppThemeProvider>
        </KeyboardProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
