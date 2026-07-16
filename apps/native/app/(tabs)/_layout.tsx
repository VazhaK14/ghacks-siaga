import { Tabs } from "expo-router";
import type { BottomTabBarProps } from "expo-router/tabs";

import { CurvedTabBar } from "@/components/curved-tab-bar";

function renderTabBar(props: BottomTabBarProps) {
  return <CurvedTabBar {...props} />;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
      tabBar={renderTabBar}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "Riwayat",
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
        }}
      />
    </Tabs>
  );
}
