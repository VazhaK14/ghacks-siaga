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
import { useEffect } from "react";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { Uniwind } from "uniwind";

import {
  SIAGA_CALL_BG,
  SIAGA_PRIMARY_DARK,
  SIAGA_SURFACE,
} from "@/constants/colors";
import { AppThemeProvider } from "@/contexts/app-theme-context";
import { AuthGate } from "@/features/auth/guards";
import { IncidentProvider } from "@/features/emergency/context";
import { ProfileGate } from "@/features/profile/components/profile-gate";
import { ProfileProvider } from "@/features/profile/context";
import { registerLiveKitGlobals } from "@/lib/register-livekit-globals";
import { queryClient } from "@/utils/trpc";

registerLiveKitGlobals();
preventAutoHideAsync();
// Uniwind has no built-in persistence — every cold start otherwise defaults
// to the device's system color scheme. Force dark by default (matching
// web's defaultTheme="dark"); the theme toggle can still switch to light
// for the rest of the session.
Uniwind.setTheme("dark");

const SCREEN_COLORS = {
  call: SIAGA_CALL_BG,
  connecting: SIAGA_PRIMARY_DARK,
  surface: SIAGA_SURFACE,
} as const;

const getRouteBackgroundStyle = (pathname: string) => {
  if (pathname === "/connecting") {
    return styles.connectingRoot;
  }

  if (pathname === "/voice-session") {
    return styles.callRoot;
  }

  return styles.surfaceRoot;
};

export const unstable_settings = {
  initialRouteName: "profile-setup",
};

function StackLayout() {
  return (
    <Stack
      screenOptions={{
        animation: "fade",
        contentStyle: { backgroundColor: SCREEN_COLORS.surface },
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
          contentStyle: { backgroundColor: SCREEN_COLORS.connecting },
        }}
      />
      <Stack.Screen
        name="voice-session"
        options={{ contentStyle: { backgroundColor: SCREEN_COLORS.call } }}
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
        style={[styles.root, getRouteBackgroundStyle(pathname)]}
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
                      <StackLayout />
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
  callRoot: {
    backgroundColor: SCREEN_COLORS.call,
  },
  connectingRoot: {
    backgroundColor: SCREEN_COLORS.connecting,
  },
  root: {
    flex: 1,
  },
  surfaceRoot: {
    backgroundColor: SCREEN_COLORS.surface,
  },
});
