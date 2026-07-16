import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

const ACTIVE_COLOR = "#870000";
const INACTIVE_COLOR = "#333333";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: ACTIVE_COLOR,
        tabBarInactiveTintColor: INACTIVE_COLOR,
        tabBarItemStyle: { paddingTop: 8 },
        tabBarLabelStyle: {
          fontFamily: "PlusJakartaSans_800ExtraBold",
          fontSize: 11,
        },
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopColor: "#e9e3df",
          height: 82,
          paddingBottom: 12,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons color={color} name="alert-circle-outline" size={size} />
          ),
          title: "SOS",
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons color={color} name="time-outline" size={size} />
          ),
          title: "Riwayat",
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons color={color} name="person-circle-outline" size={size} />
          ),
          title: "Profil",
        }}
      />
    </Tabs>
  );
}
